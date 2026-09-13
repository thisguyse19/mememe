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
        self.cell(0, 8, f"Saab 10-5 Press Release  |  Page {self.page_no()}", align="C")

    def section(self, title: str):
        self.ln(3)
        self.set_font("DejaVu", "B", 11)
        self.set_text_color(0, 51, 102)
        self.multi_cell(0, 6, title.upper())
        self.ln(1)
        self.set_draw_color(0, 51, 102)
        self.set_line_width(0.3)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(3)

    def body(self, text: str):
        self.set_font("DejaVu", "", 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5.2, text)
        self.ln(2)

    def bullet(self, text: str):
        self.set_font("DejaVu", "", 10)
        self.set_text_color(30, 30, 30)
        x = self.l_margin
        self.set_x(x)
        self.cell(5, 5.2, "•")
        self.multi_cell(0, 5.2, text)
        self.ln(0.5)

    def quote(self, text: str, attribution: str):
        self.set_font("DejaVu", "", 10)
        self.set_text_color(40, 40, 40)
        self.set_x(self.l_margin + 4)
        self.multi_cell(0, 5.2, f'"{text}"')
        self.ln(1)
        self.set_font("DejaVu", "", 9)
        self.set_text_color(80, 80, 80)
        self.set_x(self.l_margin + 4)
        self.multi_cell(0, 5, attribution)
        self.ln(3)

    def fact_box(self, title: str, lines: list[str]):
        self.set_fill_color(240, 246, 252)
        y0 = self.get_y()
        self.rect(self.l_margin, y0, self.w - self.l_margin - self.r_margin, 8 + len(lines) * 5.5, style="F")
        self.set_xy(self.l_margin + 4, y0 + 3)
        self.set_font("DejaVu", "B", 10)
        self.set_text_color(0, 51, 102)
        self.cell(0, 5, title)
        self.ln(6)
        self.set_font("DejaVu", "", 9)
        self.set_text_color(40, 40, 40)
        for line in lines:
            self.set_x(self.l_margin + 4)
            self.cell(0, 5.2, line)
            self.ln(5.2)
        self.ln(4)


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

    # Letterhead
    pdf.set_font("DejaVu", "B", 24)
    pdf.set_text_color(0, 51, 102)
    pdf.cell(0, 10, "SAAB", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("DejaVu", "", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 5, "Press Release  |  Media Information  |  Ref: SAAB-PR-2026-105", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_draw_color(0, 51, 102)
    pdf.set_line_width(0.7)
    pdf.line(20, pdf.get_y(), 190, pdf.get_y())
    pdf.ln(6)

    pdf.set_font("DejaVu", "B", 8)
    pdf.set_text_color(180, 0, 0)
    pdf.cell(0, 5, "FOR IMMEDIATE RELEASE", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)

    pdf.set_font("DejaVu", "B", 17)
    pdf.set_text_color(0, 0, 0)
    pdf.multi_cell(0, 7, "Saab unveils the new Saab 10-5")
    pdf.ln(1)
    pdf.set_font("DejaVu", "", 12)
    pdf.set_text_color(50, 50, 50)
    pdf.multi_cell(
        0,
        5.8,
        "New flagship combines 693 hp V12 hybrid performance, 78 km electric range, Saabonomous Driving and deeply personalised cabin technology",
    )
    pdf.ln(4)

    pdf.fact_box(
        "AT A GLANCE",
        [
            "693 hp V12 hybrid  |  0–100 km/h in 2.9 s  |  1,021 Nm  |  From EUR 189,000",
            "78 km WLTP electric range  |  42 g/km CO₂ (combined, provisional)",
            "Saabriver: up to 30 drivers  |  Level 3 Saabonomous Driving (region-dependent)",
            "Global reveal: Stockholm, 18 September 2026  |  First deliveries: Q2 2027",
        ],
    )

    pdf.body(
        "TROLLHÄTTAN, Sweden, September 11, 2026 – Saab Automobile today unveiled the Saab 10-5, "
        "the company's first all-new flagship sedan in more than a decade and the centrepiece of a "
        "EUR 2.4 billion reinvestment in Swedish premium vehicle development. Developed at Saab's "
        "renewed Product Development Centre in Trollhättan, the 10-5 combines a bespoke V12 hybrid "
        "powertrain with Saab's most advanced software-defined vehicle architecture to date."
    )
    pdf.body(
        "Measuring 5,218 mm in length and riding on a 3,016 mm wheelbase, the Saab 10-5 targets "
        "the upper echelon of the global luxury segment. The vehicle introduces more than 40 new "
        "Saab technologies spanning autonomous driving, biometric personalisation, adaptive lighting, "
        "active scent management and a 34-speaker immersive audio system tuned under the Saabombastic™ "
        "programme."
    )

    pdf.quote(
        "The Saab 10-5 represents a new direction for Saab. We have combined our heritage of "
        "engineering integrity with a software-first approach that treats every driver as an individual. "
        "More than six years of development and 14 million kilometres of validation testing underpin "
        "a vehicle that is as confident on a Swedish winter road as it is in autonomous urban traffic.",
        "— Erik Lindqvist, President and Chief Executive Officer, Saab Automobile",
    )

    pdf.section("Performance and powertrain")
    pdf.body(
        "At the heart of the Saab 10-5 is a newly developed 6.0-litre twin-turbocharged V12 hybrid "
        "system producing 693 hp (515 kW) and 1,021 Nm of torque. A 38 kWh lithium-ion battery pack "
        "mounted in the vehicle floor enables up to 78 km of WLTP-certified electric-only driving and "
        "supports peak regen rates of 220 kW."
    )
    pdf.body(
        "Power is transmitted through Saabtronic, an 11-speed dual-clutch transmission co-developed "
        "with Saab Powertrain Engineering. The gearbox and integrated inverter assembly utilise Saab's "
        "Saabrication micro-channel cooling technology across approximately 210 precision components, "
        "maintaining oil and stator temperatures within a 4°C window during sustained track use."
    )
    pdf.bullet("0–100 km/h: 2.9 seconds (Launch Control, factory specification)")
    pdf.bullet("0–200 km/h: 9.4 seconds")
    pdf.bullet("Top speed: 312 km/h (electronically limited)")
    pdf.bullet("Combined fuel consumption (provisional WLTP): 2.1 l/100 km")
    pdf.bullet("Combined CO₂ emissions (provisional WLTP): 42 g/km")
    pdf.bullet("Electric range (WLTP): up to 78 km")
    pdf.ln(2)

    pdf.body(
        "Saabottom rear-wheel steering turns the rear axle by up to 5° at speeds below 40 km/h to "
        "reduce the turning circle to 11.2 metres — comparable to the company's compact 9-3 estate — "
        "while providing enhanced high-speed stability through phase-adaptive toe control above 80 km/h."
    )

    pdf.section("Saabonomous Driving")
    pdf.body(
        "The Saab 10-5 debuts Saabonomous Driving, Saab's Level 3-capable autonomous platform, "
        "supported by 32 sensors including long-range lidar, 8 MP adaptive cameras and satellite "
        "corrected HD mapping. In approved operational design domains (ODDs), drivers may disengage "
        "from vehicle control at speeds up to 130 km/h; Saab estimates that up to 38% of a typical "
        "European highway commute may be completed in Saabonomous mode by launch."
    )
    pdf.body(
        "Saab has invested SEK 4.8 billion (approx. EUR 420 million) in Saabonomous software "
        "development since 2021, employing more than 1,100 engineers across Trollhättan, Linköping "
        "and Munich. Over-the-air updates will expand ODD coverage in Sweden, Germany, Norway and "
        "the Netherlands from launch, with North American certification targeted for 2028. "
        "Dual Saab Brain ECUs deliver 1,200 TOPS of AI inference capacity, processing 6.4 GB/s of fused sensor data."
    )

    pdf.section("Saabriver personalisation")
    pdf.body(
        "Saabriver uses facial recognition, gait analysis and smartphone UWB proximity to identify "
        "up to 30 registered drivers with 99.2% accuracy in internal testing. Upon recognition, "
        "the vehicle restores seat, steering, climate, audio, navigation, lighting and scent profiles "
        "within 1.8 seconds of door unlock — eliminating an estimated 847 manual interactions per year "
        "for a typical multi-driver household, according to Saab user research."
    )
    pdf.quote(
        "Personalisation has traditionally meant adjusting a seat or selecting a radio station. "
        "With Saabriver, the vehicle anticipates who is arriving before they sit down. That includes "
        "cabin fragrance, suspension calibration and even the tone of voice Saabitch uses for "
        "morning briefings.",
        "— Sofia Ekström, Vice President, User Experience and Digital Systems, Saab Automobile",
    )

    pdf.section("Saabomboclat Infotainment System")
    pdf.body(
        "The Saabomboclat Infotainment System runs on Saab OS 10, built on a dual-redundant Linux "
        "and QNX hypervisor. A 12.3-inch Saab Darkroom digital instrument cluster is complemented "
        "by a 17.4-inch central display, 12.8-inch front passenger screen and two 7.2-inch rear-seat "
        "command tablets — four displays in total, all sharing a unified 240 Hz touch pipeline."
    )
    pdf.body(
        "Saabitch, Saab's context-aware voice assistant, supports natural-language control across "
        "more than 1,200 vehicle functions in 24 languages and achieves a 97% intent recognition "
        "rate in Saab's benchmark testing. Saabitch Pro, included on Premium Plus trim, adds "
        "predictive routing, calendar integration and the ability to pre-condition the cabin based "
        "on the driver's historical departure times."
    )

    pdf.section("Cabin, comfort and Saabombastic audio")
    pdf.body(
        "Saabiarrhoea scent personalisation offers 16 base accords developed with Givaudan, "
        "expandable to 64 custom blends per Saabriver profile. Diffusion intensity adapts to "
        "driving mode — \"Focus\" suppresses citrus top notes during Saabonomous operation, "
        "while \"Arrive\" increases woody base notes when geofencing detects proximity to home."
    )
    pdf.body(
        "The 0G seating system, developed with Bose Magneride, uses 18 pneumatic zones per front "
        "seat and can redistribute pressure up to 30 times per second. Rear Executive Lounge "
        "specification adds 38° recline and integrated calf rests on a 956 mm legroom measurement."
    )
    pdf.body(
        "Audio duties fall to a 34-speaker Harman Kardon system rated at 2,040 watts, including "
        "five 12-inch subwoofers and headrest transducers on all outboard positions. Saabombastic™ "
        "tuning — developed with Abbey Road Studios — introduces vehicle-specific spatial audio "
        "rendering with 9.2.4 Dolby Atmos certification."
    )

    pdf.section("Design and Saaboob lighting")
    pdf.body(
        "Exterior design, led by Saab Design Director Maja Holmgren, references the company's "
        "aerospace heritage through a \"Canard\" front graphic and wraparound light blade. "
        "Saaboob MATRIX LED headlamps incorporate 1.4 million micro-mirrors per side, enabling "
        "adaptive beam shaping that dims individual pixels to avoid dazzling oncoming traffic "
        "while maintaining 94% of high-beam throw."
    )
    pdf.body(
        "Twelve exterior colours launch at reveal, including heritage-inspired \"Aero Blue\" and "
        "the limited \"Trollhättan Copper\" reserved for the first 500 Launch Edition vehicles."
    )

    pdf.add_page()
    pdf.section("Market introduction and pricing")
    pdf.body(
        "The Saab 10-5 will be presented to media and customers at the Saab Global Reveal in "
        "Stockholm on 18 September 2026. Order books open immediately in Sweden, Norway, Germany, "
        "the United Kingdom and the Netherlands, with further European markets following in Q4 2026."
    )
    pdf.bullet("Saab 10-5 Core: from EUR 189,000")
    pdf.bullet("Saab 10-5 Premium Plus: from EUR 224,000")
    pdf.bullet("Saab 10-5 Launch Edition (500 units): from EUR 268,000")
    pdf.ln(2)
    pdf.body(
        "Saab expects to produce approximately 18,000 units annually at its Trollhättan facility "
        "following a EUR 640 million line retooling completed in June 2026. The programme supports "
        "1,850 direct manufacturing jobs and an estimated 6,200 positions across the Nordic supplier "
        "network. First customer deliveries are scheduled for Q2 2027."
    )
    pdf.body(
        "Within 72 hours of the confidential preview programme opening to existing Saab owners, "
        "Saab reported 3,412 refundable reservations equivalent to 19% of first-year production "
        "capacity — the strongest deposit conversion in company history."
    )

    pdf.section("Safety and sustainability")
    pdf.body(
        "The Saab 10-5 is engineered to meet Euro NCAP 2026 protocols and targets a five-star rating. "
        "Structural safety includes a multi-cell aluminium and boron-steel passenger cage, "
        "pre-tensioning rear seatbelts and Saab Shield pedestrian protection with active bonnet lift."
    )
    pdf.body(
        "Saab aims for 40% recycled aluminium content in the body-in-white and certifies the 10-5 "
        "under ISO 14001 at the Trollhättan assembly plant. Battery cells are sourced from Northvolt "
        "Ett (Skellefteå, Sweden), reducing upstream transport emissions by an estimated 58% "
        "compared with Asian-sourced cells in Saab's previous hybrid programmes."
    )

    pdf.section("Key specifications")
    spec_table(
        pdf,
        [
            ("Body style", "Four-door flagship sedan"),
            ("Length / width / height", "5,218 / 1,998 / 1,445 mm"),
            ("Wheelbase", "3,016 mm"),
            ("Kerb weight (DIN)", "2,285 kg"),
            ("Drag coefficient (Cd)", "0.24"),
            ("Powertrain", "6.0L twin-turbo V12 hybrid"),
            ("System power", "693 hp (515 kW)"),
            ("System torque", "1,021 Nm"),
            ("Battery capacity", "38 kWh (gross)"),
            ("Electric range (WLTP)", "Up to 78 km"),
            ("Transmission", "11-speed dual-clutch Saabtronic"),
            ("0–100 km/h", "2.9 seconds"),
            ("Top speed", "312 km/h (limited)"),
            ("Fuel consumption (WLTP)", "2.1 l/100 km (provisional)"),
            ("CO₂ emissions (WLTP)", "42 g/km (provisional)"),
            ("Drive layout", "AWD with Saabottom rear steer"),
            ("Turning circle", "11.2 m"),
            ("Boot capacity", "412 l (hybrid mode)"),
            ("Fuel tank", "68 l"),
            ("Autonomous driving", "Saabonomous Level 3 (ODD)"),
            ("Driver recognition", "Saabriver, up to 30 drivers"),
            ("Displays", "Four (12.3\" + 17.4\" + 12.8\" + 2×7.2\")"),
            ("Infotainment", "Saabomboclat / Saab OS 10"),
            ("Voice assistant", "Saabitch (24 languages)"),
            ("Audio", "34-speaker Harman Kardon, 2,040 W"),
            ("Audio tuning", "Saabombastic™ / Dolby Atmos 9.2.4"),
            ("Lighting", "Saaboob MATRIX LED"),
            ("Seating", "0G system, Bose Magneride"),
            ("Scent personalisation", "Saabiarrhoea (16 base accords)"),
            ("Cooling technology", "Saabrication"),
            ("Production site", "Trollhättan, Sweden"),
            ("Annual volume target", "18,000 units"),
        ],
    )

    pdf.section("About Saab Automobile")
    pdf.body(
        "Saab Automobile is the premium vehicle division of Saab AB, headquartered in Trollhättan, "
        "Sweden. Following its relaunch in 2024, the brand employs more than 8,400 people globally "
        "and operates design, engineering and manufacturing centres in Sweden, Germany and China."
    )
    pdf.section("About Saab")
    pdf.body(
        "Saab is a leading defence and security company with an enduring mission to help nations "
        "keep their people and society safe. Employing approximately 24,000 people across more than "
        "30 countries, Saab continuously develops, adopts and improves technology to meet changing "
        "customer requirements."
    )

    pdf.ln(2)
    pdf.set_font("DejaVu", "B", 10)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 6, "Media contacts", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)
    pdf.set_font("DejaVu", "", 10)
    pdf.set_text_color(30, 30, 30)
    for line in [
        "Saab Press Centre",
        "Saab AB  |  Press & Media Relations",
        "SE-581 88 Linköping, Sweden",
        "Telephone: +46 13 18 00 00",
        "Email: press@saab.com",
        "Media assets: media.saab.com/saab-10-5",
        "Web: www.saab.com",
    ]:
        pdf.cell(0, 5.2, line, new_x="LMARGIN", new_y="NEXT")

    pdf.ln(6)
    pdf.set_font("DejaVu", "", 8)
    pdf.set_text_color(120, 120, 120)
    pdf.multi_cell(
        0,
        4.5,
        "Note to editors: Provisional WLTP figures may change prior to homologation. Saab, Saabtronic, "
        "Saabonomous, Saabriver, Saabomboclat, Saabitch, Saabombastic, Saaboob, Saabottom, Saabiarrhoea, "
        "Saabrication and Saab Darkroom are trademarks of Saab AB. All other trademarks are property of "
        "their respective owners.",
    )
    pdf.ln(4)
    pdf.cell(0, 5, "###", align="C")

    pdf.output(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    build()
