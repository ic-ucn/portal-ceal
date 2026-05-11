#!/usr/bin/env python3
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)
PORT = int(os.environ.get('PORT', '8080'))
print(f"Portal CEAL servido en http://localhost:{PORT}")
ThreadingHTTPServer(('0.0.0.0', PORT), SimpleHTTPRequestHandler).serve_forever()
