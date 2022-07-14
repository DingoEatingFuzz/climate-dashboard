import { style } from '@vanilla-extract/css';

export const appWrapper = style({
  width: '100%',
  maxWidth: '1200px',
  margin: 'auto',
});

export const stationSelect = style({
  borderColor: '#CCC',
  padding: '5px',
  marginBottom: '1rem',
});

export const header = style({
  marginBottom: '0.3rem',
});

export const timeseries = style({
  width: '100%',
  height: 400,
  border: '1px solid gray',
});
