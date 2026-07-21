import { supabase } from "../lib/supabase";

const SEARCH_COLUMNS = `
  id,
  exchange,
  segment,
  dhan_segment,
  security_id,
  instrument_name,
  trading_symbol,
  symbol_name,
  custom_symbol,
  series
`;

const cleanSearch = (value) =>
  String(value || "")
    .trim()
    .replace(/[%_,()]/g, " ")
    .replace(/\s+/g, " ");

const uniqueInstruments = (rows) => {
  const result = [];
  const seen = new Set();

  for (const row of rows || []) {
    const key = `${row.exchange}-${row.security_id}`;

    if (seen.has(key)) continue;

    seen.add(key);
    result.push(row);
  }

  return result;
};

const scoreInstrument = (instrument, searchText) => {
  const query = searchText.toUpperCase();

  const symbol = String(
    instrument.trading_symbol || ""
  ).toUpperCase();

  const symbolName = String(
    instrument.symbol_name || ""
  ).toUpperCase();

  const customSymbol = String(
    instrument.custom_symbol || ""
  ).toUpperCase();

  let score = 100;

  if (symbol === query) {
    score = 0;
  } else if (symbol.startsWith(query)) {
    score = 10;
  } else if (symbol.includes(query)) {
    score = 20;
  } else if (symbolName.startsWith(query)) {
    score = 30;
  } else if (symbolName.includes(query)) {
    score = 40;
  } else if (customSymbol.includes(query)) {
    score = 50;
  }

  /*
   * Prefer the main NSE EQ listing.
   */
  if (
    instrument.exchange === "NSE" &&
    instrument.series === "EQ"
  ) {
    score -= 5;
  } else if (instrument.exchange === "NSE") {
    score -= 2;
  }

  return score;
};

const sortInstruments = (rows, query) =>
  [...rows].sort((a, b) => {
    const scoreDifference =
      scoreInstrument(a, query) -
      scoreInstrument(b, query);

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    return String(
      a.trading_symbol || ""
    ).localeCompare(
      String(b.trading_symbol || "")
    );
  });

const runInstrumentQuery = async (
  configureQuery
) => {
  let query = supabase
    .from("instruments")
    .select(SEARCH_COLUMNS)
    .in("dhan_segment", [
      "NSE_EQ",
      "BSE_EQ",
    ])
    .not("security_id", "is", null);

  query = configureQuery(query);

  const { data, error } = await query;

  if (error) {
    console.error(
      "Instrument query error:",
      error
    );

    throw new Error(
      error.message ||
        "Unable to search instruments."
    );
  }

  return data || [];
};

export const searchInstruments = async (
  searchText,
  limit = 25
) => {
  const cleaned = cleanSearch(searchText);

  if (cleaned.length < 2) {
    return [];
  }

  const uppercaseQuery =
    cleaned.toUpperCase();

  /*
   * Query 1:
   * Exact trading-symbol match.
   */
  const exactRows =
    await runInstrumentQuery((query) =>
      query
        .eq(
          "trading_symbol",
          uppercaseQuery
        )
        .limit(10)
    );

  /*
   * Query 2:
   * Symbols beginning with the entered text.
   */
  const prefixRows =
    await runInstrumentQuery((query) =>
      query
        .ilike(
          "trading_symbol",
          `${cleaned}%`
        )
        .limit(30)
    );

  /*
   * Query 3:
   * Broader symbol/company-name search.
   */
  const containsRows =
    await runInstrumentQuery((query) =>
      query
        .or(
          [
            `trading_symbol.ilike.%${cleaned}%`,
            `symbol_name.ilike.%${cleaned}%`,
            `custom_symbol.ilike.%${cleaned}%`,
          ].join(",")
        )
        .limit(40)
    );

  const combinedRows =
    uniqueInstruments([
      ...exactRows,
      ...prefixRows,
      ...containsRows,
    ]);

  return sortInstruments(
    combinedRows,
    cleaned
  ).slice(0, limit);
};

export const getInstrumentBySecurityId =
  async (exchange, securityId) => {
    if (!exchange || !securityId) {
      return null;
    }

    const { data, error } = await supabase
      .from("instruments")
      .select(SEARCH_COLUMNS)
      .eq(
        "exchange",
        String(exchange).toUpperCase()
      )
      .eq(
        "security_id",
        Number(securityId)
      )
      .maybeSingle();

    if (error) {
      console.error(
        "Get instrument error:",
        error
      );

      throw new Error(
        error.message ||
          "Unable to load instrument."
      );
    }

    return data || null;
  };