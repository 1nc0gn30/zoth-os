"""URL drift detection without a live Product Hunt token."""

from __future__ import annotations

import unittest

from producthunt_connector.client import build_status
from producthunt_connector.config import normalize_url


class NormalizeTests(unittest.TestCase):
    def test_strips_ref_and_slash(self) -> None:
        live = "https://github.com/NullAITech/zoth-os?ref=producthunt"
        self.assertEqual(normalize_url(live), "https://github.com/NullAITech/zoth-os")


class DriftTests(unittest.TestCase):
    def test_github_website_is_drift(self) -> None:
        post = {
            "id": "1276873",
            "name": "ZOTHOS",
            "slug": "zothos",
            "url": "https://www.producthunt.com/posts/zothos",
            "website": "https://github.com/NullAITech/zoth-os",
            "votesCount": 16,
            "commentsCount": 2,
            "reviewsCount": 0,
            "productLinks": [{"type": "github", "url": "https://github.com/NullAITech/zoth-os"}],
            "comments": {"edges": []},
            "makers": [],
        }
        desired = {
            "desired_website": "https://zothos.nullai.tech",
            "desired_github": "https://github.com/NullAITech/zoth-os/releases/tag/v3.2.0",
            "desired_github_repo": "https://github.com/NullAITech/zoth-os",
            "product_id": 1333989,
            "post_id": 1276873,
        }
        status = build_status(post, desired)
        self.assertFalse(status["website_ok"])
        self.assertFalse(status["github_release_ok"])
        self.assertTrue(status["github_repo_present"])
        self.assertFalse(status["can_patch_via_api"])
        fields = {d["field"] for d in status["drift"]}
        self.assertEqual(fields, {"website", "github"})

    def test_matching_urls_are_ok(self) -> None:
        post = {
            "name": "ZOTHOS",
            "slug": "zothos",
            "website": "https://zothos.nullai.tech/",
            "productLinks": [
                {"type": "github", "url": "https://github.com/NullAITech/zoth-os/releases/tag/v3.2.0"}
            ],
            "comments": {"edges": []},
        }
        desired = {
            "desired_website": "https://zothos.nullai.tech",
            "desired_github": "https://github.com/NullAITech/zoth-os/releases/tag/v3.2.0",
            "desired_github_repo": "https://github.com/NullAITech/zoth-os",
        }
        status = build_status(post, desired)
        self.assertTrue(status["website_ok"])
        self.assertTrue(status["github_release_ok"])
        self.assertEqual(status["drift"], [])
        self.assertTrue(status["ok"])


if __name__ == "__main__":
    unittest.main()
