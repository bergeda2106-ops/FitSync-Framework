from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

os.chdir(r'c:\python\FitSync-Framework')

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

print("Server running on http://localhost:8081 (no-cache)")
HTTPServer(('', 8081), NoCacheHandler).serve_forever()
