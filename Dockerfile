# Use Node.js 20 as the base image
FROM node:20-slim

# Install LibreOffice and dependencies
RUN apt-get update && \
    apt-get install -y \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
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

# Build TypeScript
RUN npm run build

# Expose port (use PORT from environment variable)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]