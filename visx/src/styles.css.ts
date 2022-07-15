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

export const flexGroup = style({
  display: 'flex',
  flexWrap: 'wrap',
});

export const timeseries = style({
  width: '100%',
});

export const timeseriesTooltip = style({
  display: 'grid',
  gridGap: '10px',
  gridTemplateColumns: 'min-content',
});

export const timeseriesTooltipDt = style({
  gridColumn: 1,
});

export const timeseriesTooltipDd = style({
  gridColumn: 2,
  fontWeight: 'normal',
  margin: 0,
});

export const averages = style({
  padding: 15,
  width: '33%',
  height: 500,
});


export const dlGrid = style({
  display: 'grid',
  gridGap: '10px',
  gridTemplateColumns: 'min-content',
});

export const dlGridDt = style({
  gridColumn: 1,
});

export const dlGridDd = style({
  gridColumn: 2,
  margin: 0,
});
