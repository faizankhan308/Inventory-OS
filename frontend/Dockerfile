# Stage 1: Build React Assets
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency configs
COPY package.json package-lock.json ./

# Install standard dependencies
RUN npm ci

# Copy source assets
COPY . .

# Compile optimized static files
RUN node node_modules/vite/bin/vite.js build

# Stage 2: Serve via Nginx
FROM nginx:1.25-alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose Nginx serving port
EXPOSE 3000

# Start command
CMD ["nginx", "-g", "daemon off;"]
