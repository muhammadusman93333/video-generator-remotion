FROM node:20-bookworm-slim

# Install system dependencies for Chromium/Puppeteer, fonts, and ffmpeg/ffprobe
RUN apt-get update && apt-get install -y \
    libnss3 \
    libdbus-1-3 \
    libatk1.0-0 \
    libgbm-dev \
    libasound2 \
    libxrandr2 \
    libxkbcommon-dev \
    libxfixes3 \
    libxcomposite1 \
    libxdamage1 \
    libatk-bridge2.0-0 \
    libpango-1.0-0 \
    libcairo2 \
    libcups2 \
    ffmpeg \
    fonts-noto-color-emoji \
    fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Ensure Remotion browser is installed
RUN npx remotion browser ensure

# Copy the rest of the application files
COPY . .

# Expose the application port
EXPOSE 3000

# Start the Express server
CMD ["node", "server.js"]
