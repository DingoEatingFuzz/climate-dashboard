import { InternMap } from 'd3-array';

const pivot = (map: InternMap, key: string, on: string, rename: string):any => {
  return Array.from(map.keys()).reduce((arr:object[], idx:any) => {
    const record = map.get(idx);
    const pivots = record.reduce((obj:any, val:any) => {
      obj[val[key]] = val[on];
      return obj;
    }, {});
    arr.push({ ...pivots, [rename]: idx });
    return arr;
  }, []);
}

export default pivot;
