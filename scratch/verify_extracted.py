import json
import os

with open('scratch/extracted_meta.json', 'r', encoding='utf-8') as f:
    meta = json.load(f)

print(f"Total extracted items: {len(meta)}")
for m in meta:
    print(f"#{m['num']:03d} (Page {m['page']:02d}): Raw = {m['raw_res']} | Crop = {m['crop_res']}")
