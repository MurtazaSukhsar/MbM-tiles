import fitz
import os
import json
import base64

pdf_path = 'C:/Users/murta/.gemini/antigravity-ide/brain/6e49557d-50e5-4f27-9703-bb04a0b16112/.user_uploaded/media_1789970351774.pdf'
doc = fitz.open(pdf_path)

os.makedirs('scratch/test_extracted', exist_ok=True)

# Test extracting page 1 images
p1 = doc[0]
for idx, img in enumerate(p1.get_images()):
    xref = img[0]
    base = doc.extract_image(xref)
    w = base['width']
    h = base['height']
    ext = base['ext']
    sz = len(base['image'])
    out_path = f'scratch/test_extracted/p1_img_{idx+1}_{w}x{h}.{ext}'
    with open(out_path, 'wb') as f:
        f.write(base['image'])
    print(f'Saved {out_path} ({sz} bytes)')
