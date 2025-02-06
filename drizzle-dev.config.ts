

import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: "postgres://postgres:ihp@ihp@localhost:5432/IHP",
  },
  schemaFilter: ['rio_da_prata'],
});
