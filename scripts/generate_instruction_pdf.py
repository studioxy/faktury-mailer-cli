from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "Instrukcja-nowy-komputer.pdf"

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN_X = 46
TOP_MARGIN = 50
BOTTOM_MARGIN = 40
CONTENT_WIDTH = PAGE_WIDTH - (MARGIN_X * 2)

# Studio • Editorial / Brass Ledger
C1 = HexColor("#1F1F1F")
C2 = HexColor("#5F0F40")
C3 = HexColor("#9A031E")
C4 = HexColor("#FB8B24")
C5 = HexColor("#EAE2B7")
SURFACE = HexColor("#252525")
SURFACE_2 = HexColor("#2E2A24")


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont("UiRegular", r"C:\Windows\Fonts\arial.ttf"))
    pdfmetrics.registerFont(TTFont("UiBold", r"C:\Windows\Fonts\arialbd.ttf"))
    pdfmetrics.registerFont(TTFont("UiMono", r"C:\Windows\Fonts\consola.ttf"))


def styles() -> dict[str, ParagraphStyle]:
    return {
        "kicker": ParagraphStyle(
            "kicker",
            fontName="UiBold",
            fontSize=11,
            leading=12,
            textColor=C4,
        ),
        "title": ParagraphStyle(
            "title",
            fontName="UiBold",
            fontSize=28,
            leading=30,
            textColor=C5,
        ),
        "deck": ParagraphStyle(
            "deck",
            fontName="UiRegular",
            fontSize=11,
            leading=16,
            textColor=C5,
        ),
        "section": ParagraphStyle(
            "section",
            fontName="UiBold",
            fontSize=16,
            leading=18,
            textColor=C5,
        ),
        "body": ParagraphStyle(
            "body",
            fontName="UiRegular",
            fontSize=10.5,
            leading=15,
            textColor=C5,
        ),
        "small": ParagraphStyle(
            "small",
            fontName="UiRegular",
            fontSize=9.2,
            leading=13,
            textColor=C5,
        ),
    }


def draw_background(pdf: canvas.Canvas) -> None:
    pdf.setFillColor(C1)
    pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, stroke=0, fill=1)

    pdf.setFillColor(C2)
    pdf.rect(0, PAGE_HEIGHT - 26, PAGE_WIDTH, 26, stroke=0, fill=1)

    pdf.setFillColor(C4)
    pdf.rect(0, PAGE_HEIGHT - 42, 112, 6, stroke=0, fill=1)

    pdf.setFillColor(C3)
    pdf.rect(PAGE_WIDTH - 150, 0, 150, 8, stroke=0, fill=1)

    pdf.setStrokeColor(C4)
    pdf.setLineWidth(2)
    pdf.line(MARGIN_X, PAGE_HEIGHT - 118, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 118)


def ensure_space(pdf: canvas.Canvas, y: float, needed: float) -> float:
    if y - needed >= BOTTOM_MARGIN:
        return y
    pdf.showPage()
    draw_background(pdf)
    return PAGE_HEIGHT - TOP_MARGIN


def draw_paragraph(pdf: canvas.Canvas, text: str, style: ParagraphStyle, x: float, y: float, width: float) -> float:
    paragraph = Paragraph(text, style)
    _, height = paragraph.wrap(width, PAGE_HEIGHT)
    paragraph.drawOn(pdf, x, y - height)
    return y - height


def draw_label(pdf: canvas.Canvas, x: float, y: float, label: str, fill_color) -> None:
    width = max(56, 12 + pdf.stringWidth(label, "UiBold", 9))
    pdf.setFillColor(fill_color)
    pdf.rect(x, y - 18, width, 18, stroke=0, fill=1)
    pdf.setFillColor(C1)
    pdf.setFont("UiBold", 9)
    pdf.drawString(x + 6, y - 12.5, label)


def draw_frame(pdf: canvas.Canvas, x: float, top_y: float, width: float, height: float, border_color=C4, fill_color=None) -> None:
    if fill_color is not None:
        pdf.setFillColor(fill_color)
        pdf.rect(x, top_y - height, width, height, stroke=0, fill=1)
    pdf.setStrokeColor(border_color)
    pdf.setLineWidth(1.4)
    pdf.rect(x, top_y - height, width, height, stroke=1, fill=0)


def wrap_code_lines(pdf: canvas.Canvas, lines: list[str], max_width: float) -> list[str]:
    wrapped: list[str] = []
    for line in lines:
        if pdf.stringWidth(line, "UiMono", 9.4) <= max_width:
            wrapped.append(line)
            continue

        current = ""
        for char in line:
            candidate = f"{current}{char}"
            if pdf.stringWidth(candidate, "UiMono", 9.4) <= max_width:
                current = candidate
            else:
                if current:
                    wrapped.append(current)
                current = char
        if current:
            wrapped.append(current)
    return wrapped


