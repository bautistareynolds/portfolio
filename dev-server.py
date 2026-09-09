#!/usr/bin/env python3
"""Dev server with live reload (polling). Serves portfolio/ and injects reload script into HTML."""
import http.server, socketserver, os, sys, time, threading, mimetypes, urllib.parse
from pathlib import Path

ROOT = Path(__file__).parent.resolve()
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
VERSION = 0
VERSION_LOCK = threading.Lock()

RELOAD_JS = b"""<script>(function(){let v=null;async function chk(){try{let r=await fetch('/__version',{cache:'no-store'});let n=await r.text();if(v===null)v=n;else if(v!==n)location.reload();}catch(e){}}setInterval(chk,600);chk();})()</script>"""

def watch():
    global VERSION
    mtimes = {}
    def scan():
        d = {}
        ignored = ("__pycache__", ".git", ".playwright-mcp", "node_modules", ".direnv")
        for p in ROOT.rglob("*"):
            if p.is_file() and not any(seg in str(p) for seg in ignored) and p.name not in ("dev-server.py",):
                try: d[str(p)] = p.stat().st_mtime
                except: pass
        return d
    mtimes = scan()
    while True:
        time.sleep(0.5)
        cur = scan()
        if cur != mtimes:
            mtimes = cur
            with VERSION_LOCK:
                VERSION += 1
            print(f"[watch] change detected -> v{VERSION}", flush=True)

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/__version":
            with VERSION_LOCK:
                v = str(VERSION)
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(v.encode())
            return

        # map / to /index.html
        rel = path.lstrip("/")
        if rel == "" or rel.endswith("/"):
            rel = (rel + "index.html") if rel else "index.html"
        # prevent traversal
        rel = os.path.normpath(rel)
        if rel.startswith(".."):
            self.send_error(403); return
        fpath = ROOT / rel
        # directory without trailing slash -> try index
        if fpath.is_dir():
            fpath = fpath / "index.html"
        if not fpath.exists() or not fpath.is_file():
            self.send_error(404, f"Not found: {path}")
            return

        ctype, _ = mimetypes.guess_type(str(fpath))
        ctype = ctype or "application/octet-stream"
        try:
            data = fpath.read_bytes()
        except Exception as e:
            self.send_error(500, str(e)); return

        # inject reload into html
        if ctype.startswith("text/html"):
            if b"</body>" in data:
                data = data.replace(b"</body>", RELOAD_JS + b"</body>")
            else:
                data = data + RELOAD_JS

        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format, *args):
        sys.stdout.write("[http] %s - - [%s] %s\n" % (self.client_address[0], self.log_date_time_string(), format%args))
        sys.stdout.flush()

if __name__ == "__main__":
    threading.Thread(target=watch, daemon=True).start()
    # allow reuse
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    # try ports
    for p in [PORT, 8000, 8001, 8010, 3000, 5500]:
        try:
            with socketserver.ThreadingTCPServer(("0.0.0.0", p), Handler) as httpd:
                print(f"[dev] serving {ROOT} at http://localhost:{p}  (live reload polling /__version)", flush=True)
                print(f"[dev] live reload: polling every 600ms, version {VERSION}", flush=True)
                httpd.serve_forever()
                break
        except OSError as e:
            if "Address already in use" in str(e):
                print(f"[dev] port {p} in use, trying next...", flush=True)
                continue
            raise
