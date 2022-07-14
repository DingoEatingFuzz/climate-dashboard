import { useState, useContext, useRef, useMemo } from 'react'
import {
  Axis,
  Grid,
  LineSeries,
  AreaSeries,
  DataContext,
  XYChart,
  Tooltip,
  lightTheme
} from '@visx/xychart';
import { Brush } from '@visx/brush';
import { Bounds } from '@visx/brush/lib/types';
import { ParentSize } from '@visx/responsive';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom } from '@visx/axis';
import { Group } from '@visx/group';
import { AreaClosed } from '@visx/shape';
import { group, extent, max, bisector, InternMap } from 'd3-array';
import { dbEffect } from './db-effect'
import { timeseries } from './styles.css'

interface TimeSeriesProps {
  station: Station|undefined;
  start?: Date|undefined;
  end?: Date|undefined;
  onDateRangeSelect?: Function;
}

interface XYBrushProps<T> {
  data: DuckResult<T>|undefined,
  width: number,
  onDateRangeSelect?: Function;
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

const TimeSeriesBrush = ({ data, width, onDateRangeSelect }:XYBrushProps<Weather>) => {
  const brushRef = useRef(null);

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
      innerRef={brushRef}
      onChange={(domain: Bounds | null) => {
        if (!domain) return;
        if (onDateRangeSelect) {
          onDateRangeSelect(new Date(domain.x0), new Date(domain.x1));
        }
      }}
      onClick={() => {
        if (onDateRangeSelect) {
          onDateRangeSelect();
        }
      }}
      useWindowMoveEvents
    />
  </svg>
}

export default function TimeSeries({ station, start, end, onDateRangeSelect }:TimeSeriesProps) {
  const [monthlyWeather, setMonthlyWeather] = useState<DuckResult<Weather> | undefined>(undefined);
  const [allWeather, setAllWeather] = useState<DuckResult<Weather> | undefined>(undefined);

  const pivotedWeather = useMemo<PivotedWeather[]>(() => {
    if (!allWeather) return [];
    const pivoted = pivot(
      group(nullify(allWeather?.rows || [], 'value', -9999) as Weather[], d => d.date), 'element', 'value', 'date'
    );
    return pivoted;
  }, [allWeather]);

  const filteredWeather = useMemo<PivotedWeather[]>(() => {
    const bisect = bisector((d:PivotedWeather) => d.date);
    const startIdx = start ? bisect.left(pivotedWeather, start) : 0;
    const endIdx = end ? bisect.right(pivotedWeather, end) : undefined;
    return pivotedWeather.slice(startIdx, endIdx);
  }, [pivotedWeather, start, end]);

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
      <XYChart height={400} {...scales}>
        <Axis orientation='bottom' numTicks={10} />
        <Axis orientation='left' />
        <Grid columns={false} numTicks={4} />
        <AreaSeries
          dataKey='High/Low Band'
          data={filteredWeather}
          xAccessor={d => d.date}
          yAccessor={d => d.TMAX}
          y0Accessor={d => d.TMIN}
        />
        <LineSeries
          dataKey='Avg Line'
          data={filteredWeather}
          xAccessor={d => d.date}
          yAccessor={d => d.TAVG}
        />
      </XYChart>
      <ParentSize>
        {parent => (
          <TimeSeriesBrush
            width={parent.width}
            data={monthlyWeather}
            onDateRangeSelect={onDateRangeSelect}
          />
        )}
      </ParentSize>
    </div>
  );
}
