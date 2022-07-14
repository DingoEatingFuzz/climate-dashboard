import { useState, useMemo } from 'react'
import {
  AnimatedAxis,
  AnimatedGrid,
  AnimatedLineSeries,
  AnimatedAreaSeries,
  XYChart,
  Tooltip,
  lightTheme
} from '@visx/xychart';
import { group, InternMap } from 'd3-array';
import { dbEffect } from './db-effect'
import { timeseries } from './styles.css'

interface TimeSeriesProps {
  station: Station|undefined;
  start?: Date|undefined;
  end?: Date|undefined;
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

  return (
    <div className={timeseries}>
      <XYChart height={400} xScale={{type: 'time'}} yScale={{ type: 'linear' }}>
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
    </div>
  );
}
