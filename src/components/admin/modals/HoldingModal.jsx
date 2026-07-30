import { useEffect, useMemo, useState } from "react";
import "./HoldingModal.css";
import InstrumentSearch from "../InstrumentSearch";
import { fetchSelectedInstrumentCMP } from "../../../services/holdingService";
const today = new Date().toISOString().split("T")[0];

const marketCategories = [
  "Large Cap",
  "Mid Cap",
  "Small Cap",
  "Micro Cap",
  "Nifty Index",
  "Bank Nifty",
  "Sectoral Index",
  "ETF",
  "Commodity",
  "Other",
];

const defaultForm = {
  recommendationDate: today,
  stock: "",
  sector: "",
  marketCategory: "Other",
  tradeType: "Swing",
  entry: "",
  cmp: "",
  stopLoss: "",
  target1: "",
  target2: "",
  target3: "",
  visibility: "Public",
  accuracyShow: true,
  accuracyBlur: false,
  tradeStatus: "Active",
  publishStatus: "Published",
  featured: false,
  thesis: "",
  tradingviewSymbol: "",
  chartImageUrl: "",
  researchPdfUrl: "",
  chartImage: null,
  researchPdf: null,
  securityId: "",
  exchange: "NSE",
  segment: "NSE_EQ",
  /* ========= NEW ========= */

  exitPrice: "",
  exitDate: "",
  realisedReturn: "",
};

