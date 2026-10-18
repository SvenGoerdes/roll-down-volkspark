"""Small JSON ledgers for geometry checks and completed render outputs."""
import datetime
import hashlib
import json
import os

CODE_FILES = ('sightseeing-pipeline.py', 'sightseeing-models.py',
              'sightseeing-materials.py', 'sightseeing-gate.py', 'sightseeing-manifest.py')


def sha256(path):
    digest = hashlib.sha256()
    with open(path, 'rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def source_hash(blender_dir):
    digest = hashlib.sha256()
    for name in CODE_FILES:
        digest.update(name.encode())
        with open(os.path.join(blender_dir, name), 'rb') as stream:
            digest.update(stream.read())
    return digest.hexdigest()


def load(path, default):
    if not os.path.exists(path):
        return default
    with open(path, encoding='utf-8') as stream:
        return json.load(stream)


def save(path, data):
    with open(path, 'w', encoding='utf-8') as stream:
        json.dump(data, stream, indent=2, ensure_ascii=False)


def utc_now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def record_render(out_dir, asset, source_digest):
    png_path = asset['output']
    blend_path = asset.get('blendOutput')
    ledger_path = os.path.join(out_dir, 'render-manifest.json')
    ledger = load(ledger_path, {'assets': {}})
    ledger.setdefault('assets', {})[asset['id']] = {
        'id': asset['id'],
        'requestedGap': asset['requestedGap'],
        'renderedAt': utc_now(),
        'sourceSha256': source_digest,
        'resolution': asset['resolution'],
        'bottomAlphaFadeFraction': asset.get('bottomAlphaFadeFraction', 0),
        'pngPath': os.path.basename(png_path),
        'pngSha256': sha256(png_path),
        'blendPath': os.path.basename(blend_path) if blend_path else None,
        'blendSha256': sha256(blend_path) if blend_path and os.path.exists(blend_path) else None,
    }
    save(ledger_path, ledger)
    return ledger


def write_run_manifests(out_dir, requested_gap, source_digest, results):
    checks_path = os.path.join(out_dir, 'checks.json')
    checks = load(checks_path, {'assets': {}})
    checked_assets = checks.get('assets', {})
    if isinstance(checked_assets, list):
        checked_assets = {asset['id']: asset for asset in checked_assets}
    now = utc_now()
    for result in results:
        asset = dict(result)
        asset['checkedAt'] = now
        checked_assets[result['id']] = asset
    checks.update({'checkedAt': now, 'requestedGap': requested_gap,
                   'sourceSha256': source_digest, 'assets': checked_assets})
    save(checks_path, checks)

    render_path = os.path.join(out_dir, 'render-manifest.json')
    rendered = load(render_path, {'assets': {}}).get('assets', {})
    overview_path = os.path.join(out_dir, 'manifest.json')
    overview = load(overview_path, {'assets': {}})
    assets = overview.get('assets', {})
    if isinstance(assets, list):
        assets = {asset['id']: asset for asset in assets}
    for result in results:
        asset = dict(result)
        rec = rendered.get(result['id'])
        if rec:
            png_path = os.path.join(out_dir, rec['pngPath'])
            fresh = (rec['sourceSha256'] == source_digest
                     and rec['requestedGap'] == result['requestedGap']
                     and os.path.exists(png_path) and sha256(png_path) == rec['pngSha256'])
            asset['renderRecord'] = rec
            asset['pngMatchesCurrentCode'] = fresh
        else:
            asset['renderRecord'] = None
            asset['pngMatchesCurrentCode'] = False if asset['pngFilePresent'] else None
        assets[result['id']] = asset
    overview.update({'updatedAt': utc_now(), 'requestedGap': requested_gap,
                     'sourceSha256': source_digest, 'assets': assets})
    save(overview_path, overview)
