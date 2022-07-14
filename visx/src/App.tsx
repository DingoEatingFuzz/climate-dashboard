import { useState } from 'react'
import './App.css'
import { dbEffect } from './db-effect'
import { appWrapper, header, stationSelect } from './styles.css'
import TimeSeries from './TimeSeries'

function App() {
  const [station, setStation] = useState<Station | undefined>(undefined)
  const [stations, setStations] = useState<DuckResult<Station> | undefined>(undefined)
  const [start, setStart] = useState<Date | undefined>(undefined)
  const [end, setEnd] = useState<Date | undefined>(undefined)

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
    <div className={appWrapper}>
      <div className="Header">
        <h1 className={header}>{station?.name}</h1>
        <select className={stationSelect} onChange={e => setStation(stationForId(e.target.value))}>
          {stations && stations.rows.filter(s => s.sampled).map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <TimeSeries station={station} start={start} end={end} onDateRangeSelect={(start, end) => {
        setStart(start);
        setEnd(end);
      }}/>
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
