const http = require('http');
const url = require('url');
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();
const PORT = process.env.SEED_PORT || 4000;

// CORS middleware
function addCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Validate weather object
function isValidWeather(obj) {
  if (!obj) return false;
  const { date, temperature, windspeed, humidity, pressure, rainfall } = obj;
  if (!date) return false;
  if ([temperature, windspeed, humidity, pressure, rainfall].some(v => v === undefined)) return false;
  const d = new Date(date);
  return !Number.isNaN(d.getTime());
}

const server = http.createServer(async (req, res) => {
  addCorsHeaders(res);

  // Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = url.parse(req.url, true);
  const path = reqUrl.pathname;

  // ================== LOGIN ==================
  if (req.method === 'POST' && path === '/login') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { email, password } = JSON.parse(body);
        if (!email || !password) throw new Error('Email und Passwort erforderlich');

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error('Benutzer nicht gefunden');
        if (user.password !== password) throw new Error('Falsches Passwort');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }));
      } catch (err) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // ================== GET WEATHER ==================
  if (req.method === 'GET' && path === '/weather') {
    try {
      const entries = await prisma.weather.findMany({ orderBy: { date: 'asc' } });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(entries));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // ================== POST WEATHER ==================
  if (req.method === 'POST' && path === '/weather') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        if (!body.trim()) throw new Error('Leerer Body');
        const parsed = JSON.parse(body);
        const arr = Array.isArray(parsed) ? parsed : [parsed];

        for (const item of arr) {
          if (!isValidWeather(item)) throw new Error('Ungültiges Wetterobjekt');
        }

        for (const item of arr) {
          await prisma.weather.create({
            data: {
              date: new Date(item.date),
              temperature: Number(item.temperature),
              windspeed: Number(item.windspeed),
              humidity: Number(item.humidity),
              pressure: Number(item.pressure),
              rainfall: Number(item.rainfall),
            },
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, inserted: arr.length }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // ================== DELETE WEATHER ==================
  if (req.method === 'DELETE' && path.startsWith('/weather/')) {
    const id = parseInt(path.split('/')[2]);
    if (isNaN(id)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Ungültige ID' }));
      return;
    }

    try {
      await prisma.weather.delete({ where: { id } });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Eintrag nicht gefunden' }));
    }
    return;
  }

  // ================== SHUTDOWN ==================
  if (req.method === 'POST' && path === '/done') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, message: 'Shutting down' }));
    server.close(() => {
      prisma.$disconnect();
      process.exit(0);
    });
    return;
  }

  // 404
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`\nBackend läuft auf http://localhost:${PORT}`);
  console.log('Verfügbare Endpunkte:');
  console.log('  POST /login          → Login');
  console.log('  GET  /weather         → Alle Wetterdaten');
  console.log('  POST /weather         → Neuen Eintrag speichern');
  console.log('  DELETE /weather/:id   → Eintrag löschen');
  console.log('  POST /done            → Server stoppen\n');
});

process.on('SIGINT', () => {
  server.close(() => {
    prisma.$disconnect();
    process.exit(0);
  });
});