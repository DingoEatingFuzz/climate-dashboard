import DB from 'db'
import { useState, useEffect } from 'react'

// Initialize the DB at module read-time
const weatherDB = new DB();

export const dbEffect = (fn: (db: DB) => Promise<void>, keys:Array<any>|undefined) => {
  useEffect(() => {
    const dbCall = async () => {
      if (!weatherDB.ready) await weatherDB.init();
      await fn(weatherDB);
    }

    dbCall().catch(console.error);
  }, keys)
}
