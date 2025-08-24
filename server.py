import http.server
import socketserver
import subprocess
import os
from pathlib import Path
from urllib.parse import urlparse, parse_qs

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
    def do_GET(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path == '/update-ranking':
            if not verify_access(self):
                self.send_response(403)
                self.end_headers()
                return
            try:
                subprocess.run(['python3', 'update_ranquing.py'], check=True)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status": "ok"}')
            except subprocess.CalledProcessError:
                self.send_response(500)
                self.end_headers()
            return
        if parsed_path.path == '/update-classificacions':
            if not verify_access(self):
                self.send_response(403)
                self.end_headers()
                return
            try:
                subprocess.run(['python3', 'update_classificacions.py'], check=True)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status": "ok"}')
            except subprocess.CalledProcessError:
                self.send_response(500)
                self.end_headers()
            return
        if parsed_path.path == '/update-events':
            if not verify_access(self):
                self.send_response(403)
                self.end_headers()
                return
            try:
                subprocess.run(['python3', 'update_events.py'], check=True)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status": "ok"}')
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
