"""
Open-Source Intelligence (OSINT) aggregation service.

Surfaces publicly available information about a target (domain, company, or
person) by querying open search indexes and public archives, then normalises
the findings into clean, presentation-ready groups. The specific upstream
techniques are intentionally abstracted away from the API consumer.
"""

import re
import html
import socket
import urllib.parse
import requests
import concurrent.futures
from typing import Dict, List, Any

# Browser-like session — public indexes reject non-browser agents.
_osint_session = requests.Session()
_osint_session.headers.update({
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
})

# Reliable platforms that return clean 404s for non-existent profiles.
_SOCIAL_PLATFORMS = {
    "GitHub": "https://github.com/{u}",
    "GitLab": "https://gitlab.com/{u}",
    "Reddit": "https://www.reddit.com/user/{u}",
    "Keybase": "https://keybase.io/{u}",
    "Pinterest": "https://www.pinterest.com/{u}",
    "Medium": "https://medium.com/@{u}",
    "Replit": "https://replit.com/@{u}",
    "Dev.to": "https://dev.to/{u}",
}

_ROLE_MAILBOXES = ["info", "admin", "support", "contact", "sales", "hr", "security", "careers"]


class OsintService:

    # ----------------------------------------------------------------- helpers
    @staticmethod
    def _domain(target: str) -> str:
        clean = re.sub(r"^https?://", "", target.strip(), flags=re.I)
        clean = clean.split("/")[0].split(":")[0].strip().lower()
        return clean

    @staticmethod
    def _is_domain(target: str) -> bool:
        t = target.strip().lower()
        t = re.sub(r"^https?://", "", t)
        t = t.split("/")[0]
        return bool(re.match(r"^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$", t))

    @staticmethod
    def _source_of(url: str) -> str:
        try:
            host = urllib.parse.urlparse(url).netloc or url
            return host.replace("www.", "")
        except Exception:
            return ""

    @staticmethod
    def _google_url(query: str) -> str:
        """Build an executable open-web search URL for an intelligence query."""
        return "https://www.google.com/search?q=" + urllib.parse.quote_plus(query)

    @classmethod
    def _search(cls, query: str, max_results: int = 6) -> List[Dict[str, str]]:
        """Best-effort live enrichment from public open-web indexes."""
        endpoints = [
            ("https://html.duckduckgo.com/html/", r'class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>'),
            ("https://lite.duckduckgo.com/lite/", r'class="result-link"[^>]*href="([^"]+)"[^>]*>(.*?)</a>'),
        ]
        for url, pat in endpoints:
            try:
                resp = _osint_session.post(url, data={"q": query}, timeout=5)
                page = resp.text
            except Exception:
                continue

            results: List[Dict[str, str]] = []
            seen = set()
            for match in re.finditer(pat, page, re.S):
                href = match.group(1)
                title = html.unescape(re.sub(r"<[^>]+>", "", match.group(2))).strip()

                if "uddg=" in href:
                    m = re.search(r"uddg=([^&]+)", href)
                    if m:
                        href = urllib.parse.unquote(m.group(1))
                if href.startswith("//"):
                    href = "https:" + href
                if not href.startswith("http"):
                    continue

                if not title or href in seen:
                    continue
                seen.add(href)
                results.append({"title": title, "url": href, "source": cls._source_of(href)})
                if len(results) >= max_results:
                    break
            if results:
                return results
        return []

    @classmethod
    def _wayback(cls, domain: str, limit: int = 12) -> List[Dict[str, str]]:
        """Pull historically archived URLs for the domain."""
        try:
            url = (
                "http://web.archive.org/cdx/search/cdx?"
                f"url={domain}/*&output=json&fl=original&collapse=urlkey&limit={limit}"
            )
            resp = _osint_session.get(url, timeout=10)
            rows = resp.json()
        except Exception:
            return []
        items = []
        for row in rows[1:] if rows and isinstance(rows[0], list) else rows:
            original = row[0] if isinstance(row, list) else row
            items.append({"title": original, "url": original, "source": "web.archive.org"})
        return items

    @classmethod
    def _social_presence(cls, name: str) -> List[Dict[str, str]]:
        """Probe reliable platforms for an existing handle."""
        handle = re.sub(r"[^a-zA-Z0-9_.-]", "", name.strip().replace(" ", ""))
        if not handle:
            return []

        def probe(item):
            platform, tmpl = item
            target_url = tmpl.format(u=handle)
            try:
                r = _osint_session.get(target_url, timeout=6, allow_redirects=True)
                if r.status_code == 200:
                    return {"title": f"{platform}: @{handle}", "url": target_url, "source": cls._source_of(target_url)}
            except Exception:
                pass
            return None

        found = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
            futures = [ex.submit(probe, kv) for kv in _SOCIAL_PLATFORMS.items()]
            for fut in concurrent.futures.as_completed(futures):
                try:
                    r = fut.result()
                    if r:
                        found.append(r)
                except Exception:
                    pass
        return found

    @staticmethod
    def _common_addresses(domain: str) -> List[Dict[str, str]]:
        return [
            {"title": f"{m}@{domain}", "url": "", "source": "address pattern"}
            for m in _ROLE_MAILBOXES
        ]

    @classmethod
    def _infra_intel(cls, domain: str) -> List[Dict[str, str]]:
        """Resolve live network footprint and surface infrastructure pivots."""
        items: List[Dict[str, str]] = []
        try:
            _host, _aliases, ips = socket.gethostbyname_ex(domain)
            for ip in ips:
                items.append({
                    "title": f"Resolved host: {ip}",
                    "url": f"https://www.shodan.io/host/{ip}",
                    "source": "live DNS",
                })
        except Exception:
            pass
        # Curated, always-valid infrastructure intelligence pivots.
        items.extend([
            {"title": "DNS records & history", "url": f"https://securitytrails.com/domain/{domain}/dns", "source": "securitytrails.com"},
            {"title": "TLS certificate transparency", "url": f"https://crt.sh/?q=%25.{domain}", "source": "crt.sh"},
            {"title": "Domain reputation & passive DNS", "url": f"https://www.virustotal.com/gui/domain/{domain}", "source": "virustotal.com"},
            {"title": "Exposed services & open ports", "url": f"https://www.shodan.io/search?query=hostname:{domain}", "source": "shodan.io"},
            {"title": "Archived snapshots", "url": f"https://web.archive.org/web/*/{domain}/*", "source": "web.archive.org"},
        ])
        return items

    # --------------------------------------------------------------- query plan
    @classmethod
    def _dork_plan(cls, category: str, is_domain: bool, domain: str, name: str):
        """Build the intelligence plan as (group_title -> [(label, query)])."""
        token = f"site:{domain}" if is_domain else f'"{name}"'
        subject = domain if is_domain else f'"{name}"'
        dom = domain if is_domain else ""

        plans = {
            "people": {
                "Professional Profiles": [
                    ("LinkedIn profiles", f'site:linkedin.com/in {subject}'),
                    ("Developer & code presence", f'{subject} (site:github.com OR site:gitlab.com OR site:stackoverflow.com)'),
                ],
                "Social Media Accounts": [
                    ("Twitter / X, Facebook, Instagram", f'{subject} (site:twitter.com OR site:x.com OR site:facebook.com OR site:instagram.com)'),
                    ("TikTok, YouTube, Mastodon", f'{subject} (site:tiktok.com OR site:youtube.com OR site:mastodon.social)'),
                ],
                "Public Records & CVs": [
                    ("Resumes & curriculum vitae", f'{subject} (resume OR cv OR "curriculum vitae") (filetype:pdf OR filetype:doc)'),
                    ("Biography, interviews & talks", f'{subject} (biography OR interview OR speaker OR profile)'),
                ],
            },
            "company": {
                "Corporate Records": [
                    ("Company registry & filings", f'{subject} (site:opencorporates.com OR site:sec.gov OR site:bloomberg.com)'),
                    ("LinkedIn company page", f'site:linkedin.com/company {subject}'),
                ],
                "Funding & Business Intel": [
                    ("Funding, investors & valuation", f'{subject} (site:crunchbase.com OR site:pitchbook.com OR site:zoominfo.com)'),
                    ("Reviews & employee culture", f'{subject} (site:glassdoor.com OR site:indeed.com OR site:trustpilot.com)'),
                ],
                "People & Org Chart": [
                    ("Executives & staff on LinkedIn", f'site:linkedin.com/in {subject} (CEO OR CTO OR engineer OR manager)'),
                    ("News, press & acquisitions", f'{subject} (news OR "press release" OR acquisition OR funding)'),
                ],
            },
            "documents": {
                "Exposed Documents": [
                    ("PDF & Office documents", f'{token} (filetype:pdf OR filetype:docx OR filetype:xlsx OR filetype:pptx)'),
                    ("Spreadsheets & data files", f'{token} (filetype:csv OR filetype:xls OR filetype:sql)'),
                ],
                "Sensitive Files": [
                    ("Confidential & internal docs", f'{token} ("confidential" OR "internal use only" OR "do not distribute")'),
                    ("Config, backup & log files", f'{token} (filetype:env OR filetype:ini OR filetype:conf OR filetype:bak OR filetype:log)'),
                ],
                "Open Directories": [
                    ("Index-of directory listings", f'{token} intitle:"index of"'),
                ],
            },
            "credentials": {
                "Paste & Leak Exposure": [
                    ("Paste sites", f'{subject} (site:pastebin.com OR site:ghostbin.com OR site:controlc.com OR site:throwbin.io)'),
                    ("Breach & dump mentions", f'{subject} ("data breach" OR leaked OR dump OR "password list")'),
                ],
                "Secrets in Public Code": [
                    ("API keys & tokens in repos", f'{subject} (site:github.com OR site:gitlab.com) (password OR api_key OR secret OR token)'),
                    ("Exposed env & credential files", f'{token} (filetype:env OR filetype:log OR filetype:sql) (intext:password OR intext:secret)'),
                ],
            },
            "surfaces": {
                "Login & Admin Portals": [
                    ("Login & sign-in pages", f'{token} (inurl:login OR inurl:signin OR intitle:"log in" OR intitle:"sign in")'),
                    ("Admin & management panels", f'{token} (inurl:admin OR inurl:administrator OR inurl:cpanel)'),
                ],
                "Infrastructure Surfaces": [
                    ("Dev & infra consoles", f'{token} (inurl:.git OR inurl:phpmyadmin OR inurl:jenkins OR inurl:grafana OR inurl:kibana)'),
                    ("VPN & remote access", f'{token} (inurl:vpn OR inurl:remote OR inurl:owa OR inurl:citrix)'),
                ],
            },
            "email": {
                "Email & Contacts": [
                    ("Email addresses & contacts", f'{subject} (email OR contact OR "@{dom}")' if is_domain else f'{subject} (email OR contact)'),
                    ("Emails inside documents", f'{token} intext:"@{dom}" (filetype:pdf OR filetype:xlsx OR filetype:csv)' if is_domain else f'{subject} mail'),
                ],
                "Contact Discovery Tools": [
                    ("Email-finder services", f'"@{dom}" (site:hunter.io OR site:rocketreach.co OR site:signalhire.com)' if is_domain else f'{subject} (site:hunter.io OR site:rocketreach.co)'),
                ],
            },
        }

        if category == "all":
            merged = {}
            for cat in ("people", "company", "documents", "credentials", "surfaces", "email"):
                first_group = next(iter(plans[cat].items()))
                merged[first_group[0]] = first_group[1][:1]
            return merged
        return plans.get(category, plans["people"])

    # ------------------------------------------------------------------ runner
    @classmethod
    def run(cls, target: str, category: str = "all") -> Dict[str, Any]:
        target = (target or "").strip()
        category = (category or "all").lower()
        if not target:
            return {"target": target, "category": category, "groups": [],
                    "summary": {"results": 0, "sources": 0}}

        is_domain = cls._is_domain(target)
        domain = cls._domain(target)
        name = target

        plan = cls._dork_plan(category, is_domain, domain, name)
        grouped: Dict[str, List[Dict[str, str]]] = {}

        # Build executable intelligence leads from the dork plan.
        for group, entries in plan.items():
            grouped[group] = [
                {"title": label, "url": cls._google_url(query), "source": "open-web search"}
                for label, query in entries
            ]

        # Best-effort live enrichment (merged in when the network permits).
        live_jobs = {
            group: entries[0][1]
            for group, entries in plan.items()
            if entries
        }
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
            future_map = {ex.submit(cls._search, q, 4): g for g, q in live_jobs.items()}
            try:
                for fut in concurrent.futures.as_completed(future_map, timeout=12):
                    group = future_map[fut]
                    try:
                        hits = fut.result() or []
                        if hits:
                            grouped[group] = hits + grouped.get(group, [])
                    except Exception:
                        pass
            except concurrent.futures.TimeoutError:
                pass

        # Deterministic intelligence modules (always real, no external search).
        if category in ("people", "company", "all"):
            handle = domain.split(".")[0] if is_domain else name
            social = cls._social_presence(handle)
            if social:
                grouped["Confirmed Profiles"] = social

        if category in ("email", "all") and is_domain:
            grouped["Likely Addresses"] = cls._common_addresses(domain)

        if is_domain and category in ("surfaces", "company", "documents", "all"):
            infra = cls._infra_intel(domain)
            if infra:
                grouped["Infrastructure & DNS"] = infra

        # Normalise: dedupe by url within each group, drop empties.
        groups_out: List[Dict[str, Any]] = []
        all_sources = set()
        total = 0
        for title, items in grouped.items():
            seen = set()
            clean = []
            for it in items:
                key = it.get("url") or it.get("title")
                if key in seen:
                    continue
                seen.add(key)
                clean.append(it)
                if it.get("source"):
                    all_sources.add(it["source"])
            if clean:
                total += len(clean)
                groups_out.append({"title": title, "items": clean[:8]})

        return {
            "target": target,
            "category": category,
            "subject_type": "domain" if is_domain else "entity",
            "groups": groups_out,
            "summary": {"results": total, "sources": len(all_sources)},
        }
