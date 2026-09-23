// Node 20+. Fetches the Caratlytics Diamond Price Index CSV mirror on Hugging Face
// and rewrites data/prices.json with the latest month's row. Never fails the run:
// on any problem it logs a warning, leaves the existing file untouched, and exits 0.

const fs = require('fs');
const path = require('path');

const CSV_URL =
  'https://huggingface.co/datasets/carathunter/caratlytics-diamond-price-index/resolve/main/diamond_price_index_lab_vs_natural.csv';
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'prices.json');

function warnAndExit(message) {
  console.warn(`update-prices: ${message} — leaving data/prices.json untouched.`);
  process.exit(0);
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return null;

  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim());
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cells[i];
    });
    return row;
  });

  return { headers, rows };
}

function findColumn(headers, { must, mustNot }) {
  return headers.find((h) => {
    const lower = h.toLowerCase();
    return must.some((m) => lower.includes(m)) && !mustNot.some((m) => lower.includes(m));
  });
}

async function main() {
  let text;
  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) {
      warnAndExit(`request failed with status ${res.status}`);
      return;
    }
    text = await res.text();
  } catch (err) {
    warnAndExit(`network error (${err.message})`);
    return;
  }

  if (!text || !text.trim()) {
    warnAndExit('empty response body');
    return;
  }

  const parsed = parseCsv(text);
  if (!parsed) {
    warnAndExit('could not parse CSV (not enough rows)');
    return;
  }

  const { headers, rows } = parsed;

  const monthCol = findColumn(headers, { must: ['month'], mustNot: [] });
  const naturalCol = findColumn(headers, {
    must: ['natural'],
    mustNot: ['ratio', 'pct', 'premium', 'over'],
  });
  const labCol = findColumn(headers, {
    must: ['lab'],
    mustNot: ['ratio', 'pct', 'premium', 'over'],
  });
  const ratioCol = findColumn(headers, { must: ['ratio'], mustNot: [] });

  if (!monthCol || !naturalCol || !labCol || !ratioCol) {
    warnAndExit(
      `missing expected columns (found: ${headers.join(', ') || 'none'})`
    );
    return;
  }

  let latest = null;
  for (const row of rows) {
    const month = row[monthCol];
    if (!month || !/^\d{4}-\d{2}$/.test(month)) continue;
    if (!latest || month > latest[monthCol]) latest = row;
  }

  if (!latest) {
    warnAndExit('no valid rows with a parseable month found');
    return;
  }

  const natural = Number(latest[naturalCol]);
  const lab = Number(latest[labCol]);
  const ratio = Number(latest[ratioCol]);

  if (!Number.isFinite(natural) || !Number.isFinite(lab) || !Number.isFinite(ratio)) {
    warnAndExit('latest row has non-numeric price/ratio values');
    return;
  }

  const output = {
    month: latest[monthCol],
    natural_per_carat: natural,
    lab_per_carat: lab,
    ratio: Math.round(ratio * 10) / 10,
    updated: new Date().toISOString().slice(0, 10),
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output)}\n`);
  console.log(`update-prices: wrote data/prices.json for month ${output.month}.`);
}

main().catch((err) => {
  warnAndExit(`unexpected error (${err.message})`);
});
