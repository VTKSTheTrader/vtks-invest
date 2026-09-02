import { supabase } from "../lib/supabase";

// =========================================================
// HELPERS
// =========================================================

const normalizeETF = (row = {}) => ({
  id: row.id,
  name: row.name || "",
  symbol: row.symbol || "",
  fullName: row.full_name || "",
  etfType: row.etf_type || "Index ETF",
  description: row.description || "",

dhanSecurityId: row.dhan_security_id
  ? Number(row.dhan_security_id)
  : null,

exchangeSegment:
  row.exchange_segment || "NSE_EQ",

  cmp: Number(row.cmp || 0),
  status: row.status || "Accumulating",
  publishStatus: row.publish_status || "draft",
  notes: row.notes || "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const normalizeETFSummary = (row = {}) => ({
  ...normalizeETF(row),

  accumulationCount: Number(row.accumulation_count || 0),
  totalInvested: Number(row.total_invested || 0),
  totalUnits: Number(row.total_units || 0),
  averagePrice: Number(row.average_price || 0),
  currentValue: Number(row.current_value || 0),
  gainLoss: Number(row.gain_loss || 0),
  returnPercentage: Number(row.return_percentage || 0),
});

const normalizeAccumulation = (row = {}) => ({
  id: row.id,
  etfId: row.etf_id,
  accumulationDate: row.accumulation_date,
  price: Number(row.price || 0),
  amount: Number(row.amount || 0),
  units: Number(row.units || 0),
  note: row.note || "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const buildETFPayload = (etf = {}) => ({
  name: etf.name?.trim(),
  symbol: etf.symbol?.trim()?.toUpperCase(),
  full_name: etf.fullName?.trim() || null,
  etf_type: etf.etfType || "Index ETF",
  description: etf.description?.trim() || null,

dhan_security_id:
  etf.dhanSecurityId &&
  Number(etf.dhanSecurityId) > 0
    ? Number(etf.dhanSecurityId)
    : null,

exchange_segment:
  etf.exchangeSegment || "NSE_EQ",

  cmp: Number(etf.cmp || 0),
  status: etf.status || "Accumulating",
  publish_status: etf.publishStatus || "draft",
  notes: etf.notes?.trim() || null,
});

const buildAccumulationPayload = (accumulation = {}) => ({
  etf_id: Number(accumulation.etfId),
  accumulation_date:
    accumulation.accumulationDate ||
    new Date().toISOString().split("T")[0],
  price: Number(accumulation.price || 0),
  amount: Number(accumulation.amount || 0),
  note: accumulation.note?.trim() || null,
});

// =========================================================
// ETF MASTER
// =========================================================

export const getETFs = async () => {
  const { data, error } = await supabase
    .from("etfs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getETFs error:", error);
    throw error;
  }

  return (data || []).map(normalizeETF);
};

export const getETFById = async (id) => {
  if (!id) return null;

  const { data, error } = await supabase
    .from("etfs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getETFById error:", error);
    throw error;
  }

  return data ? normalizeETF(data) : null;
};

export const addETF = async (etf) => {
  const payload = buildETFPayload(etf);

  if (!payload.name) {
    throw new Error("ETF name is required.");
  }

  if (!payload.symbol) {
    throw new Error("ETF symbol is required.");
  }

  const { data, error } = await supabase
    .from("etfs")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("addETF error:", error);
    throw error;
  }

  return normalizeETF(data);
};

export const updateETF = async (id, etf) => {
  if (!id) {
    throw new Error("ETF ID is required.");
  }

  const payload = buildETFPayload(etf);

  if (!payload.name) {
    throw new Error("ETF name is required.");
  }

  if (!payload.symbol) {
    throw new Error("ETF symbol is required.");
  }

  const { data, error } = await supabase
    .from("etfs")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("updateETF error:", error);
    throw error;
  }

  return normalizeETF(data);
};

export const deleteETF = async (id) => {
  if (!id) {
    throw new Error("ETF ID is required.");
  }

  const { error } = await supabase
    .from("etfs")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteETF error:", error);
    throw error;
  }

  return true;
};

// =========================================================
// ETF SUMMARY
// =========================================================

export const getETFSummaries = async () => {
  const { data, error } = await supabase
    .from("etf_portfolio_summary")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getETFSummaries error:", error);
    throw error;
  }

  return (data || []).map(normalizeETFSummary);
};

export const getETFSummaryById = async (id) => {
  if (!id) return null;

  const { data, error } = await supabase
    .from("etf_portfolio_summary")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getETFSummaryById error:", error);
    throw error;
  }

  return data ? normalizeETFSummary(data) : null;
};

// =========================================================
// PUBLIC ETF
// =========================================================

export const getPublicETFs = async () => {
  const { data, error } = await supabase
    .from("etf_portfolio_summary")
    .select("*")
    .eq("publish_status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getPublicETFs error:", error);
    throw error;
  }

  return (data || []).map(normalizeETFSummary);
};

