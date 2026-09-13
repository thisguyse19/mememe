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

    def trim_heading(self, name: str, price: str):
        self.ln(2)
        self.set_font("DejaVu", "B", 10)
        self.set_text_color(0, 51, 102)
        self.multi_cell(0, 5.5, f"{name}  —  from {price}")
        self.ln(1)

    def feature_line(self, label: str, items: str):
        self.set_font("DejaVu", "B", 9)
        self.set_text_color(60, 60, 60)
        self.cell(28, 5, label + ":", new_x="END")
        self.set_font("DejaVu", "", 9)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5, items)
        self.ln(1)


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

    # --- Main release body (~900 words, Saab-style) ---

    pdf.body(
        "Trollhättan, Sweden, 11 September 2026 — Saab has today unveiled the Saab 10-5, "
        "a new flagship passenger car developed at the Product Development Centre in Trollhättan. "
        "The vehicle is the first result of Saab's renewed passenger car programme and will be built "
        "at the company's assembly plant in Trollhättan."
    )
    pdf.body(
        "The Saab 10-5 measures 5,218 mm in length and sits on a 3,016 mm wheelbase. "
        "It is offered exclusively with a V12 hybrid powertrain rated at 693 hp and 1,021 Nm of torque. "
        "Power is transferred through an 11-speed dual-clutch transmission, designated Saabtronic. "
        "Saab states acceleration from 0 to 100 km/h at 2.9 seconds and a top speed of 312 km/h."
    )
    pdf.body(
        "The hybrid system uses a 38 kWh battery mounted in the floor. Saab quotes an electric range "
        "of up to 78 km under WLTP, combined fuel consumption of 2.1 l/100 km and combined CO₂ emissions "
        "of 42 g/km. These figures remain provisional pending final homologation."
    )

    pdf.quote(
        "The Saab 10-5 is a further step in our passenger vehicle programme. We have applied the same "
        "discipline to engineering and system integration that we use across the company, with a clear "
        "focus on how the vehicle responds to the driver in daily use",
        "Erik Lindqvist",
        "President and CEO of Saab Automobile",
    )

    pdf.section("Powertrain and chassis")
    pdf.body(
        "The V12 hybrid unit was developed for the 10-5 programme. Saabtronic was designed specifically "
        "for the car and works with Saab's Saabrication cooling technology in both the transmission and "
        "the battery thermal management system."
    )
    pdf.body(
        "Saabottom rear-wheel steering allows up to five degrees of rear axle movement. "
        "At low speed the system reduces turning circle to 11.2 metres. At higher road speeds it "
        "operates in coordination with the all-wheel-drive layout to support stability. "
        "Kerb weight for the base car is 2,285 kg."
    )

    pdf.section("Saabonomous Driving and Saabriver")
    pdf.body(
        "The Saab 10-5 is the first Saab car offered with Saabonomous Driving. "
        "The system uses lidar, cameras and map data as part of the vehicle's electronic architecture. "
        "Where permitted by local regulation and within defined operating conditions, the driver may "
        "hand over control to the system. Saab will release Saabonomous functionality in Sweden, Germany, "
        "Norway and the Netherlands from launch."
    )
    pdf.body(
        "Saabriver is Saab's driver recognition and personalisation system. "
        "It can store profiles for up to 30 drivers and applies settings for seating, steering, climate, "
        "audio, navigation, lighting and scent when a registered user enters the vehicle. "
        "Recognition is based on facial identification and smartphone proximity."
    )

    pdf.quote(
        "Saabriver removes the need to configure the vehicle each time a different driver uses it. "
        "That function is particularly relevant for households and fleet operators where several people "
        "share one car",
        "Sofia Ekström",
        "Head of User Experience and Digital Systems at Saab Automobile",
    )

    pdf.section("Infotainment, cabin and audio")
    pdf.body(
        "Infotainment functions are handled by the Saabomboclat system, running Saab OS 10. "
        "The driver uses a 12.3-inch Saab Darkroom display. A 17.4-inch central screen, a 12.8-inch "
        "front passenger display and two 7.2-inch rear-seat screens complete the four-screen cabin layout."
    )
    pdf.body(
        "Voice control is provided by Saabitch. Saabitch Pro, available on Premium Plus and Launch Edition, "
        "adds calendar integration and predictive cabin pre-conditioning. "
        "Saabiarrhoea provides driver-specific scent settings linked to Saabriver profiles."
    )
    pdf.body(
        "Front seats use the 0G system with Bose Magneride on Premium Plus and Launch Edition. "
        "A 34-speaker Harman Kardon audio installation with Saabombastic tuning is available on the same "
        "specifications. Saaboob MATRIX LED headlamps are fitted across the range."
    )

    pdf.section("Trim levels and equipment")
    pdf.body(
        "The Saab 10-5 is offered in three specifications. All versions share the V12 hybrid powertrain, "
        "Saabtronic transmission, all-wheel drive, Saabottom rear-wheel steering, Saaboob MATRIX LED "
        "lighting and Saabriver driver recognition. Equipment differences are set out below."
    )

    pdf.trim_heading("Core", "EUR 189,000")
    pdf.body(
        "Core is the entry specification. It includes the full hybrid powertrain and Saabtronic "
        "transmission with paddle shifters, Saaboob lighting, power-folding mirrors and keyless entry."
    )
    pdf.feature_line("Interior", "Charcoal woven textile upholstery, aluminium dash trim, 12.3-inch Saab Darkroom display, 14-inch central touchscreen, Saabomboclat infotainment, Saabitch voice control, dual-zone climate control, heated front seats, power-adjustable front seats with memory linked to Saabriver")
    pdf.feature_line("Audio", "12-speaker Harman Kardon system")
    pdf.feature_line("Wheels", "20-inch Aero turbine alloy wheels")
    pdf.feature_line("Safety", "Adaptive cruise control, lane keeping assist, automatic emergency braking, 360-degree camera, front and rear parking sensors")
    pdf.feature_line("Comfort", "Electric tailgate, rain-sensing wipers, heated steering wheel, wireless phone charging")

    pdf.trim_heading("Premium Plus", "EUR 224,000")
    pdf.body(
        "Premium Plus includes all Core equipment and adds Saab's full driver assistance and personalisation "
        "package. Saabonomous Driving is standard on this specification."
    )
    pdf.feature_line("Added interior", "Nappa leather upholstery (black or walnut inlay), four-screen cabin layout with 17.4-inch central display, 12.8-inch passenger screen and twin 7.2-inch rear tablets, 0G front seats with Bose Magneride, Saabiarrhoea scent personalisation, soft-close doors, head-up display, four-zone climate control, ventilated front seats, rear Executive Lounge seating with 956 mm legroom")
    pdf.feature_line("Added audio", "34-speaker Harman Kardon system with Saabombastic tuning and Dolby Atmos")
    pdf.feature_line("Added tech", "Saabitch Pro, Saabonomous Driving, digital key, over-the-air updates")
    pdf.feature_line("Added exterior", "21-inch split-spoke alloy wheels, panoramic glass roof, acoustic laminated side glass, power rear sunblinds")
    pdf.feature_line("Added comfort", "Air quality sensor, fragrance diffuser linked to Saabriver, hands-free tailgate")

    pdf.trim_heading("Launch Edition", "EUR 268,000")
    pdf.body(
        "Launch Edition is limited to 500 vehicles for the 2027 model year. It is based on Premium Plus "
        "and adds the following exclusive items."
    )
    pdf.feature_line("Exterior", "Trollhättan Copper paint (fixed), carbon mirror caps, black brake calipers, dark Saaboob lens tint, Launch Edition badging on C-pillars and sill plates, exclusive 21-inch forged alloy wheels")
    pdf.feature_line("Interior", "Launch Edition Nappa leather with brushed aluminium and copper stitching, illuminated door sills, numbered plaque on centre console, copper-accent steering wheel")
    pdf.feature_line("Included", "All Premium Plus equipment, dedicated Launch Edition delivery case, two years complimentary Saab Connected Services")

    pdf.section("Exterior colours")
    pdf.body(
        "Eleven exterior colours are available on Core and Premium Plus. Saab offers two no-cost colours "
        "and nine supplementary colours. Trollhättan Copper is exclusive to Launch Edition and is not "
        "available on other specifications."
    )
    pdf.feature_line("No-cost colours", "Aero Blue (metallic), Granite Black (solid)")
    pdf.feature_line("Metallic colours", "Baltic Grey, Graphite Steel, Ice Silver, Midnight Green, Polar Midnight, Storm Cloud, Titanium Mist — EUR 1,200")
    pdf.feature_line("Premium colours", "Arctic White (pearlescent), Scarlet Wing (special effect) — EUR 2,400")
    pdf.feature_line("Launch Edition", "Trollhättan Copper (included, not optional)")

    pdf.section("Interior colours and materials")
    pdf.body(
        "Interior specification depends on trim level. Core is supplied with the Charcoal textile environment "
        "as standard. Premium Plus and Launch Edition use Nappa leather."
    )
    pdf.feature_line("Core", "Charcoal woven textile with aluminium trim — standard, no alternative")
    pdf.feature_line("Premium Plus", "Black Nappa leather — no-cost option; Walnut Nappa with open-pore walnut inlay — no-cost option")
    pdf.feature_line("Launch Edition", "Launch Edition Nappa with brushed aluminium and copper stitching — fixed specification")
    pdf.body(
        "All leather interiors use vegetable-tanned Nappa sourced within the EU. Contrast stitching "
        "matches exterior colour on Premium Plus when a supplementary paint is selected."
    )

    pdf.section("Market introduction")
    pdf.body(
        "The Saab 10-5 will be shown to media and customers in Stockholm on 18 September 2026. "
        "Orders open on the same date in Sweden, Norway, Germany, the United Kingdom and the Netherlands. "
        "Further European markets will follow in the fourth quarter of 2026."
    )
    pdf.body(
        "Deliveries are planned from the second quarter of 2027. Production takes place in Trollhättan, "
        "where Saab has completed retooling of the passenger car line. "
        "Battery cells for the hybrid system are supplied by Northvolt. "
        "The Saab 10-5 is being developed to meet current Euro NCAP requirements."
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
