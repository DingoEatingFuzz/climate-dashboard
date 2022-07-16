import { default as React, useState, useContext, useRef, useMemo } from 'react'
import { Bar, Line } from '@visx/shape';
import { ParentSize } from '@visx/responsive';
import { scaleLinear, scaleQuantize } from '@visx/scale';
import { group, extent, bisector, InternMap } from 'd3-array';
import { schemeSpectral } from 'd3-scale-chromatic';
import { dbEffect } from './db-effect';
import pivot from './pivot';
import { dlGrid, dlGridDt, dlGridDd, inlineChart, avgBar, avgMidpoint, avgTextAnchorEnd, avgTextAnchorStart, avgTextRain } from './styles.css'

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

const formatTemperature = (temp:number|undefined) => temp == null
  ? '--'
  : (temp / 10).toLocaleString('default', { maximumFractionDigits: 2 }) + '° C';
const formatRainfall = (rain:number|undefined) => rain == null
  ? '--'
  : (rain / 10).toLocaleString('default', { maximumFractionDigits: 1 }) + 'mm';

function Averages({ station, width: parentWidth }:AveragesProps) {
  const [averages, setAverages] = useState<DuckResult<MonthlyWeather>|undefined>(undefined);
  const width = parentWidth ? parentWidth - 100 :  200;

  const pivotedAverages = useMemo(() => {
    if (!averages) return [];
    const groups = group(averages.rows, d => d.month);
    return pivot(groups, 'element', 'value', 'month').sort(monthSort);
  }, [averages]);

  const colorScale = scaleQuantize({
    domain: [-350, 500],
    range: schemeSpectral[9].slice().reverse(),
  });

  const tempDomain = extent(pivotedAverages, (d:PivotedAverage) => d.TAVG) as [number, number];

  const tempScale = scaleLinear({
    domain: [Math.min(tempDomain[0], 0), Math.max(tempDomain[1], 0)],
    range: [60, width - 60],
  });

  const rainScale = scaleLinear({
    domain: [0, 1000],
    range: [0, width],
  });

  dbEffect(async (db:DB) => {
    if (station) {
      setAverages(await db.averagesForStation(station));
    }
  }, [station])

  return (
    <div>
      <dl className={dlGrid}>
        {pivotedAverages.map((record:PivotedAverage) => (
          <React.Fragment key={record.month}>
            <dt className={dlGridDt}>{record.month}</dt>
            <dd className={dlGridDd}>
              <svg className={inlineChart} height={30}>
                <Line className={avgMidpoint} from={{ x: tempScale(0), y: 0 }} to={{ x: tempScale(0), y: 16 }} />
                <Bar
                  x={Math.min(tempScale(0), tempScale(record.TAVG))}
                  y={3}
                  height={10}
                  width={Math.abs(tempScale(record.TAVG) - tempScale(0))}
                  fill={colorScale(record.TAVG)}
                  className={avgBar}
                />
                <text
                  className={record.TAVG < 0 ? avgTextAnchorEnd : avgTextAnchorStart}
                  y={8}
                  x={record.TAVG < 0 ? tempScale(record.TAVG) - 5 : tempScale(record.TAVG) + 5}
                >{formatTemperature(record.TAVG)}</text>
                <Bar
                  x={rainScale(0)}
                  y={20}
                  height={5}
                  fill='#3366CC'
                  width={rainScale(record.PRCP)}
                />
                <text
                  className={avgTextRain}
                  y={23}
                  x={rainScale(record.PRCP) + 5}
                >{formatRainfall(record.PRCP)}</text>
              </svg>
            </dd>
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