export const getPublicETFById = async (id) => {
  if (!id) return null;

  const { data, error } = await supabase
    .from("etf_portfolio_summary")
    .select("*")
    .eq("id", id)
    .eq("publish_status", "published")
    .maybeSingle();

  if (error) {
    console.error("getPublicETFById error:", error);
    throw error;
  }

  return data ? normalizeETFSummary(data) : null;
};

// =========================================================
// ACCUMULATION HISTORY
// =========================================================

export const getETFAccumulations = async (etfId) => {
  if (!etfId) return [];

  const { data, error } = await supabase
    .from("etf_accumulations")
    .select("*")
    .eq("etf_id", etfId)
    .order("accumulation_date", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error("getETFAccumulations error:", error);
    throw error;
  }

  return (data || []).map(normalizeAccumulation);
};

export const addETFAccumulation = async (accumulation) => {
  const payload = buildAccumulationPayload(accumulation);

  if (!payload.etf_id) {
    throw new Error("ETF ID is required.");
  }

  if (!payload.price || payload.price <= 0) {
    throw new Error("ETF price must be greater than zero.");
  }

  if (!payload.amount || payload.amount <= 0) {
    throw new Error("Accumulation amount must be greater than zero.");
  }

  const { data, error } = await supabase
    .from("etf_accumulations")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("addETFAccumulation error:", error);
    throw error;
  }

  return normalizeAccumulation(data);
};

export const updateETFAccumulation = async (id, accumulation) => {
  if (!id) {
    throw new Error("Accumulation ID is required.");
  }

  const payload = {
    accumulation_date:
      accumulation.accumulationDate ||
      new Date().toISOString().split("T")[0],
    price: Number(accumulation.price || 0),
    amount: Number(accumulation.amount || 0),
    note: accumulation.note?.trim() || null,
  };

  if (!payload.price || payload.price <= 0) {
    throw new Error("ETF price must be greater than zero.");
  }

  if (!payload.amount || payload.amount <= 0) {
    throw new Error("Accumulation amount must be greater than zero.");
  }

  const { data, error } = await supabase
    .from("etf_accumulations")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("updateETFAccumulation error:", error);
    throw error;
  }

  return normalizeAccumulation(data);
};

export const deleteETFAccumulation = async (id) => {
  if (!id) {
    throw new Error("Accumulation ID is required.");
  }

  const { error } = await supabase
    .from("etf_accumulations")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteETFAccumulation error:", error);
    throw error;
  }

  return true;
};

// =========================================================
// COMPLETE ETF DETAIL
// Useful for View Analysis page
// =========================================================

export const getETFAnalysis = async (etfId) => {
  if (!etfId) {
    return {
      etf: null,
      accumulations: [],
    };
  }

  const [etf, accumulations] = await Promise.all([
    getPublicETFById(etfId),
    getETFAccumulations(etfId),
  ]);

  return {
    etf,
    accumulations,
  };
};

// =========================================================
// PORTFOLIO TOTALS
// Useful for public ETF dashboard summary cards
// =========================================================

export const calculateETFPortfolioTotals = (etfs = []) => {
  const totals = etfs.reduce(
    (acc, etf) => {
      acc.totalInvested += Number(etf.totalInvested || 0);
      acc.currentValue += Number(etf.currentValue || 0);
      acc.totalUnits += Number(etf.totalUnits || 0);
      acc.etfCount += 1;

      return acc;
    },
    {
      totalInvested: 0,
      currentValue: 0,
      totalUnits: 0,
      etfCount: 0,
    }
  );

  totals.gainLoss = totals.currentValue - totals.totalInvested;

  totals.returnPercentage =
    totals.totalInvested > 0
      ? (totals.gainLoss / totals.totalInvested) * 100
      : 0;

  return totals;
};

// =========================================================
// USER ACCUMULATION CALCULATOR
// This does NOT save anything to Supabase.
// Used only for public simulation.
// =========================================================

export const calculateAmountBasedAccumulation = ({
  amount = 0,
  price = 0,
  portfolioAmount = 0,
}) => {
  const safeAmount = Number(amount || 0);
  const safePrice = Number(price || 0);
  const safePortfolioAmount = Number(portfolioAmount || 0);

  const units =
    safePrice > 0
      ? safeAmount / safePrice
      : 0;

  const equivalentPercentage =
    safePortfolioAmount > 0
      ? (safeAmount / safePortfolioAmount) * 100
      : 0;

  return {
    amount: safeAmount,
    price: safePrice,
    units,
    equivalentPercentage,
  };
};

export const calculatePercentageBasedAccumulation = ({
  portfolioAmount = 0,
  percentage = 0,
  price = 0,
}) => {
  const safePortfolioAmount = Number(portfolioAmount || 0);
  const safePercentage = Number(percentage || 0);
  const safePrice = Number(price || 0);

  const amount =
    safePortfolioAmount > 0 && safePercentage > 0
      ? (safePortfolioAmount * safePercentage) / 100
      : 0;

  const units =
    safePrice > 0
      ? amount / safePrice
      : 0;

  return {
    portfolioAmount: safePortfolioAmount,
    percentage: safePercentage,
    amount,
    price: safePrice,
    units,
  };
};