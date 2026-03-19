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

# Install coturn and build frontend at IMAGE BUILD TIME (while we're still root)
RUN apt-get update && apt-get install -y coturn && apt-get clean

RUN SignallingWebServer/platform_scripts/bash/setup.sh --build

# Pre-create the logs directory and make it writable by any user
# This is needed because GKE runs containers as non-root
RUN mkdir -p /SignallingWebServer/logs && chmod 777 /SignallingWebServer/logs

# Also ensure the working directory is writable
RUN chmod -R 777 /SignallingWebServer

EXPOSE 80
EXPOSE 443
EXPOSE 8888
EXPOSE 8888/udp
EXPOSE 8889
EXPOSE 19302
EXPOSE 3478
EXPOSE 3479

ENTRYPOINT ["bash", "SignallingWebServer/platform_scripts/bash/start.sh", "--nosudo"]