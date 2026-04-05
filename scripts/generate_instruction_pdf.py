from pathlib import Path

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "Instrukcja-nowy-komputer.pdf"

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN_X = 54
TOP_MARGIN = 58
BOTTOM_MARGIN = 48
CONTENT_WIDTH = PAGE_WIDTH - (MARGIN_X * 2)

BG = HexColor("#0B1020")
SURFACE = HexColor("#131A2E")
SURFACE_2 = HexColor("#182137")
TEXT = HexColor("#E8EEF9")
MUTED = HexColor("#9CA8C7")
BLUE = HexColor("#55C2FF")
ORANGE = HexColor("#FFB14A")
GREEN = HexColor("#57D38C")
DIVIDER = Color(1, 1, 1, alpha=0.08)


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont("UiRegular", r"C:\Windows\Fonts\arial.ttf"))
    pdfmetrics.registerFont(TTFont("UiBold", r"C:\Windows\Fonts\arialbd.ttf"))
    pdfmetrics.registerFont(TTFont("UiMono", r"C:\Windows\Fonts\consola.ttf"))


def make_styles():
    return {
        "eyebrow": ParagraphStyle(
            "eyebrow",
            fontName="UiBold",
            fontSize=10,
            leading=12,
            textColor=BLUE,
            spaceAfter=0,
        ),
        "title": ParagraphStyle(
            "title",
            fontName="UiBold",
            fontSize=24,
            leading=30,
            textColor=TEXT,
            spaceAfter=0,
        ),
        "subtitle": ParagraphStyle(
            "subtitle",
            fontName="UiRegular",
            fontSize=11,
            leading=16,
            textColor=MUTED,
            spaceAfter=0,
        ),
        "section": ParagraphStyle(
            "section",
            fontName="UiBold",
            fontSize=15,
            leading=19,
            textColor=TEXT,
            spaceAfter=0,
        ),
        "body": ParagraphStyle(
            "body",
            fontName="UiRegular",
            fontSize=10.5,
            leading=15,
            textColor=TEXT,
            spaceAfter=0,
        ),
        "small": ParagraphStyle(
            "small",
            fontName="UiRegular",
            fontSize=9.5,
            leading=13,
            textColor=MUTED,
            spaceAfter=0,
        ),
        "list": ParagraphStyle(
            "list",
            fontName="UiRegular",
            fontSize=10.5,
            leading=15,
            textColor=TEXT,
            leftIndent=12,
            bulletIndent=0,
            spaceAfter=0,
        ),
    }


def draw_background(pdf: canvas.Canvas) -> None:
    pdf.setFillColor(BG)
    pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, stroke=0, fill=1)

    if hasattr(pdf, "setFillAlpha"):
        pdf.setFillAlpha(0.12)
    pdf.setFillColor(BLUE)
    pdf.circle(PAGE_WIDTH - 54, PAGE_HEIGHT - 34, 88, stroke=0, fill=1)

    if hasattr(pdf, "setFillAlpha"):
        pdf.setFillAlpha(0.10)
    pdf.setFillColor(ORANGE)
    pdf.circle(74, PAGE_HEIGHT - 20, 56, stroke=0, fill=1)

    if hasattr(pdf, "setFillAlpha"):
        pdf.setFillAlpha(1)

    pdf.setStrokeColor(DIVIDER)
    pdf.setLineWidth(1)
    pdf.line(MARGIN_X, PAGE_HEIGHT - 116, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 116)


def draw_paragraph(pdf: canvas.Canvas, text: str, style: ParagraphStyle, x: float, y: float, width: float) -> float:
    paragraph = Paragraph(text, style)
    _, height = paragraph.wrap(width, PAGE_HEIGHT)
    paragraph.drawOn(pdf, x, y - height)
    return y - height


def draw_badge(pdf: canvas.Canvas, x: float, y: float, label: str, fill_color) -> None:
    pdf.setFillColor(fill_color)
    pdf.roundRect(x, y - 16, 62, 22, 11, stroke=0, fill=1)
    pdf.setFillColor(BG)
    pdf.setFont("UiBold", 9)
    pdf.drawCentredString(x + 31, y - 9, label)


def draw_card(pdf: canvas.Canvas, x: float, top_y: float, width: float, height: float, fill_color=SURFACE) -> None:
    pdf.setFillColor(fill_color)
    pdf.roundRect(x, top_y - height, width, height, 18, stroke=0, fill=1)


def wrap_code_lines(pdf: canvas.Canvas, lines: list[str], font_name: str, font_size: float, max_width: float) -> list[str]:
    wrapped: list[str] = []
    for line in lines:
        if pdf.stringWidth(line, font_name, font_size) <= max_width:
            wrapped.append(line)
            continue

        current = ""
        for char in line:
            candidate = f"{current}{char}"
            if pdf.stringWidth(candidate, font_name, font_size) <= max_width:
                current = candidate
                continue

            if current:
                wrapped.append(current)
            current = char

        if current:
            wrapped.append(current)

    return wrapped


