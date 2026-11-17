"""Serve the built site with JavaScript module MIME types on Windows too."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      '.mjs': 'text/javascript', '.pbf': 'application/vnd.mapbox-vector-tile'}

    def do_GET(self):
        if 'If-Modified-Since' in self.headers:
            del self.headers['If-Modified-Since']
        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', 8000), partial(Handler, directory='dist'))
    print('GeoTiles: http://127.0.0.1:8000', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
