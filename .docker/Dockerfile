# Use the current Long Term Support (LTS) version of Node.js
FROM node:lts

WORKDIR /SignallingWebServer

COPY NODE_VERSION ./NODE_VERSION
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
COPY /Common ./Common
COPY /Signalling ./Signalling
COPY /SignallingWebServer ./SignallingWebServer
COPY /Frontend ./Frontend
# Install the dependencies for the signalling server and build the frontend
RUN apt-get update && rm -rf /var/lib/apt/lists/*
RUN SignallingWebServer/platform_scripts/bash/setup.sh --build

# Create logs directory with write permissions for non-root users
RUN mkdir -p /SignallingWebServer/logs && chmod 777 /SignallingWebServer/logs

# Expose TCP ports 80 and 443 for player WebSocket connections and web server HTTP(S) access
EXPOSE 80
EXPOSE 443
EXPOSE 8888
EXPOSE 8888/udp
EXPOSE 8889
EXPOSE 19302
EXPOSE 3478
EXPOSE 3479

ENTRYPOINT ["bash", "SignallingWebServer/platform_scripts/bash/start.sh", "--nosudo"]

