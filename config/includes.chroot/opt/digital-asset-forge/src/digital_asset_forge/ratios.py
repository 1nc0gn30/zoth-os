"""Digital Asset Forge - Multi-Ratio Mathematical Engine.

Computes exact 300 DPI pixel dimensions, aspect ratio crops,
and physical print tolerances across US and International paper standards.
100% Python Standard Library.
"""

from dataclasses import dataclass
from typing import Dict, List, Tuple, Any

@dataclass
class RatioSpec:
    ratio_id: str
    ratio_label: str
    ratio_decimal: float
    max_print_size_inches: str
    max_pixel_dimensions_300dpi: Tuple[int, int]
    supported_sizes_inches: List[str]
    supported_sizes_cm: List[str]
    description: str

RATIO_FAMILIES: Dict[str, RatioSpec] = {
    "2x3": RatioSpec(
        ratio_id="2x3",
        ratio_label="2:3 Ratio",
        ratio_decimal=2.0 / 3.0,
        max_print_size_inches='24"x36"',
        max_pixel_dimensions_300dpi=(7200, 10800),
        supported_sizes_inches=['4"x6"', '6"x9"', '8"x12"', '10"x15"', '12"x18"', '16"x24"', '20"x30"', '24"x36"'],
        supported_sizes_cm=["10x15cm", "20x30cm", "30x45cm", "40x60cm", "50x75cm", "60x90cm"],
        description="The universal standard photo ratio. Scales cleanly from postcard prints up to massive 24x36 poster frames."
    ),
    "3x4": RatioSpec(
        ratio_id="3x4",
        ratio_label="3:4 Ratio",
        ratio_decimal=3.0 / 4.0,
        max_print_size_inches='18"x24"',
        max_pixel_dimensions_300dpi=(5400, 7200),
        supported_sizes_inches=['6"x8"', '9"x12"', '12"x16"', '15"x20"', '18"x24"'],
        supported_sizes_cm=["15x20cm", "30x40cm", "45x60cm"],
        description="Standard gallery & medium poster frame ratio. Extremely popular for gallery wall groupings."
    ),
    "4x5": RatioSpec(
        ratio_id="4x5",
        ratio_label="4:5 Ratio",
        ratio_decimal=4.0 / 5.0,
        max_print_size_inches='16"x20"',
        max_pixel_dimensions_300dpi=(4800, 6000),
        supported_sizes_inches=['4"x5"', '8"x10"', '12"x15"', '16"x20"'],
        supported_sizes_cm=["10x12cm", "20x25cm", "28x35cm", "40x50cm"],
        description="Classic American framing standard. Home of the quintessential 8x10 tabletop and portrait frame."
    ),
    "11x14": RatioSpec(
        ratio_id="11x14",
        ratio_label="11:14 Ratio",
        ratio_decimal=11.0 / 14.0,
        max_print_size_inches='11"x14"',
        max_pixel_dimensions_300dpi=(3300, 4200),
        supported_sizes_inches=['11"x14"', '22"x28"'],
        supported_sizes_cm=["28x35cm"],
        description="Dedicated statement art format popular in North American home decor and matted frames."
    ),
    "iso": RatioSpec(
        ratio_id="iso",
        ratio_label="ISO International Paper",
        ratio_decimal=1.0 / 1.4142,
        max_print_size_inches='A1 (23.4"x33.1")',
        max_pixel_dimensions_300dpi=(7016, 9933),
        supported_sizes_inches=["A1", "A2", "A3", "A4", "A5", '5"x7"'],
        supported_sizes_cm=["59.4x84.1cm (A1)", "42x59.4cm (A2)", "29.7x42cm (A3)", "21x29.7cm (A4)", "14.8x21cm (A5)"],
        description="International standard paper sizing used across Europe, UK, Australia, and Asia."
    )
}

class RatioCalculator:
    """Calculates pixel dimensions, DPI quality metrics, and centering crop coordinates."""

    @staticmethod
    def calculate_pixels(width_inches: float, height_inches: float, dpi: int = 300) -> Tuple[int, int]:
        return (int(round(width_inches * dpi)), int(round(height_inches * dpi)))

    @staticmethod
    def calculate_dpi(pixel_width: int, physical_width_inches: float) -> float:
        if physical_width_inches <= 0:
            return 0.0
        return round(pixel_width / physical_width_inches, 1)

    @staticmethod
    def validate_dpi_quality(pixel_w: int, pixel_h: int, target_w_in: float, target_h_in: float) -> Dict[str, Any]:
        dpi_w = pixel_w / target_w_in if target_w_in > 0 else 0
        dpi_h = pixel_h / target_h_in if target_h_in > 0 else 0
        min_dpi = min(dpi_w, dpi_h)

        if min_dpi >= 300:
            rating = "MUSEUM_GRADE"
            label = "Museum Archival Quality (300+ DPI)"
            status = "pass"
        elif min_dpi >= 240:
            rating = "COMMERCIAL_EXCELLENT"
            label = "Excellent Print Quality (240-299 DPI)"
            status = "pass"
        elif min_dpi >= 150:
            rating = "ACCEPTABLE"
            label = "Acceptable Standard Quality (150-239 DPI)"
            status = "warning"
        else:
            rating = "DEFICIENT"
            label = "Deficient Low Resolution (<150 DPI - Pixelation Risk)"
            status = "fail"

        return {
            "effective_dpi": round(min_dpi, 1),
            "rating": rating,
            "label": label,
            "status": status,
            "pixel_dimensions": f"{pixel_w}x{pixel_h}px",
            "physical_dimensions": f'{target_w_in}"x{target_h_in}"'
        }

    @staticmethod
    def calculate_centered_crop(
        source_w: int,
        source_h: int,
        target_ratio_w: float,
        target_ratio_h: float
    ) -> Dict[str, int]:
        """Calculates optimal centered bounding box to conform source to target aspect ratio without stretching."""
        target_aspect = target_ratio_w / target_ratio_h
        source_aspect = source_w / source_h

        if source_aspect > target_aspect:
            # Source is wider than target: crop left & right
            crop_h = source_h
            crop_w = int(round(source_h * target_aspect))
            x_offset = int((source_w - crop_w) / 2)
            y_offset = 0
        else:
            # Source is taller than target: crop top & bottom
            crop_w = source_w
            crop_h = int(round(source_w / target_aspect))
            x_offset = 0
            y_offset = int((source_h - crop_h) / 2)

        return {
            "crop_x": x_offset,
            "crop_y": y_offset,
            "crop_width": crop_w,
            "crop_height": crop_h,
            "source_width": source_w,
            "source_height": source_h,
            "pixel_retention_percent": round((crop_w * crop_h) / (source_w * source_h) * 100.0, 1)
        }

    @staticmethod
    def get_all_families() -> List[Dict[str, Any]]:
        result = []
        for spec in RATIO_FAMILIES.values():
            result.append({
                "id": spec.ratio_id,
                "label": spec.ratio_label,
                "max_size": spec.max_print_size_inches,
                "max_pixels_300dpi": f"{spec.max_pixel_dimensions_300dpi[0]}x{spec.max_pixel_dimensions_300dpi[1]}",
                "pixel_width": spec.max_pixel_dimensions_300dpi[0],
                "pixel_height": spec.max_pixel_dimensions_300dpi[1],
                "sizes_inches": spec.supported_sizes_inches,
                "sizes_cm": spec.supported_sizes_cm,
                "description": spec.description
            })
        return result