def draw_code_block(pdf: canvas.Canvas, x: float, top_y: float, width: float, lines: list[str], accent=C4) -> float:
    wrapped_lines = wrap_code_lines(pdf, lines, width - 28)
    line_height = 12
    height = 18 + (len(wrapped_lines) * line_height) + 16

    draw_frame(pdf, x, top_y, width, height, border_color=accent, fill_color=SURFACE)
    pdf.setFillColor(accent)
    pdf.rect(x, top_y - 18, 52, 18, stroke=0, fill=1)
    pdf.setFillColor(C1)
    pdf.setFont("UiBold", 9)
    pdf.drawString(x + 7, top_y - 12.5, "COMMAND")

    pdf.setFillColor(C5)
    pdf.setFont("UiMono", 9.4)
    current_y = top_y - 32
    for line in wrapped_lines:
        pdf.drawString(x + 12, current_y, line)
        current_y -= line_height

    return top_y - height


def draw_step(pdf: canvas.Canvas, index: str, title: str, body: str, x: float, top_y: float, width: float) -> float:
    draw_label(pdf, x, top_y, index, C3)
    current_y = top_y - 30
    current_y = draw_paragraph(pdf, title, STYLES["section"], x, current_y, width)
    current_y -= 8
    current_y = draw_paragraph(pdf, body, STYLES["body"], x, current_y, width)
    return current_y


def draw_check_row(pdf: canvas.Canvas, text: str, y: float) -> float:
    pdf.setFillColor(SURFACE)
    pdf.rect(MARGIN_X, y - 26, CONTENT_WIDTH, 26, stroke=0, fill=1)
    pdf.setFillColor(C4)
    pdf.rect(MARGIN_X, y - 26, 6, 26, stroke=0, fill=1)
    pdf.setFillColor(C5)
    pdf.setFont("UiRegular", 10.2)
    pdf.drawString(MARGIN_X + 16, y - 17, text)
    return y - 34


