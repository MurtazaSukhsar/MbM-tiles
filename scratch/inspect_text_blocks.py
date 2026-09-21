import fitz
import json

pdf_path = 'C:/Users/murta/.gemini/antigravity-ide/brain/6e49557d-50e5-4f27-9703-bb04a0b16112/.user_uploaded/media_1789970351774.pdf'
doc = fitz.open(pdf_path)

for page_num, page in enumerate(doc):
    text_blocks = page.get_text("blocks")
    # print text blocks sorted by y0
    text_blocks.sort(key=lambda b: b[1])
    print(f"\n================ PAGE {page_num+1} ================")
    for b in text_blocks:
        t = b[4].strip().replace('\n', ' | ')
        if t:
            print(f"  y={b[1]:.1f}: {t}")
