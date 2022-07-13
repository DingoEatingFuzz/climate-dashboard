import { useState, useEffect } from 'react'
import './App.css'
import { dbEffect } from './db-effect'

function App() {
  const [station, setStation] = useState<Station | undefined>(undefined)
  const [stations, setStations] = useState<DuckResult<Station> | undefined>(undefined)

  const stationForId = (id: string):Station|undefined => {
    return stations?.rows.find(s => s.id === id);
  }

  dbEffect(async (db:DB) => {
    const dbStations = await db.stations();
    setStations(dbStations);
    if (!station){
      setStation(dbStations?.rows.filter(s => s.sampled)[0]);
    }
  }, [])

  return (
    <div className="App">
      <div className="Header">
        <h1>{station?.name}</h1>
        <select onChange={e => setStation(stationForId(e.target.value))}>
          {stations && stations.rows.filter(s => s.sampled).map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      {/* <TimeSeries station={station} start={start} end={end} /> */}
      <div className="FlexGroup">
        {/* <Averages station={station} start={start} end={end} /> */}
        {/* <Map station={station} /> */}
        {/* <Quantized station={station} start={start} end={end} /> */}
        {/* <Table station={station} start={start} end={end} /> */}
      </div>
    </div>
  )
}

export default App
