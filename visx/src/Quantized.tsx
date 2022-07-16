import { useState, useContext, useRef, useEffect,  useMemo } from 'react'
import Pie from '@visx/shape/lib/shapes/Pie';
import { Group } from '@visx/group';
import { ParentSize } from '@visx/responsive';
import { scaleOrdinal, scaleThreshold } from '@visx/scale';
import { rollup, group } from 'd3-array';
import { schemeSpectral } from 'd3-scale-chromatic';
import { dbEffect } from './db-effect';
import pivot from './pivot';

interface QuantizedProps {
  station?: Station;
  start: Date;
  end: Date;
  width?: number;
  className?: string;
}

function Quantized({ station, start, end, width: parentWidth }:QuantizedProps) {
  const width = parentWidth ?? 300;
  const [ _start, _end ] = useDebounce(500, start, end) as [Date, Date];

  const binScale = scaleThreshold<number,string>({
    domain: [0, 100, 200, 300, 400],
    range: ['<0', '0-10', '10-20', '20-30', '30-40', '>40'],
  });

  const colorScale = scaleOrdinal({
    domain: ['<0', '0-10', '10-20', '20-30', '30-40', '>40'],
    range: schemeSpectral[6].slice().reverse(),
  });

  const [data, setData] = useState<DuckResult<Weather>|undefined>(undefined);
  dbEffect(async (db:DB) => {
    if (station) {
      setData(await db.weatherForStationForRange(station, _start, _end));
    }
  }, [station, _start, _end]);

  const bins = useMemo(() => {
    const rolled = rollup(data?.rows.filter(r => r.element === 'TAVG') || [], v => v.length, d => binScale(d.value))
    return Array.from(rolled).map(([bin, count]) => ({ bin, count }));
  }, [data]);

  console.log(bins);
  const radius = Math.min(200, width / 2 - 50);

  return (
    <svg width={width} height={400}>
      <Group top={200} left={width / 2}>
        <Pie
          data={bins}
          pieValue={(d:any) => d.count}
          outerRadius={radius}
          innerRadius={radius - 30}
          padAngle={0.005}
        >
          {(pie) => pie.arcs.map((arc, idx) => {
            console.log(arc, pie.path);
            const label = arc.data.bin;
            const ang = (arc.endAngle + arc.startAngle) / 2 - Math.PI / 2;
            console.log('blah?', ang);
            const [ lx, ly ] = [Math.cos(ang) * (radius + 30), Math.sin(ang) * (radius + 30)];
            const [centroidX, centroidY] = pie.path.centroid(arc);
            const hasSpaceForLabel = arc.endAngle - arc.startAngle >= 0.1;
            const arcPath = pie.path(arc) || '';
            return (
              <g key={`arc-${label}`}>
                <path d={arcPath} fill={colorScale(label)} />
                {hasSpaceForLabel && (
                  <text x={lx} y={ly} fill='black' textAnchor='middle' alignmentBaseline='middle'>{label}</text>
                )}
              </g>
            );
          })}
        </Pie>
      </Group>
    </svg>
  );
}

export default function ResponsiveQuantized(props:QuantizedProps) {
  return <div className={props.className}>
    <ParentSize>
      {parent => (
        <Quantized width={parent.width} {...props} />
      )}
    </ParentSize>
  </div>
}

function useDebounce(delay: number , ...values: any[]): any[]  {
  const [debounced, setDebounced] = useState<any[]>([]);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced([...values]), delay);
    return () => clearTimeout(handler);
  }, [...values, delay]);

  return debounced;
}
