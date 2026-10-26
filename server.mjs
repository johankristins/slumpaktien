import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('./slumpaktien.html', import.meta.url));
const source = html.toString('utf8');
const universe = source.match(/const UNIVERSE = `([^`]+)`/);
if (!universe) throw new Error('Stock universe not found');
const allowed = new Set(universe[1].trim().split('\n').map(line => line.split('|')[0].trim()));
const cache = new Map();
const ttlMs = 15 * 60 * 1000;
const port = Number(process.env.PORT || 3000);

async function chart(symbol) {
  const cached = cache.get(symbol);
  if (cached && cached.until > Date.now()) return cached.body;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2y&interval=1d`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RunhavenStaging/1.0)', Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Yahoo status ${response.status}`);
  const body = await response.text();
  if (body.length > 1_000_000) throw new Error('Chart response too large');
  const parsed = JSON.parse(body);
  if (!parsed.chart?.result?.[0]?.timestamp?.length) return null;
  if (cache.size > 500) cache.clear();
  cache.set(symbol, { body, until: Date.now() + ttlMs });
  return body;
}

createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') { res.writeHead(405).end(); return; }
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }).end('ok');
    return;
  }
  if (req.url === '/' || req.url === '/slumpaktien.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }).end(html);
    return;
  }
  const match = /^\/api\/chart\/([A-Za-z0-9^.=\-]{1,20})$/.exec(req.url || '');
  if (!match || !allowed.has(match[1])) { res.writeHead(404).end(); return; }
  try {
    const body = await chart(match[1]);
    if (!body) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=900' }).end(body);
  } catch (error) {
    console.error('Chart fetch failed:', error.message);
    res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' }).end('{"error":"chart_unavailable"}');
  }
}).listen(port, '0.0.0.0', () => console.log(`Slumpaktien listening on ${port}`));
