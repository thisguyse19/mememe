#!/usr/bin/env python3
"""Generate Saab 10-5 press release PDF."""

from fpdf import FPDF

FONT_DIR = "/usr/share/fonts/truetype/dejavu/"
OUTPUT = "/workspace/press-releases/Saab_10-5_Press_Release.pdf"


class PressReleasePDF(FPDF):
    def footer(self):
        self.set_y(-14)
        self.set_font("DejaVu", "", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, str(self.page_no()), align="C")

    def section(self, title: str):
        self.ln(4)
        self.set_font("DejaVu", "B", 10)
        self.set_text_color(0, 0, 0)
        self.multi_cell(0, 5.5, title)
        self.ln(2)

    def body(self, text: str):
        self.set_font("DejaVu", "", 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5.2, text)
        self.ln(2.5)

    def quote(self, text: str, name: str, title: str):
        self.set_font("DejaVu", "", 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5.2, f'"{text}" says {name}, {title}.')
        self.ln(3)


def spec_table(pdf: PressReleasePDF, rows: list[tuple[str, str]]):
    w_label, w_val = 72, 94
    pdf.set_font("DejaVu", "B", 9)
    pdf.set_fill_color(0, 51, 102)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(w_label, 7, "Specification", border=1, fill=True)
    pdf.cell(w_val, 7, "Saab 10-5", border=1, fill=True, new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("DejaVu", "", 9)
    fill = False
    for label, val in rows:
        pdf.set_text_color(30, 30, 30)
        pdf.set_fill_color(240, 244, 248) if fill else pdf.set_fill_color(255, 255, 255)
        pdf.cell(w_label, 6.2, label, border=1, fill=True)
        pdf.cell(w_val, 6.2, val, border=1, fill=True, new_x="LMARGIN", new_y="NEXT")
        fill = not fill
    pdf.ln(3)


def build():
    pdf = PressReleasePDF("P", "mm", "A4")
    pdf.set_auto_page_break(True, 18)
    pdf.add_font("DejaVu", "", FONT_DIR + "DejaVuSans.ttf")
    pdf.add_font("DejaVu", "B", FONT_DIR + "DejaVuSans-Bold.ttf")
    pdf.set_margins(20, 18, 20)
    pdf.add_page()

    pdf.set_font("DejaVu", "B", 24)
    pdf.set_text_color(0, 51, 102)
    pdf.cell(0, 10, "SAAB", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("DejaVu", "", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 5, "Press Release  |  Media Information", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_draw_color(0, 51, 102)
    pdf.set_line_width(0.7)
    pdf.line(20, pdf.get_y(), 190, pdf.get_y())
    pdf.ln(6)

    pdf.set_font("DejaVu", "B", 8)
    pdf.set_text_color(180, 0, 0)
    pdf.cell(0, 5, "FOR IMMEDIATE RELEASE", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)

    pdf.set_font("DejaVu", "B", 16)
    pdf.set_text_color(0, 0, 0)
    pdf.multi_cell(0, 7, "Saab unveils the new Saab 10-5")
    pdf.ln(4)

    # --- Main release body (~550 words, Saab-style) ---

    pdf.body(
        "Trollhättan, Sweden, 11 September 2026 — Saab has today unveiled the Saab 10-5, "
        "a new flagship passenger car developed at the Product Development Centre in Trollhättan."
    )
    pdf.body(
        "The Saab 10-5 is offered with a V12 hybrid powertrain rated at 693 hp and 1,021 Nm of torque. "
        "Power is transferred through an 11-speed dual-clutch transmission, designated Saabtronic. "
        "Saab states acceleration from 0 to 100 km/h at 2.9 seconds. Electric range under WLTP is up to 78 km. "
        "Combined CO₂ emissions are quoted at 42 g/km. These figures remain provisional pending homologation."
    )
    pdf.body(
        "The car introduces Saabonomous Driving, Saabriver driver recognition, the Saabomboclat infotainment "
        "system and Saaboob MATRIX LED lighting. Saabottom rear-wheel steering and Saab's Saabrication "
        "cooling technology are also fitted."
    )

    pdf.quote(
        "The Saab 10-5 is a further step in our passenger vehicle programme. We have applied the same "
        "approach to system integration used elsewhere in the company, with a clear focus on how the vehicle "
        "responds to the driver",
        "Erik Lindqvist",
        "President and CEO of Saab Automobile",
    )

    pdf.body(
        "Saabriver stores profiles for up to 30 drivers and applies settings for seating, climate, audio, "
        "navigation and lighting when a registered user enters the vehicle. Infotainment is handled through "
        "Saab OS 10, with a 12.3-inch Saab Darkroom display and three further screens in the cabin. "
        "Voice control is provided by Saabitch."
    )

    pdf.section("Model range")
    pdf.body(
        "The Saab 10-5 is available in three specifications."
    )
    pdf.body(
        "Core includes all-wheel drive, Saabtronic transmission, Saaboob lighting, Saabomboclat infotainment, "
        "Saabriver, Saab Darkroom instrumentation and 20-inch alloy wheels. List price from EUR 189,000."
    )
    pdf.body(
        "Premium Plus adds Saabonomous Driving, Saabitch Pro, the 0G seating system with Bose Magneride, "
        "Saabiarrhoea scent personalisation, a 34-speaker Harman Kardon audio system with Saabombastic tuning, "
        "four-screen cabin display and 21-inch alloy wheels. List price from EUR 224,000."
    )
    pdf.body(
        "Launch Edition is limited to 500 vehicles. It includes all Premium Plus equipment together with "
        "Trollhättan Copper exterior paint, Launch Edition interior trim, black brake calipers and "
        "model-specific badging. List price from EUR 268,000."
    )

    pdf.section("Exterior colours")
    pdf.body(
        "The following exterior colours are available on Core and Premium Plus: Aero Blue, Arctic White, "
        "Baltic Grey, Graphite Steel, Granite Black, Ice Silver, Midnight Green, Polar Midnight, Scarlet Wing, "
        "Storm Cloud and Titanium Mist."
    )
    pdf.body(
        "Trollhättan Copper is reserved for Launch Edition. Aero Blue and Granite Black are no-cost options; "
        "remaining colours are offered at additional charge. Two interior environments are available: "
        "Charcoal woven textile with aluminium trim on Core, and Nappa leather with walnut inlay on "
        "Premium Plus and Launch Edition."
    )

    pdf.section("Market introduction")
    pdf.body(
        "The Saab 10-5 will be shown in Stockholm on 18 September 2026. Orders open in Sweden, Norway, "
        "Germany, the United Kingdom and the Netherlands. Deliveries are planned from the second quarter of 2027. "
        "Production takes place in Trollhättan."
    )

    pdf.section("Technical data")
    spec_table(
        pdf,
        [
            ("Body style", "Four-door sedan"),
            ("Length / width / height", "5,218 / 1,998 / 1,445 mm"),
            ("Wheelbase", "3,016 mm"),
            ("Kerb weight (DIN)", "2,285 kg"),
            ("Powertrain", "6.0-litre V12 hybrid"),
            ("System output", "693 hp (515 kW)"),
            ("Torque", "1,021 Nm"),
            ("Transmission", "11-speed Saabtronic"),
            ("0–100 km/h", "2.9 s"),
            ("Electric range (WLTP)", "Up to 78 km"),
            ("CO₂ emissions (WLTP)", "42 g/km (provisional)"),
            ("Drive", "All-wheel drive"),
            ("Rear-wheel steering", "Saabottom, up to 5°"),
            ("Production", "Trollhättan, Sweden"),
        ],
    )

    pdf.section("About Saab")
    pdf.body(
        "Saab is a leading defence and security company with an enduring purpose, to help nations "
        "keep their people and society safe. Empowered by its 29,000 talented people, Saab constantly "
        "pushes the boundaries of technology to create a safer and more sustainable world. Saab designs, "
        "manufactures and maintains advanced systems in aeronautics, weapons, command and control, "
        "sensors and underwater systems. Saab is headquartered in Sweden. It has major operations all "
        "over the world and is part of the domestic defence capability of several nations."
    )

    pdf.ln(2)
    pdf.set_font("DejaVu", "B", 10)
    pdf.cell(0, 6, "Contact", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)
    pdf.set_font("DejaVu", "", 10)
    for line in [
        "Saab Press Centre",
        "+46 (0)734 180 018",
        "presscentre@saabgroup.com",
        "www.saab.com",
    ]:
        pdf.cell(0, 5.2, line, new_x="LMARGIN", new_y="NEXT")

    pdf.output(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    build()
