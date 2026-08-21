// Adapter: turns a Vercel Node.js handler invocation (IncomingMessage /
// ServerResponse) into the Web Request / Response API that _handler.js uses.
// Used by every entry point (chat.js, key-status.js, dev-proxy.mjs) so local
// dev exercises the exact same code path as production.

export function nodeHandler(webHandler) {
  return async function handler(nodeReq, nodeRes) {
    try {
      const url = `https://${nodeReq.headers.host || 'localhost'}${nodeReq.url || '/'}`;
      const chunks = [];
      for await (const chunk of nodeReq) chunks.push(chunk);
      const body = chunks.length ? Buffer.concat(chunks) : undefined;

      // Strip hop-by-hop / framing headers; undici sets its own when a body
      // is present and rejects some of these in the Request constructor.
      const headers = {};
      const SKIP = new Set(['host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive', 'upgrade']);
      for (const [key, value] of Object.entries(nodeReq.headers)) {
        if (!SKIP.has(key.toLowerCase())) headers[key] = value;
      }

      const response = await webHandler(new Request(url, { method: nodeReq.method, headers, body }));

      nodeRes.statusCode = response.status;
      response.headers.forEach((value, key) => nodeRes.setHeader(key, value));
      nodeRes.end(Buffer.from(await response.arrayBuffer()));
    } catch (e) {
      if (!nodeRes.headersSent) {
        nodeRes.statusCode = 500;
        nodeRes.setHeader('Content-Type', 'application/json');
      }
      nodeRes.end(JSON.stringify({ error: { message: `Function error: ${e.message}` } }));
    }
  };
}
