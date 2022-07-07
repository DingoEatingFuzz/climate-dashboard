import { useState, useEffect } from 'react'
import './App.css'
import DB from 'db';

const db = new DB();

function App() {
  const [station, setStation] = useState<Station | undefined>(undefined)
  const [stations, setStations] = useState<DuckResult<Station> | undefined>(undefined)

  const stationForId = (id: string):Station|undefined => {
    return stations?.rows.find(s => s.id === id);
  }

  useEffect(() => {
    const dbCall = async () => {
      if (!db.ready) await db.init();
      setStations(await db.stations());
      if (!station) {
        setStation(stations?.rows.filter(s => s.sampled)[0]);
      }
    };

    dbCall().catch(console.error);
  }, []);

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
