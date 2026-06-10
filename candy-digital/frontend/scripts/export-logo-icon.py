"""Crop Candy Digital logo to icon only + transparent background."""
import shutil
from collections import deque
from PIL import Image

PUBLIC = r"d:\candy-digital\candy-digital\frontend\public"
SRC = f"{PUBLIC}\\logo-candy-digital.png"
BACKUP = f"{PUBLIC}\\logo-candy-digital-lockup.png"
# Analyzed from 1024x1024 asset: main mark only (no text, no bottom app tile)
CROP = (112, 365, 432, 655)


def is_bg(r: int, g: int, b: int) -> bool:
    if r > 252 and g > 252 and b > 252:
        return True
    if r > 245 and g > 245 and b > 245 and (max(r, g, b) - min(r, g, b)) < 15:
        return True
    return False


def flood_transparent(im: Image.Image) -> Image.Image:
    w, h = im.size
    px = im.load()
    bg = [[False] * w for _ in range(h)]
    q = deque()
    for sx, sy in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        r, g, b, _ = px[sx, sy]
        if is_bg(r, g, b):
            q.append((sx, sy))
    seen = set()
    while q:
        x, y = q.popleft()
        if (x, y) in seen:
            continue
        if x < 0 or y < 0 or x >= w or y >= h:
            continue
        seen.add((x, y))
        r, g, b, a = px[x, y]
        if not is_bg(r, g, b):
            continue
        bg[y][x] = True
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q.append((x + dx, y + dy))

    out = im.copy()
    opx = out.load()
    for y in range(h):
        for x in range(w):
            if bg[y][x]:
                r, g, b, _ = opx[x, y]
                opx[x, y] = (r, g, b, 0)
    return out


def main():
    shutil.copy2(SRC, BACKUP)
    print("Backup ->", BACKUP)
    im = Image.open(SRC).convert("RGBA")
    icon = im.crop(CROP)
    icon = flood_transparent(icon)
    bbox = icon.getbbox()
    if bbox:
        icon = icon.crop(bbox)
    icon.save(SRC, "PNG", optimize=True)
    print("Wrote icon-only transparent ->", SRC, "size", icon.size)


if __name__ == "__main__":
    main()
