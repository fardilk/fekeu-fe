#!/usr/bin/env python3
"""
Simple mock API for local testing:
- POST /login expects JSON {"username":"usertest01","password":"test123"}
  and returns {"token":"mock-token-..."}
- POST /uploads expects Authorization: Bearer <token> and multipart form field 'file'
  and saves the uploaded file to /tmp/mock-uploads and returns JSON with filename.
"""
import http.server
import socketserver
import json
import os
import cgi

import os

# Allow overriding the port via env var so we can run multiple instances if needed
PORT = int(os.environ.get('MOCK_API_PORT', '8081'))
UPLOAD_DIR = '/tmp/mock-uploads'

os.makedirs(UPLOAD_DIR, exist_ok=True)

class Handler(http.server.BaseHTTPRequestHandler):
    def _set_json(self, code=200):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()

    def do_POST(self):
        if self.path == '/login':
            length = int(self.headers.get('content-length', 0))
            raw = self.rfile.read(length) if length else b''
            try:
                data = json.loads(raw.decode('utf-8')) if raw else {}
            except Exception:
                self._set_json(400)
                self.wfile.write(json.dumps({'error':'invalid_body'}).encode())
                return
            username = data.get('username')
            password = data.get('password')
            if username == 'usertest01' and password == 'test123':
                self._set_json(200)
                self.wfile.write(json.dumps({'token':'mock-token-usertest01'}).encode())
            else:
                self._set_json(401)
                self.wfile.write(json.dumps({'error':'invalid_credentials'}).encode())
            return

        if self.path == '/uploads':
            # Check Authorization header
            auth = self.headers.get('Authorization', '')
            if not auth.startswith('Bearer '):
                self._set_json(401)
                self.wfile.write(json.dumps({'error':'missing_token'}).encode())
                return
            token = auth.split(' ', 1)[1].strip()
            if token != 'mock-token-usertest01':
                self._set_json(403)
                self.wfile.write(json.dumps({'error':'invalid_token'}).encode())
                return

            # parse multipart
            ctype, pdict = cgi.parse_header(self.headers.get('content-type'))
            if ctype != 'multipart/form-data':
                self._set_json(400)
                self.wfile.write(json.dumps({'error':'invalid_content_type'}).encode())
                return
            pdict['boundary'] = pdict['boundary'].encode('utf-8')
            form = cgi.FieldStorage(fp=self.rfile, headers=self.headers, environ={'REQUEST_METHOD':'POST'}, keep_blank_values=True)
            if 'file' not in form:
                self._set_json(400)
                self.wfile.write(json.dumps({'error':'missing_file_field'}).encode())
                return
            fileitem = form['file']
            if not fileitem.file or not fileitem.filename:
                self._set_json(400)
                self.wfile.write(json.dumps({'error':'invalid_file'}).encode())
                return
            filename = os.path.basename(fileitem.filename)
            outpath = os.path.join(UPLOAD_DIR, filename)
            with open(outpath, 'wb') as out:
                out.write(fileitem.file.read())
            self._set_json(200)
            self.wfile.write(json.dumps({'ok':True,'filename':filename,'saved_to':outpath}).encode())
            return

        # default
        self._set_json(404)
        self.wfile.write(json.dumps({'error':'not_found'}).encode())

    def log_message(self, format, *args):
        # keep output minimal
        print("[mock_api] %s - %s" % (self.address_string(), format%args))

if __name__ == '__main__':
    print('Starting mock API on port', PORT)
    with socketserver.TCPServer(('0.0.0.0', PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('Shutting down')
            httpd.server_close()
