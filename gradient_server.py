import http.server
import socketserver
from urllib.parse import urlparse, parse_qs
import json
from PIL import Image, ImageDraw
import numpy as np
import io
import random
import zipfile

def create_complex_gradient(width, height, colors, direction, noise_factor=0.1):
    """Create a complex gradient with multiple color points and noise"""
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    num_colors = len(colors)
    for y in range(height):
        for x in range(width):
            # Determine base color
            if direction == 'horizontal':
                t = x / width
            elif direction == 'vertical':
                t = y / height
            else:  # diagonal
                t = (x + y) / (width + height)
            
            i = int(t * (num_colors - 1))
            color1 = np.array(colors[i])
            color2 = np.array(colors[min(i + 1, num_colors - 1)])
            t = (t * (num_colors - 1)) % 1
            base_color = color1 * (1 - t) + color2 * t
            
            # Add noise
            noise = np.random.normal(0, noise_factor, 3)
            color = np.clip(base_color + noise * 255, 0, 255).astype(int)
            
            draw.point([x, y], tuple(color))
    
    return img

def generate_gradients(width, height, colors, direction, num_gradients=1, noise_range=(0.05, 0.2)):
    """Generate multiple gradient variations"""
    gradients = []
    for _ in range(num_gradients):
        noise_factor = random.uniform(*noise_range)
        img = create_complex_gradient(width, height, colors, direction, noise_factor)
        gradients.append(img)
    return gradients

class GradientHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            with open('index.html', 'rb') as file:
                self.wfile.write(file.read())
        elif self.path.startswith('/generate'):
            params = parse_qs(urlparse(self.path).query)
            width = int(params['width'][0])
            height = int(params['height'][0])
            direction = params['direction'][0]
            colors = [tuple(int(c.lstrip('#')[i:i+2], 16) for i in (0, 2, 4)) for c in json.loads(params['colors'][0])]
            num_gradients = int(params['num_gradients'][0])
            noise_min = float(params['noise_min'][0])
            noise_max = float(params['noise_max'][0])
            
            gradients = generate_gradients(width, height, colors, direction, num_gradients, (noise_min, noise_max))
            
            # Send gradients as a zip file
            buffer = io.BytesIO()
            with zipfile.ZipFile(buffer, 'w') as zip_file:
                for i, img in enumerate(gradients):
                    img_byte_arr = io.BytesIO()
                    img.save(img_byte_arr, format='PNG')
                    img_byte_arr = img_byte_arr.getvalue()
                    zip_file.writestr(f'gradient_{i+1}.png', img_byte_arr)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/zip')
            self.send_header('Content-Disposition', 'attachment; filename="gradients.zip"')
            self.end_headers()
            self.wfile.write(buffer.getvalue())
        else:
            super().do_GET()

class GradientHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        return super().do_GET()

# Run the server
with socketserver.TCPServer(("", 8000), GradientHandler) as httpd:
    print("Server running on http://localhost:8000")
    httpd.serve_forever()