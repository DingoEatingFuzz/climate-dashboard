import { default as React, useState, useEffect, useMemo } from 'react'
import { Bar, Line } from '@visx/shape';
import { ParentSize } from '@visx/responsive';
import { CustomProjection, Graticule } from '@visx/geo';
import { scaleLinear, scaleQuantize } from '@visx/scale';
import { geoNaturalEarth1 } from 'd3-geo';
import * as topojson from 'topojson-client';
import { dbEffect } from './db-effect';
import pivot from './pivot';
import { mapStyle } from './styles.css';

interface MapProps {
  width?: number;
  className?: string;
  stations: DuckResult<Station>;
}

interface FeatureShape {
  type: 'Feature';
  id: string;
  geometry: { coordinates: [number, number][][]; type: 'Polygon' };
  properties: { name: string };
}

const geoUrl ='https://cdn.jsdelivr.net/npm/vega-datasets@2/data/world-110m.json';

function MapViz({ stations, width: parentWidth }:MapProps) {
  const [geometry, setGeometry] = useState<FeatureShape[]|undefined>(undefined);
  const width = parentWidth ?? 400;

  useEffect(() => {
    const load = async () => {
      const response = await fetch(geoUrl);
      const topoJson = await response.json();
      console.log('topo', topoJson);

      // @ts-ignore
      const geoJson = topojson.feature(topoJson, topoJson.objects.countries) as {
        type: 'FeatureCollection';
        features: FeatureShape[];
      };
      setGeometry(geoJson.features);
    }
    load().catch(console.error);
  }, []);

  console.log(width, geometry);

  return  <svg width={width} height={500}>
    { geometry &&
      <CustomProjection<FeatureShape>
        projection={geoNaturalEarth1}
        data={geometry}
        scale={(width / 630) * 110}
        translate={[width / 2, 250]}
      >
        {proj => (
          <g>
            <Graticule graticule={g => proj.path(g) || ''} stroke='#EEEEEE' />
            {proj.features.map(({ feature, path }, idx) => (
              <path
                key={`country-${idx}`}
                d={path || ''}
                fill='#CCCCCC'
                stroke='#AAAAAA'
                strokeWidth={0.5}
              />
            ))}
          </g>
        )}
      </CustomProjection>
    }
  </svg>
}

export default function ResponsiveMap(props:MapProps) {
  return <div className={props.className}>
    <ParentSize>
      {parent => (
        <MapViz width={parent.width} {...props} />
      )}
    </ParentSize>
  </div>
}
