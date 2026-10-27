#!/usr/bin/env python3
"""Validate the static website before publishing or previewing it."""

from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / "website"
PAGES = [
    ROOT / "index.html",
    ROOT / "es" / "index.html",
    ROOT / "privacy.html",
    ROOT / "es" / "privacy.html",
]


class Page(HTMLParser):
    def __init__(self, name):
        super().__init__(convert_charrefs=True)
        self.name = name
        self.ids = set()
        self.links = []
        self.scripts = 0
        self.title = ""
        self.lang = ""
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "html":
            self.lang = attrs.get("lang", "")
        if tag == "script":
            self.scripts += 1
        if tag == "title":
            self._in_title = True
        if "id" in attrs:
            if attrs["id"] in self.ids:
                raise ValueError(f"{self.name}: duplicate id {attrs['id']}")
            self.ids.add(attrs["id"])
        for key in ("href", "src"):
            if key in attrs:
                self.links.append((key, attrs[key]))

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data


pages = {}
for path in PAGES:
    page = Page(str(path.relative_to(ROOT)))
    page.feed(path.read_text(encoding="utf-8"))
    pages[path.resolve()] = page

errors = []
for path, page in pages.items():
    name = page.name
    if not page.lang:
        errors.append(f"{name}: missing html lang")
    if not page.title.strip():
        errors.append(f"{name}: missing title")
    if page.scripts:
        errors.append(f"{name}: found {page.scripts} script tag(s)")
    for key, value in page.links:
        if value.startswith(("http://", "https://", "mailto:", "tel:", "data:")):
            continue
        if value.startswith("#"):
            if value[1:] not in page.ids:
                errors.append(f"{name}: missing fragment {value}")
            continue
        target, _, fragment = value.partition("#")
        target_path = (path.parent / target).resolve()
        if target_path.is_dir():
            target_path = target_path / "index.html"
        if not target_path.exists():
            errors.append(f"{name}: broken {key}={value}")
            continue
        if fragment:
            target_page = pages.get(target_path)
            if target_page and fragment not in target_page.ids:
                errors.append(f"{name}: missing fragment #{fragment} in {target_page.name}")

if errors:
    print("\n".join(errors))
    raise SystemExit(1)

print(f"website checks passed: {len(pages)} pages, {sum(len(p.links) for p in pages.values())} references")
