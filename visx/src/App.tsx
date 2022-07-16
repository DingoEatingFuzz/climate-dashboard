import { useState } from 'react'
import './App.css'
import { dbEffect } from './db-effect'
import { appWrapper, header, stationSelect, flexGroup, averages, mapStyle, quantized } from './styles.css'
import TimeSeries from './TimeSeries'
import Averages from './Averages'
import MapViz from './Map'
import Quantized from './Quantized'

const days = (n:number) => n * 24 * 60 * 60 * 1000;
const dateFormat = (d:Date|undefined) => d ? d.toLocaleDateString('default') : '--';

function App() {
  const [station, setStation] = useState<Station | undefined>(undefined)
  const [stations, setStations] = useState<DuckResult<Station> | undefined>(undefined)
  const [start, setStart] = useState<Date | undefined>(new Date(Date.now() - days(365)))
  const [end, setEnd] = useState<Date | undefined>(new Date())

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
            <option key={s.id} value={s.id} selected={s.id === station?.id}>{s.name}</option>
          ))}
        </select>
        {start && end &&
          (<span>{dateFormat(start)}&mdash;{dateFormat(end)}</span>)
        }
      </div>
      <TimeSeries station={station} start={start} end={end} onDateRangeSelect={(start:Date, end:Date) => {
        setStart(start);
        setEnd(end);
      }}/>
      <div className={flexGroup}>
        <Averages station={station} className={averages} />
        {stations && <MapViz stations={stations} station={station} className={mapStyle} onStationSelect={setStation} />}
        {start && end && <Quantized station={station} start={start} end={end} className={quantized} />}
        {/* <Table station={station} start={start} end={end} /> */}
      </div>
    </div>
  )
}

export default App
