# Climate Dashboard Project

This is a collection of reference implementations of the climate dashboard spec. Use this to compare various data visualization libraries and frameworks.

## Spec

The climate dashboard aims to exercise various expected features of data visualizations, but it makes no assumptions and enforces no details about the implementation.

The nine categories of features the climate dashboard exercises are:

1. Cartesian charts with multiple types of marks
2. Data transformations, including:
  a. Nested documents to columnar tables
  b. Columnar data to structured trees
  c. Binned aggregation
  d. Sampling
3. Brushing as a form of filtering
4. Tooltips
5. Data updates
6. Animated transitions based on data updates
7. Data loading
8. Accessibility, cinluding:
  a. Color scales
  b. Patterns/redundant encodings
  c. Keyboard interactivity
  d. Textual descriptions
9. Geospatial charts

### Charts

An arrangement of charts has been selected based on the above categories and the NOAA climate data. All charts MUST be implemented. Each charts are specified below.

#### High/Low Timeseries

The high/low timeseries chart plots the high, low, and average temperatures for a station.

- Each data point MUST be an individual day
- Each high/low MUST be plotted using a range area mark
- Each average MUST be plotted using a line mark
- The y-axis MUST present values in Celsius (the underlying data is represented as 10ths of degrees in Celsius)
- The x-axis MUST present as locally-formatted date strings
- There MUST be a tooltip that presents the high, low, and average values as well as the station name and the date.
- There MUST be a brushable filter for the chart that displays the full 12 year range of data with a maximum selection range of 730 days.
- The brushable filter MUST display an area chart of the average temperatures.

#### Monthly Averages

The monthly averages chart plots the average temperature and rainfall by month for a station.

- Each data point MUST be plotted in a multi-series column chart
- Temperature MUST be colored on a cool-to-warm scale
- Rainfall MUST be colored blue
- The accessibility object model MUST be structured to read name, temp, rain, name, temp, rain (instead of name, name, temp, temp, rain, rain).
- Each month MAY plot a year-over-year distribution in any way desirable

### Quantized Donut Chart

The quantized donut chart represents the number of days in the brushed date range in each of six segments: <0°C, 0-10, 10-20, 20-30, 30-40, >40°C.

- The donut MUST have a legend.
- The legend MUST include all six segments and the count of segment (even when the count is 0).
- Each donut slice MUST be colored on a cool-to-warm scale.
- Each donut slice MUST have a distinct pattern.
- The center of the donut MUST display the min, max, and mean temperatures in the selected range.
- The donut MUST have animated transitions when data changes.

### Stations Map

The stations map plots all stations on a geospatial map with the active station highlighted.

- The map MUST use the Natural Earth projection.
- The map MUST include geometries for Earth's land mass.
- The map MUST include graticules.
- The map MUST use symbol marks for each station based on the stations elevation.
- Each station MUST be clickable, setting the station for the page and refreshing the time series and monthly averages chart.

### Data Table

The data table lists each month of data for a station based on the brushed selection of the high/low timeseries chart.

- The table MUST include columns for Month, Year, Total Rainfall, Avg. Temperature, Rainfall distribution, and Temperature distribution.
- The rainfall distribution MUST be a bar chart sparkline.
- The temperature distribution MUST be a line chart sparkline.
