"""Create a deterministic source archive from the explicit committed manifest."""
import argparse
import json
from pathlib import Path
import subprocess
import zipfile

ROOT = Path(__file__).absolute().parent.parent

def package(root):
    names = json.loads((root / 'source-files.json').read_text())
    tracked = subprocess.check_output(['git', 'ls-files', '-z'], cwd=root).decode().strip('\0').split('\0')
    if sorted(names) != sorted(tracked):
        raise ValueError('Manifest must exactly match committed source')
    payload = {}
    for name in names:
        data = (root / name).read_bytes()
        if data != subprocess.check_output(['git', 'show', 'HEAD:' + name], cwd=root):
            raise ValueError('Dirty source refused: ' + name)
        payload[name] = data
    output = root / 'artifacts' / 'Moonlit-Courier-source.zip'
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in sorted(payload.items()):
            info = zipfile.ZipInfo(name, (2026, 10, 22, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data)
    with zipfile.ZipFile(output) as archive:
        assert sorted(archive.namelist()) == sorted(names)
        for name, data in payload.items():
            assert archive.read(name) == data
    print(f'{len(names)} committed files verified in {output}')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=ROOT)
    arguments = parser.parse_args()
    if not arguments.root.absolute().is_relative_to(ROOT / 'artifacts' / 'archive-fixtures'):
        raise SystemExit('Archive release gate closed: symlink boundary implementation and tests are unfinished. See docs/implementation-checkpoint.md.')
    package(arguments.root)
