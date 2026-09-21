import fitz

pdf_path = r'C:/Users/murta/.gemini/antigravity-ide/brain/6e49557d-50e5-4f27-9703-bb04a0b16112/.user_uploaded/media_1789970351774.pdf'
doc = fitz.open(pdf_path)

for p_num in [13, 17]:
    page = doc[p_num - 1]
    print(f"\n================ PAGE {p_num} DETAIL ================")
    # List all text with exact bbox
    for b in page.get_text("blocks"):
        print(f"Block at y=[{b[1]:.1f} .. {b[3]:.1f}], x=[{b[0]:.1f} .. {b[2]:.1f}]: {b[4].strip()}")
    
    # List all images with exact bbox
    img_list = page.get_images(full=True)
    for idx, img_info in enumerate(img_list):
        xref = img_info[0]
        base_img = doc.extract_image(xref)
        rects = page.get_image_rects(xref)
        print(f"Image {idx+1}: xref={xref}, size={base_img['width']}x{base_img['height']}, rects={rects}")
