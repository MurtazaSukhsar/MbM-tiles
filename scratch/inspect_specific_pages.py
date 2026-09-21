import fitz

pdf_path = r'C:/Users/murta/.gemini/antigravity-ide/brain/6e49557d-50e5-4f27-9703-bb04a0b16112/.user_uploaded/media_1789970351774.pdf'
doc = fitz.open(pdf_path)

for p_num in [13, 14, 17, 18, 21, 22]:
    page = doc[p_num - 1]
    print(f"\n================ PAGE {p_num} ================")
    
    # Print drawings / vector paths or rects if any
    drawings = page.get_drawings()
    print(f"Drawings count: {len(drawings)}")
    
    # Print text in detail
    text_page = page.get_text("words")
    # Group words by approx y
    lines = {}
    for w in text_page:
        y = round(w[1] / 10) * 10
        lines.setdefault(y, []).append(w[4])
    for y in sorted(lines.keys()):
        print(f"  y~{y}: {' '.join(lines[y])}")
        
    # Print images
    imgs = page.get_images(full=True)
    print(f"Images count: {len(imgs)}")
    for i, img in enumerate(imgs):
        xref = img[0]
        base = doc.extract_image(xref)
        rects = page.get_image_rects(xref)
        print(f"  Img #{i+1}: xref={xref}, rects={rects}, res={base['width']}x{base['height']}, ext={base['ext']}")
