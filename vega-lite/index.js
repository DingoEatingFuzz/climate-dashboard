import App from './app';
import * as vl from 'vega-lite-api';
import * as vega from 'vega';
import * as vegaLite from 'vega-lite';
import * as tooltip from 'vega-tooltip';

vl.register(vega, vegaLite, {
  init: view => { view.tooltip(new tooltip.Handler().call) }
});

document.addEventListener('DOMContentLoaded', bootstrap);

function bootstrap() {
  let app = new App(document.querySelector('#app'));
}
