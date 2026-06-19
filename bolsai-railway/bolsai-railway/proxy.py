"""
proxy.py — servidor Bolsai Analyzer para Railway
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import urllib.error
import json
import os

API_KEY  = os.environ.get('BOLSAI_API_KEY', '')
API_BASE = 'https://api.usebolsai.com'
PORT     = int(os.environ.get('PORT', 8080))
DIR      = os.path.dirname(os.path.abspath(__file__))

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
        print(f"  {self.address_string()} — {fmt % args}", flush=True)

    def cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key')

    def do_OPTIONS(self):
        self.send_response(200)
        self.cors()
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/'):
            url = API_BASE + self.path
            req = urllib.request.Request(url, headers={
                'X-API-Key': API_KEY,
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
                self.send_header('Content-Type', 'application/json')
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
    print(f"\n  Bolsai Analyzer rodando na porta {PORT}\n", flush=True)
    HTTPServer(('0.0.0.0', PORT), Handler).serve_forever()
