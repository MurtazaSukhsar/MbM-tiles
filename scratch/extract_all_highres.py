import fitz
import json
import os
from PIL import Image
import io
import base64

pdf_path = r'C:/Users/murta/.gemini/antigravity-ide/brain/6e49557d-50e5-4f27-9703-bb04a0b16112/.user_uploaded/media_1789970351774.pdf'
doc = fitz.open(pdf_path)

out_dir = 'scratch/extracted_all'
os.makedirs(out_dir, exist_ok=True)

with open('scratch/rows_detected.json', 'r', encoding='utf-8') as f:
    rows = json.load(f)

extracted_meta = []

for row in rows:
    num = row['num']
    page_num = row['page']
    page = doc[page_num - 1]
    
    # 1. High DPI raster render of the photo cell
    # Photo cell column is approx x: 45 to 180, y: row['y_top'] to row['y_bottom']
    # Let's inspect the page rect
    # Let's clip tightly to the photo box
    clip_rect = fitz.Rect(45, max(row['y_top'], 0), 185, min(row['y_bottom'], page.rect.height))
    
    # Render at 4x zoom (approx 288 DPI)
    zoom = 4.0
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, clip=clip_rect, alpha=False)
    crop_filename = f"crop_{num:03d}.png"
    crop_path = os.path.join(out_dir, crop_filename)
    pix.save(crop_path)
    
    # 2. Check embedded images that intersect with this row
    img_list = page.get_images(full=True)
    best_raw_img = None
    best_raw_rect = None
    min_dist = 999999
    
    for img_info in img_list:
        xref = img_info[0]
        # Ignore page 1 logo (which is at top y < 50)
        if page_num == 1 and xref == 48: # or logo xref
            pass
        rects = page.get_image_rects(xref)
        for r in rects:
            # Check center y of image vs center y of row
            img_center_y = (r.y0 + r.y1) / 2
            row_center_y = (row['y_top'] + row['y_bottom']) / 2
            dist = abs(img_center_y - row_center_y)
            
            # Must overlap vertically with row
            if not (r.y1 < row['y_top'] or r.y0 > row['y_bottom']):
                base_img = doc.extract_image(xref)
                if dist < min_dist:
                    min_dist = dist
                    best_raw_img = base_img
                    best_raw_rect = [r.x0, r.y0, r.x1, r.y1]
                    
    raw_saved_path = None
    raw_res = None
    if best_raw_img:
        ext = best_raw_img['ext']
        raw_filename = f"raw_{num:03d}.{ext}"
        raw_saved_path = os.path.join(out_dir, raw_filename)
        with open(raw_saved_path, 'wb') as f:
            f.write(best_raw_img['image'])
        raw_res = f"{best_raw_img['width']}x{best_raw_img['height']}"
        
    extracted_meta.append({
        'num': num,
        'page': page_num,
        'crop_file': crop_filename,
        'crop_res': f"{pix.width}x{pix.height}",
        'raw_file': raw_saved_path,
        'raw_res': raw_res,
        'raw_rect': best_raw_rect
    })

print(f"Successfully processed all {len(extracted_meta)} items!")
with open('scratch/extracted_meta.json', 'w', encoding='utf-8') as f:
    json.dump(extracted_meta, f, indent=2)
