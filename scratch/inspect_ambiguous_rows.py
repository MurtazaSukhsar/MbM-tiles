import json

with open('scratch/row_image_analysis.json', 'r', encoding='utf-8') as f:
    rows = json.load(f)

for num in [47, 48, 49, 50, 84, 85, 86, 87]:
    r = rows[num - 1]
    print(f"\n--- Row #{num} (Page {r['page']}) y_top={r['y_top']:.1f}, item_y={r['item_y']:.1f}, y_bottom={r['y_bottom']:.1f} ---")
    for img in r['images_found']:
        print(f"  Img xref={img['xref']}, rect={img['rect']}, res={img['width']}x{img['height']}, bytes={img['bytes']}")