register_fonts()
STYLES = styles()


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(OUTPUT), pagesize=A4)
    pdf.setTitle("Instrukcja uruchomienia na nowym komputerze")
    draw_background(pdf)

    y = PAGE_HEIGHT - TOP_MARGIN
    y = draw_paragraph(pdf, "FAKTURY MAILER / NEW MACHINE RUNBOOK", STYLES["kicker"], MARGIN_X, y, CONTENT_WIDTH)
    y -= 10
    y = draw_paragraph(
        pdf,
        "Uruchomienie i uzycie systemu na nowym komputerze",
        STYLES["title"],
        MARGIN_X,
        y,
        CONTENT_WIDTH * 0.82,
    )
    y -= 12
    y = draw_paragraph(
        pdf,
        "Surowa instrukcja operacyjna: klon repo, instalacja, konfiguracja, dry-run, test jednej sztuki i dopiero potem pelna wysylka.",
        STYLES["deck"],
        MARGIN_X,
        y,
        CONTENT_WIDTH * 0.9,
    )
    y -= 28

    draw_frame(pdf, MARGIN_X, y, CONTENT_WIDTH, 126, border_color=C4, fill_color=SURFACE)
    draw_label(pdf, MARGIN_X, y, "START / 3 COMMANDS", C4)
    start_y = y - 36
    start_y = draw_code_block(
        pdf,
        MARGIN_X + 16,
        start_y,
        CONTENT_WIDTH - 32,
        [
            "git clone https://github.com/studioxy/faktury-mailer-cli.git",
            "cd faktury-mailer-cli",
            "npm install",
        ],
        accent=C4,
    )
    y -= 146

    y = ensure_space(pdf, y, 220)
    left_w = (CONTENT_WIDTH - 18) / 2
    right_x = MARGIN_X + left_w + 18

    draw_frame(pdf, MARGIN_X, y, left_w, 176, border_color=C2, fill_color=SURFACE)
    left_y = y - 12
    left_y = draw_step(
        pdf,
        "01",
        "Przygotuj pliki robocze",
        "Skopiuj config.example.json do config.json. Skopiuj .env.example do .env. Do katalogu data wrzuc kontrahenci.xlsx i faktury PDF albo ZIP.",
        MARGIN_X + 14,
        left_y,
        left_w - 28,
    )

    draw_frame(pdf, right_x, y, left_w, 214, border_color=C3, fill_color=SURFACE_2)
    right_y = y - 12
    right_y = draw_step(
        pdf,
        "02",
        "Uzupelnij sekrety Gmaila",
        "Do pliku .env wpisz wlasne dane Google OAuth. Bez tego dry-run zadziala, ale realna wysylka nie.",
        right_x + 14,
        right_y,
        left_w - 28,
    )
    right_y -= 10
    right_y = draw_code_block(
        pdf,
        right_x + 14,
        right_y,
        left_w - 28,
        [
            "GOOGLE_CLIENT_ID=...",
            "GOOGLE_CLIENT_SECRET=...",
            "GOOGLE_REFRESH_TOKEN=...",
            "GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground",
        ],
        accent=C3,
    )
    y -= 236

    y = ensure_space(pdf, y, 280)
    draw_frame(pdf, MARGIN_X, y, CONTENT_WIDTH, 264, border_color=C4, fill_color=SURFACE)
    flow_y = y - 14
    flow_y = draw_step(
        pdf,
        "03",
        "Najpierw dry-run",
        "Zobacz podglad i upewnij sie, ze parowanie po NIP wyglada dobrze i nic nie leci jeszcze do klientow.",
        MARGIN_X + 16,
        flow_y,
        CONTENT_WIDTH - 32,
    )
    flow_y -= 10
    flow_y = draw_code_block(
        pdf,
        MARGIN_X + 16,
        flow_y,
        CONTENT_WIDTH - 32,
        ["npm run dev -- --config .\\config.json --dry-run"],
        accent=C4,
    )
    flow_y -= 16
    flow_y = draw_step(
        pdf,
        "04",
        "Potem jedna sztuka testowa",
        "Wyslij jedna fakture do siebie, zanim ruszysz cala partie.",
        MARGIN_X + 16,
        flow_y,
        CONTENT_WIDTH - 32,
    )
    flow_y -= 10
    flow_y = draw_code_block(
        pdf,
        MARGIN_X + 16,
        flow_y,
        CONTENT_WIDTH - 32,
        ['npm run dev -- --config .\\config.json --override-email "twoj@gmail.com" --limit 1'],
        accent=C3,
    )
    y -= 286

    y = ensure_space(pdf, y, 190)
    draw_frame(pdf, MARGIN_X, y, CONTENT_WIDTH, 162, border_color=C3, fill_color=SURFACE_2)
    confirm_y = y - 14
    confirm_y = draw_step(
        pdf,
        "05",
        "Potwierdzenie i finalna wysylka",
        "Program poprosi o reczne potwierdzenie. Dla testu jednej faktury wpisz SEND 1. Jesli test dojdzie poprawnie, uruchom pelna wysylke.",
        MARGIN_X + 16,
        confirm_y,
        CONTENT_WIDTH - 32,
    )
    confirm_y -= 10
    pdf.setFillColor(C4)
    pdf.rect(MARGIN_X + 16, confirm_y - 34, 132, 34, stroke=0, fill=1)
    pdf.setFillColor(C1)
    pdf.setFont("UiBold", 18)
    pdf.drawString(MARGIN_X + 28, confirm_y - 23, "SEND 1")
    confirm_y -= 52
    confirm_y = draw_code_block(
        pdf,
        MARGIN_X + 16,
        confirm_y,
        CONTENT_WIDTH - 32,
        ["npm run dev -- --config .\\config.json"],
        accent=C4,
    )

    pdf.showPage()
    draw_background(pdf)
    y = PAGE_HEIGHT - TOP_MARGIN
    y = draw_paragraph(pdf, "CHECKLISTA OPERACYJNA", STYLES["kicker"], MARGIN_X, y, CONTENT_WIDTH)
    y -= 10
    y = draw_paragraph(pdf, "Zanim odpalisz pelna wysylke", STYLES["title"], MARGIN_X, y, CONTENT_WIDTH * 0.78)
    y -= 18

    checklist = [
        "Repo zostalo sklonowane do nowego katalogu.",
        "npm install zakonczyl sie poprawnie.",
        "Plik .env zawiera wlasne sekrety Google.",
        "Plik config.json jest obok projektu.",
        "W katalogu data sa kontrahenci.xlsx i faktury PDF.",
        "Dry-run pokazuje poprawne dopasowania.",
        "Test --limit 1 doszedl na Twoj adres.",
        "Dopiero teraz uruchamiasz pelna wysylke.",
    ]

    for item in checklist:
        y = ensure_space(pdf, y, 38)
        y = draw_check_row(pdf, item, y)

    y -= 12
    draw_frame(pdf, MARGIN_X, y, CONTENT_WIDTH, 72, border_color=C4, fill_color=SURFACE)
    draw_label(pdf, MARGIN_X, y, "RAPORTY", C4)
    note_y = y - 30
    note_y = draw_paragraph(
        pdf,
        "Po kazdym uruchomieniu raport JSON zapisuje sie w katalogu reports. Bezpieczny rytm pracy: clone -> install -> env -> data -> dry-run -> test 1 sztuki -> full send.",
        STYLES["body"],
        MARGIN_X + 14,
        note_y,
        CONTENT_WIDTH - 28,
    )

    pdf.save()


if __name__ == "__main__":
    main()
