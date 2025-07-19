#!/usr/bin/env python3

import http.server
import socketserver
import os
import sys

PORT = 3000
HOST = "0.0.0.0"

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_GET(self):
        # Serve index.html for SPA routes
        if self.path == '/' or (not '.' in os.path.basename(self.path)):
            self.path = '/index.html'
        
        return super().do_GET()

# Change to frontend directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

try:
    with socketserver.TCPServer((HOST, PORT), CustomHandler) as httpd:
        print("🚀 Python Development Server Started")
        print(f"   ➜ Local:   http://localhost:{PORT}/")
        print(f"   ➜ Network: http://{HOST}:{PORT}/")
        print("")
        print("📋 Status:")
        print("   ✅ Backend API: Available at http://localhost:3001")
        print("   ⚠️  Frontend: Static mode (React requires Vite)")
        print("")
        print("🔧 To get full React functionality:")
        print("   1. Fix Windows permissions (PowerShell as Admin):")
        print('   icacls "C:\\Users\\junju\\OneDrive\\Desktop\\fuyou" /grant Everyone:F /T')
        print("   2. Run: npm install")
        print("   3. Run: npm run dev")
        print("")
        print("Press Ctrl+C to stop the server")
        
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\n🛑 Server shutting down...")
    sys.exit(0)
except OSError as e:
    print(f"❌ Error: {e}")
    if "Address already in use" in str(e):
        print("Port 3000 is already in use. Please kill the existing process.")
    sys.exit(1)