def draw_code_block(pdf: canvas.Canvas, x: float, top_y: float, width: float, lines: list[str], accent=BLUE) -> float:
    font_name = "UiMono"
    font_size = 9.2
    line_height = 12
    padding_x = 16
    padding_top = 28
    padding_bottom = 14
    wrapped_lines = wrap_code_lines(pdf, lines, font_name, font_size, width - (padding_x * 2))
    block_height = padding_top + padding_bottom + (len(wrapped_lines) * line_height)

    draw_card(pdf, x, top_y, width, block_height, SURFACE_2)
    pdf.setFillColor(accent)
    pdf.roundRect(x + 14, top_y - 16, 44, 16, 8, stroke=0, fill=1)
    pdf.setFillColor(BG)
    pdf.setFont("UiBold", 8)
    pdf.drawCentredString(x + 36, top_y - 11, "KOD")

    pdf.setFillColor(TEXT)
    pdf.setFont(font_name, font_size)
    current_y = top_y - padding_top - 2
    for line in wrapped_lines:
        pdf.drawString(x + padding_x, current_y, line)
        current_y -= line_height

    return top_y - block_height


def ensure_space(pdf: canvas.Canvas, y: float, needed: float) -> float:
    if y - needed >= BOTTOM_MARGIN:
        return y
    pdf.showPage()
    draw_background(pdf)
    return PAGE_HEIGHT - TOP_MARGIN


