import fitz
import json
import os

pdf_path = r'C:/Users/murta/.gemini/antigravity-ide/brain/6e49557d-50e5-4f27-9703-bb04a0b16112/.user_uploaded/media_1789970351774.pdf'
doc = fitz.open(pdf_path)

os.makedirs('scratch/inspected_rows', exist_ok=True)

with open('scratch/rows_detected.json', 'r', encoding='utf-8') as f:
    rows = json.load(f)

for row in rows:
    num = row['num']
    page_num = row['page']
    page = doc[page_num - 1]
    
    # Get all images intersecting this row's vertical bounds
    img_list = page.get_images(full=True)
    row_images = []
    
    # Also get table drawings on page to find exact table cell rect for photo
    # Let's find drawings in the x range 40..200
    for img_info in img_list:
        xref = img_info[0]
        rects = page.get_image_rects(xref)
        for r in rects:
            # Check if rect overlaps with row vertically
            if not (r.y1 < row['y_top'] or r.y0 > row['y_bottom']):
                base_img = doc.extract_image(xref)
                row_images.append({
                    'xref': xref,
                    'rect': [r.x0, r.y0, r.x1, r.y1],
                    'width': base_img['width'],
                    'height': base_img['height'],
                    'ext': base_img['ext'],
                    'bytes': len(base_img['image'])
                })
                
    row['images_found'] = row_images

print("Analyzed all 111 rows for embedded images.")
# Check rows with 0 images or >1 images
no_img = [r['num'] for r in rows if len(r['images_found']) == 0]
multi_img = [r['num'] for r in rows if len(r['images_found']) > 1]
single_img = [r['num'] for r in rows if len(r['images_found']) == 1]

print(f"Single image rows ({len(single_img)}): {single_img}")
print(f"No direct embedded image rows ({len(no_img)}): {no_img}")
print(f"Multi image rows ({len(multi_img)}): {multi_img}")

with open('scratch/row_image_analysis.json', 'w', encoding='utf-8') as f:
    json.dump(rows, f, indent=2)
