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

  // ================== REGISTER ==================
  if (req.method === 'POST' && path === '/register') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { name, email, password } = JSON.parse(body);

        if (!name || !email || !password) {
          throw new Error('Name, Email und Passwort sind erforderlich');
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          throw new Error('Diese Email ist bereits registriert');
        }

        const user = await prisma.user.create({
          data: {
            name,
            email,
            password,
            role: 'user'
          }
        });

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }));

        console.log(`Neuer Benutzer registriert: ${user.email}`);
      } catch (err) {
        console.error('Registrierungsfehler:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

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

  // ================== GET SINGLE WEATHER ==================
  if (req.method === 'GET' && path.startsWith('/weather/')) {
    const id = parseInt(path.split('/')[2], 10);
    if (isNaN(id) || id <= 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Ungültige ID' }));
      return;
    }

    try {
      const entry = await prisma.weather.findUnique({ where: { id } });
      if (!entry) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Eintrag nicht gefunden' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(entry));
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
            }
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

  // ================== UPDATE WEATHER ==================
  if (req.method === 'PUT' && path.startsWith('/weather/')) {
    const id = path.split('/')[2];
    if (!id || id.trim() === '') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Ungültige ID' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        // Validate the update data (allow partial updates)
        if (!data.date) {
          throw new Error('Datum ist erforderlich');
        }

        const updateData = {
          date: new Date(data.date),
          temperature: Number(data.temperature),
          windspeed: Number(data.windspeed || 0),
          humidity: Number(data.humidity || 0),
          pressure: Number(data.pressure || 0),
          rainfall: Number(data.rainfall || 0),
        };

        const updated = await prisma.weather.update({
          where: { id },
          data: updateData
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(updated));
      } catch (err) {
        console.error('Update error:', err);
        if (err.code === 'P2025') {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Eintrag nicht gefunden' }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      }
    });
    return;
  }

  // ================== DELETE WEATHER ==================
  if (req.method === 'DELETE' && path.startsWith('/weather/')) {
    console.log(`DELETE-Anfrage erhalten: ${req.url}`);
    const id = path.split('/')[2];
    if (!id || id.trim() === '') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Ungültige ID' }));
      return;
    }

    try {
      await prisma.weather.delete({ where: { id } });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, message: `Eintrag ${id} gelöscht` }));
      console.log(`Wettereintrag mit ID ${id} gelöscht.`);
    } catch (err) {
      console.error(`Löschfehler für ID ${id}:`, err.message);
      if (err.code === 'P2025') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Eintrag nicht gefunden' }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
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
  console.log('  POST   /register        → Registrieren');
  console.log('  POST   /login           → Login');
  console.log('  GET    /weather         → Alle Wetterdaten');
  console.log('  POST   /weather         → Neuen Eintrag speichern');
  console.log('  PUT    /weather/:id     → Eintrag aktualisieren');
  console.log('  DELETE /weather/:id     → Eintrag löschen');
  console.log('  POST   /done            → Server stoppen\n');
});

process.on('SIGINT', () => {
  console.log('\nServer wird beendet...');
  server.close(() => {
    (async () => {
      await prisma.$disconnect();
      process.exit(0);
    })();
  });
});