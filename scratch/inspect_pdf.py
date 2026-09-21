import fitz
import json

pdf_path = r'C:/Users/murta/.gemini/antigravity-ide/brain/6e49557d-50e5-4f27-9703-bb04a0b16112/.user_uploaded/media_1789970351774.pdf'
doc = fitz.open(pdf_path)

all_pages = []

for page_idx, page in enumerate(doc):
    page_data = {
        'page': page_idx + 1,
        'rect': [page.rect.x0, page.rect.y0, page.rect.x1, page.rect.y1],
        'images': [],
        'text_blocks': []
    }
    
    # Sort text blocks by vertical y coordinate
    blocks = page.get_text("blocks")
    for b in blocks:
        page_data['text_blocks'].append({
            'bbox': [round(b[0], 1), round(b[1], 1), round(b[2], 1), round(b[3], 1)],
            'text': b[4].strip()
        })
    
    img_list = page.get_images(full=True)
    for img_info in img_list:
        xref = img_info[0]
        base_img = doc.extract_image(xref)
        rects = page.get_image_rects(xref)
        rect_list = []
        for r in rects:
            rect_list.append([round(r.x0, 1), round(r.y0, 1), round(r.x1, 1), round(r.y1, 1)])
        page_data['images'].append({
            'xref': xref,
            'ext': base_img['ext'],
            'width': base_img['width'],
            'height': base_img['height'],
            'size': len(base_img['image']),
            'rects': rect_list
        })
    all_pages.append(page_data)

with open('scratch/pdf_layout.json', 'w', encoding='utf-8') as f:
    json.dump(all_pages, f, indent=2)

print("Dumped pdf_layout.json. Summary:")
for p in all_pages:
    print(f"Page {p['page']}: {len(p['images'])} images, {len(p['text_blocks'])} text blocks")
