import http.server
import socketserver
import subprocess
import os
from pathlib import Path

PORT = 8000
WEB_DIR = Path(__file__).resolve().parent

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/update-ranking':
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
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

if __name__ == '__main__':
    os.chdir(WEB_DIR)
    with socketserver.TCPServer(('', PORT), Handler) as httpd:
        print(f'Serving on http://localhost:{PORT}')
        httpd.serve_forever()
