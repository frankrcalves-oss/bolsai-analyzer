"""
proxy.py — Bolsai Analyzer para Railway
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import urllib.error
import json, os, io

BOLSAI_KEY    = os.environ.get('BOLSAI_API_KEY', '')
ANTHROPIC_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
BOLSAI_BASE   = 'https://api.usebolsai.com'
ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
PORT          = int(os.environ.get('PORT', 8080))
DIR           = os.path.dirname(os.path.abspath(__file__))

MIME = {'.html':'text/html; charset=utf-8','.css':'text/css',
        '.js':'application/javascript','.json':'application/json',
        '.png':'image/png','.ico':'image/x-icon'}

def read_all(resp):
    buf = io.BytesIO()
    while True:
        chunk = resp.read(65536)
        if not chunk:
            break
        buf.write(chunk)
    return buf.getvalue()

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"{self.address_string()} {fmt%args}", flush=True)

    def send_json(self, code, body: bytes):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)
        self.wfile.flush()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path != '/ia/messages':
            self.send_response(404); self.end_headers(); return
        length = int(self.headers.get('Content-Length', 0))
        body   = self.rfile.read(length)
        req    = urllib.request.Request(ANTHROPIC_URL, data=body, headers={
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_KEY,
            'anthropic-version': '2023-06-01',
        })
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = read_all(resp)
            print(f"  Anthropic response: {len(result)} bytes", flush=True)
            self.send_json(200, result)
        except urllib.error.HTTPError as e:
            self.send_json(e.code, e.read())
        except Exception as e:
            self.send_json(502, json.dumps({'error': str(e)}).encode())

    def do_GET(self):
        if self.path.startswith('/api/'):
            req = urllib.request.Request(BOLSAI_BASE + self.path,
                headers={'X-API-Key': BOLSAI_KEY, 'User-Agent': 'BolsaiAnalyzer/1.0'})
            try:
                with urllib.request.urlopen(req, timeout=15) as resp:
                    body = read_all(resp)
                self.send_json(200, body)
            except urllib.error.HTTPError as e:
                self.send_json(e.code, e.read())
            except Exception as e:
                self.send_json(502, json.dumps({'error': str(e)}).encode())
            return

        path = self.path.split('?')[0] or '/index.html'
        if path == '/': path = '/index.html'
        fp = os.path.join(DIR, path.lstrip('/'))
        if os.path.isfile(fp):
            mime = MIME.get(os.path.splitext(fp)[1], 'text/plain')
            with open(fp, 'rb') as f: body = f.read()
            self.send_response(200)
            self.send_header('Content-Type', mime)
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404); self.end_headers(); self.wfile.write(b'Not found')

if __name__ == '__main__':
    print(f"\n  Bolsai Analyzer porta {PORT}\n", flush=True)
    HTTPServer(('0.0.0.0', PORT), Handler).serve_forever()
