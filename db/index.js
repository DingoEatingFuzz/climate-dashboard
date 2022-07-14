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
  #initializing = false;
  #initPromise = null;
  #counter = 0;

  constructor() {}

  async init() {
    if (this.ready) {
      console.warn('Database has already been made. Avoid calling `init` twice');
      return;
    }
    if (this.#initializing) {
      console.warn('Database is currently being made. Possibly a race condition in your app?');
      return await this.#initPromise;
    }

    this.#initPromise = this._init();
    return await this.#initPromise;
  }

  async _init() {
    this.#initializing = true;

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
    await conn.query("CREATE TABLE weather AS SELECT * FROM parquet_scan('weather')");
    await conn.query("CREATE TABLE stations AS SELECT * FROM parquet_scan('stations')");

    // TODO: This should be correct in the parquet file
    await conn.query("ALTER TABLE weather ALTER value TYPE INTEGER");
    await conn.query("ALTER TABLE weather ALTER year TYPE INTEGER");
    await conn.query("ALTER TABLE weather ALTER month TYPE INTEGER");
    await conn.query("ALTER TABLE weather ALTER day TYPE INTEGER");
    await conn.close();

    this.ready = true;
    this.#initializing = false;
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
      result = await statement.query(...params);
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

  // Queries for common charts

  async stations() {
    return await this.query('SELECT * FROM stations ORDER BY name');
  }

  async monthlyAverageForStation(station) {
    return await this.query(`
      SELECT id, date_trunc('month', date) as date, avg(value) as value, first(year), first(month)
      FROM weather
      WHERE element = 'TAVG' AND id = ?::TEXT AND value != -9999
      GROUP BY id, date_trunc('month', date)
      ORDER BY date_trunc('month', date)
    `, station.id || station);
  }

  async weatherForStationForRange(station, start, end) {
    const args = [station.id || station, start, end].filter(v => v != null);
    return await this.query(`
      SELECT *
      FROM weather
      WHERE id = ?::TEXT ${start ? 'AND date >= ?::DATE AND date <= ?::DATE' : ''}
      ORDER BY date
    `, ...args);
  }

  async averagesForStation(station) {
    return await this.query(`
      SELECT id, monthname(date) as month, element, avg(value) as value
      FROM weather
      WHERE id = ?::TEXT AND element IN ('TAVG', 'PRCP') AND value != -9999
      GROUP BY id, monthname(date), element
    `, station.id || station)
  }

  async weatherDetailByMonth(station) {
    // TAVG
    const temperatures = await this.query(`
      SELECT id, date_trunc('month', date) as date, element, avg(value) as average, list(value) as values
      FROM weather
      WHERE id = ?::TEXT AND element = 'TAVG' AND value != -9999
      GROUP BY id, date_trunc('month', date), element
      ORDER BY date
    `, station.id || station)

    // PRCP
    const rainfall = await this.query(`
      SELECT id, date_trunc('month', date) as date, element, sum(value) as total, list(value) as values
      FROM weather
      WHERE id = ?::TEXT AND element = 'PRCP' AND value != -9999
      GROUP BY id, date_trunc('month', date), element
      ORDER BY date
    `, station.id || station)

    return {
      columns: union(temperatures.columns, rainfall.columns),
      rows: tableJoin(temperatures.rows, rainfall.rows, 'date', { total: 'rainfall', values: 'rainValues' }),
    };
  }
}

function union(...arrs) {
  const s = new Set();
  arrs.forEach(arr => {
    arr.forEach(val => {
      s.add(val);
    });
  });

  return Array.from(s);
}

// Adds columns from 'from' to 'dest' by joining on 'field' and using 'mapper' for column names
function tableJoin(dest, from, field, mapper) {
  const ir = hash(dest, field);
  const maps = Object.entries(mapper);
  from.forEach(row => {
    const record = ir[row[field]];
    if (record) {
      maps.forEach(([key, value]) => {
        record[value] = row[key];
      });
    }
  });
  return table(ir);
}

// Makes a hash of a table on a field for O(1) lookups
function hash(table, field) {
  const obj = {}
  const keys = [];
  table.forEach(row => {
    obj[row[field]] = row;
    keys.push(''+row[field]);
  });
  obj.keys = keys;
  return obj;
}

// Converts a hash back to a table (used with hash)
function table(hash) {
  if (!hash.keys) throw "Provided hash is not a result of hash(table, field)";
  return hash.keys.map(k => hash[k]);
}
