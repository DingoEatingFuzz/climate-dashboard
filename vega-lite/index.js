import App from './app';
import * as vl from 'vega-lite-api';
import * as vega from 'vega';
import * as vegaLite from 'vega-lite';

vl.register(vega, vegaLite);

document.addEventListener('DOMContentLoaded', bootstrap);

function bootstrap() {
  let app = new App(document.querySelector('#app'));
}
