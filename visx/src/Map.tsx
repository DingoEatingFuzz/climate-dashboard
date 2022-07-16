import { useState, useEffect, useMemo } from 'react'
import { ParentSize } from '@visx/responsive';
import { CustomProjection, Graticule } from '@visx/geo';
import { geoNaturalEarth1 } from 'd3-geo';
import * as topojson from 'topojson-client';

interface MapProps {
  width?: number;
  className?: string;
  station: Station|undefined;
  stations: DuckResult<Station>;
  onStationSelect?: Function;
}

interface FeaturePolygon {
  type: 'Feature';
  id: string;
  geometry: { coordinates: [number, number][][]; type: 'Polygon' };
  properties: object;
}

interface FeatureStationPoint {
  type: 'Feature';
  id: string;
  geometry: { coordinates: [number, number]; type: 'Point' };
  properties: Station;
}

const geoUrl ='https://cdn.jsdelivr.net/npm/vega-datasets@2/data/world-110m.json';

function MapViz({ station, stations, onStationSelect, width: parentWidth }:MapProps) {
  const [geometry, setGeometry] = useState<FeaturePolygon[]|undefined>(undefined);
  const width = parentWidth ?? 400;

  const stationsGeoJson = useMemo<FeatureStationPoint[]>(() => {
    if (!stations) return [];
    return stations.rows.map(s => ({
      type: 'Feature',
      id: s.name,
      geometry: { coordinates: [s.lon, s.lat], type: 'Point' },
      properties: { ...s },
    }));
  }, [stations]);

  useEffect(() => {
    const load = async () => {
      const response = await fetch(geoUrl);
      const topoJson = await response.json();
      console.log('topo', topoJson);

      // @ts-ignore
      const geoJson = topojson.feature(topoJson, topoJson.objects.countries) as {
        type: 'FeatureCollection';
        features: FeaturePolygon[];
      };
      setGeometry(geoJson.features);
    }
    load().catch(console.error);
  }, []);

  return  <svg width={width} height={500}>
    { geometry &&
      <CustomProjection<FeaturePolygon>
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
                fill='#DDDDDD'
                stroke='#AAAAAA'
                strokeWidth={0.5}
              />
            ))}
          </g>
        )}
      </CustomProjection>
    }
    {stationsGeoJson &&
      <CustomProjection<FeatureStationPoint>
        projection={geoNaturalEarth1}
        data={stationsGeoJson}
        scale={(width / 630) * 110}
        translate={[width / 2, 250]}
      >
        {proj => (
          <g>
            {proj.features.map(({ feature, centroid }, idx) => (
              <circle
                key={`country-${idx}`}
                r={feature.properties.sampled ? 4 : 1.5}
                cx={centroid[0]}
                cy={centroid[1]}
                fill={feature.properties.sampled ? feature.properties.id === station?.id ? '#3F0' : '#F00' : '#779'}
                strokeWidth={0.5}
                onClick={() => feature.properties.sampled && onStationSelect?.(feature.properties)}
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