def main() -> None:
    register_fonts()
    styles = make_styles()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    pdf = canvas.Canvas(str(OUTPUT), pagesize=A4)
    pdf.setTitle("Instrukcja uruchomienia na nowym komputerze")
    draw_background(pdf)

    y = PAGE_HEIGHT - TOP_MARGIN
    y = draw_paragraph(pdf, "FAKTURY MAILER CLI", styles["eyebrow"], MARGIN_X, y, CONTENT_WIDTH)
    y -= 8
    y = draw_paragraph(
        pdf,
        "Instrukcja uruchomienia i użycia na nowym komputerze",
        styles["title"],
        MARGIN_X,
        y,
        CONTENT_WIDTH * 0.78,
    )
    y -= 10
    y = draw_paragraph(
        pdf,
        "Minimalny zestaw kroków, żeby po klonowaniu repo szybko uruchomić system, sprawdzić podgląd i bezpiecznie wysłać pierwszą fakturę testową.",
        styles["subtitle"],
        MARGIN_X,
        y,
        CONTENT_WIDTH * 0.9,
    )
    y -= 26

    quick_card_height = 168
    draw_card(pdf, MARGIN_X, y, CONTENT_WIDTH, quick_card_height)
    draw_badge(pdf, MARGIN_X + 20, y - 18, "START", ORANGE)
    y_inside = y - 34
    y_inside = draw_paragraph(
        pdf,
        "3 komendy startowe",
        styles["section"],
        MARGIN_X + 20,
        y_inside,
        CONTENT_WIDTH - 40,
    )
    y_inside -= 12
    y_inside = draw_code_block(
        pdf,
        MARGIN_X + 20,
        y_inside,
        CONTENT_WIDTH - 40,
        [
            "git clone https://github.com/studioxy/faktury-mailer-cli.git",
            "cd faktury-mailer-cli",
            "npm install",
        ],
        accent=BLUE,
    )
    y = y - quick_card_height - 20

    y = ensure_space(pdf, y, 180)
    left_w = (CONTENT_WIDTH - 14) / 2
    right_x = MARGIN_X + left_w + 14

    draw_card(pdf, MARGIN_X, y, left_w, 170)
    draw_badge(pdf, MARGIN_X + 18, y - 18, "PLIKI", BLUE)
    ly = y - 36
    ly = draw_paragraph(pdf, "Co przygotować", styles["section"], MARGIN_X + 18, ly, left_w - 36)
    ly -= 8
    ly = draw_paragraph(pdf, "1. Skopiuj `config.example.json` do `config.json`.", styles["body"], MARGIN_X + 18, ly, left_w - 36)
    ly -= 6
    ly = draw_paragraph(pdf, "2. Skopiuj `.env.example` do `.env`.", styles["body"], MARGIN_X + 18, ly, left_w - 36)
    ly -= 6
    ly = draw_paragraph(pdf, "3. Wrzuć do katalogu `data` plik `kontrahenci.xlsx` oraz faktury PDF albo ZIP.", styles["body"], MARGIN_X + 18, ly, left_w - 36)

    draw_card(pdf, right_x, y, left_w, 186)
    draw_badge(pdf, right_x + 18, y - 18, "ENV", GREEN)
    ry = y - 36
    ry = draw_paragraph(pdf, "Sekrety Gmaila", styles["section"], right_x + 18, ry, left_w - 36)
    ry -= 8
    ry = draw_paragraph(pdf, "Do pliku `.env` wpisz własne dane Google OAuth.", styles["body"], right_x + 18, ry, left_w - 36)
    ry -= 10
    ry = draw_code_block(
        pdf,
        right_x + 18,
        ry,
        left_w - 36,
        [
            "GOOGLE_CLIENT_ID=...",
            "GOOGLE_CLIENT_SECRET=...",
            "GOOGLE_REFRESH_TOKEN=...",
            "GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground",
        ],
        accent=GREEN,
    )
    y -= 190

    y = ensure_space(pdf, y, 240)
    draw_card(pdf, MARGIN_X, y, CONTENT_WIDTH, 232)
    draw_badge(pdf, MARGIN_X + 20, y - 18, "BEZPIECZNIE", BLUE)
    sy = y - 36
    sy = draw_paragraph(pdf, "Kolejność uruchomienia", styles["section"], MARGIN_X + 20, sy, CONTENT_WIDTH - 40)
    sy -= 10
    sy = draw_paragraph(pdf, "1. Najpierw sprawdź podgląd bez wysyłki.", styles["body"], MARGIN_X + 20, sy, CONTENT_WIDTH - 40)
    sy -= 8
    sy = draw_code_block(
        pdf,
        MARGIN_X + 20,
        sy,
        CONTENT_WIDTH - 40,
        ["npm run dev -- --config .\\config.json --dry-run"],
        accent=BLUE,
    )
    sy -= 16
    sy = draw_paragraph(pdf, "2. Potem wyślij jedną fakturę testowo do siebie.", styles["body"], MARGIN_X + 20, sy, CONTENT_WIDTH - 40)
    sy -= 8
    sy = draw_code_block(
        pdf,
        MARGIN_X + 20,
        sy,
        CONTENT_WIDTH - 40,
        ['npm run dev -- --config .\\config.json --override-email "twoj@gmail.com" --limit 1'],
        accent=ORANGE,
    )
    y -= 248

    y = ensure_space(pdf, y, 220)
    draw_card(pdf, MARGIN_X, y, CONTENT_WIDTH, 202)
    draw_badge(pdf, MARGIN_X + 20, y - 18, "WYSYŁKA", ORANGE)
    fy = y - 36
    fy = draw_paragraph(pdf, "Finalny krok", styles["section"], MARGIN_X + 20, fy, CONTENT_WIDTH - 40)
    fy -= 8
    fy = draw_paragraph(
        pdf,
        "Program poprosi o ręczne potwierdzenie. Przy teście jednej faktury wpisz dokładnie:",
        styles["body"],
        MARGIN_X + 20,
        fy,
        CONTENT_WIDTH - 40,
    )
    fy -= 10
    fy = draw_code_block(pdf, MARGIN_X + 20, fy, 180, ["SEND 1"], accent=ORANGE)
    fy -= 16
    fy = draw_paragraph(pdf, "Jeśli test dotrze poprawnie, uruchom pełną wysyłkę:", styles["body"], MARGIN_X + 20, fy, CONTENT_WIDTH - 40)
    fy -= 10
    fy = draw_code_block(
        pdf,
        MARGIN_X + 20,
        fy,
        CONTENT_WIDTH - 40,
        ["npm run dev -- --config .\\config.json"],
        accent=GREEN,
    )
    y -= 220

    y = ensure_space(pdf, y, 120)
    draw_card(pdf, MARGIN_X, y, CONTENT_WIDTH, 96, SURFACE_2)
    draw_badge(pdf, MARGIN_X + 20, y - 18, "RAPORT", BLUE)
    gy = y - 36
    gy = draw_paragraph(
        pdf,
        "Raporty po każdym uruchomieniu zapisują się w katalogu `reports`. Najbezpieczniejszy rytm pracy na nowym komputerze: klon -> npm install -> .env -> data -> dry-run -> test 1 sztuki -> pełna wysyłka.",
        styles["body"],
        MARGIN_X + 20,
        gy,
        CONTENT_WIDTH - 40,
    )

    pdf.showPage()
    draw_background(pdf)
    y = PAGE_HEIGHT - TOP_MARGIN
    y = draw_paragraph(pdf, "Szybka checklista", styles["title"], MARGIN_X, y, CONTENT_WIDTH)
    y -= 12
    checklist = [
        "Repo sklonowane do nowego katalogu.",
        "Pakiety zainstalowane przez `npm install`.",
        "Plik `.env` uzupełniony własnymi sekretami Google.",
        "Plik `config.json` obecny obok projektu.",
        "W katalogu `data` są `kontrahenci.xlsx` i faktury PDF.",
        "Dry-run pokazuje poprawne dopasowania.",
        "Test `--limit 1` doszedł na własny adres.",
        "Dopiero potem uruchamiasz pełną wysyłkę.",
    ]
    for item in checklist:
        y = ensure_space(pdf, y, 34)
        draw_card(pdf, MARGIN_X, y, CONTENT_WIDTH, 28, SURFACE)
        pdf.setFillColor(GREEN)
        pdf.setFont("UiBold", 11)
        pdf.drawString(MARGIN_X + 18, y - 18, "•")
        y = draw_paragraph(pdf, item, styles["body"], MARGIN_X + 34, y - 8, CONTENT_WIDTH - 52) - 12

    pdf.save()


if __name__ == "__main__":
    main()
