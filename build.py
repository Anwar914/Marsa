"""Regenerate the standalone learning page."""
from pathlib import Path

root = Path(__file__).parent
html = (root / "index.html").read_text(encoding="utf-8-sig")
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>' + (root / "style.css").read_text(encoding="utf-8-sig") + '</style>')
for name in ("data.js", "games.js", "app.js"):
    script = (root / name).read_text(encoding="utf-8-sig").replace('</script', '<\\/script')
    html = html.replace(f'<script src="{name}"></script>', '<script>' + script + '</script>')
(root / "Marsa.html").write_text(html, encoding="utf-8")
