import json

with open('Claude outputs/mbm-tiles-catalog-import.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

products = data.get('products', [])
print(f"Total products in import.json: {len(products)}")

with open('scratch/pdf_layout.json', 'r', encoding='utf-8') as f:
    pages = json.load(f)

print(f"Total pages in pdf: {len(pages)}")

# Count images in pdf
total_pdf_images = sum(len(p['images']) for p in pages)
print(f"Total images across all PDF pages: {total_pdf_images}")

# Print each page's images and products
item_count = 0
for p in pages:
    page_num = p['page']
    images = p['images']
    # If page 1, image 0 is the logo, remaining 5 are tiles
    tile_images = images[1:] if page_num == 1 else images
    print(f"\n--- Page {page_num} ({len(tile_images)} tile images) ---")
    for img_idx, img in enumerate(tile_images):
        item_count += 1
        prod = products[item_count - 1] if item_count <= len(products) else None
        prod_name = prod['name'] if prod else 'UNKNOWN'
        prod_size = prod['size'] if prod else ''
        print(f"Item #{item_count}: xref={img['xref']}, res={img['width']}x{img['height']}, {img['ext']}, {img['size']//1024}KB -> Prod: {prod_name} ({prod_size})")

print(f"\nTotal tile items mapped: {item_count}")
