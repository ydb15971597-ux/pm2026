"""index.html → artifact.html (claude.ai Artifact 웹 게임용 페이지)
Artifact는 게시할 때 <!doctype>/<html>/<head>/<body> 뼈대를 붙이므로 제목·스타일·본문만 남긴다.
게임 스크립트(*.js)는 그대로 함께 게시한다:  python3 tools/build_artifact.py"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = (root/'index.html').read_text(encoding='utf-8')
title = re.search(r'<title>.*?</title>', src, re.S).group(0)
style = re.search(r'<style>(.*?)</style>', src, re.S).group(1)
body = re.search(r'<body[^>]*>(.*?)</body>', src, re.S).group(1).strip()
scripts = re.findall(r'<script src="([^"]+)"></script>', body)
style = ':root{color-scheme:dark}\n' + style   # 다크 단일 테마 디자인
out = f'{title}\n<style>{style}</style>\n{body}\n'
(root/'artifact.html').write_text(out, encoding='utf-8')
print('artifact.html written; scripts:', ', '.join(scripts))
