import { useState, useEffect,  useMemo } from 'react'
import Pie from '@visx/shape/lib/shapes/Pie';
import { Group } from '@visx/group';
import { ParentSize } from '@visx/responsive';
import { scaleOrdinal, scaleThreshold, scaleQuantile } from '@visx/scale';
import { LegendOrdinal } from '@visx/legend';
import { rollup } from 'd3-array';
import { schemeSpectral } from 'd3-scale-chromatic';
import { dbEffect } from './db-effect';
import { quantizedLegend, flex } from './styles.css';

interface QuantizedProps {
  station?: Station;
  start: Date;
  end: Date;
  width?: number;
  className?: string;
}

function Quantized({ station, start, end, width: parentWidth }:QuantizedProps) {
  const width = (parentWidth ?? 300) - 100;
  const [ _start, _end ] = useDebounce(50, start, end) as [Date, Date];

  const binScale = scaleThreshold<number,string>({
    domain: [0, 100, 200, 300, 400],
    range: ['<0', '0-10', '10-20', '20-30', '30-40', '>40'],
  });

  const colorScale = scaleOrdinal({
    domain: ['<0', '0-10', '10-20', '20-30', '30-40', '>40'],
    range: schemeSpectral[6].slice().reverse(),
  });

  const radialTextAnchorScale = scaleQuantile({
    domain: [0, Math.PI * 2],
    range: ['start', 'middle', 'end', 'middle'],
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

  const radius = Math.min(200, width / 2 - 50);

  return (
    <>
      <svg width={width} height={200}>
        <Group top={100} left={width / 2}>
          <Pie
            data={bins}
            pieValue={(d:any) => d.count}
            outerRadius={radius}
            innerRadius={radius - 30}
            padAngle={0.005}
          >
            {(pie) => pie.arcs.map((arc, idx) => {
              const label = arc.data.bin;
              const ang = (arc.endAngle + arc.startAngle) / 2 - Math.PI / 2;
              const magnitude = radius + 10;
              const [ lx, ly ] = [Math.cos(ang) * magnitude, Math.sin(ang) * magnitude];
              const hasSpaceForLabel = arc.endAngle - arc.startAngle >= 0.2;
              const arcPath = pie.path(arc) || '';
              return (
                <g key={`arc-${label}`}>
                  <path d={arcPath} fill={colorScale(label)} />
                  {hasSpaceForLabel && (
                    <text x={lx} y={ly} fill='black' textAnchor={radialTextAnchorScale(ang)} alignmentBaseline='middle'>{label}</text>
                  )}
                </g>
              );
            })}
          </Pie>
        </Group>
      </svg>
      <LegendOrdinal
        className={quantizedLegend}
        scale={colorScale}
        direction="column-reverse"
        itemDirection="row-reverse"
      />
    </>
  );
}

export default function ResponsiveQuantized(props:QuantizedProps) {
  return <div className={props.className}>
    <ParentSize className={flex}>
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
