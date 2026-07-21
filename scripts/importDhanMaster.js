import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import dotenv from "dotenv";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";

/* =========================================================
   LOAD IMPORT ENVIRONMENT
========================================================= */

dotenv.config({
  path: path.resolve(process.cwd(), ".env.import"),
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;
const DHAN_CSV_PATH = process.env.DHAN_CSV_PATH;

const BATCH_SIZE = 500;

/* =========================================================
   VALIDATE ENVIRONMENT
========================================================= */

if (!SUPABASE_URL) {
  throw new Error(
    "SUPABASE_URL is missing from .env.import"
  );
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing from .env.import"
  );
}

if (!DHAN_CSV_PATH) {
  throw new Error(
    "DHAN_CSV_PATH is missing from .env.import"
  );
}

const resolvedCsvPath = path.isAbsolute(DHAN_CSV_PATH)
  ? DHAN_CSV_PATH
  : path.resolve(process.cwd(), DHAN_CSV_PATH);

if (!fs.existsSync(resolvedCsvPath)) {
  throw new Error(
    `Dhan CSV file not found at:\n${resolvedCsvPath}`
  );
}

/* =========================================================
   SUPABASE CLIENT
========================================================= */

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/* =========================================================
   HELPERS
========================================================= */

const cleanText = (value) =>
  String(value ?? "").trim();

const cleanUpper = (value) =>
  cleanText(value).toUpperCase();

const toNumberOrNull = (value) => {
  const cleaned = cleanText(value);

  if (!cleaned) return null;

  const number = Number(cleaned);

  return Number.isFinite(number)
    ? number
    : null;
};

const getDhanSegment = (exchange, segment) => {
  const normalizedExchange =
    cleanUpper(exchange);

  const normalizedSegment =
    cleanUpper(segment);

  if (normalizedSegment === "E") {
    if (normalizedExchange === "NSE") {
      return "NSE_EQ";
    }

    if (normalizedExchange === "BSE") {
      return "BSE_EQ";
    }
  }

  return "";
};

/* =========================================================
   READ CSV
========================================================= */

console.log("\nReading Dhan instrument CSV...");
console.log(`File: ${resolvedCsvPath}\n`);

const csvContent = fs.readFileSync(
  resolvedCsvPath,
  "utf8"
);

const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  bom: true,
  relax_column_count: true,
  relax_quotes: true,
});

console.log(
  `Total rows found in CSV: ${records.length}`
);

/* =========================================================
   FILTER NSE/BSE EQUITY INSTRUMENTS
========================================================= */

const preparedRows = records
  .filter((row) => {
    const exchange = cleanUpper(
      row.SEM_EXM_EXCH_ID
    );

    const segment = cleanUpper(
      row.SEM_SEGMENT
    );

    const instrumentName = cleanUpper(
      row.SEM_INSTRUMENT_NAME
    );

    const tradingSymbol = cleanText(
      row.SEM_TRADING_SYMBOL
    );

    const securityId = Number(
      row.SEM_SMST_SECURITY_ID
    );

    return (
      ["NSE", "BSE"].includes(exchange) &&
      segment === "E" &&
      instrumentName === "EQUITY" &&
      Boolean(tradingSymbol) &&
      Number.isFinite(securityId) &&
      securityId > 0
    );
  })
  .map((row) => {
    const exchange = cleanUpper(
      row.SEM_EXM_EXCH_ID
    );

    const segment = cleanUpper(
      row.SEM_SEGMENT
    );

    return {
      exchange,

      segment,

      dhan_segment: getDhanSegment(
        exchange,
        segment
      ),

      security_id: Number(
        row.SEM_SMST_SECURITY_ID
      ),

      instrument_name: cleanText(
        row.SEM_INSTRUMENT_NAME
      ),

      trading_symbol: cleanUpper(
        row.SEM_TRADING_SYMBOL
      ),

      symbol_name: cleanText(
        row.SM_SYMBOL_NAME
      ),

      custom_symbol: cleanText(
        row.SEM_CUSTOM_SYMBOL
      ),

      series: cleanUpper(
        row.SEM_SERIES
      ),

      exchange_instrument_type:
        cleanText(
          row.SEM_EXCH_INSTRUMENT_TYPE
        ),

      lot_size: toNumberOrNull(
        row.SEM_LOT_UNITS
      ),

      tick_size: toNumberOrNull(
        row.SEM_TICK_SIZE
      ),

      updated_at:
        new Date().toISOString(),
    };
  });

/* =========================================================
   REMOVE DUPLICATES
========================================================= */

const uniqueMap = new Map();

for (const row of preparedRows) {
  const uniqueKey =
    `${row.exchange}-${row.security_id}`;

  uniqueMap.set(uniqueKey, row);
}

const instrumentRows = Array.from(
  uniqueMap.values()
);

console.log(
  `NSE/BSE equity instruments prepared: ${instrumentRows.length}`
);

if (instrumentRows.length === 0) {
  console.log(
    "\nAvailable CSV headers:"
  );

  console.log(
    Object.keys(records[0] || {})
  );

  throw new Error(
    "No equity instruments were found. Check the CSV headers and file format."
  );
}

/* =========================================================
   IMPORT INTO SUPABASE
========================================================= */

let importedCount = 0;

for (
  let start = 0;
  start < instrumentRows.length;
  start += BATCH_SIZE
) {
  const batch = instrumentRows.slice(
    start,
    start + BATCH_SIZE
  );

  const { error } = await supabase
    .from("instruments")
    .upsert(batch, {
      onConflict: "exchange,security_id",
      ignoreDuplicates: false,
    });

  if (error) {
    console.error(
      `\nImport failed for records ${
        start + 1
      } to ${start + batch.length}`
    );

    console.error(error);

    process.exit(1);
  }

  importedCount += batch.length;

  console.log(
    `Imported ${importedCount}/${instrumentRows.length}`
  );
}

console.log(
  "\n✅ Dhan instrument import completed successfully."
);

console.log(
  `✅ Total instruments imported: ${importedCount}\n`
);