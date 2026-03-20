# Use the current Long Term Support (LTS) version of Node.js
FROM node:lts

WORKDIR /SignallingWebServer

COPY NODE_VERSION ./NODE_VERSION
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
COPY Common ./Common
COPY Signalling ./Signalling
COPY SignallingWebServer ./SignallingWebServer
COPY Frontend ./Frontend

# Install coturn and curl during build
RUN apt-get update && apt-get install -y coturn curl && rm -rf /var/lib/apt/lists/*

# Build the signalling server and frontend
RUN SignallingWebServer/platform_scripts/bash/setup.sh --build

# Create logs directory with write permissions (app runs from /SignallingWebServer/SignallingWebServer/)
RUN mkdir -p /SignallingWebServer/SignallingWebServer/logs && chmod 777 /SignallingWebServer/SignallingWebServer/logs

# Expose ports
EXPOSE 8080
EXPOSE 443
EXPOSE 8888
EXPOSE 8888/udp
EXPOSE 8889
EXPOSE 19302
EXPOSE 3478
EXPOSE 3479

# Create health check script
RUN printf '#!/bin/sh\ncurl -sf http://localhost:8080/ > /dev/null || exit 1\n' > /SignallingWebServer/health-check.sh && chmod +x /SignallingWebServer/health-check.sh

# Use port 8080 since non-root users cannot bind to port 80
WORKDIR /SignallingWebServer
ENTRYPOINT ["bash", "SignallingWebServer/platform_scripts/bash/start.sh", "--nosudo", "--", "--player_port", "8080", "--base_path", "/flamai-pixelstreaminginfrastructure", "--streamer_base_path", "/flamai-pixelstreaminginfrastructure/signalling"]
