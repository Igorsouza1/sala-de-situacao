// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  dialect: "postgresql",
  dbCredentials: {
    url: "postgres://postgres:ihp@ihp@localhost:5432/IHP?search_path=rio_da_prata",
  },
});