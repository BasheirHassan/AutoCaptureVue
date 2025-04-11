// Update with your config settings.

import path from "path";
import type { Knex } from "knex";
import fs from "fs";

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */

// Ensure the database directory exists
const dbDir = path.join(process.env.APPDATA || '', 'AutoCapture');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const config: Knex.Config = {
  client: 'sqlite3',
  connection: {
    filename: path.join(dbDir, 'imageStore.db')
  },
  useNullAsDefault: true,
  migrations: {
    directory: './migrations'
  },
  seeds: {
    directory: './seeds'
  }
};

export default config;
