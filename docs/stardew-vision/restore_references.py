#!/usr/bin/env python3
"""Offline, lossless restore and SHA-256 verification. Python 3 stdlib only."""
import base64, hashlib, io, json, zipfile
from pathlib import Path
root = Path(__file__).resolve().parent
m = json.loads((root / 'references/manifest.json').read_text())
encoded = ''.join((root / p).read_text().strip() for p in m['archive_parts'])
blob = base64.b64decode(encoded, validate=True)
assert hashlib.sha256(blob).hexdigest() == m['archive_sha256'], 'Archive checksum mismatch'
with zipfile.ZipFile(io.BytesIO(blob)) as z:
    assert set(z.namelist()) == {r['path'] for r in m['references']}, 'Unexpected archive paths'
    for r in m['references']:
        data = z.read(r['path'])
        assert len(data) == r['bytes'] and hashlib.sha256(data).hexdigest() == r['sha256'], r['id']
        p = (root / r['path']).resolve()
        assert root in p.parents, 'Unsafe output path'
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(data)
        print('VERIFIED', r['id'], r['path'])
print('Restored all 7 original files, including the original 4-frame GIF. Open index.html.')
