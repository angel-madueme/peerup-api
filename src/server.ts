import { app } from './app.js';
import { config } from './config/index.js';
import { prisma } from './lib/prisma.js';
import { warmUpDatabase } from './lib/db-retry.js';

void warmUpDatabase(() => prisma.$queryRaw`SELECT 1`);
app.listen(config.port, () => {
  console.log(`Peerup API listening on http://localhost:${config.port}`);
});
