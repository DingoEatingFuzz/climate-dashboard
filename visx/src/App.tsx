import { useState } from 'react'
import logo from './logo.svg'
import './App.css'

function App() {
  const [station, setStation] = useState('')

  return (
    <div className="App">
      <div className="Header">
        <h1>{station}</h1>
        <select>
          <option>Placeholder</option>
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
