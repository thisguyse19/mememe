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

    pdf.body(
        "Trollhättan, Sweden, 11 September 2026 — Saab has today unveiled the Saab 10-5, "
        "a new flagship passenger car developed at the company's Product Development Centre in Trollhättan."
    )
    pdf.body(
        "The Saab 10-5 is equipped with a V12 hybrid powertrain rated at 693 hp and 1,021 Nm of torque. "
        "Power is transferred through an 11-speed dual-clutch transmission, designated Saabtronic. "
        "Acceleration from 0 to 100 km/h is stated at 2.9 seconds."
    )
    pdf.body(
        "The car also introduces several new Saab systems for assisted driving, driver recognition, "
        "infotainment, lighting, seating, audio and cabin environment control."
    )

    pdf.quote(
        "The Saab 10-5 marks a new step for Saab in passenger vehicles. We have applied the same "
        "discipline to engineering and system integration that we use across our other business areas, "
        "with greater emphasis on how the vehicle adapts to the driver",
        "Erik Lindqvist",
        "President and CEO of Saab Automobile",
    )

    pdf.section("Performance and powertrain")
    pdf.body(
        "The hybrid system combines a 6.0-litre twin-turbocharged V12 with a 38 kWh battery mounted in the floor. "
        "Saab quotes an electric range of up to 78 km under WLTP and combined CO₂ emissions of 42 g/km. "
        "These figures remain provisional pending final homologation."
    )
    pdf.body(
        "Saabtronic was developed for the 10-5 programme. The transmission and its thermal management "
        "system use Saab's Saabrication cooling technology."
    )
    pdf.body(
        "Saabottom rear-wheel steering allows up to five degrees of rear axle movement. "
        "The system is intended to reduce low-speed turning radius and support stability at higher road speeds. "
        "The wheelbase measures 3,016 mm."
    )

    pdf.section("Saabonomous Driving")
    pdf.body(
        "The Saab 10-5 is the first Saab car to be offered with Saabonomous Driving. "
        "The system uses lidar, cameras and map data as part of the vehicle's electronic architecture."
    )
    pdf.body(
        "Where permitted by local regulation and within defined operating conditions, the driver may "
        "hand over control to the system. Saab will release Saabonomous functionality in Sweden, Germany, "
        "Norway and the Netherlands from launch, with further markets to follow."
    )

    pdf.section("Saabriver")
    pdf.body(
        "Saabriver is Saab's driver recognition and personalisation system. "
        "It can store profiles for up to 30 drivers and apply settings for seating, climate, audio, "
        "navigation, lighting and related functions when a registered user enters the vehicle."
    )
    pdf.quote(
        "With Saabriver, the vehicle identifies who is driving and applies the correct settings automatically. "
        "That is a practical extension of the work we are doing elsewhere in human-machine interaction",
        "Sofia Ekström",
        "Head of User Experience and Digital Systems at Saab Automobile",
    )

    pdf.section("Saabomboclat Infotainment System")
    pdf.body(
        "Infotainment functions are handled by the Saabomboclat system, running Saab OS 10. "
        "The driver uses a 12.3-inch Saab Darkroom display. Three additional screens are fitted in the cabin."
    )
    pdf.body(
        "Voice control is provided through Saabitch, Saab's in-car assistant. "
        "Saabitch Pro is included on Premium Plus specification."
    )

    pdf.section("Cabin and audio")
    pdf.body(
        "Saabiarrhoea provides driver-specific scent settings linked to Saabriver profiles. "
        "Front seats use the 0G system with Bose Magneride. "
        "A 34-speaker Harman Kardon installation is available, including Saabombastic audio tuning."
    )

    pdf.section("Exterior and lighting")
    pdf.body(
        "Saaboob MATRIX LED headlamps are fitted as standard. "
        "The exterior length is 5,218 mm. "
        "Twelve paint finishes are offered at launch, including Aero Blue and Trollhättan Copper on Launch Edition cars."
    )

    pdf.section("Market introduction")
    pdf.body(
        "The Saab 10-5 will be shown to media and customers in Stockholm on 18 September 2026. "
        "Orders open in Sweden, Norway, Germany, the United Kingdom and the Netherlands. "
        "Deliveries are planned to begin in the second quarter of 2027."
    )
    pdf.body(
        "List prices start at EUR 189,000 for Core specification, EUR 224,000 for Premium Plus "
        "and EUR 268,000 for Launch Edition. Production will take place in Trollhättan."
    )

    pdf.section("Safety and sustainability")
    pdf.body(
        "The Saab 10-5 is being developed to meet current Euro NCAP requirements. "
        "Battery cells for the hybrid system are supplied by Northvolt. "
        "The Trollhättan plant is certified to ISO 14001."
    )

    pdf.section("Technical data")
    spec_table(
        pdf,
        [
            ("Body style", "Four-door sedan"),
            ("Length / width / height", "5,218 / 1,998 / 1,445 mm"),
            ("Wheelbase", "3,016 mm"),
            ("Kerb weight (DIN)", "2,285 kg"),
            ("Drag coefficient (Cd)", "0.24"),
            ("Powertrain", "6.0-litre V12 hybrid"),
            ("System output", "693 hp (515 kW)"),
            ("Torque", "1,021 Nm"),
            ("Battery", "38 kWh"),
            ("Electric range (WLTP)", "Up to 78 km"),
            ("Transmission", "11-speed Saabtronic"),
            ("0–100 km/h", "2.9 s"),
            ("Top speed", "312 km/h"),
            ("Fuel consumption (WLTP)", "2.1 l/100 km (provisional)"),
            ("CO₂ emissions (WLTP)", "42 g/km (provisional)"),
            ("Drive", "All-wheel drive"),
            ("Rear-wheel steering", "Saabottom, up to 5°"),
            ("Turning circle", "11.2 m"),
            ("Boot volume", "412 l"),
            ("Fuel tank", "68 l"),
            ("Assisted driving", "Saabonomous Driving"),
            ("Driver recognition", "Saabriver (30 profiles)"),
            ("Displays", "Four"),
            ("Infotainment", "Saabomboclat / Saab OS 10"),
            ("Voice assistant", "Saabitch"),
            ("Audio", "Harman Kardon, 34 speakers"),
            ("Lighting", "Saaboob MATRIX LED"),
            ("Seating", "0G / Bose Magneride"),
            ("Scent system", "Saabiarrhoea"),
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
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 6, "Contact", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)
    pdf.set_font("DejaVu", "", 10)
    pdf.set_text_color(30, 30, 30)
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