export default function HoldingModal({ onClose, onSave, editingHolding }) {
  const initialForm = useMemo(
  () => ({
    ...defaultForm,
    ...(editingHolding || {}),

    recommendationDate:
      editingHolding?.recommendationDate ||
      today,

    marketCategory:
      editingHolding?.marketCategory ||
      "Other",

    accuracyShow:
      editingHolding?.accuracyShow ??
      defaultForm.accuracyShow,

    accuracyBlur:
      editingHolding?.accuracyBlur ??
      defaultForm.accuracyBlur,

    featured: Boolean(
      editingHolding?.featured ??
        defaultForm.featured
    ),

    securityId:
      editingHolding?.securityId ?? "",

    exchange:
      editingHolding?.exchange || "NSE",

    segment:
      editingHolding?.segment ||
      (editingHolding?.exchange ===
      "BSE"
        ? "BSE_EQ"
        : "NSE_EQ"),

    /* ========= NEW ========= */

    exitPrice:
      editingHolding?.exitPrice ??
      "",

    exitDate:
      editingHolding?.exitDate ??
      "",

    realisedReturn:
      editingHolding?.realisedReturn ??
      "",

    chartImage: null,
    researchPdf: null,
  }),
  [editingHolding]
);

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [fetchingCMP, setFetchingCMP] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState(null);

  useEffect(() => {
    setForm(initialForm);

    if (editingHolding?.securityId) {
      setSelectedInstrument({
        trading_symbol: editingHolding.stock,
        security_id: editingHolding.securityId,
        exchange: editingHolding.exchange || "NSE",
        dhan_segment:
          editingHolding.segment ||
          (editingHolding.exchange === "BSE" ? "BSE_EQ" : "NSE_EQ"),
      });
    } else {
      setSelectedInstrument(null);
    }
  }, [initialForm, editingHolding]);

  const handleChange = (event) => {
  const {
    name,
    value,
    type,
    checked,
    files,
  } = event.target;

  if (type === "file") {
    setForm((previous) => ({
      ...previous,
      [name]: files?.[0] || null,
    }));
    return;
  }

  setForm((previous) => {
    const updated = {
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    };

    if (
      name === "accuracyShow" &&
      checked === false
    ) {
      updated.accuracyBlur = false;
    }

    /*
      If Entry changes and Exit Price
      already exists, recalculate
      realised return automatically.
    */
    if (
      name === "entry" &&
      previous.exitPrice
    ) {
      updated.realisedReturn =
        calculateRealisedReturn(
          value,
          previous.exitPrice
        );
    }

    /*
      If trade becomes Active again,
      remove exit details.
    */
    if (name === "tradeStatus") {
      const completed =
        [
          "booked profit",
          "sl hit",
        ].includes(
          normalize(value)
        );

      if (!completed) {
        updated.exitPrice = "";
        updated.exitDate = "";
        updated.realisedReturn = "";
      }
    }

    return updated;
  });
};
  const handleExitPriceChange = (
  event
) => {
  const exitPrice =
    event.target.value;

  setForm((previous) => ({
    ...previous,
    exitPrice,
    realisedReturn:
      calculateRealisedReturn(
        previous.entry,
        exitPrice
      ),
  }));
};

  const handleInstrumentSelect = async (instrument) => {
    const exchange = String(
      instrument.exchange || "NSE"
    ).toUpperCase();

    const segment =
      instrument.dhan_segment ||
      (exchange === "BSE" ? "BSE_EQ" : "NSE_EQ");

    const tradingSymbol =
      instrument.trading_symbol || "";

    const securityId = String(
      instrument.security_id || ""
    );

    setSelectedInstrument(instrument);

    setForm((previous) => ({
      ...previous,
      stock: tradingSymbol,
      tradingviewSymbol: `${exchange}:${tradingSymbol}`,
      securityId,
      exchange,
      segment,
      cmp: "",
    }));

    try {
      setFetchingCMP(true);

      const liveCMP =
        await fetchSelectedInstrumentCMP({
          securityId,
          segment,
        });

      setForm((previous) => {
        if (
          String(previous.securityId) !==
          String(securityId)
        ) {
          return previous;
        }

        return {
          ...previous,
          cmp: liveCMP,
        };
      });
    } catch (error) {
      console.error(
        "Automatic live CMP fetch failed:",
        error
      );

      alert(
        error?.message ||
          "Stock selected, but live CMP could not be fetched."
      );
    } finally {
      setFetchingCMP(false);
    }
  };

  const handleStockTextChange = (value) => {
    setSelectedInstrument(null);
    setForm((previous) => ({
      ...previous,
      stock: value,
      securityId: "",
      exchange: "NSE",
      segment: "NSE_EQ",
      tradingviewSymbol: "",
      cmp: "",
    }));
  };
  const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const isCompletedTrade = [
  "booked profit",
  "sl hit",
].includes(normalize(form.tradeStatus));

const calculateRealisedReturn = (
  entry,
  exitPrice
) => {
  const entryValue = Number(entry || 0);
  const exitValue = Number(
    exitPrice || 0
  );

  if (
    !entryValue ||
    !exitValue ||
    entryValue <= 0
  ) {
    return "";
  }

  return (
    ((exitValue - entryValue) /
      entryValue) *
    100
  ).toFixed(2);
};
  const handleSubmit = async () => {
    if (saving || fetchingCMP) return;

    const stock = String(form.stock || "").trim();
    const sector = String(form.sector || "").trim() || "General";

    if (!stock || !form.entry || !form.cmp) {
      alert("Please fill Stock Name, Entry Price and CMP.");
      return;
    }
    if (isCompletedTrade) {
  if (!form.exitPrice) {
    alert("Please enter Exit Price.");
    return;
  }

  if (!form.exitDate) {
    alert("Please select Exit Date.");
    return;
  }
}
    if (!form.securityId) {
      alert("Please select the stock from the Dhan instrument search results.");
      return;
    }

    const entry = Number(form.entry);
    const cmp = Number(form.cmp);
    const stopLoss = Number(form.stopLoss || 0);
    const target1 = Number(form.target1 || 0);
    const target2 = Number(form.target2 || 0);
    const target3 = Number(form.target3 || 0);
    const securityId = Number(form.securityId);
    const exitPrice = Number(form.exitPrice || 0);

    if (!Number.isFinite(entry) || !Number.isFinite(cmp) || entry <= 0 || cmp <= 0) {
      alert("Entry Price and CMP must be greater than zero.");
      return;
    }

    if (!Number.isFinite(securityId) || securityId <= 0) {
      alert("Invalid Dhan Security ID. Please select the stock again.");
      return;
    }

    if (stopLoss && stopLoss >= entry) {
      alert("Stop Loss must be below Entry Price.");
      return;
    }

    if (target1 && target1 <= entry) {
      alert("Target 1 must be greater than Entry Price.");
      return;
    }

    if (target2 && (!target1 || target2 <= target1)) {
      alert("Target 2 must be greater than Target 1.");
      return;
    }

    if (target3 && (!target2 || target3 <= target2)) {
      alert("Target 3 must be greater than Target 2.");
      return;
    }

    try {
      setSaving(true);

      await onSave({
        ...form,
        stock,
        sector,
        marketCategory: form.marketCategory || "Other",
        tradeType: form.tradeType || "Swing",
        entry,
        cmp,
        stopLoss,
        target1,
        target2,
        target3,
        visibility: form.visibility || "Public",
        accuracyShow: Boolean(form.accuracyShow),
        accuracyBlur: Boolean(form.accuracyShow && form.accuracyBlur),
        tradeStatus: form.tradeStatus || "Active",
        exitPrice,
exitDate: form.exitDate || null,
realisedReturn:
  form.realisedReturn === ""
    ? null
    : Number(form.realisedReturn),
        publishStatus: form.publishStatus || "Published",
        featured: Boolean(form.featured),
        thesis: String(form.thesis || "").trim(),
        tradingviewSymbol: String(form.tradingviewSymbol || "").trim(),
        securityId,
        exchange: String(form.exchange || "NSE").trim().toUpperCase(),
        segment: String(
          form.segment || (form.exchange === "BSE" ? "BSE_EQ" : "NSE_EQ")
        ).trim().toUpperCase(),
      });

      onClose();
    } catch (error) {
      console.error("Holding save error:", error);
      alert(error?.message || "Failed to save holding.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="holding-modal-overlay">
      <div className="holding-modal-container">
        <div className="holding-modal-header">
          <div>
            <h2>{editingHolding ? "Edit Holding" : "Add New Holding"}</h2>
            <p>
              Search the Dhan instrument master, then enter trade details,
              targets, visibility and research files.
            </p>
          </div>

          <button
            type="button"
            className="holding-close-button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close holding modal"
          >
            ✕
          </button>
        </div>

        <div className="holding-form-grid">
          <Field label="Recommendation Date">
            <input
              type="date"
              name="recommendationDate"
              value={form.recommendationDate || today}
              onChange={handleChange}
            />
          </Field>

          <div className="holding-field">
            <InstrumentSearch
              value={form.stock}
              selectedInstrument={
                selectedInstrument ||
                (form.securityId
                  ? {
                      trading_symbol: form.stock,
                      security_id: form.securityId,
                      exchange: form.exchange,
                      dhan_segment: form.segment,
                    }
                  : null)
              }
              onChange={handleStockTextChange}
              onSelect={handleInstrumentSelect}
              disabled={saving || fetchingCMP}
            />
          </div>

          <Field label="Dhan Security ID">
            <input
              type="text"
              value={form.securityId || ""}
              readOnly
              placeholder="Select a stock first"
            />
          </Field>

          <Field label="Exchange">
            <input type="text" value={form.exchange || "NSE"} readOnly />
          </Field>

          <Field label="Dhan Segment">
            <input type="text" value={form.segment || "NSE_EQ"} readOnly />
          </Field>

          <Field label="Sector">
            <input
              type="text"
              name="sector"
              value={form.sector || ""}
              onChange={handleChange}
              placeholder="Example: Defence"
            />
          </Field>

          <Field label="Indices">
            <select
              name="marketCategory"
              value={form.marketCategory || "Other"}
              onChange={handleChange}
            >
              {marketCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Trade Type">
            <select
              name="tradeType"
              value={form.tradeType || "Swing"}
              onChange={handleChange}
            >
              <option value="Swing">Swing</option>
              <option value="Positional">Positional</option>
              <option value="Investment">Investment</option>
            </select>
          </Field>

          <Field label="TradingView Symbol">
            <input
              type="text"
              name="tradingviewSymbol"
              value={form.tradingviewSymbol || ""}
              onChange={handleChange}
              placeholder="Auto-filled after stock selection"
            />
          </Field>

          <Field label="Entry Price">
            <input
              type="number"
              min="0"
              step="0.01"
              name="entry"
              value={form.entry ?? ""}
              onChange={handleChange}
              placeholder="Entry Price"
            />
          </Field>

          <Field label="Current Market Price">
            <input
              type="number"
              min="0"
              step="0.01"
              name="cmp"
              value={form.cmp ?? ""}
              onChange={handleChange}
              placeholder={
                fetchingCMP
                  ? "Fetching live CMP..."
                  : "Select a stock to fetch CMP"
              }
              readOnly={fetchingCMP}
            />

            {fetchingCMP && (
              <small>
                Fetching live price from Dhan…
              </small>
            )}

            {!fetchingCMP &&
              form.securityId &&
              form.cmp && (
                <small
                  style={{
                    color: "#15803d",
                    fontWeight: 700,
                  }}
                >
                  ✓ Live CMP fetched from Dhan
                </small>
              )}
          </Field>

          <Field label="Stop Loss">
            <input
              type="number"
              min="0"
              step="0.01"
              name="stopLoss"
              value={form.stopLoss ?? ""}
              onChange={handleChange}
              placeholder="Stop Loss"
            />
          </Field>

          <Field label="Target 1">
            <input
              type="number"
              min="0"
              step="0.01"
              name="target1"
              value={form.target1 ?? ""}
              onChange={handleChange}
              placeholder="Target 1"
            />
          </Field>

          <Field label="Target 2">
            <input
              type="number"
              min="0"
              step="0.01"
              name="target2"
              value={form.target2 ?? ""}
              onChange={handleChange}
              placeholder="Target 2"
            />
          </Field>

          <Field label="Target 3">
            <input
              type="number"
              min="0"
              step="0.01"
              name="target3"
              value={form.target3 ?? ""}
              onChange={handleChange}
              placeholder="Optional"
            />
          </Field>

          <Field label="Visibility">
            <select
              name="visibility"
              value={form.visibility || "Public"}
              onChange={handleChange}
            >
              <option value="Public">Public</option>
              <option value="Subscriber">Subscriber</option>
              <option value="Community">Community</option>
              <option value="Private">Private</option>
            </select>
          </Field>

          <Field label="Trade Status">
            <select
              name="tradeStatus"
              value={form.tradeStatus || "Active"}
              onChange={handleChange}
            >
              <option value="Active">Active</option>
              <option value="Target 1 Hit">Target 1 Hit</option>
              <option value="Target 2 Hit">Target 2 Hit</option>
              <option value="Target 3 Hit">Target 3 Hit</option>
              <option value="Booked Profit">Booked Profit</option>
              <option value="SL Hit">SL Hit</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </Field>
          {isCompletedTrade && (
  <>
    <Field label="Exit Price">
      <input
        type="number"
        min="0"
        step="0.01"
        name="exitPrice"
        value={form.exitPrice ?? ""}
        onChange={handleExitPriceChange}
        placeholder="Final Exit Price"
      />
    </Field>

    <Field label="Exit Date">
      <input
        type="date"
        name="exitDate"
        value={form.exitDate || ""}
        onChange={handleChange}
      />
    </Field>

    <Field label="Realised Return (%)">
      <input
        type="number"
        name="realisedReturn"
        value={form.realisedReturn ?? ""}
        readOnly
        placeholder="Auto Calculated"
      />
    </Field>
  </>
)}

          <Field label="Publish Status">
            <select
              name="publishStatus"
              value={form.publishStatus || "Published"}
              onChange={handleChange}
            >
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </Field>

          <div className="holding-accuracy-controls">
            <div>
              <strong>Public Accuracy Page</strong>
              <p>
                Control whether this trade appears in the public performance
                record.
              </p>
            </div>

            <label className="holding-checkbox-field">
              <input
                type="checkbox"
                name="accuracyShow"
                checked={Boolean(form.accuracyShow)}
                onChange={handleChange}
              />
              <span>Show on Public Accuracy Page</span>
            </label>

            <label
              className={`holding-checkbox-field ${
                !form.accuracyShow ? "holding-checkbox-disabled" : ""
              }`}
            >
              <input
                type="checkbox"
                name="accuracyBlur"
                checked={Boolean(form.accuracyBlur)}
                onChange={handleChange}
                disabled={!form.accuracyShow}
              />
              <span>Blur Stock, Entry, CMP, SL and Target Details</span>
            </label>

            <small>
              Uncheck blur later to reveal the completed trade publicly.
            </small>
          </div>

          <label className="holding-checkbox-field">
            <input
              type="checkbox"
              name="featured"
              checked={Boolean(form.featured)}
              onChange={handleChange}
            />
            <span>Feature this holding</span>
          </label>

          <Field label="Chart Image">
            <input
              type="file"
              name="chartImage"
              accept="image/*"
              onChange={handleChange}
            />

            {form.chartImageUrl && !form.chartImage && (
              <a href={form.chartImageUrl} target="_blank" rel="noreferrer">
                View existing chart
              </a>
            )}
          </Field>

          <Field label="Research PDF">
            <input
              type="file"
              name="researchPdf"
              accept="application/pdf"
              onChange={handleChange}
            />

            {form.researchPdfUrl && !form.researchPdf && (
              <a href={form.researchPdfUrl} target="_blank" rel="noreferrer">
                View existing PDF
              </a>
            )}
          </Field>

          <div className="holding-field holding-field-full">
            <label>Trade Thesis / Notes</label>
            <textarea
              name="thesis"
              value={form.thesis || ""}
              onChange={handleChange}
              placeholder="Explain the setup, structure and reasoning..."
              rows={5}
            />
          </div>
        </div>

        <div className="holding-modal-actions">
          <button
            type="button"
            className="holding-cancel-button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="holding-save-button"
            onClick={handleSubmit}
            disabled={saving || fetchingCMP}
          >
            {fetchingCMP
              ? "Fetching CMP..."
              : saving
              ? "Saving..."
              : editingHolding
                ? "Update Holding"
                : "Save Holding"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="holding-field">
      <label>{label}</label>
      {children}
    </div>
  );
}
