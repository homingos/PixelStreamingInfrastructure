// SignallingWebServer/src/proxy.ts
'use strict';

import * as http from 'http';
import * as net from 'net';
import * as url from 'url';

const PORT: number = parseInt(process.env.PORT || '8080', 10);
const CONTEXT: string = process.env.CONTEXT || 'flamai-pixelstreaminginfrastructure';
const PLAYER_PORT: number = 8081;
const STREAMER_PORT: number = 8888;
const SIGNALLING_PATH: string = `/${CONTEXT}/signalling`;
const PLAYER_PATH: string = `/${CONTEXT}`;

function tunnel(
    req: http.IncomingMessage,
    clientSocket: net.Socket,
    head: Buffer,
    port: number,
    targetPath: string
): void {
    const upstream = net.connect(port, '127.0.0.1', () => {
        const headers = { ...req.headers, host: `127.0.0.1:${port}` };
        const headerStr = Object.entries(headers)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\r\n');
        upstream.write(`GET ${targetPath} HTTP/1.1\r\n${headerStr}\r\n\r\n`);
        if (head?.length) upstream.write(head);
    });

    upstream.on('error', (e: Error) => {
        console.error('[proxy] upstream error:', e.message);
        clientSocket.destroy();
    });
    clientSocket.on('error', (e: Error) => {
        console.error('[proxy] client error:', e.message);
        upstream.destroy();
    });

    upstream.pipe(clientSocket);
    clientSocket.pipe(upstream);
}

function proxyHttp(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    port: number
): void {
    const options: http.RequestOptions = {
        hostname: '127.0.0.1',
        port,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: `127.0.0.1:${port}` },
    };

    const upstream = http.request(options, (upstreamRes) => {
        res.writeHead(upstreamRes.statusCode || 200, upstreamRes.headers);
        upstreamRes.pipe(res, { end: true });
    });

    upstream.on('error', (e: Error) => {
        console.error('[proxy] HTTP upstream error:', e.message);
        res.writeHead(502).end('Bad Gateway');
    });

    req.pipe(upstream, { end: true });
}

const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
    const parsedUrl = url.parse(req.url || '/');
    const path = parsedUrl.pathname || '/';

    // Health check
    if (path === '/' || path === '/healthz') {
        res.writeHead(200).end('ok');
        return;
    }

    // Forward player HTTP requests to Cirrus :8081
    if (path.startsWith(PLAYER_PATH)) {
        console.log(`[proxy] HTTP ${req.method} ${path} → :${PLAYER_PORT}`);
        proxyHttp(req, res, PLAYER_PORT);
        return;
    }

    res.writeHead(404).end('Not found');
});

server.on('upgrade', (req: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
    const path = url.parse(req.url || '/').pathname || '/';

    if (path.startsWith(SIGNALLING_PATH)) {
        console.log(`[proxy] streamer WS ${path} → :${STREAMER_PORT}`);
        tunnel(req, socket, head, STREAMER_PORT, path);
    } else {
        console.log(`[proxy] player WS ${path} → :${PLAYER_PORT}`);
        tunnel(req, socket, head, PLAYER_PORT, path);
    }
});

server.listen(PORT, () => {
    console.log(`[proxy] listening on :${PORT}`);
    console.log(`[proxy] streamer: ${SIGNALLING_PATH} → :${STREAMER_PORT}`);
    console.log(`[proxy] player:   ${PLAYER_PATH} → :${PLAYER_PORT}`);
});