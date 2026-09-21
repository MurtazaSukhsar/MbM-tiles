import fitz
import os
import json
import base64
import re
from PIL import Image
import io

pdf_path = 'C:/Users/murta/.gemini/antigravity-ide/brain/6e49557d-50e5-4f27-9703-bb04a0b16112/.user_uploaded/media_1789970351774.pdf'
doc = fitz.open(pdf_path)

os.makedirs('assets/tiles', exist_ok=True)

# Load existing catalog data if available
existing_json_path = 'Claude outputs/mbm-tiles-catalog-import.json'
with open(existing_json_path, 'r', encoding='utf-8') as f:
    existing_data = json.load(f)
existing_products = existing_data.get('products', [])

print(f"Total existing products in catalog: {len(existing_products)}")

# Let's extract high quality images for each product 1 to 111
extracted_products = []

# Row vertical bounding boxes for standard 5-row pages (approximate in PDF points)
# Page height is 841 pt.
# Row 1: y in [45, 185]
# Row 2: y in [185, 325]
# Row 3: y in [325, 465]
# Row 4: y in [465, 605]
# Row 5: y in [605, 755]
# Photo column: x in [25, 200]

# Special pages:
# Page 1: Top header has logo at y < 100. Row 1 starts around y=100.
# Page 13: 6 items (61, 62, 63, 64, 65, 66)
# Page 17: 6 items (82, 83, 84, 85, 86, 87)
# Page 18: 5 items (88, 89, 90, 91, 92)
# Page 22: 4 items (108, 109, 110, 111)

for page_idx, page in enumerate(doc):
    page_num = page_idx + 1
    # Get all text blocks on this page
    blocks = page.get_text("blocks")
    blocks.sort(key=lambda b: b[1])
    
    # Parse row items from text
    page_items = []
    for b in blocks:
        text = b[4].strip()
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        if not lines:
            continue
        # Check if first token is a product number (1 to 111)
        m = re.match(r'^(\d+)\s*\|?\s*(.*)', lines[0])
        if m:
            num = int(m.group(1))
            if 1 <= num <= 111:
                page_items.append({
                    'num': num,
                    'y0': b[1],
                    'y1': b[3],
                    'raw_text': text
                })
    
    # Sort page items by item number
    page_items.sort(key=lambda x: x['num'])
    print(f"Page {page_num}: Found {len(page_items)} products: {[x['num'] for x in page_items]}")
