import DB from 'db';
import * as vl from 'vega-lite-api';

const days = n => n * 24 * 60 * 60 * 1000;

export default class App {
  constructor(el) {
    this.el = el;
    this.db = new DB();
    this.start();
  }

  async start() {
    this.loading();
    await this.db.init();

    const geoUrl ='https://cdn.jsdelivr.net/npm/vega-datasets@2/data/world-110m.json';
    const geoRes = await fetch(geoUrl);
    this.worldGeometry = await geoRes.json();

    this.ready();

    this.stations = await this.db.stations();
    this.station = this.stations.rows.filter(s => s.sampled)[0];
    this.populateFilters();

    this.renderMap();
    this.renderCharts();
  }

  populateFilters() {
    const $stations = this.stations.rows.filter(s => s.sampled).map(station => {
      const $station = document.createElement('option');
      $station.append(station.name);
      $station.value = station.id;
      if (station === this.station) $station.selected = true;
      return $station;
    });
    const select = this.el.querySelector('#station-select');
    select.append(...$stations);
    select.addEventListener('change', (ev) => {
      this.setStation(ev.target.value);
    });
  }

  setStation(id) {
    this.station = this.stations.rows.find(s => s.id === id);
    this.renderMap();
    this.renderCharts();
  }

  loading() {
    this.el.innerHTML = '<h1>Loading...</h1>';
  }

  ready() {
    this.el.innerHTML = `
      <div class='header'>
        <h1 id='station'></h1>
        <select id='station-select'></select>
        <div id='timeseries'></div>
        <div class='flex-group'>
          <div id='averages'></div>
          <div id='map'></div>
          <div id='quantized'></div>
          <div id='table'></div>
        </div>
      </div>
    `;
  }

  async renderMap() {
    // TODO: Somehow bind a click event that can be handled outside the context of the Vega chart
    const map = await vl.layer(
        vl.markGeoshape({ fill: '#f0f0f0' })
          .data(vl.sphere()),
        vl.markGeoshape({ stroke: '#ddd', strokeWidth: 1 })
          .data(vl.graticule()),
        vl.markGeoshape({fill: '#ccc', stroke: '#706545', strokeWidth: 0.5})
          .data(vl.topojson(this.worldGeometry).feature('countries')),
        vl.markCircle({ size: 5, opacity: 1, fill: '#666' })
          .data(this.stations.rows)
          .transform(vl.filter({ field: 'sampled', equal: false }))
          .encode(
            vl.longitude().fieldQ('lon'),
            vl.latitude().fieldQ('lat'),
          ),
        vl.markCircle({ size: 32, opacity: 1, color: '#3333FF', tooltip: { content: 'data' } })
          .data(this.stations.rows)
          .transform(vl.filter({ field: 'sampled', equal: true }))
          .encode(
            vl.longitude().fieldQ('lon'),
            vl.latitude().fieldQ('lat'),
          ),
        vl.markPoint({ shape: 'triangle', color: '#FF00FF' })
          .data([this.station])
          .encode(
            vl.longitude().fieldQ('lon'),
            vl.latitude().fieldQ('lat'),
          )
      )
      .project(vl.projection('naturalEarth1'))
      .width(770)
      .height(470)
      .autosize({ type: 'fit-x', contains: 'padding' })
      .config({ view: { stroke : null } })
      .render();

    const $map = this.el.querySelector('#map');
    clearChildren($map);
    $map.appendChild(map);
  }

  async renderCharts() {
    this.el.querySelector('#station').innerText = `${this.station.name} (elev: ${this.station.elevation}m)`;

    this.timeseriesChart(this.el.querySelector('#timeseries'));
    this.monthlyAveragesChart(this.el.querySelector('#averages'));
  }

  async timeseriesChart(el) {
    const monthlyWeather = await this.db.monthlyAverageForStation(this.station);
    const allWeather = await this.db.weatherForStationForRange(this.station);

    const now = Date.now();
    const brush = vl.selectInterval().encodings('x').value({ x: [now - days(365), now]});

    const timeseries = vl.layer(
      vl.markArea({ fill: '#99A6CC', opacity: 0.5, tooltip: true })
        .encode(
          vl.x().fieldT('date'),
          vl.y().fieldQ('TMAX'),
          vl.y2().fieldQ('TMIN'),
        ),
      vl.markLine()
        .encode(
          vl.x().fieldT('date'),
          vl.y().fieldQ('TAVG'),
          vl.tooltip(['date', 'TMIN', 'TAVG', 'TMAX'])
        )
    )
    .data(allWeather.rows)
    .transform(
      vl.filter({ and: [{ field: 'element', oneOf: ['TMIN', 'TAVG',  'TMAX'] }, { field: 'value', gt: -9999 }] }),
      vl.filter(brush),
      vl.pivot('element').groupby(['date']).value('value'),
    )
    .width(1150)
    .height(400)

    const monthly = vl.markArea()
      .data(monthlyWeather.rows)
      .encode(
        vl.x().fieldT('date'),
        vl.y().fieldQ('value'),
      )
      .width(1150)
      .height(100)
      .params(brush)

    const composed = vl.vconcat(timeseries, monthly)

    clearChildren(el);
    el.append(await composed.render());
  }

  async monthlyAveragesChart(el) {
    const averages = await this.db.averagesForStation(this.station);

    // TODO: Use yOffset to unstack the two bars once the API bindings for VL 5.2 is released
    const columnChart = vl.markBar({ tooltip: { content: 'data' } })
      .data(averages.rows)
      .encode(
        vl.y().field('month'),
        vl.x().fieldQ('value'),
        vl.color().field('element'),
      )
      .width(370)
      .height(470)
      .autosize({ type: 'fit', contains: 'padding' });

    clearChildren(el);
    el.append(await columnChart.render());
  }
}

function clearChildren(el) {
  while (el.childNodes.length) {
    el.removeChild(el.childNodes[0]);
  }
}
