import { PrismaClient } from './generated/prisma';
import { faker } from '@faker-js/faker';
import * as readline from 'readline';

const prisma = new PrismaClient();

async function main() {
  // Create users (50)
  const roles = ['admin', 'user'] as const;
  for (let i = 0; i < 50; i++) {
    await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        role: faker.helpers.arrayElement(roles),
        password: faker.internet.password(10),
      },
    });
  }

  console.log('');
  console.log('Now enter weather entries manually, one JSON object per line.');
  console.log("When finished type 'done' on its own line.");
  console.log('Required fields: date (ISO string), temperature, windspeed, humidity, pressure, rainfall');
  console.log('Example: {"date":"2025-10-17T12:00:00Z","temperature":12.3,"windspeed":3.4,"humidity":56,"pressure":1012,"rainfall":0}');
  console.log('');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });

  await new Promise<void>((resolve) => {
    rl.on('line', async (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed.toLowerCase() === 'done' || trimmed.toLowerCase() === 'exit') {
        rl.close();
        return;
      }

      let obj;
      try {
        obj = JSON.parse(trimmed);
      } catch (e) {
        console.error('Invalid JSON — try again:', e.message);
        return;
      }

      const { date, temperature, windspeed, humidity, pressure, rainfall } = obj;
      if (!date || temperature === undefined || windspeed === undefined || humidity === undefined || pressure === undefined || rainfall === undefined) {
        console.error('Missing required fields. See example above.');
        return;
      }

      const parsedDate = new Date(date);
      if (Number.isNaN(parsedDate.getTime())) {
        console.error('Invalid date format. Use ISO string, e.g. 2025-10-17T12:00:00Z');
        return;
      }

      try {
        await prisma.weather.create({
          data: {
            date: parsedDate,
            temperature: Number(temperature),
            windspeed: Number(windspeed),
            humidity: Number(humidity),
            pressure: Number(pressure),
            rainfall: Number(rainfall),
          },
        });
        console.log('Inserted weather entry for', parsedDate.toISOString());
      } catch (e) {
        console.error('DB error:', e.message);
      }
    });

    rl.on('close', () => {
      resolve();
    });
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });