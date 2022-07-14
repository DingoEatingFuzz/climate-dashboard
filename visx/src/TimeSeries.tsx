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

const TimeSeriesBrush = ({ data }:XYBrushProps<Weather>) => {
  const { xScale, yScale, margin, width, height: sourceHeight } = useContext(DataContext);
  const height = 100;
  const innerWidth = Math.max(0, (width || 0) - (margin?.left || 0) - (margin?.right || 0));

  const brushXScale = scaleTime({
    range: [0, innerWidth],
    domain: extent(data?.rows || [], (d:Weather) => d.date) as [Date, Date],
  })

  const brushYScale = scaleLinear({
    range: [height, 0],
    domain: extent(data?.rows || [], (d:Weather) => d.value) as [number, number],
  })

  return (
    <Group left={margin?.left} top={sourceHeight - (margin?.bottom || 0)}>
      <AreaClosed
        data={data?.rows || []}
        x={d => brushXScale(d.date) as number}
        y={d => brushYScale(d.value) as number}
        yScale={brushYScale}
      />
      <AxisBottom scale={brushXScale} />
      <Brush
        xScale={brushXScale}
        yScale={brushYScale}
        width={innerWidth}
        margin={margin}
        height={height}
        handleSize={8}
        resizeTriggerAreas={['left', 'right']}
      />
    </Group>
  )
}

const XYBrush = ({ data }:XYBrushProps<Weather>) => {
  const { xScale, yScale, margin: ctxMargin, width, height } = useContext(DataContext);
  const margin = { top: 0, right: 0, bottom: 0, left: 0, ...ctxMargin };
  const xBrushMax = Math.max((width || 0) - margin.left - margin.right, 0);
  const yBrushMax = Math.max((height || 0) - margin.top - margin.bottom, 0);
  console.log('wat?', margin, xScale?.range(), yScale?.range());

  const brushDateScale = scaleTime<number>({
    range: [margin.left, xBrushMax],
    domain: xScale?.domain(),
  })
  const brushValueScale = scaleLinear({
    range: [yBrushMax, margin.top],
    domain: yScale?.domain(),
  })
  return (
    <Brush
      xScale={brushDateScale}
      yScale={brushValueScale}
      width={xBrushMax}
      height={yBrushMax}
      brushRegion='xAxis'
      margin={margin}
      handleSize={8}
      resizeTriggerAreas={['left', 'right']}
    />
  );
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

  // const filterHeight = 150;


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
        <TimeSeriesBrush data={monthlyWeather} />
      </XYChart>
    </div>
  );
}
