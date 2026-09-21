import fitz
import os
import json

pdf_path = r'C:/Users/murta/.gemini/antigravity-ide/brain/6e49557d-50e5-4f27-9703-bb04a0b16112/.user_uploaded/media_1789970351774.pdf'
doc = fitz.open(pdf_path)

os.makedirs('scratch/extracted_photos', exist_ok=True)
os.makedirs('scratch/page_crops', exist_ok=True)

print(f"Opened PDF with {len(doc)} pages.")

# Let's inspect each row of the table across all 22 pages
# In this PDF, the table columns are:
# Column 1: '#' (item number) around x=30-70
# Column 2: 'Photo' around x=70-200
# Column 3: 'Item name' around x=200-400
# Column 4: 'Box calicut' around x=400-500
# Column 5: 'Size' around x=500-600

# Let's write a script that analyzes every table row on every page!
rows_detected = []

for page_idx, page in enumerate(doc):
    page_num = page_idx + 1
    # Find all text spans and their positions
    text_dict = page.get_text("words") # (x0, y0, x1, y1, word, block_no, line_no, word_no)
    
    # Let's find all item numbers in column 1 (x < 80) that are numbers 1 to 115
    item_numbers = []
    for w in text_dict:
        if w[0] < 80 and w[4].isdigit() and 1 <= int(w[4]) <= 120:
            item_numbers.append({
                'num': int(w[4]),
                'x0': w[0], 'y0': w[1], 'x1': w[2], 'y1': w[3]
            })
    
    # Sort by y0
    item_numbers.sort(key=lambda x: x['y0'])
    print(f"\nPage {page_num}: detected {len(item_numbers)} row numbers: {[x['num'] for x in item_numbers]}")
    
    # Calculate row vertical intervals [y_top, y_bottom]
    # Header ends around y=40 on page > 1, or around y=70 on page 1
    # Footer starts around y=810
    for i, itm in enumerate(item_numbers):
        num = itm['num']
        y_top = itm['y0'] - 20
        if i == 0:
            y_top = max(y_top, 40 if page_num > 1 else 70)
        else:
            # halfway between previous and current
            y_top = (item_numbers[i-1]['y1'] + itm['y0']) / 2
            
        if i < len(item_numbers) - 1:
            y_bottom = (itm['y1'] + item_numbers[i+1]['y0']) / 2
        else:
            y_bottom = 810
            
        rows_detected.append({
            'num': num,
            'page': page_num,
            'y_top': y_top,
            'y_bottom': y_bottom,
            'item_y': itm['y0']
        })

print(f"\nTotal rows detected: {len(rows_detected)}")
with open('scratch/rows_detected.json', 'w', encoding='utf-8') as f:
    json.dump(rows_detected, f, indent=2)
