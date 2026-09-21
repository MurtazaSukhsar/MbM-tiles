import fitz
import json
import os

pdf_path = r'C:/Users/murta/.gemini/antigravity-ide/brain/6e49557d-50e5-4f27-9703-bb04a0b16112/.user_uploaded/media_1789970351774.pdf'
doc = fitz.open(pdf_path)

with open('Claude outputs/mbm-tiles-catalog-import.json', 'r', encoding='utf-8') as f:
    orig_import = json.load(f)

products = orig_import['products']

# Let's map each page and row explicitly
# Page 1: 5 items (1..5), 5 tile images (images[1..5])
# Page 2..12: 5 items each, 5 tile images each (items 6..60)
# Page 13: 6 items (61..66), 5 tile images:
#   61 -> img 0
#   62 -> img 1
#   63 -> None (no photo in PDF)
#   64 -> img 2
#   65 -> img 3
#   66 -> img 4
# Page 14..16: 5 items each, 5 tile images each (items 67..81)
# Page 17: 6 items (82..87), 5 tile images:
#   82 -> img 0
#   83 -> img 1
#   84 -> img 2
#   85 -> None (no photo in PDF)
#   86 -> img 3
#   87 -> img 4
# Page 18..21: 5 items each, 5 tile images each (items 88..107)
# Page 22: 4 items (108..111), 4 tile images (items 108..111)

mapping = []

for p_num in range(1, 23):
    page = doc[p_num - 1]
    img_list = page.get_images(full=True)
    if p_num == 1:
        # First image on page 1 is the brand logo
        logo_xref = img_list[0][0]
        tile_imgs = img_list[1:]
    else:
        tile_imgs = img_list
        
    if p_num == 13:
        # 6 items: 61, 62, 63 (None), 64, 65, 66
        mapping.append({'item_num': 61, 'xref': tile_imgs[0][0], 'page': 13})
        mapping.append({'item_num': 62, 'xref': tile_imgs[1][0], 'page': 13})
        mapping.append({'item_num': 63, 'xref': None, 'page': 13})
        mapping.append({'item_num': 64, 'xref': tile_imgs[2][0], 'page': 13})
        mapping.append({'item_num': 65, 'xref': tile_imgs[3][0], 'page': 13})
        mapping.append({'item_num': 66, 'xref': tile_imgs[4][0], 'page': 13})
    elif p_num == 17:
        # 6 items: 82, 83, 84, 85 (None), 86, 87
        mapping.append({'item_num': 82, 'xref': tile_imgs[0][0], 'page': 17})
        mapping.append({'item_num': 83, 'xref': tile_imgs[1][0], 'page': 17})
        mapping.append({'item_num': 84, 'xref': tile_imgs[2][0], 'page': 17})
        mapping.append({'item_num': 85, 'xref': None, 'page': 17})
        mapping.append({'item_num': 86, 'xref': tile_imgs[3][0], 'page': 17})
        mapping.append({'item_num': 87, 'xref': tile_imgs[4][0], 'page': 17})
    else:
        # Standard page
        start_item = len(mapping) + 1
        for idx, img_info in enumerate(tile_imgs):
            mapping.append({'item_num': start_item + idx, 'xref': img_info[0], 'page': p_num})

print(f"Total mapped items: {len(mapping)}")

# Print and verify all mappings against product names
for m in mapping:
    num = m['item_num']
    prod = products[num - 1]
    xref = m['xref']
    if xref:
        base = doc.extract_image(xref)
        info_str = f"res={base['width']}x{base['height']}, {base['ext']}, {len(base['image'])//1024}KB"
    else:
        info_str = "NO EMBEDDED IMAGE IN PDF"
    print(f"#{num:03d} (Pg {m['page']:02d}): {prod['name']} | {prod['size']} -> {info_str}")

with open('scratch/exact_item_mapping.json', 'w', encoding='utf-8') as f:
    json.dump(mapping, f, indent=2)
