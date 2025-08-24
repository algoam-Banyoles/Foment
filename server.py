import http.server
import os
import socketserver
import subprocess
from pathlib import Path
from urllib.parse import parse_qs, urlparse

PORT = 8000
WEB_DIR = Path(__file__).resolve().parent

def verify_access(request: http.server.BaseHTTPRequestHandler) -> bool:
    """Return True if the request provides the correct admin code via header or query."""
    code = request.headers.get('X-Admin-Code')
    if code is None:
        parsed = urlparse(request.path)
        params = parse_qs(parsed.query)
        code = (
            params.get('code', [None])[0]
            or params.get('admin_code', [None])[0]
            or params.get('X-Admin-Code', [None])[0]
        )
    expected = os.environ.get('ADMIN_CODE')
    return expected is not None and code == expected


class Handler(http.server.SimpleHTTPRequestHandler):
    """Serve static files and provide endpoints to update cached data."""

    SCRIPTS = {
        "/update-ranking": "tools/update_ranquing.py",
        "/update-classificacions": "tools/update_classificacions.py",
        "/update-events": "tools/update_events.py",
    }

    def do_GET(self) -> None:  # noqa: D401 - inherited docs
        parsed_path = urlparse(self.path)
        script = self.SCRIPTS.get(parsed_path.path)
        if script:
            if not verify_access(self):
                self.send_response(403)
                self.end_headers()
                return
            try:
                subprocess.run(["python3", str(WEB_DIR / script)], check=True)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b"{\"status\": \"ok\"}")
            except subprocess.CalledProcessError:
                self.send_response(500)
                self.end_headers()
            return
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

if __name__ == '__main__':
    os.chdir(WEB_DIR)
    with socketserver.TCPServer(('', PORT), Handler) as httpd:
        print(f'Serving on http://localhost:{PORT}')
        httpd.serve_forever()
