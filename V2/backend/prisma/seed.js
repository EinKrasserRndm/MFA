const http = require('http');
const { PrismaClient } = require('../generated/prisma');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();
const PORT = process.env.SEED_PORT || 4000;

function isValidWeather(obj) {
  if (!obj) return false;
  const { date, temperature, windspeed, humidity, pressure, rainfall } = obj;
  if (!date) return false;
  if ([temperature, windspeed, humidity, pressure, rainfall].some(v => v === undefined)) return false;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return false;
  return true;
}

async function seedUsers() {
  console.log('Seeding 50 users...');
  for (let i = 0; i < 50; i++) {
    await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        role: faker.helpers.arrayElement(['admin', 'user']),
        password: faker.internet.password(10),
      },
    });
  }
  console.log('Users seeded.');
}

async function insertWeatherArray(arr) {
  for (const item of arr) {
    if (!isValidWeather(item)) {
      throw new Error('Invalid weather object: ' + JSON.stringify(item));
    }
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
}

(async function main() {
  try {
    await seedUsers();

    console.log('');
    console.log(`HTTP server listening on http://localhost:${PORT}`);
    console.log('POST JSON to /weather  (single object or array) to insert weather entries.');
    console.log("POST to /done to stop the server and finish the seed.");
    console.log('');
    console.log('Example curl (single):');
    console.log(`curl -X POST http://localhost:${PORT}/weather -H "Content-Type: application/json" -d '{"date":"2025-10-17T12:00:00Z","temperature":12.3,"windspeed":3.4,"humidity":56,"pressure":1012,"rainfall":0}'`);
    console.log('');
    console.log('Example curl (multiple):');
    console.log(`curl -X POST http://localhost:${PORT}/weather -H "Content-Type: application/json" -d '[{"date":"2025-10-17T12:00:00Z","temperature":12.3,"windspeed":3.4,"humidity":56,"pressure":1012,"rainfall":0},{"date":"2025-10-17T13:00:00Z","temperature":11.9,"windspeed":2.1,"humidity":60,"pressure":1011,"rainfall":0}]'`);
    console.log('');

    const server = http.createServer(async (req, res) => {
      if (req.method === 'POST' && req.url === '/weather') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body);
            const arr = Array.isArray(parsed) ? parsed : [parsed];
            await insertWeatherArray(arr);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, inserted: arr.length }));
            console.log(`Inserted ${arr.length} weather entries.`);
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: err.message }));
            console.error('Error inserting weather:', err.message);
          }
        });
        return;
      }

      if (req.method === 'POST' && req.url === '/done') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, message: 'Shutting down' }));
        console.log('Received /done — shutting down.');
        server.close(async () => {
          await prisma.$disconnect();
          process.exit(0);
        });
        return;
      }

      if (req.method === 'GET' && req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
      }

      res.writeHead(404);
      res.end();
    });

    server.listen(PORT);
    // handle ctrl+c
    process.on('SIGINT', async () => {
      console.log('SIGINT — closing.');
      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    });
  } catch (e) {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }
})();