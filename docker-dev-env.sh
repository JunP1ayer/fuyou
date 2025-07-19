#!/bin/bash

# Docker-based Development Environment
# Complete WSL2 permission bypass solution

echo "🚀 Creating Docker-based development environment..."

# Create Dockerfile for Node.js development
cat > Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Install dependencies for better compatibility
RUN apk add --no-cache git python3 make g++

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install all dependencies with full permissions
RUN npm install --ignore-scripts --force
RUN cd frontend && npm install --ignore-scripts --force
RUN cd backend && npm install --ignore-scripts --force

# Copy source code
COPY . .

# Expose ports
EXPOSE 3000 3001 3002 3003

# Default command
CMD ["npm", "run", "dev:frontend"]
EOF

# Create docker-compose for full stack
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:3000"
      - "5173:5173"
    volumes:
      - ./frontend:/app/frontend
      - /app/node_modules
      - /app/frontend/node_modules
    command: sh -c "cd frontend && npm run dev"
    environment:
      - CHOKIDAR_USEPOLLING=true
      - FAST_REFRESH=false

  backend:
    build: .
    ports:
      - "3001:3001"
    volumes:
      - ./backend:/app/backend
      - /app/node_modules
      - /app/backend/node_modules
    command: sh -c "cd backend && npm run dev"
    environment:
      - NODE_ENV=development

  optimization:
    image: python:3.11-alpine
    ports:
      - "8000:8000"
    volumes:
      - ./optimization_service:/app
    working_dir: /app
    command: sh -c "pip install -r requirements.txt && python main.py"

networks:
  default:
    driver: bridge
EOF

echo "✅ Docker environment created successfully!"
echo "🐳 Run: docker-compose up --build"