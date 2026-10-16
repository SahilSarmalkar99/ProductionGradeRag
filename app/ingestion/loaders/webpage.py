import time
from collections import deque
from urllib.parse import urljoin, urlparse, urldefrag

import requests
from bs4 import BeautifulSoup


DEFAULT_TIMEOUT = 15

USER_AGENT = (
    "Mozilla/5.0 (compatible; EnterpriseRAGBot/1.0; "
    "+https://example.com/bot)"
)


def normalize_url(url: str) -> str:
    """
    Normalize a URL so the same page isn't crawled multiple times.
    """

    url = urldefrag(url)[0]

    parsed = urlparse(url)

    scheme = parsed.scheme.lower()
    netloc = parsed.netloc.lower()

    if netloc.endswith(":80") and scheme == "http":
        netloc = netloc[:-3]

    if netloc.endswith(":443") and scheme == "https":
        netloc = netloc[:-4]

    path = parsed.path or "/"

    if path != "/" and path.endswith("/"):
        path = path.rstrip("/")

    normalized = f"{scheme}://{netloc}{path}"

    if parsed.query:
        normalized += f"?{parsed.query}"

    return normalized


def is_same_domain(url: str, base_domain: str) -> bool:
    """
    Check whether a URL belongs to the original website.
    """

    parsed = urlparse(url)

    hostname = parsed.hostname

    if not hostname:
        return False

    hostname = hostname.lower()

    return (
        hostname == base_domain
        or hostname.endswith("." + base_domain)
    )


def is_http_url(url: str) -> bool:
    """
    Only allow HTTP/HTTPS URLs.
    """

    parsed = urlparse(url)

    return parsed.scheme in ("http", "https")


def parse_html_content(html: str) -> dict:
    """
    Parse one HTML page.

    Returns:
        {
            "title": "...",
            "text": "...",
            "links": [...]
        }
    """

    soup = BeautifulSoup(html, "html.parser")

    for element in soup(
        [
            "script",
            "style",
            "meta",
            "noscript",
            "svg",
            "iframe",
            "canvas",
            "template",
        ]
    ):
        element.decompose()

    title = ""

    if soup.title:
        title = soup.title.get_text(" ", strip=True)

    text = soup.get_text(separator="\n")

    lines = []

    for line in text.splitlines():
        line = line.strip()

        if not line:
            continue

        lines.append(line)

    cleaned_lines = []

    previous = None

    for line in lines:
        if line == previous:
            continue

        cleaned_lines.append(line)
        previous = line

    text_clean = "\n".join(cleaned_lines)

    links = []

    for anchor in soup.find_all("a", href=True):
        href = anchor.get("href")

        if not href:
            continue

        links.append(href)

    return {
        "title": title,
        "text": text_clean,
        "links": links,
    }


class WebsiteCrawler:

    def __init__(
        self,
        start_url: str,
        max_pages: int = 100,
        timeout: int = DEFAULT_TIMEOUT,
        delay: float = 0.2,
    ):
        self.start_url = normalize_url(start_url)

        parsed = urlparse(self.start_url)

        if not parsed.hostname:
            raise ValueError(
                f"Invalid website URL: {start_url}"
            )

        self.base_domain = parsed.hostname.lower()

        self.max_pages = max_pages
        self.timeout = timeout
        self.delay = delay

        self.visited = set()
        self.queue = deque()

        self.session = requests.Session()

        self.session.headers.update(
            {
                "User-Agent": USER_AGENT,
                "Accept": (
                    "text/html,application/xhtml+xml,"
                    "application/xml;q=0.9,*/*;q=0.8"
                ),
            }
        )

    def fetch_page(self, url: str):
        """
        Download one webpage.
        """

        try:
            response = self.session.get(
                url,
                timeout=self.timeout,
            )

            response.raise_for_status()

            content_type = response.headers.get(
                "Content-Type",
                "",
            ).lower()

            if "text/html" not in content_type:
                return None

            return response.text

        except requests.RequestException:
            return None

    def resolve_url(self, current_url: str, href: str):
        """
        Convert a relative URL into an absolute URL.
        """

        if not href:
            return None

        href = href.strip()

        if href.startswith(
            (
                "#",
                "mailto:",
                "tel:",
                "javascript:",
                "data:",
                "ftp:",
            )
        ):
            return None

        absolute_url = urljoin(
            current_url,
            href,
        )

        absolute_url = normalize_url(
            absolute_url
        )

        if not is_http_url(absolute_url):
            return None

        return absolute_url

    def should_crawl(self, url: str):
        """
        Check whether a URL should be crawled.
        """

        if not url:
            return False

        if url in self.visited:
            return False

        if not is_same_domain(
            url,
            self.base_domain,
        ):
            return False

        return True

    def crawl(self):
        """
        Crawl the website recursively.
        """

        self.queue.append(self.start_url)

        pages = []

        while self.queue and len(pages) < self.max_pages:

            current_url = self.queue.popleft()

            if current_url in self.visited:
                continue

            if not is_same_domain(
                current_url,
                self.base_domain,
            ):
                continue

            self.visited.add(current_url)

            html = self.fetch_page(current_url)

            if not html:
                continue

            parsed = parse_html_content(html)

            text = parsed["text"]
            title = parsed["title"]
            raw_links = parsed["links"]

            if text.strip():
                pages.append(
                    {
                        "url": current_url,
                        "title": title,
                        "text": text,
                    }
                )

            for href in raw_links:

                next_url = self.resolve_url(
                    current_url,
                    href,
                )

                if not next_url:
                    continue

                if not self.should_crawl(next_url):
                    continue

                self.queue.append(next_url)

            if self.delay > 0:
                time.sleep(self.delay)

        return pages


def crawl_website(
    url: str,
    max_pages: int = 100,
    timeout: int = 15,
    delay: float = 0.2,
):
    """
    Crawl an entire website starting from a URL.

    Returns:
        [
            {
                "url": "...",
                "title": "...",
                "text": "..."
            }
        ]
    """

    crawler = WebsiteCrawler(
        start_url=url,
        max_pages=max_pages,
        timeout=timeout,
        delay=delay,
    )

    return crawler.crawl()


# if __name__ == "__main__":
#     pages = crawl_website(
#         "https://www.ikea.com/in/en/",
#         max_pages=50,
#     )

#     for page in pages:
#         print("=" * 80)
#         print("TITLE:", page["title"])
#         print("URL:", page["url"])
#         print(page["text"][:1000])

