import { useState, useContext, useMemo } from 'react'
import {
  AnimatedAxis,
  AnimatedGrid,
  AnimatedLineSeries,
  AnimatedAreaSeries,
  AreaSeries,
  DataContext,
  XYChart,
  Tooltip,
  lightTheme
} from '@visx/xychart';
import { Brush } from '@visx/brush';
import { ParentSize } from '@visx/responsive';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom } from '@visx/axis';
import { Group } from '@visx/group';
import { AreaClosed } from '@visx/shape';
import { group, extent, max, InternMap } from 'd3-array';
import { dbEffect } from './db-effect'
import { timeseries } from './styles.css'

interface TimeSeriesProps {
  station: Station|undefined;
  start?: Date|undefined;
  end?: Date|undefined;
}

interface XYBrushProps<T> {
  data: DuckResult<T>|undefined,
  width: number,
}

interface PivotedWeather {
  date: Date;
  TMIN?: Number;
  TMAX?: Number;
  TAVG?: Number;
  PRCP?: Number;
}

const pivot = (map: InternMap, key: string, on: string, rename: string):any => {
  return Array.from(map.keys()).reduce((arr:object[], idx:any) => {
    const record = map.get(idx);
    const pivots = record.reduce((obj:any, val:any) => {
      obj[val[key]] = val[on];
      return obj;
    }, {});
    arr.push({ ...pivots, [rename]: idx });
    return arr;
  }, []);
}

const nullify = (arr: any, key: string, value: any):any => {
  arr.forEach((record:any) => {
    if (record[key] === value) {
      record[key] = null;
    }
  });
  return arr;
}

const TimeSeriesBrush = ({ data, width }:XYBrushProps<Weather>) => {
  const brushColor = '#99AACC';
  const brushHeight = 100;
  const axisHeight = 25;
  const brushXScale = scaleTime({
    range: [0, width],
    domain: extent(data?.rows || [], (d:Weather) => d.date) as [Date, Date],
  })

  const brushYScale = scaleLinear({
    range: [brushHeight-axisHeight, 0],
    domain: extent(data?.rows || [], (d:Weather) => d.value) as [number, number],
  })

  return <svg height={brushHeight} width={width}>
    <AreaClosed
      data={data?.rows || []}
      x={d => brushXScale(d.date) as number}
      y={d => brushYScale(d.value) as number}
      yScale={brushYScale}
      fill={brushColor}
    />
    <AxisBottom scale={brushXScale} top={brushHeight - axisHeight} />
    <Brush
      xScale={brushXScale}
      yScale={brushYScale}
      width={width}
      height={brushHeight-axisHeight}
      handleSize={8}
      resizeTriggerAreas={['left', 'right']}
    />
  </svg>
}

export default function TimeSeries({ station, start, end }:TimeSeriesProps) {
  const [monthlyWeather, setMonthlyWeather] = useState<DuckResult<Weather> | undefined>(undefined);
  const [allWeather, setAllWeather] = useState<DuckResult<Weather> | undefined>(undefined);
  const pivotedWeather = useMemo<PivotedWeather[]>(() => {
    if (!allWeather) return [];
    const pivoted = pivot(
      group(nullify(allWeather?.rows || [], 'value', -9999) as Weather[], d => d.date), 'element', 'value', 'date'
    );
    return pivoted;
  }, [allWeather]);

  dbEffect(async (db:DB) => {
    if (station) {
      setMonthlyWeather(await db.monthlyAverageForStation(station));
      setAllWeather(await db.weatherForStationForRange(station));
    }
  }, [station])

  const scales = {
    xScale: { type: 'time' },
    yScale: { type: 'linear' },
  }

  return (
    <div className={timeseries}>
      <XYChart height={400} {...scales} margin={{bottom:100, top:0, right:0, left:0}}>
        <AnimatedAxis orientation='bottom' numTicks={10} />
        <AnimatedAxis orientation='left' />
        <AnimatedGrid columns={false} numTicks={4} />
        <AnimatedAreaSeries
          dataKey='High/Low Band'
          data={pivotedWeather}
          xAccessor={d => d.date}
          yAccessor={d => d.TMAX}
          y0Accessor={d => d.TMIN}
        />
        <AnimatedLineSeries
          dataKey='Avg Line'
          data={pivotedWeather}
          xAccessor={d => d.date}
          yAccessor={d => d.TAVG}
        />
      </XYChart>
      <ParentSize>
        {parent => (
          <TimeSeriesBrush width={parent.width} data={monthlyWeather} />
        )}
      </ParentSize>
    </div>
  );
}
