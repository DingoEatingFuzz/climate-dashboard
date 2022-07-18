import { useState, useEffect,  useMemo } from 'react'
import { Bar, LinePath } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale';
import { max, min, bisector } from 'd3-array';
import { dbEffect } from './db-effect';
import { tableTd, tableHead, tableTh, tableChart } from './styles.css';

interface TableProps {
  station?: Station;
  start: Date;
  end: Date;
  className?: string;
}

interface SparkProps {
  width: number;
  height: number;
  data: number[];
}

function BarSpark({ data, width, height }:SparkProps) {
  const barWidth = width / data.length - 1;
  const xScale = scaleLinear({
    domain: [0, data.length - 1],
    range: [0, width],
  });
  const yScale = scaleLinear({
    domain: [0, Math.max(30, max(data) || 0)],
    range: [height - 2, 0],
  });

  return (
    <svg width={width} height={height} className={tableChart}>
      <Group>
        {data.map((d, idx) => {
          return (
            <Bar
              key={`bar-${idx}`}
              x={xScale(idx)}
              y={yScale(d)}
              width={barWidth}
              height={height - yScale(d)}
              fill='#3366CC'
            />
          );
        })}
      </Group>
    </svg>
  )
}

function LineSpark({ data, width, height }:SparkProps) {
  const xScale = scaleLinear({
    domain: [0, data.length - 1],
    range: [0, width],
  });
  const yScale = scaleLinear({
    domain: [Math.min(-200, min(data) || 0), Math.max(300, max(data) || 0)],
    range: [height, 0],
  });

  return (
    <svg width={width} height={height} className={tableChart}>
      <LinePath
        data={data}
        x={(d:number, idx:number) => xScale(idx)}
        y={(d:number) => yScale(d)}
        stroke='black'
        strokeWidth={2}
      />
    </svg>
  );
}

export default function Table({ station, start, end, className }:TableProps) {
  const [data, setData] = useState<DuckResult<MonthlyWeatherDetail>|undefined>(undefined);
  dbEffect(async (db:DB) => {
    if (station) {
      setData(await db.weatherDetailByMonth(station));
    }
  }, [station]);

  const filteredData = useMemo<MonthlyWeatherDetail[]>(() => {
    if (!data) return [];
    const records = data.rows;
    const bisect = bisector((d:MonthlyWeatherDetail) => d.date);
    const startIdx = start ? bisect.left(records, start) : 0;
    const endIdx = end ? bisect.right(records, end) : undefined;
    return records.slice(startIdx, endIdx);
  }, [data, start, end]);

  return <table className={className}>
    <thead className={tableHead}>
      <tr>
        <th className={tableTh}>Month</th>
        <th className={tableTh}>Year</th>
        <th className={tableTh}>Total Rainfall</th>
        <th className={tableTh}>Avg. Temperature</th>
        <th className={tableTh}>Rainfall</th>
        <th className={tableTh}>Temperature</th>
      </tr>
    </thead>
    <tbody>
      {filteredData.length ? filteredData.map(row => (
        <tr>
          <td className={tableTd}>{row.date.toLocaleString('default', { month: 'long' })}</td>
          <td className={tableTd}>{row.date.toLocaleString('default', { year: 'numeric' })}</td>
          <td className={tableTd}>{row.rainfall ? (BigInt.asIntN(32, row.rainfall) / 10n).toLocaleString('default', { maximumFractionDigits: 2 }) + 'mm' : '--'}</td>
          <td className={tableTd}>{(row.average / 10).toLocaleString('default', { maximumFractionDigits: 2 })}° C</td>
          <td className={tableTd}><BarSpark data={Array.from(row.rainValues || [])} width={150} height={30} /></td>
          <td className={tableTd}><LineSpark data={Array.from(row.values ||[])} width={150} height={30} /></td>
        </tr>
      )) : (
        <tr>
          <td colSpan={6}>Loading...</td>
        </tr>
      )}
    </tbody>
  </table>
}
