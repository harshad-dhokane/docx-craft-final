# Use Node.js 20 as the base image
FROM node:20-slim

# Install LibreOffice and other dependencies
RUN apt-get update && \
    apt-get install -y \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    fonts-liberation2 \
    fonts-noto-cjk \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy package files first
COPY package*.json ./

# Install dependencies and TypeScript globally
RUN npm install && \
    npm install -g typescript

# Copy the rest of the application
COPY . .

# Create necessary directories with proper permissions
RUN mkdir -p node_modules/.vite && \
    mkdir -p dist && \
    chown -R node:node /usr/src/app

# Switch to node user
USER node

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Build application
RUN npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]