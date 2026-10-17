#!/usr/bin/env python3
"""Clicks Communicator 風のエミュレータースキン（外枠画像・マスク・layout）を生成します。

寸法は公式サイトの公開値（本体 130.5 x 78.63mm、4.03 インチ 1080x1200 表示）から算出しています。
ベゼル幅とキー配置は推定のイラストです。実機の実測値が分かったら定数を更新して再生成してください。

使い方: python3 tools/generate_skin.py
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont

SKIN_DIR = Path(__file__).resolve().parent.parent / "skin" / "clicks_communicator"

DISPLAY_W_PX = 1080
DISPLAY_H_PX = 1200
DISPLAY_DIAGONAL_IN = 4.03
DEVICE_W_MM = 78.63
DEVICE_H_MM = 130.5

# 以下は推定値
DEVICE_CORNER_MM = 9.0
DISPLAY_CORNER_PX = 70
TOP_BEZEL_EQUALS_SIDE = True

BODY_COLOR = (29, 29, 31, 255)
EDGE_COLOR = (70, 70, 74, 255)
KEY_COLOR = (44, 44, 47, 255)
KEY_EDGE_COLOR = (78, 78, 82, 255)
LABEL_COLOR = (225, 225, 230, 255)
CAPTION_COLOR = (120, 120, 126, 255)

# 1 行 = (ラベル, 幅の単位) のリスト。各行の合計は 10 単位。
KEY_ROWS = [
    [(c, 1) for c in "QWERTYUIOP"],
    [(c, 1) for c in "ASDFGHJKL"] + [("del", 1)],
    [("shift", 1)] + [(c, 1) for c in "ZXCVBNM"] + [(".", 1), ("ret", 1)],
    [("alt", 1), ("sym", 1), ("space", 6), (",", 1), ("?", 1)],
]

SUPERSAMPLE = 2


def px_per_mm() -> float:
    diagonal_px = math.hypot(DISPLAY_W_PX, DISPLAY_H_PX)
    display_w_mm = DISPLAY_DIAGONAL_IN * 25.4 * DISPLAY_W_PX / diagonal_px
    return DISPLAY_W_PX / display_w_mm


def load_font(size: int) -> ImageFont.ImageFont:
    for path in (
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ):
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default(size=size)


def geometry() -> dict[str, int]:
    scale = px_per_mm()
    frame_w = round(DEVICE_W_MM * scale)
    frame_h = round(DEVICE_H_MM * scale)
    display_x = (frame_w - DISPLAY_W_PX) // 2
    display_y = display_x if TOP_BEZEL_EQUALS_SIDE else round(5 * scale)
    return {
        "frame_w": frame_w,
        "frame_h": frame_h,
        "display_x": display_x,
        "display_y": display_y,
        "corner": round(DEVICE_CORNER_MM * scale),
    }


def draw_frame(g: dict[str, int]) -> Image.Image:
    s = SUPERSAMPLE
    w, h = g["frame_w"] * s, g["frame_h"] * s
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius=g["corner"] * s,
                        fill=BODY_COLOR, outline=EDGE_COLOR, width=4 * s)

    dx, dy = g["display_x"] * s, g["display_y"] * s
    d.rounded_rectangle((dx, dy, dx + DISPLAY_W_PX * s, dy + DISPLAY_H_PX * s),
                        radius=DISPLAY_CORNER_PX * s, fill=(0, 0, 0, 255))

    side = g["display_x"]
    kb_top = g["display_y"] + DISPLAY_H_PX + side
    kb_bottom = g["frame_h"] - round(side * 1.6)
    kb_left, kb_right = side, g["frame_w"] - side
    gap = 14
    rows = len(KEY_ROWS)
    key_h = (kb_bottom - kb_top - gap * (rows - 1)) / rows
    unit = (kb_right - kb_left - gap * 9) / 10

    letter_font = load_font(round(key_h * 0.42) * s)
    word_font = load_font(round(key_h * 0.26) * s)
    for r, row in enumerate(KEY_ROWS):
        x = float(kb_left)
        y0 = kb_top + r * (key_h + gap)
        for label, units in row:
            kw = unit * units + gap * (units - 1)
            box = (x * s, y0 * s, (x + kw) * s, (y0 + key_h) * s)
            d.rounded_rectangle(box, radius=round(key_h * 0.28) * s,
                                fill=KEY_COLOR, outline=KEY_EDGE_COLOR, width=2 * s)
            if label != "space":
                font = letter_font if len(label) == 1 else word_font
                d.text(((box[0] + box[2]) / 2, (box[1] + box[3]) / 2), label,
                       font=font, fill=LABEL_COLOR, anchor="mm")
            x += kw + gap

    caption_font = load_font(22 * s)
    d.text((w / 2, (kb_bottom + g["frame_h"]) / 2 * s),
           "Community skin - not an official Clicks asset",
           font=caption_font, fill=CAPTION_COLOR, anchor="mm")

    return img.resize((g["frame_w"], g["frame_h"]), Image.LANCZOS)


def draw_mask(g: dict[str, int]) -> Image.Image:
    """表示領域の角を本体色で覆う前景マスク（外枠と同じサイズ）。"""
    s = SUPERSAMPLE
    w, h = g["frame_w"] * s, g["frame_h"] * s
    dx, dy = g["display_x"] * s, g["display_y"] * s
    rect = (dx, dy, dx + DISPLAY_W_PX * s - 1, dy + DISPLAY_H_PX * s - 1)

    covered = Image.new("L", (w, h), 0)
    ImageDraw.Draw(covered).rectangle(rect, fill=255)
    visible = Image.new("L", (w, h), 0)
    ImageDraw.Draw(visible).rounded_rectangle(rect, radius=DISPLAY_CORNER_PX * s, fill=255)
    alpha = ImageChops.subtract(covered, visible)

    mask = Image.new("RGBA", (w, h), BODY_COLOR)
    mask.putalpha(alpha)
    return mask.resize((g["frame_w"], g["frame_h"]), Image.LANCZOS)


def layout_text(g: dict[str, int]) -> str:
    return f"""parts {{
    device {{
        display {{
            width   {DISPLAY_W_PX}
            height  {DISPLAY_H_PX}
            x       0
            y       0
        }}
    }}
    portrait {{
        background {{
            image   frame.png
        }}
        foreground {{
            mask    mask.png
        }}
    }}
}}

layouts {{
    portrait {{
        width     {g["frame_w"]}
        height    {g["frame_h"]}
        color     0x000000

        part1 {{
            name    portrait
            x       0
            y       0
        }}

        part2 {{
            name    device
            x       {g["display_x"]}
            y       {g["display_y"]}
        }}
    }}
}}
"""


def main() -> None:
    g = geometry()
    SKIN_DIR.mkdir(parents=True, exist_ok=True)
    draw_frame(g).save(SKIN_DIR / "frame.png", optimize=True)
    draw_mask(g).save(SKIN_DIR / "mask.png", optimize=True)
    (SKIN_DIR / "layout").write_text(layout_text(g), encoding="utf-8")
    print(f"skin: {SKIN_DIR}")
    print(f"frame {g['frame_w']}x{g['frame_h']} px, display at ({g['display_x']}, {g['display_y']}), "
          f"{px_per_mm():.2f} px/mm")


if __name__ == "__main__":
    main()
