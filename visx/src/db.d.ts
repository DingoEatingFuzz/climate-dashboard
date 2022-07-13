declare interface IDuckRecord {};

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
  public weatherForStationForRange(station:Station|string, start:Date, end:Date): Promise<DuckResult>;
  public averagesForStation(station:Station|string): Promise<DuckResult>;
  public weatherDetailByMonth(station:Station|string): Promise<DuckResult>;
}

declare module 'db' {
  export = DB;
};
