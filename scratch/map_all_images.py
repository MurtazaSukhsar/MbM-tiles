import fitz
import os
import json
import re

pdf_path = 'C:/Users/murta/.gemini/antigravity-ide/brain/6e49557d-50e5-4f27-9703-bb04a0b16112/.user_uploaded/media_1789970351774.pdf'
doc = fitz.open(pdf_path)

print(f"Total pages: {len(doc)}")

catalog_items = []

for page_num in range(len(doc)):
    page = doc[page_num]
    
    # Extract images sorted by y position
    img_list = []
    for img in page.get_images():
        xref = img[0]
        rects = page.get_image_rects(xref)
        if rects:
            r = rects[0]
            # Exclude logo at the top (y < 100 on page 1)
            if page_num == 0 and r.y0 < 100:
                continue
            base = doc.extract_image(xref)
            img_list.append({
                'y0': r.y0,
                'y1': r.y1,
                'x0': r.x0,
                'x1': r.x1,
                'xref': xref,
                'w': base['width'],
                'h': base['height'],
                'ext': base['ext'],
                'size': len(base['image'])
            })
    
    img_list.sort(key=lambda x: x['y0'])
    
    text = page.get_text()
    print(f"\n--- Page {page_num+1} ({len(img_list)} tile images found) ---")
    for idx, im in enumerate(img_list):
        print(f"  Item {len(catalog_items)+idx+1}: xref={im['xref']}, {im['w']}x{im['h']} ({im['ext']}, {im['size']} bytes) at y={im['y0']:.1f}")
    
    for im in img_list:
        catalog_items.append({
            'page': page_num + 1,
            'xref': im['xref'],
            'width': im['w'],
            'height': im['h'],
            'ext': im['ext']
        })

print(f"\nTotal tile images matched across all pages: {len(catalog_items)}")
