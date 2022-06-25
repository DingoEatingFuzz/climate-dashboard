import * as duckdb from '@duckdb/duckdb-wasm';

async function makeDB() {
  // Returns references to js deliver cdn for web worker script
  const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());

  const logger = new duckdb.ConsoleLogger();
  const worker = await duckdb.createWorker(bundle.mainWorker);
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule);
  return db;
}

function qualifyURL(url) {
  const HOST = 'https://storage.googleapis.com/mlange-files/noaa-cdo/';
  return HOST + url;
}

export default class DB {
  ready = false;
  #counter = 0;

  constructor() {}

  async init() {
    // Create the database
    this.db = await makeDB();
    await this.db.open({
      query: {
        castTimestampToDate: true,
      }
    });

    // Load data
    this.db.registerFileURL('weather', qualifyURL('noaa-sample.parquet'));
    this.db.registerFileURL('stations', qualifyURL('noaa-gsn-stations.parquet'));

    // Create tables
    const conn = await this.db.connect();
    await conn.query("CREATE VIEW weather AS SELECT * FROM parquet_scan('weather')");
    await conn.query("CREATE VIEW stations AS SELECT * FROM parquet_scan('stations')");
    await conn.close();

    this.ready = true;
  }

  async connection() {
    if (!this.ready) throw new Error('Database has not been initialized');
    if (this._conn) return this._conn;

    return await this.db.connect();
  }

  async query(query, ...params) {
    const key = `Query: ${this.#counter++}: ${query}`;
    console.time(key);

    const conn = await this.connection();
    let result;
    if (params.length) {
      const statement = await conn.prepare(query);
      result = statement.query(...params);
    } else {
      result = await conn.query(query);
    }

    console.timeEnd(key);

    const rows = result.toArray().map(Object.fromEntries);
    const columns = result.schema.fields.map(d => d.name);
    return { rows, columns };
  }

  async describe(table) {
    const query = this.query(table ? `DESCRIBE ${table}` : 'SHOW TABLES');
    return await query;
  }
}
