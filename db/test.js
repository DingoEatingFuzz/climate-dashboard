import DB from './index';

document.addEventListener('DOMContentLoaded', main);

async function main() {
  const db = new DB();
  const app = document.querySelector('#app');

  console.time('init');
  await db.init();
  console.timeEnd('init');

  app.append(
    heading("Tables"),
    table(await db.describe()),
  );
  app.append(
    heading("Table: weather"),
    table(await db.describe('weather')),
  );
  app.append(
    heading("Table: stations"),
    table(await db.describe('stations')),
  );
  app.append(
    heading("Sample: stations"),
    table(await db.query('select * from stations limit 10')),
  );
  app.append(
    heading("Sample: weather"),
    table(await db.query('select * from weather limit 10')),
  );

  const query = `
SELECT
  s.name, strftime(date_trunc('month', w.date), '%B %Y'), concat(round(avg(w.value)/10, 2), '° C')
FROM stations s
LEFT JOIN weather w ON s.id = w.id
WHERE
  w.element = 'TAVG' AND w.value != -9999 AND w.date > current_date - INTERVAL 1 YEAR
GROUP BY
  s.name, date_trunc('month', w.date)
ORDER BY
  s.name, date_trunc('month', w.date) DESC
LIMIT 500;
  `;

  app.append(
    heading("Sample: join"),
    snippet(query),
    table(await db.query(query)),
  );
}

function heading(str, level = 'h2') {
  const heading = document.createElement(level);
  heading.append(str);
  return heading;
}

function snippet(str) {
  const pre = document.createElement('pre');
  pre.append(str.trim());
  return pre;
}

function table(res) {
  const fragment = new DocumentFragment();
  const table = document.createElement('table');
  const head = document.createElement('tr');
  res.columns.forEach(col => {
    const cell = document.createElement('td');
    cell.append(col);
    head.append(cell);
  });

  const rows = res.rows.map(row => {
    const tr = document.createElement('tr');
    const cells = res.columns.map(col => {
      const cell = document.createElement('td');
      if (row[col] instanceof Date) console.log('wat', row[col]);
      cell.append(row[col]);
      return cell;
    });
    tr.append(...cells);
    return tr;
  });

  table.append(head, ...rows);
  fragment.append(table);
  return fragment;
}
