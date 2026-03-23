FROM node:lts

WORKDIR /SignallingWebServer

COPY NODE_VERSION ./NODE_VERSION
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
COPY Common ./Common
COPY Signalling ./Signalling
COPY SignallingWebServer ./SignallingWebServer
COPY Frontend ./Frontend

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

RUN SignallingWebServer/platform_scripts/bash/setup.sh --build

RUN mkdir -p /SignallingWebServer/SignallingWebServer/logs && chmod 777 /SignallingWebServer/SignallingWebServer/logs

EXPOSE 8080
EXPOSE 8888
EXPOSE 8888/udp
EXPOSE 8889

RUN printf '#!/bin/sh\ncurl -sf http://localhost:8080/ > /dev/null || exit 1\n' > /SignallingWebServer/health-check.sh && chmod +x /SignallingWebServer/health-check.sh

RUN printf '#!/bin/bash\n\
set -e\n\
\n\
echo "[startup] Fetching Cloudflare TURN credentials..."\n\
TURN_RESPONSE=$(curl -s -X POST \\\n\
  "https://rtc.live.cloudflare.com/v1/turn/keys/${CLOUDFARE_TURN_KEY}/credentials/generate-ice-servers" \\\n\
  -H "Authorization: Bearer ${CLOUDFARE_API_KEY}" \\\n\
  -H "Content-Type: application/json" \\\n\
  -d '"'"'{"ttl": 86400}'"'"')\n\
\n\
echo "[startup] Writing peer_options.json..."\n\
echo "${TURN_RESPONSE}" | node -e "\n\
  const raw = require('"'"'fs'"'"').readFileSync(0, '"'"'utf8'"'"');\n\
  let d;\n\
  try {\n\
    d = JSON.parse(raw);\n\
  } catch(e) {\n\
    console.error('"'"'[startup] Failed to parse Cloudflare response:'"'"', raw);\n\
    process.exit(1);\n\
  }\n\
  if (!d.iceServers) {\n\
    console.error('"'"'[startup] No iceServers in response:'"'"', raw);\n\
    process.exit(1);\n\
  }\n\
  require('"'"'fs'"'"').writeFileSync(\n\
    '"'"'/tmp/peer_options.json'"'"',\n\
    JSON.stringify({ iceServers: d.iceServers }, null, 2)\n\
  );\n\
  console.log('"'"'[startup] peer_options.json written'"'"');\n\
"\n\
\n\
echo "[startup] Starting Cirrus on ports 8081 (player) and 8888 (streamer)..."\n\
bash SignallingWebServer/platform_scripts/bash/start.sh \\\n\
  --nosudo -- \\\n\
  --player_port 8081 \\\n\
  --streamer_port 8888 \\\n\
  --serve \\\n\
  --reverse_proxy \\\n\
  --base_path /flamai-pixelstreaminginfrastructure \\\n\
  --streamer_base_path /flamai-pixelstreaminginfrastructure/signalling \\\n\
  --peer_options_file /tmp/peer_options.json &\n\
\n\
echo "[startup] Waiting for Cirrus to start..."\n\
sleep 3\n\
\n\
echo "[startup] Starting proxy on port 8080..."\n\
exec node /SignallingWebServer/SignallingWebServer/dist/proxy.js\n\
' > /SignallingWebServer/startup.sh && chmod +x /SignallingWebServer/startup.sh

WORKDIR /SignallingWebServer
ENTRYPOINT ["/SignallingWebServer/startup.sh"]