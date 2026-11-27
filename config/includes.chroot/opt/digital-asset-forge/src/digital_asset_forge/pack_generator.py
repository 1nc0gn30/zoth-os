"""Digital Asset Forge - Digital Pack Generator & Manifest Engine.

Generates file naming taxonomies, resolution allocations,
and Etsy 20MB multi-zip distribution architectures.
100% Python Standard Library.
"""

from dataclasses import dataclass
from typing import Dict, List, Any
import re
from .ratios import RATIO_FAMILIES, RatioCalculator

@dataclass
class PackFileSpec:
    filename: str
    ratio_id: str
    ratio_label: str
    target_dimensions_inches: str
    pixel_width: int
    pixel_height: int
    estimated_size_mb: float
    description: str

class ArtPackGenerator:
    """Generates canonical multi-ratio art pack manifests and Etsy file distribution plans."""

    @staticmethod
    def sanitize_title(title: str) -> str:
        clean = re.sub(r'[^a-zA-Z0-9\s_-]', '', title)
        return "_".join(clean.strip().split())

    @classmethod
    def generate_manifest(cls, artwork_title: str = "Celestial Geometry", artist_name: str = "1nc0gn30") -> Dict[str, Any]:
        slug = cls.sanitize_title(artwork_title)
        files: List[PackFileSpec] = []
        total_estimated_mb = 0.0

        for key, spec in RATIO_FAMILIES.items():
            w_px, h_px = spec.max_pixel_dimensions_300dpi
            # Standard high-quality 300 DPI JPEG (quality 92) averages ~0.00015 to 0.00018 MB per 10k pixels
            est_mb = round((w_px * h_px) / (1024 * 1024) * 0.16, 1)
            total_estimated_mb += est_mb

            if key == "iso":
                fname = f"{slug}_ISO_Paper_300DPI_A1.jpg"
                dim_str = "A1 (594x841mm)"
            else:
                fname = f"{slug}_{spec.ratio_id}_Ratio_300DPI_{spec.max_print_size_inches.replace('\"', '')}in.jpg"
                dim_str = spec.max_print_size_inches

            files.append(PackFileSpec(
                filename=fname,
                ratio_id=spec.ratio_id,
                ratio_label=spec.ratio_label,
                target_dimensions_inches=dim_str,
                pixel_width=w_px,
                pixel_height=h_px,
                estimated_size_mb=est_mb,
                description=f"Master 300 DPI high-resolution file for {spec.ratio_label}. Scales down to all supported sizes in this ratio family."
            ))

        # Printing guide attachment
        guide_filename = f"{slug}_Customer_Printing_Guide.pdf"
        guide_est_mb = 1.2
        total_estimated_mb += guide_est_mb

        # Multi-ZIP distribution strategy for Etsy 20MB limit
        zip_bundles = cls._plan_zip_bundles(slug, files, guide_filename)

        return {
            "artwork_title": artwork_title,
            "artist": artist_name,
            "total_files": len(files) + 1,
            "total_estimated_size_mb": round(total_estimated_mb, 1),
            "files": [
                {
                    "filename": f.filename,
                    "ratio": f.ratio_id,
                    "label": f.ratio_label,
                    "max_print_size": f.target_dimensions_inches,
                    "resolution": f"{f.pixel_width}x{f.pixel_height}px",
                    "estimated_mb": f.estimated_size_mb,
                    "description": f.description
                }
                for f in files
            ],
            "printing_guide": {
                "filename": guide_filename,
                "estimated_mb": guide_est_mb,
                "type": "PDF Instruction Manual"
            },
            "etsy_delivery_plan": zip_bundles
        }

    @classmethod
    def _plan_zip_bundles(cls, slug: str, files: List[PackFileSpec], guide_file: str) -> Dict[str, Any]:
        """Plans bundle distribution to ensure no individual archive exceeds Etsy's 20MB limit."""
        # Etsy allows max 5 uploaded files per listing, max 20MB per file (total 100MB max directly on Etsy)
        bundles = []
        current_bundle_files = []
        current_bundle_size = 0.0
        bundle_index = 1

        for f in files:
            if current_bundle_size + f.estimated_size_mb > 18.0 and current_bundle_files:
                bundles.append({
                    "zip_filename": f"{slug}_Part_{bundle_index}.zip",
                    "contained_files": current_bundle_files,
                    "bundle_size_mb": round(current_bundle_size, 1),
                    "fits_etsy_limit": current_bundle_size <= 20.0
                })
                bundle_index += 1
                current_bundle_files = []
                current_bundle_size = 0.0

            current_bundle_files.append(f.filename)
            current_bundle_size += f.estimated_size_mb

        # Append guide to last bundle or create standalone
        current_bundle_files.append(guide_file)
        current_bundle_size += 1.2
        bundles.append({
            "zip_filename": f"{slug}_Part_{bundle_index}.zip",
            "contained_files": current_bundle_files,
            "bundle_size_mb": round(current_bundle_size, 1),
            "fits_etsy_limit": current_bundle_size <= 20.0
        })

        return {
            "etsy_direct_upload_viable": len(bundles) <= 5 and all(b["bundle_size_mb"] <= 20.0 for b in bundles),
            "total_zip_archives": len(bundles),
            "bundles": bundles,
            "alternate_delivery": {
                "strategy": "Instant Cloud Access PDF",
                "pdf_filename": f"{slug}_Direct_Download_Access_Link.pdf",
                "recommended_for": "Collections exceeding 100MB or multi-art bundles"
            }
        }
