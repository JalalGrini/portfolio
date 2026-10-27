#!/usr/bin/env python3
"""Restore vetted-source candidate files only; never copy them into runtime."""
import base64, hashlib, json
from pathlib import Path
root=Path(__file__).resolve().parent
for item in json.loads((root/'assets/candidate-manifest.json').read_text()):
    data=base64.b64decode(''.join((root/p).read_text().strip() for p in item['parts']),validate=True)
    assert len(data)==item['bytes'] and hashlib.sha256(data).hexdigest()==item['sha256'],item['id']
    p=(root/item['path']).resolve()
    assert root in p.parents
    p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
    print('VERIFIED CANDIDATE',item['id'])
print('Candidates restored; check source credits and approval before any use.')
