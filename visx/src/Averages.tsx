import { default as React, useState, useContext, useRef, useMemo } from 'react'
import { Bar } from '@visx/shape';
import { ParentSize } from '@visx/responsive';
import { scaleBand, scaleLinear, scaleOrdinal } from '@visx/scale';
import { group, extent, bisector, InternMap } from 'd3-array';
import { schemeSpectral } from 'd3-scale-chromatic';
import { dbEffect } from './db-effect';
import pivot from './pivot';
import { dlGrid, dlGridDt, dlGridDd } from './styles.css'

interface PivotedAverage {
  month: string;
  TAVG: number;
  PRCP: number;
}

interface AveragesProps {
  station: Station|undefined;
  width?: number;
  className?: string;
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthSort = (a:any, b:any) => months.indexOf(a?.month) - months.indexOf(b?.month);

function Averages({ station, width: parentWidth }:AveragesProps) {
  const [averages, setAverages] = useState<DuckResult<MonthlyWeather>|undefined>(undefined);
  const width = parentWidth ?? 200;

  const pivotedAverages = useMemo(() => {
    if (!averages) return [];
    const groups = group(averages.rows, d => d.month);
    return pivot(groups, 'element', 'value', 'month').sort(monthSort);
  }, [averages]);

  // temp color
  // temp linear
  // rainfall linear

  const colorScale = scaleLinear({
    domain: [-400, 500],
    range: [...schemeSpectral],
  });

  const tempScale = scaleLinear({
    domain: [-400, 500],
    range: [0, width],
  });

  const rainScale = scaleLinear({
    domain: [0, 100],
    range: [0, width],
  });

  dbEffect(async (db:DB) => {
    if (station) {
      setAverages(await db.averagesForStation(station));
    }
  }, [station])

  console.table(pivotedAverages);

  return (
    <div>
      <dl className={dlGrid}>
        {pivotedAverages.map((record:PivotedAverage) => (
          <React.Fragment key={record.month}>
            <dt className={dlGridDt}>{record.month}</dt>
            <dd className={dlGridDd}>{record.TAVG} {record.PRCP}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  );
}

export default function ResponsiveAverages(props:AveragesProps) {
  return <div className={props.className}>
    <ParentSize>
      {parent => (
        <Averages width={parent.width} {...props} />
      )}
    </ParentSize>
  </div>
}
