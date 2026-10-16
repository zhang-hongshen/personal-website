# Local preview server. Unlike plain `python3 -m http.server`, it tells the browser to
# revalidate every file, so edits show up on a normal refresh.
import functools
import http.server
import sys
from pathlib import Path


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
root = Path(__file__).resolve().parent.parent
handler = functools.partial(Handler, directory=str(root))
http.server.ThreadingHTTPServer(("", port), handler).serve_forever()
