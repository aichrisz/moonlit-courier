"""Deterministic, allowlisted source ZIP; fail closed before any output write."""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import subprocess
import zipfile

ROOT = Path(__file__).absolute().parent.parent
FORBIDDEN = {'.git', '.worktrees', 'node_modules', 'dist', 'artifacts', 'parent',
             '__pycache__', 'private', '.env', '.hermes'}


def safe_path(root, relative=''):
    """Check every lexical ancestor with lstat, including dangling links.

    Do not resolve() first: resolving would conceal the very links we refuse.
    This is a local single-writer packaging tool, not a concurrent sandbox.
    """
    if relative and (not isinstance(relative, str) or '\\' in relative or
                     PurePosixPath(relative).is_absolute() or
                     any(p in ('', '.', '..') for p in relative.split('/'))):
        raise ValueError('Path traversal refused')
    target = root / relative
    current = Path(target.anchor)
    for part in target.parts[1:]:
        current /= part
        try:
            mode = current.lstat().st_mode
        except FileNotFoundError:
            continue
        if stat.S_ISLNK(mode):
            raise ValueError('Symlink refused: ' + str(current))
    return target


def source_name(name):
    if not isinstance(name, str) or not re.fullmatch(r'[A-Za-z0-9_./-]+', name):
        raise ValueError('Invalid manifest path')
    parts = name.split('/')
    if any(p in ('', '.', '..') or p in FORBIDDEN or p.startswith('.env') for p in parts):
        raise ValueError('Forbidden source path: ' + name)
    if name.endswith(('.pem', '.key', '.db', '.sqlite', '.zip')) or 'private' in name.lower():
        raise ValueError('Private or generated source refused: ' + name)
    if len(parts) > 1 and parts[0] not in ('docs', 'tests', 'scripts'):
        raise ValueError('Source directory not allowlisted: ' + name)
    if name == 'docs/parent-acceptance.md':
        raise ValueError('Parent-owned source refused')


def git(root, *args):
    return subprocess.check_output(['git', *args], cwd=root)


def read_regular(root, name):
    file = safe_path(root, name)
    info = file.lstat()
    if not stat.S_ISREG(info.st_mode) or info.st_size > 2 * 1024 * 1024:
        raise ValueError('Expected bounded regular source: ' + name)
    return file.read_bytes()


def output_path(root, name):
    file = safe_path(root, name)
    try:
        if not stat.S_ISREG(file.lstat().st_mode):
            raise ValueError('Expected regular output: ' + name)
    except FileNotFoundError:
        pass
    return file


def write_output(root, name, data):
    file = output_path(root, name)
    file.parent.mkdir(parents=True, exist_ok=True)
    safe_path(root, name)
    descriptor = os.open(file, os.O_WRONLY | os.O_CREAT | os.O_TRUNC | os.O_NOFOLLOW, 0o644)
    with os.fdopen(descriptor, 'wb') as stream:
        stream.write(data)


def package(root):
    root = root.absolute()
    safe_path(root)
    if Path(git(root, 'rev-parse', '--show-toplevel').decode().strip()) != root:
        raise ValueError('Package root must be the repository root')
    names = json.loads(read_regular(root, 'source-files.json'))
    if not isinstance(names, list) or not 1 <= len(names) <= 1000:
        raise ValueError('Invalid bounded source manifest')
    for name in names:
        source_name(name)
    if len(set(names)) != len(names) or 'source-files.json' not in names:
        raise ValueError('Duplicate or missing manifest entry')
    committed = git(root, 'ls-tree', '-r', '--name-only', '-z', 'HEAD').decode().strip('\0').split('\0')
    tracked = git(root, 'ls-files', '-z').decode().strip('\0').split('\0')
    if sorted(names) != sorted(committed) or sorted(names) != sorted(tracked):
        raise ValueError('Manifest must exactly match committed source and index')

    # Preflight every source and destination before writing either artifact.
    payload = {}
    for name in names:
        data = read_regular(root, name)
        if data != git(root, 'show', 'HEAD:' + name):
            raise ValueError('Dirty source refused: ' + name)
        payload[name] = data
    if sum(map(len, payload.values())) > 16 * 1024 * 1024:
        raise ValueError('Source archive exceeds bounded size')
    zip_name = 'artifacts/Moonlit-Courier-source.zip'
    report_name = 'artifacts/evidence/package.json'
    output_path(root, zip_name)
    output_path(root, report_name)

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w') as archive:
        for name, data in sorted(payload.items()):
            info = zipfile.ZipInfo(name, (2026, 10, 22, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data)
    write_output(root, zip_name, buffer.getvalue())
    output = safe_path(root, zip_name)
    with zipfile.ZipFile(output) as archive:
        if sorted(archive.namelist()) != sorted(names):
            raise ValueError('Archive entry verification failed')
        for name, data in payload.items():
            if archive.read(name) != data:
                raise ValueError('Archive byte verification failed: ' + name)
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    report = {'head': git(root, 'rev-parse', 'HEAD').decode().strip(),
              'files': len(names), 'zip_sha256': digest,
              'sources': {name: hashlib.sha256(data).hexdigest() for name, data in sorted(payload.items())}}
    write_output(root, report_name, (json.dumps(report, indent=2) + '\n').encode())
    if json.loads(safe_path(root, report_name).read_text()) != report:
        raise ValueError('Package report verification failed')
    print(f'{len(names)} committed files verified in {output}')
    print(f'SHA256 {digest}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=ROOT,
                        help='Repository root; tests use synthetic fixture repositories')
    package(parser.parse_args().root)
