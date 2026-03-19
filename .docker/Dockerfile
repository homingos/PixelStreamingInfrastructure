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

# Install coturn during build (required for TURN server)
RUN apt-get update && apt-get install -y coturn && rm -rf /var/lib/apt/lists/*

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

# Use port 8080 since non-root users cannot bind to port 80
ENTRYPOINT ["bash", "SignallingWebServer/platform_scripts/bash/start.sh", "--nosudo", "--", "--player_port", "8080"]
