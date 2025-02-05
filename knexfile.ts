// Update with your config settings.

import {getDBFolder, getDBName} from "./src/assets/ipcHandel";
import path from "path";
import {Config} from "knex";

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */



const config: Config = {
  client: 'sqlite3',
  connection: async () => {
    let dbPath = await getDBFolder();
    let dbName = await getDBName();
    console.log(dbName,'dbName')
    console.log(dbPath,'dbPath')
    return {
      filename:path.join(dbPath, dbName)
    }
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
