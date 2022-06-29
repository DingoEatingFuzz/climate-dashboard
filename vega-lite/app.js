import DB from 'db';
import * as vl from 'vega-lite-api';

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
    this.station = this.stations.rows[0];
    this.populateFilters();

    this.renderMap();
    this.renderCharts();
  }

  populateFilters() {
    const $stations = this.stations.rows.map(station => {
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
        <div id='timeseries' />
        <div id='timeseries-brush' />
        <div class='flex-group'>
          <div id='averages' />
          <div id='quantized' />
          <div id='map' />
        </div>
        <div id='table'>
        </div>
      </div>
    `;
  }

  async renderMap() {
    const map = await vl.layer(
        vl.markGeoshape({ fill: '#f0f0f0' })
          .data(vl.sphere()),
        vl.markGeoshape({ stroke: '#ddd', strokeWidth: 1 })
          .data(vl.graticule()),
        vl.markGeoshape({fill: '#ccc', stroke: '#706545', strokeWidth: 0.5})
          .data(vl.topojson(this.worldGeometry).feature('countries')),
        vl.markCircle({ size: 8, opacity: 1 })
          .data(this.stations.rows)
          .encode(
            vl.longitude().fieldQ('lon'),
            vl.latitude().fieldQ('lat'),
            vl.color().fieldN('sampled'),
          )
      )
      .project(vl.projection('naturalEarth1'))
      .width(800)
      .height(500)
      .autosize({ type: 'fit-x', contains: 'padding' })
      .config({ view: { stroke : null } })
      .render();

    this.el.querySelector('#map').appendChild(map);
  }

  renderCharts() {
    this.el.querySelector('#station').innerText = `${this.station.name} (elev: ${this.station.elevation}m)`;
  }
}
