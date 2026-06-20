"""
proxy.py — servidor Bolsai Analyzer para Railway
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import urllib.error
import json
import os

BOLSAI_KEY    = os.environ.get('BOLSAI_API_KEY', '')
ANTHROPIC_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
BOLSAI_BASE   = 'https://api.usebolsai.com'
ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
PORT          = int(os.environ.get('PORT', 8080))
DIR           = os.path.dirname(os.path.abspath(__file__))

MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css',
    '.js':   'application/javascript',
    '.json': 'application/json',
    '.png':  'image/png',
    '.ico':  'image/x-icon',
}

class Handler(BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        print(f"  {self.address_string()} {fmt % args}", flush=True)

    def cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key')

    def do_OPTIONS(self):
        self.send_response(200)
        self.cors()
        self.end_headers()

    def do_POST(self):
        if self.path == '/ia/messages':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            req = urllib.request.Request(
                ANTHROPIC_URL,
                data=body,
                headers={
                    'Content-Type': 'application/json',
                    'x-api-key': ANTHROPIC_KEY,
                    'anthropic-version': '2023-06-01',
                }
            )
            try:
                with urllib.request.urlopen(req, timeout=120) as resp:
                    chunks = []
                    while True:
                        chunk = resp.read(8192)
                        if not chunk:
                            break
                        chunks.append(chunk)
                    result = b''.join(chunks)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(result)))
                self.cors()
                self.end_headers()
                self.wfile.write(result)
                self.wfile.flush()
            except urllib.error.HTTPError as e:
                result = e.read()
                self.send_response(e.code)
                self.send_header('Content-Type', 'application/json')
                self.cors()
                self.end_headers()
                self.wfile.write(result)
            except Exception as e:
                msg = json.dumps({'error': str(e)}).encode()
                self.send_response(502)
                self.send_header('Content-Type', 'application/json')
                self.cors()
                self.end_headers()
                self.wfile.write(msg)
            return
        self.send_response(404)
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/'):
            url = BOLSAI_BASE + self.path
            req = urllib.request.Request(url, headers={
                'X-API-Key': BOLSAI_KEY,
                'User-Agent': 'BolsaiAnalyzer/1.0',
            })
            try:
                with urllib.request.urlopen(req, timeout=15) as resp:
                    body = resp.read()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.cors()
                self.end_headers()
                self.wfile.write(body)
            except urllib.error.HTTPError as e:
                body = e.read()
                self.send_response(e.code)
                self.send_header('Content-Type', 'application/json')
                self.cors()
                self.end_headers()
                self.wfile.write(body)
            except Exception as e:
                self.send_response(502)
                self.cors()
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
            return

        path = self.path.split('?')[0]
        if path == '/':
            path = '/index.html'
        filepath = os.path.join(DIR, path.lstrip('/'))

        if os.path.isfile(filepath):
            ext  = os.path.splitext(filepath)[1]
            mime = MIME.get(ext, 'text/plain')
            with open(filepath, 'rb') as f:
                body = f.read()
            self.send_response(200)
            self.send_header('Content-Type', mime)
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not found')

if __name__ == '__main__':
    print(f"\n  Bolsai Analyzer porta {PORT}\n", flush=True)
    HTTPServer(('0.0.0.0', PORT), Handler).serve_forever()
