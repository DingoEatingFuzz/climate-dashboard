declare interface IDuckRecord {};

declare enum Element {
  TAVG = 'TAVG',
  TMIN = 'TMIN',
  TMAX = 'TMAX',
  PRCP = 'PRCP',
}

declare class Station implements IDuckRecord {
  id: string;
  lat: Number;
  lon: Number;
  elevation: Number;
  state: string;
  name: string;
  gsn: boolean;
  hcn: boolean;
  crn: boolean;
  wmo: Number;
  sampled: boolean;
}

declare class Weather implements IDuckRecord {
  id: string;
  year: Number;
  month: Number
  day: Number;
  date: Date;
  element: Element;
  value: number;
}

declare class MonthlyWeather implements IDuckRecord {
  id: string;
  month: string;
  element: Element;
  value: number;
}

declare type DuckResult<Type> = {
  columns: string[],
  rows: Array<Type>,
}

declare class DB {
  constructor();

  public ready: boolean;
  public init(): Promise;

  // Connection is technically public, but it shouldn't be used directly, so it's left untyped

  public query(query: string, ...params:Array<any>): Promise<DuckResult>;
  public describe(table:string|undefined): Promise<DuckResult>;
  public stations(): Promise<DuckResult<Station>>;
  public monthlyAverageForStation(station:Station|string): Promise<DuckResult>;
  public weatherForStationForRange(station:Station|string, start?:Date, end?:Date): Promise<DuckResult>;
  public averagesForStation(station:Station|string): Promise<DuckResult>;
  public weatherDetailByMonth(station:Station|string): Promise<DuckResult>;
}

declare module 'db' {
  export = DB;
};
