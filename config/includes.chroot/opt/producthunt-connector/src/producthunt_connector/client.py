"""Product Hunt GraphQL v2 client. Stdlib only.

Public developer tokens are read-only. There is no mutation to set a product
website or GitHub URL; those stay in the maker dashboard.
"""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional

from . import config

GRAPHQL_URL = "https://api.producthunt.com/v2/api/graphql"

POST_QUERY = """
query PostBySlug($slug: String!) {
  post(slug: $slug) {
    id
    name
    tagline
    slug
    url
    website
    votesCount
    commentsCount
    reviewsCount
    reviewsRating
    featuredAt
    createdAt
    weeklyRank
    monthlyRank
    yearlyRank
    productLinks {
      type
      url
    }
    makers {
      name
      username
    }
    comments(first: 20) {
      edges {
        node {
          id
          body
          createdAt
          votesCount
          user {
            name
            username
          }
        }
      }
    }
  }
}
"""

VIEWER_QUERY = """
query Viewer {
  viewer {
    user {
      id
      name
      username
    }
  }
}
"""


class ProductHuntError(RuntimeError):
    pass


class ProductHuntClient:
    def __init__(self, token: Optional[str] = None) -> None:
        self.token = (token or config.token_from_env_or_file()).strip()

    def is_configured(self) -> bool:
        return bool(self.token)

    def graphql(self, query: str, variables: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not self.token:
            raise ProductHuntError(
                "No developer token. Run `zoth-ph login` or set PRODUCTHUNT_DEVELOPER_TOKEN."
            )
        payload = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
        req = urllib.request.Request(
            GRAPHQL_URL,
            data=payload,
            method="POST",
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "zoth-ph/0.1.0 (NullAITech/zoth-os)",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                body = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as err:
            detail = err.read().decode("utf-8", errors="replace")[:400]
            raise ProductHuntError(f"Product Hunt HTTP {err.code}: {detail}") from err
        except urllib.error.URLError as err:
            raise ProductHuntError(f"Product Hunt unreachable: {err.reason}") from err
        if body.get("errors"):
            messages = "; ".join(
                str(e.get("message") or e) for e in body["errors"] if isinstance(e, dict)
            )
            raise ProductHuntError(messages or "GraphQL error")
        return body.get("data") or {}

    def whoami(self) -> Dict[str, Any]:
        data = self.graphql(VIEWER_QUERY)
        user = ((data.get("viewer") or {}).get("user")) or {}
        return {"id": user.get("id"), "name": user.get("name"), "username": user.get("username")}

    def fetch_post(self, slug: str) -> Dict[str, Any]:
        data = self.graphql(POST_QUERY, {"slug": slug})
        post = data.get("post")
        if not post:
            raise ProductHuntError(f"No post for slug {slug!r}")
        return post


def _link_urls(post: Dict[str, Any]) -> List[Dict[str, str]]:
    links = []
    for item in post.get("productLinks") or []:
        if not isinstance(item, dict):
            continue
        url = str(item.get("url") or "").strip()
        if url:
            links.append({"type": str(item.get("type") or ""), "url": url})
    website = str(post.get("website") or "").strip()
    if website:
        links.append({"type": "website", "url": website})
    return links


def github_urls(post: Dict[str, Any]) -> List[str]:
    found = []
    for item in _link_urls(post):
        host = config.host_of(item["url"])
        if host == "github.com" or host.endswith(".github.com"):
            found.append(item["url"])
    return found


def build_status(post: Dict[str, Any], desired: Dict[str, Any]) -> Dict[str, Any]:
    website = str(post.get("website") or "")
    desired_website = str(desired.get("desired_website") or "")
    desired_github = str(desired.get("desired_github") or "")
    desired_repo = str(desired.get("desired_github_repo") or "")
    gits = github_urls(post)
    website_norm = config.normalize_url(website)
    desired_web_norm = config.normalize_url(desired_website)
    website_ok = bool(desired_web_norm) and (
        website_norm == desired_web_norm or config.host_of(website) == config.host_of(desired_website)
    )
    git_norms = [config.normalize_url(u) for u in gits]
    github_release_ok = config.normalize_url(desired_github) in git_norms if desired_github else False
    github_repo_present = any(
        config.normalize_url(desired_repo) == g or g.startswith(config.normalize_url(desired_repo) + "/")
        for g in git_norms
    ) if desired_repo else False
    comments = []
    for edge in ((post.get("comments") or {}).get("edges") or []):
        node = (edge or {}).get("node") or {}
        user = node.get("user") or {}
        comments.append(
            {
                "id": node.get("id"),
                "body": node.get("body"),
                "createdAt": node.get("createdAt"),
                "votesCount": node.get("votesCount"),
                "user": user.get("name"),
                "username": user.get("username"),
            }
        )
    drift = []
    if not website_ok:
        drift.append(
            {
                "field": "website",
                "live": website,
                "desired": desired_website,
                "action": "Product Hunt dashboard → Edit product → Website → https://zothos.nullai.tech",
            }
        )
    if not github_release_ok:
        drift.append(
            {
                "field": "github",
                "live": gits,
                "desired": desired_github,
                "action": "Product Hunt dashboard → GitHub / links → https://github.com/NullAITech/zoth-os/releases/tag/v3.2.0",
            }
        )
    return {
        "ok": not drift,
        "configured": True,
        "slug": post.get("slug"),
        "id": post.get("id"),
        "name": post.get("name"),
        "tagline": post.get("tagline"),
        "url": post.get("url"),
        "website": website,
        "product_links": _link_urls(post),
        "github_urls": gits,
        "votesCount": post.get("votesCount"),
        "commentsCount": post.get("commentsCount"),
        "reviewsCount": post.get("reviewsCount"),
        "reviewsRating": post.get("reviewsRating"),
        "weeklyRank": post.get("weeklyRank"),
        "monthlyRank": post.get("monthlyRank"),
        "yearlyRank": post.get("yearlyRank"),
        "featuredAt": post.get("featuredAt"),
        "createdAt": post.get("createdAt"),
        "makers": post.get("makers") or [],
        "comments": comments,
        "desired": {
            "website": desired_website,
            "github": desired_github,
            "github_repo": desired_repo,
        },
        "website_ok": website_ok,
        "github_release_ok": github_release_ok,
        "github_repo_present": github_repo_present,
        "drift": drift,
        "can_patch_via_api": False,
        "api_note": "Product Hunt GraphQL has no mutation for website or GitHub. Dashboard only.",
        "badges": badge_html(desired),
    }


def badge_html(desired: Dict[str, Any]) -> Dict[str, str]:
    post_id = desired.get("featured_post_id") or desired.get("post_id") or 1276873
    product_id = desired.get("review_product_id") or desired.get("product_id") or 1333989
    featured_href = (
        "https://www.producthunt.com/products/zothos?embed=true"
        "&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-zothos-2"
    )
    featured_src = (
        f"https://api.producthunt.com/widgets/embed-image/v1/featured.svg"
        f"?post_id={post_id}&theme=light"
    )
    review_href = (
        "https://www.producthunt.com/products/zothos/reviews/new"
        "?utm_source=badge-product_review&utm_medium=badge&utm_source=badge-zothos"
    )
    review_src = (
        f"https://api.producthunt.com/widgets/embed-image/v1/product_review.svg"
        f"?product_id={product_id}&theme=light"
    )
    alt = "ZOTHOS - Debian 13 + KDE Plasma 6 OS for AI agents and security | Product Hunt"
    featured = (
        f'<a href="{featured_href}" target="_blank" rel="noopener noreferrer">'
        f'<img alt="{alt}" width="250" height="54" src="{featured_src}"></a>'
    )
    review = (
        f'<a href="{review_href}" target="_blank" rel="noopener noreferrer">'
        f'<img alt="{alt}" width="250" height="54" src="{review_src}"></a>'
    )
    return {
        "featured_href": featured_href,
        "featured_src": featured_src,
        "review_href": review_href,
        "review_src": review_src,
        "featured_html": featured,
        "review_html": review,
    }
