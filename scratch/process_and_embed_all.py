import fitz
import json
import os
import base64
from PIL import Image
import io

pdf_path = r'C:/Users/murta/.gemini/antigravity-ide/brain/6e49557d-50e5-4f27-9703-bb04a0b16112/.user_uploaded/media_1789970351774.pdf'
doc = fitz.open(pdf_path)

assets_dir = 'assets/tiles'
os.makedirs(assets_dir, exist_ok=True)

# 1. Extract Logo
page1 = doc[0]
img_list_p1 = page1.get_images(full=True)
logo_xref = img_list_p1[0][0]
logo_base = doc.extract_image(logo_xref)
logo_bytes = logo_base['image']
logo_ext = logo_base['ext']
logo_path = f'assets/logo.{logo_ext}'
with open(logo_path, 'wb') as f:
    f.write(logo_bytes)
logo_b64 = f"data:image/{logo_ext};base64," + base64.b64encode(logo_bytes).decode('utf-8')
print(f"Extracted Logo: {logo_base['width']}x{logo_base['height']}, {len(logo_bytes)} bytes -> {logo_path}")

# Load existing import JSON
with open('Claude outputs/mbm-tiles-catalog-import.json', 'r', encoding='utf-8') as f:
    import_data = json.load(f)

products = import_data['products']
print(f"Total products in import.json: {len(products)}")

with open('scratch/exact_item_mapping.json', 'r', encoding='utf-8') as f:
    mapping = json.load(f)

updated_products = []

for m in mapping:
    num = m['item_num']
    prod_idx = num - 1
    prod = products[prod_idx] if prod_idx < len(products) else {}
    xref = m['xref']
    page_num = m['page']
    page = doc[page_num - 1]
    
    img_data_url = ""
    saved_filename = ""
    
    if xref is not None:
        base = doc.extract_image(xref)
        img_bytes = base['image']
        ext = base['ext']
        
        # Save high-res asset
        saved_filename = f"tile_{num:03d}.{ext}"
        saved_path = os.path.join(assets_dir, saved_filename)
        with open(saved_path, 'wb') as f:
            f.write(img_bytes)
            
        mime = 'image/jpeg' if ext.lower() in ['jpg', 'jpeg'] else f'image/{ext.lower()}'
        img_data_url = f"data:{mime};base64," + base64.b64encode(img_bytes).decode('utf-8')
        print(f"Product #{num:03d} [{prod.get('name')}]: extracted raw {base['width']}x{base['height']} ({len(img_bytes)//1024} KB)")
    else:
        # For items 63 and 85, generate clean high-res crop from page
        print(f"Product #{num:03d} [{prod.get('name')}]: no direct image xref, creating crisp raster crop...")
        # Get crop from row
        # Sandy beige on p13 or p17
        saved_filename = f"tile_{num:03d}.png"
        saved_path = os.path.join(assets_dir, saved_filename)
        
        # Clip tightly around table cell for this row
        # Row y coordinates
        with open('scratch/rows_detected.json', 'r', encoding='utf-8') as rf:
            all_rows = json.load(rf)
        r_info = all_rows[num - 1]
        clip_rect = fitz.Rect(50, r_info['y_top'], 180, r_info['y_bottom'])
        pix = page.get_pixmap(matrix=fitz.Matrix(4.0, 4.0), clip=clip_rect, alpha=False)
        pix.save(saved_path)
        with open(saved_path, 'rb') as f:
            crop_bytes = f.read()
        img_data_url = f"data:image/png;base64," + base64.b64encode(crop_bytes).decode('utf-8')

    # Update product images array
    # Replace existing primary image with this high-resolution extracted image
    updated_prod = dict(prod)
    updated_prod['images'] = [
        {
            'id': f"img_{prod_idx}_0",
            'dataUrl': img_data_url,
            'name': f"{prod.get('name', 'Tile')} High-Res"
        }
    ]
    updated_products.append(updated_prod)

import_data['products'] = updated_products

# Save updated import JSON
with open('Claude outputs/mbm-tiles-catalog-import.json', 'w', encoding='utf-8') as f:
    json.dump(import_data, f, indent=2)

print("\nSuccessfully updated 'Claude outputs/mbm-tiles-catalog-import.json' with all 111 high-res images!")
