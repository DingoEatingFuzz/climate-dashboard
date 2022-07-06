const NUMERIC = (a, b) => a - b;

export function bisectIndex(list, item, comparator = NUMERIC) {
  let low = 0;
  let high = list.length - 1;

  while (low < high) {
    const midIndex = Math.floor((high + low) / 2)
    const test = list[midIndex];

    if (comparator(list[midIndex], item) < 0) {
      low = midIndex + 1;
    } else {
      high = midIndex;
    }
  }
  return low;
  return list.slice(0, low);
}

export function bisectLeft(list, item, comparator) {
  return list.slice(0, bisectIndex(...arguments));
}

export function bisectRight(list, item, comparator) {
  return list.slice(bisectIndex(...arguments));
}
