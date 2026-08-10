import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./HoldingModal.css";

import InstrumentSearch from "../InstrumentSearch";

import {
  fetchSelectedInstrumentCMP,
  removeHoldingChart,
  removeHoldingResearchPdf,
} from "../../../services/holdingService";

const today =
  new Date().toISOString().split("T")[0];

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

  /*
    Legacy chart field.
  */
  chartImageUrl: "",

  /*
    Before / After charts.
  */
  beforeChartUrl: "",
  afterChartUrl: "",

  beforeChartCaption: "",
  afterChartCaption: "",

  beforeChart: null,
  afterChart: null,

  researchPdfUrl: "",
  researchPdf: null,

  /*
    Dhan instrument details.
  */
  securityId: "",
  exchange: "NSE",
  segment: "NSE_EQ",

  /*
    Exit / Realised details.
  */
  exitPrice: "",
  exitDate: "",
  realisedReturn: "",
};

/* =========================================================
   HELPERS
========================================================= */

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const calculateRealisedReturn = (
  entry,
  exitPrice
) => {
  const entryValue =
    Number(entry || 0);

  const exitValue =
    Number(exitPrice || 0);

  if (
    !Number.isFinite(entryValue) ||
    !Number.isFinite(exitValue) ||
    entryValue <= 0 ||
    exitValue <= 0
  ) {
    return "";
  }

  return (
    ((exitValue - entryValue) /
      entryValue) *
    100
  ).toFixed(2);
};

/*
  Automatically classify a manually
  booked study based on Entry vs Exit.
*/
const getAutomaticBookedStatus = (
  entry,
  exitPrice
) => {
  const entryValue =
    Number(entry || 0);

  const exitValue =
    Number(exitPrice || 0);

  if (
    !Number.isFinite(entryValue) ||
    !Number.isFinite(exitValue) ||
    entryValue <= 0 ||
    exitValue <= 0
  ) {
    return null;
  }

  if (exitValue > entryValue) {
    return "Booked Profit";
  }

  if (exitValue < entryValue) {
    return "Booked Loss";
  }

  return "Breakeven";
};

/* =========================================================
   COMPONENT
========================================================= */

export default function HoldingModal({
  onClose,
  onSave,
  editingHolding,
}) {
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
        editingHolding?.securityId ??
        "",

      exchange:
        editingHolding?.exchange ||
        "NSE",

      segment:
        editingHolding?.segment ||
        (
          editingHolding?.exchange ===
          "BSE"
            ? "BSE_EQ"
            : "NSE_EQ"
        ),

      exitPrice:
        editingHolding?.exitPrice ??
        "",

      exitDate:
        editingHolding?.exitDate ??
        "",

      realisedReturn:
        editingHolding?.realisedReturn ??
        "",

      beforeChart: null,
      afterChart: null,
      researchPdf: null,
    }),
    [editingHolding]
  );

  const [form, setForm] =
    useState(initialForm);

  const [saving, setSaving] =
    useState(false);

  const [
    fetchingCMP,
    setFetchingCMP,
  ] = useState(false);

  const [
    selectedInstrument,
    setSelectedInstrument,
  ] = useState(null);

  const [
    removingChart,
    setRemovingChart,
  ] = useState("");

  const [
    chartMessage,
    setChartMessage,
  ] = useState({
    type: "",
    text: "",
  });

  const [
    chartToRemove,
    setChartToRemove,
  ] = useState(null);

  const [
    removingPdf,
    setRemovingPdf,
  ] = useState(false);

  /* =========================================================
     LOAD EDITING HOLDING
  ========================================================= */

  useEffect(() => {
    setForm(initialForm);

    if (
      editingHolding?.securityId
    ) {
      setSelectedInstrument({
        trading_symbol:
          editingHolding.stock,

        security_id:
          editingHolding.securityId,

        exchange:
          editingHolding.exchange ||
          "NSE",

        dhan_segment:
          editingHolding.segment ||
          (
            editingHolding.exchange ===
            "BSE"
              ? "BSE_EQ"
              : "NSE_EQ"
          ),
      });
    } else {
      setSelectedInstrument(null);
    }
  }, [
    initialForm,
    editingHolding,
  ]);

  /* =========================================================
     GENERAL INPUT CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
      files,
    } = event.target;

    /*
      File input.
    */
    if (type === "file") {
      setForm((previous) => ({
        ...previous,
        [name]:
          files?.[0] || null,
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

      /*
        If hidden from Accuracy,
        disable blur too.
      */
      if (
        name === "accuracyShow" &&
        checked === false
      ) {
        updated.accuracyBlur =
          false;
      }

      /* =====================================================
         ENTRY PRICE CHANGE

         If Exit Price already exists:
         - recalculate realised ROI
         - automatically update
           Profit / Loss / Breakeven

         SL Hit is preserved manually.
      ===================================================== */

      if (
        name === "entry" &&
        previous.exitPrice
      ) {
        updated.realisedReturn =
          calculateRealisedReturn(
            value,
            previous.exitPrice
          );

        const currentStatus =
          normalize(
            previous.tradeStatus
          );

        /*
          Do not automatically replace
          an explicitly selected SL Hit.
        */
        if (
          currentStatus !==
          "sl hit"
        ) {
          const autoStatus =
            getAutomaticBookedStatus(
              value,
              previous.exitPrice
            );

          if (autoStatus) {
            updated.tradeStatus =
              autoStatus;
          }
        }
      }

      /* =====================================================
         TRADE STATUS CHANGE

         Closed studies require:
         Exit Price
         Exit Date
         Realised Return

         If changing back to an open
         status, clear exit information.
      ===================================================== */

      if (
        name === "tradeStatus"
      ) {
        const completed = [
          "booked profit",
          "booked loss",
          "breakeven",
          "sl hit",
        ].includes(
          normalize(value)
        );

        if (!completed) {
          updated.exitPrice = "";
          updated.exitDate = "";
          updated.realisedReturn =
            "";
        }

        /*
          If switching between Booked
          Profit / Loss / Breakeven while
          exit price already exists,
          enforce the mathematically
          correct booked status.
        */
        if (
          [
            "booked profit",
            "booked loss",
            "breakeven",
          ].includes(
            normalize(value)
          ) &&
          previous.exitPrice
        ) {
          const autoStatus =
            getAutomaticBookedStatus(
              previous.entry,
              previous.exitPrice
            );

          if (autoStatus) {
            updated.tradeStatus =
              autoStatus;
          }
        }
      }

      return updated;
    });
  };

  /* =========================================================
     EXIT PRICE CHANGE

     AUTOMATIC STATUS:

     Exit > Entry
       → Booked Profit

     Exit < Entry
       → Booked Loss

     Exit = Entry
       → Breakeven

     If SL Hit was explicitly selected,
     keep SL Hit.
  ========================================================= */

  const handleExitPriceChange = (
    event
  ) => {
    const exitPrice =
      event.target.value;

    setForm((previous) => {
      const currentStatus =
        normalize(
          previous.tradeStatus
        );

      let tradeStatus =
        previous.tradeStatus;

      /*
        Preserve manually selected
        SL Hit.
      */
      if (
        currentStatus !== "sl hit"
      ) {
        const autoStatus =
          getAutomaticBookedStatus(
            previous.entry,
            exitPrice
          );

        if (autoStatus) {
          tradeStatus =
            autoStatus;
        }
      }

      return {
        ...previous,

        exitPrice,

        tradeStatus,

        realisedReturn:
          calculateRealisedReturn(
            previous.entry,
            exitPrice
          ),
      };
    });
  };

  /* =========================================================
     DHAN INSTRUMENT SELECT
  ========================================================= */

  const handleInstrumentSelect =
    async (instrument) => {
      const exchange =
        String(
          instrument.exchange ||
            "NSE"
        ).toUpperCase();

      const segment =
        instrument.dhan_segment ||
        (
          exchange === "BSE"
            ? "BSE_EQ"
            : "NSE_EQ"
        );

      const tradingSymbol =
        instrument.trading_symbol ||
        "";

      const securityId =
        String(
          instrument.security_id ||
            ""
        );

      setSelectedInstrument(
        instrument
      );

      setForm((previous) => ({
        ...previous,

        stock:
          tradingSymbol,

        tradingviewSymbol:
          `${exchange}:${tradingSymbol}`,

        securityId,
        exchange,
        segment,

        cmp: "",
      }));

      try {
        setFetchingCMP(true);

        const liveCMP =
          await fetchSelectedInstrumentCMP(
            {
              securityId,
              segment,
            }
          );

        setForm((previous) => {
          /*
            Ensure user didn't select
            another stock while request
            was running.
          */
          if (
            String(
              previous.securityId
            ) !==
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

  /* =========================================================
     MANUAL STOCK TEXT CHANGE
  ========================================================= */

  const handleStockTextChange = (
    value
  ) => {
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

  /* =========================================================
     COMPLETED TRADE
  ========================================================= */

  const isCompletedTrade = [
    "booked profit",
    "booked loss",
    "breakeven",
    "sl hit",
  ].includes(
    normalize(
      form.tradeStatus
    )
  );

  /* =========================================================
     REMOVE CHART
  ========================================================= */

  const handleRemoveChart = (
    chartType
  ) => {
    if (!editingHolding?.id) {
      setChartMessage({
        type: "error",
        text:
          "Save the holding first before removing an uploaded chart.",
      });

      return;
    }

    const isBefore =
      chartType === "before";

    const chartLabel =
      isBefore
        ? "Before Chart"
        : "After Chart";

    const chartUrl =
      isBefore
        ? form.beforeChartUrl ||
          form.chartImageUrl ||
          ""
        : form.afterChartUrl ||
          "";

    if (!chartUrl) {
      setChartMessage({
        type: "error",

        text:
          `No ${chartLabel.toLowerCase()} is currently uploaded.`,
      });

      return;
    }

    setChartMessage({
      type: "",
      text: "",
    });

    setChartToRemove({
      chartType,
      chartLabel,
      chartUrl,
    });
  };

  /* =========================================================
     CONFIRM REMOVE CHART
  ========================================================= */

  const confirmRemoveChart =
    async () => {
      if (!chartToRemove) {
        return;
      }

      const {
        chartType,
        chartLabel,
        chartUrl,
      } = chartToRemove;

      const isBefore =
        chartType === "before";

      try {
        setRemovingChart(
          chartType
        );

        setChartMessage({
          type: "",
          text: "",
        });

        await removeHoldingChart({
          holdingId:
            editingHolding.id,

          chartType,
          chartUrl,
        });

        setForm((previous) => {
          if (isBefore) {
            return {
              ...previous,

              beforeChart: null,
              beforeChartUrl: "",
              beforeChartCaption: "",

              chartImage: null,
              chartImageUrl: "",
            };
          }

          return {
            ...previous,

            afterChart: null,
            afterChartUrl: "",
            afterChartCaption: "",
          };
        });

        setChartToRemove(null);

        setChartMessage({
          type: "success",

          text:
            `${chartLabel} removed successfully.`,
        });
      } catch (error) {
        console.error(
          "Remove chart error:",
          error
        );

        setChartMessage({
          type: "error",

          text:
            error?.message ||
            `Unable to remove ${chartLabel.toLowerCase()}.`,
        });
      } finally {
        setRemovingChart("");
      }
    };

  /* =========================================================
     REMOVE RESEARCH PDF
  ========================================================= */

  const handleRemoveResearchPdf =
    async () => {
      if (!editingHolding?.id) {
        return;
      }

      if (
        !window.confirm(
          "Delete existing research PDF?"
        )
      ) {
        return;
      }

      try {
        setRemovingPdf(true);

        await removeHoldingResearchPdf(
          {
            holdingId:
              editingHolding.id,

            pdfUrl:
              form.researchPdfUrl,
          }
        );

        setForm((previous) => ({
          ...previous,

          researchPdf: null,
          researchPdfUrl: "",
        }));

        setChartMessage({
          type: "success",

          text:
            "Research PDF removed successfully.",
        });
      } catch (error) {
        console.error(
          "Remove research PDF error:",
          error
        );

        setChartMessage({
          type: "error",

          text:
            error?.message ||
            "Unable to remove Research PDF.",
        });
      } finally {
        setRemovingPdf(false);
      }
    };

  /* =========================================================
     SAVE HOLDING
  ========================================================= */

  const handleSubmit = async () => {
    if (
      saving ||
      fetchingCMP
    ) {
      return;
    }

    const stock =
      String(
        form.stock || ""
      ).trim();

    const sector =
      String(
        form.sector || ""
      ).trim() ||
      "General";

    if (
      !stock ||
      !form.entry ||
      !form.cmp
    ) {
      alert(
        "Please fill Stock Name, Entry Price and CMP."
      );

      return;
    }

    /* =====================================================
       COMPLETED STUDY VALIDATION
    ===================================================== */

    if (isCompletedTrade) {
      if (!form.exitPrice) {
        alert(
          "Please enter Exit Price."
        );

        return;
      }

      if (!form.exitDate) {
        alert(
          "Please select Exit Date."
        );

        return;
      }
    }

    if (!form.securityId) {
      alert(
        "Please select the stock from the Dhan instrument search results."
      );

      return;
    }

    const entry =
      Number(form.entry);

    const cmp =
      Number(form.cmp);

    const stopLoss =
      Number(
        form.stopLoss || 0
      );

    const target1 =
      Number(
        form.target1 || 0
      );

    const target2 =
      Number(
        form.target2 || 0
      );

    const target3 =
      Number(
        form.target3 || 0
      );

    const securityId =
      Number(
        form.securityId
      );

    const exitPrice =
      Number(
        form.exitPrice || 0
      );

    /* =====================================================
       PRICE VALIDATION
    ===================================================== */

    if (
      !Number.isFinite(entry) ||
      !Number.isFinite(cmp) ||
      entry <= 0 ||
      cmp <= 0
    ) {
      alert(
        "Entry Price and CMP must be greater than zero."
      );

      return;
    }

    if (
      !Number.isFinite(
        securityId
      ) ||
      securityId <= 0
    ) {
      alert(
        "Invalid Dhan Security ID. Please select the stock again."
      );

      return;
    }

    if (
      stopLoss &&
      stopLoss >= entry
    ) {
      alert(
        "Stop Loss must be below Entry Price."
      );

      return;
    }

    if (
      target1 &&
      target1 <= entry
    ) {
      alert(
        "Target 1 must be greater than Entry Price."
      );

      return;
    }

    if (
      target2 &&
      (
        !target1 ||
        target2 <= target1
      )
    ) {
      alert(
        "Target 2 must be greater than Target 1."
      );

      return;
    }

    if (
      target3 &&
      (
        !target2 ||
        target3 <= target2
      )
    ) {
      alert(
        "Target 3 must be greater than Target 2."
      );

      return;
    }

    /* =====================================================
       FINAL STATUS SAFETY CHECK

       For manually booked studies,
       enforce correct status one final
       time before save.

       SL Hit remains manual.
    ===================================================== */

    let finalTradeStatus =
      form.tradeStatus ||
      "Active";

    if (
      isCompletedTrade &&
      normalize(
        finalTradeStatus
      ) !== "sl hit"
    ) {
      const autoStatus =
        getAutomaticBookedStatus(
          entry,
          exitPrice
        );

      if (autoStatus) {
        finalTradeStatus =
          autoStatus;
      }
    }

    /*
      Calculate ROI again before save
      rather than relying only on the
      UI field.
    */
    const finalRealisedReturn =
      isCompletedTrade
        ? calculateRealisedReturn(
            entry,
            exitPrice
          )
        : "";

    try {
      setSaving(true);

      await onSave({
        ...form,

        stock,
        sector,

        marketCategory:
          form.marketCategory ||
          "Other",

        tradeType:
          form.tradeType ||
          "Swing",

        entry,
        cmp,

        stopLoss,
        target1,
        target2,
        target3,

        visibility:
          form.visibility ||
          "Public",

        accuracyShow:
          Boolean(
            form.accuracyShow
          ),

        accuracyBlur:
          Boolean(
            form.accuracyShow &&
              form.accuracyBlur
          ),

        tradeStatus:
          finalTradeStatus,

        exitPrice:
          isCompletedTrade
            ? exitPrice
            : 0,

        exitDate:
          isCompletedTrade
            ? form.exitDate ||
              null
            : null,

        realisedReturn:
          isCompletedTrade &&
          finalRealisedReturn !==
            ""
            ? Number(
                finalRealisedReturn
              )
            : null,

        publishStatus:
          form.publishStatus ||
          "Published",

        featured:
          Boolean(
            form.featured
          ),

        thesis:
          String(
            form.thesis || ""
          ).trim(),

        tradingviewSymbol:
          String(
            form.tradingviewSymbol ||
              ""
          ).trim(),

        securityId,

        exchange:
          String(
            form.exchange ||
              "NSE"
          )
            .trim()
            .toUpperCase(),

        segment:
          String(
            form.segment ||
              (
                form.exchange ===
                "BSE"
                  ? "BSE_EQ"
                  : "NSE_EQ"
              )
          )
            .trim()
            .toUpperCase(),
      });

      onClose();
    } catch (error) {
      console.error(
        "Holding save error:",
        error
      );

      alert(
        error?.message ||
          "Failed to save holding."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="holding-modal-overlay">
      <div className="holding-modal-container">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="holding-modal-header">
          <div>
            <h2>
              {editingHolding
                ? "Edit Holding"
                : "Add New Holding"}
            </h2>

            <p>
              Search the Dhan instrument master,
              then enter study details, targets,
              visibility and research files.
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

        {/* ===================================================
            FORM
        =================================================== */}

        <div className="holding-form-grid">

          {/* DATE */}

          <Field label="Recommendation Date">
            <input
              type="date"
              name="recommendationDate"
              value={
                form.recommendationDate ||
                today
              }
              onChange={handleChange}
            />
          </Field>

          {/* DHAN STOCK SEARCH */}

          <div className="holding-field">
            <InstrumentSearch
              value={form.stock}
              selectedInstrument={
                selectedInstrument ||
                (
                  form.securityId
                    ? {
                        trading_symbol:
                          form.stock,

                        security_id:
                          form.securityId,

                        exchange:
                          form.exchange,

                        dhan_segment:
                          form.segment,
                      }
                    : null
                )
              }
              onChange={
                handleStockTextChange
              }
              onSelect={
                handleInstrumentSelect
              }
              disabled={
                saving ||
                fetchingCMP
              }
            />
          </div>

          {/* SECURITY ID */}

          <Field label="Dhan Security ID">
            <input
              type="text"
              value={
                form.securityId ||
                ""
              }
              readOnly
              placeholder="Select a stock first"
            />
          </Field>

          {/* EXCHANGE */}

          <Field label="Exchange">
            <input
              type="text"
              value={
                form.exchange ||
                "NSE"
              }
              readOnly
            />
          </Field>

          {/* SEGMENT */}

          <Field label="Dhan Segment">
            <input
              type="text"
              value={
                form.segment ||
                "NSE_EQ"
              }
              readOnly
            />
          </Field>

          {/* SECTOR */}

          <Field label="Sector">
            <input
              type="text"
              name="sector"
              value={
                form.sector ||
                ""
              }
              onChange={
                handleChange
              }
              placeholder="Example: Defence"
            />
          </Field>

          {/* MARKET CATEGORY */}

          <Field label="Indices">
            <select
              name="marketCategory"
              value={
                form.marketCategory ||
                "Other"
              }
              onChange={
                handleChange
              }
            >
              {marketCategories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}
            </select>
          </Field>

          {/* STUDY TYPE */}

          <Field label="Trade Type">
            <select
              name="tradeType"
              value={
                form.tradeType ||
                "Swing"
              }
              onChange={
                handleChange
              }
            >
              <option value="Swing">
                Swing
              </option>

              <option value="Positional">
                Positional
              </option>

              <option value="Investment">
                Investment
              </option>
            </select>
          </Field>

          {/* TRADINGVIEW */}

          <Field label="TradingView Symbol">
            <input
              type="text"
              name="tradingviewSymbol"
              value={
                form.tradingviewSymbol ||
                ""
              }
              onChange={
                handleChange
              }
              placeholder="Auto-filled after stock selection"
            />
          </Field>

          {/* ENTRY */}

          <Field label="Entry Price">
            <input
              type="number"
              min="0"
              step="0.01"
              name="entry"
              value={
                form.entry ?? ""
              }
              onChange={
                handleChange
              }
              placeholder="Entry Price"
            />
          </Field>

          {/* CMP */}

          <Field label="Current Market Price">
            <input
              type="number"
              min="0"
              step="0.01"
              name="cmp"
              value={
                form.cmp ?? ""
              }
              onChange={
                handleChange
              }
              placeholder={
                fetchingCMP
                  ? "Fetching live CMP..."
                  : "Select a stock to fetch CMP"
              }
              readOnly={
                fetchingCMP
              }
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
                    color:
                      "#15803d",

                    fontWeight:
                      700,
                  }}
                >
                  ✓ Live CMP fetched from Dhan
                </small>
              )}
          </Field>

          {/* STOP LOSS */}

          <Field label="Stop Loss">
            <input
              type="number"
              min="0"
              step="0.01"
              name="stopLoss"
              value={
                form.stopLoss ??
                ""
              }
              onChange={
                handleChange
              }
              placeholder="Stop Loss"
            />
          </Field>

          {/* TARGET 1 */}

          <Field label="Target 1">
            <input
              type="number"
              min="0"
              step="0.01"
              name="target1"
              value={
                form.target1 ??
                ""
              }
              onChange={
                handleChange
              }
              placeholder="Target 1"
            />
          </Field>

          {/* TARGET 2 */}

          <Field label="Target 2">
            <input
              type="number"
              min="0"
              step="0.01"
              name="target2"
              value={
                form.target2 ??
                ""
              }
              onChange={
                handleChange
              }
              placeholder="Target 2"
            />
          </Field>

          {/* TARGET 3 */}

          <Field label="Target 3">
            <input
              type="number"
              min="0"
              step="0.01"
              name="target3"
              value={
                form.target3 ??
                ""
              }
              onChange={
                handleChange
              }
              placeholder="Optional"
            />
          </Field>

          {/* VISIBILITY */}

          <Field label="Visibility">
            <select
              name="visibility"
              value={
                form.visibility ||
                "Public"
              }
              onChange={
                handleChange
              }
            >
              <option value="Public">
                Public
              </option>

              <option value="Subscriber">
                Subscriber
              </option>

              <option value="Community">
                Community
              </option>

              <option value="Private">
                Private
              </option>
            </select>
          </Field>

          {/* =================================================
              TRADE STATUS
          ================================================= */}

          <Field label="Trade Status">
            <select
              name="tradeStatus"
              value={
                form.tradeStatus ||
                "Active"
              }
              onChange={
                handleChange
              }
            >
              <option value="Active">
                Active
              </option>

              <option value="Target 1 Hit">
                Target 1 Hit
              </option>

              <option value="Target 2 Hit">
                Target 2 Hit
              </option>

              <option value="Target 3 Hit">
                Target 3 Hit
              </option>

              <option value="Booked Profit">
                Booked Profit
              </option>

              <option value="Booked Loss">
                Booked Loss
              </option>

              <option value="Breakeven">
                Breakeven
              </option>

              <option value="SL Hit">
                SL Hit
              </option>

              <option value="Cancelled">
                Cancelled
              </option>
            </select>
          </Field>

          {/* =================================================
              EXIT DETAILS
          ================================================= */}

          {isCompletedTrade && (
            <>
              <Field label="Exit Price">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="exitPrice"
                  value={
                    form.exitPrice ??
                    ""
                  }
                  onChange={
                    handleExitPriceChange
                  }
                  placeholder="Final Exit Price"
                />
              </Field>

              <Field label="Exit Date">
                <input
                  type="date"
                  name="exitDate"
                  value={
                    form.exitDate ||
                    ""
                  }
                  onChange={
                    handleChange
                  }
                />
              </Field>

              <Field label="Realised Return (%)">
                <input
                  type="number"
                  name="realisedReturn"
                  value={
                    form.realisedReturn ??
                    ""
                  }
                  readOnly
                  placeholder="Auto Calculated"
                />

                {form.realisedReturn !==
                  "" && (
                  <small
                    style={{
                      color:
                        Number(
                          form.realisedReturn
                        ) > 0
                          ? "#15803d"
                          : Number(
                                form.realisedReturn
                              ) < 0
                            ? "#dc2626"
                            : "#64748b",

                      fontWeight:
                        700,
                    }}
                  >
                    {Number(
                      form.realisedReturn
                    ) > 0
                      ? "✓ Booked Profit"
                      : Number(
                            form.realisedReturn
                          ) < 0
                        ? "📉 Booked Loss"
                        : "⚖️ Breakeven"}
                  </small>
                )}
              </Field>
            </>
          )}

          {/* PUBLISH */}

          <Field label="Publish Status">
            <select
              name="publishStatus"
              value={
                form.publishStatus ||
                "Published"
              }
              onChange={
                handleChange
              }
            >
              <option value="Published">
                Published
              </option>

              <option value="Draft">
                Draft
              </option>
            </select>
          </Field>

          {/* =================================================
              ACCURACY
          ================================================= */}

          <div className="holding-accuracy-controls">
            <div>
              <strong>
                Public Accuracy Page
              </strong>

              <p>
                Control whether this study appears
                in the public performance record.
              </p>
            </div>

            <label className="holding-checkbox-field">
              <input
                type="checkbox"
                name="accuracyShow"
                checked={
                  Boolean(
                    form.accuracyShow
                  )
                }
                onChange={
                  handleChange
                }
              />

              <span>
                Show on Public Accuracy Page
              </span>
            </label>

            <label
              className={`holding-checkbox-field ${
                !form.accuracyShow
                  ? "holding-checkbox-disabled"
                  : ""
              }`}
            >
              <input
                type="checkbox"
                name="accuracyBlur"
                checked={
                  Boolean(
                    form.accuracyBlur
                  )
                }
                onChange={
                  handleChange
                }
                disabled={
                  !form.accuracyShow
                }
              />

              <span>
                Blur Stock, Entry, CMP, SL and
                Target Details
              </span>
            </label>

            <small>
              Uncheck blur later to reveal the
              completed study publicly.
            </small>
          </div>

          {/* FEATURED */}

          <label className="holding-checkbox-field">
            <input
              type="checkbox"
              name="featured"
              checked={
                Boolean(
                  form.featured
                )
              }
              onChange={
                handleChange
              }
            />

            <span>
              Feature this holding
            </span>
          </label>

          {/* =================================================
              MESSAGE
          ================================================= */}

          {chartMessage.text && (
            <div
              className={`holding-chart-message ${
                chartMessage.type ===
                "success"
                  ? "holding-chart-success"
                  : "holding-chart-error"
              }`}
              role={
                chartMessage.type ===
                "error"
                  ? "alert"
                  : "status"
              }
            >
              {chartMessage.type ===
              "success"
                ? "✓ "
                : "⚠ "}

              {chartMessage.text}
            </div>
          )}

          {/* =================================================
              BEFORE CHART
          ================================================= */}

          <Field label="Before Chart Image">
            <input
              type="file"
              name="beforeChart"
              accept="image/png,image/jpeg,image/webp"
              onChange={
                handleChange
              }
              disabled={
                saving ||
                Boolean(
                  removingChart
                )
              }
            />

            {form.beforeChart && (
              <small className="holding-selected-file">
                Selected:{" "}
                {
                  form.beforeChart
                    .name
                }
              </small>
            )}

            {(form.beforeChartUrl ||
              form.chartImageUrl) &&
              !form.beforeChart && (
                <div className="holding-existing-file-actions">
                  <a
                    href={
                      form.beforeChartUrl ||
                      form.chartImageUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    View existing before chart
                  </a>

                  <button
                    type="button"
                    className="holding-remove-file-button"
                    onClick={() =>
                      handleRemoveChart(
                        "before"
                      )
                    }
                    disabled={
                      saving ||
                      removingChart ===
                        "before"
                    }
                  >
                    {removingChart ===
                    "before"
                      ? "Removing..."
                      : "🗑 Remove Before Chart"}
                  </button>
                </div>
              )}
          </Field>

          {/* =================================================
              AFTER CHART
          ================================================= */}

          <Field label="After Chart Image">
            <input
              type="file"
              name="afterChart"
              accept="image/png,image/jpeg,image/webp"
              onChange={
                handleChange
              }
              disabled={
                saving ||
                Boolean(
                  removingChart
                )
              }
            />

            {form.afterChart && (
              <small className="holding-selected-file">
                Selected:{" "}
                {
                  form.afterChart
                    .name
                }
              </small>
            )}

            {form.afterChartUrl &&
              !form.afterChart && (
                <div className="holding-existing-file-actions">
                  <a
                    href={
                      form.afterChartUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    View existing after chart
                  </a>

                  <button
                    type="button"
                    className="holding-remove-file-button"
                    onClick={() =>
                      handleRemoveChart(
                        "after"
                      )
                    }
                    disabled={
                      saving ||
                      removingChart ===
                        "after"
                    }
                  >
                    {removingChart ===
                    "after"
                      ? "Removing..."
                      : "🗑 Remove After Chart"}
                  </button>
                </div>
              )}
          </Field>

          {/* BEFORE CAPTION */}

          <Field label="Before Chart Caption">
            <input
              type="text"
              name="beforeChartCaption"
              value={
                form.beforeChartCaption ||
                ""
              }
              onChange={
                handleChange
              }
              placeholder="Example: Initial setup before breakout"
            />
          </Field>

          {/* AFTER CAPTION */}

          <Field label="After Chart Caption">
            <input
              type="text"
              name="afterChartCaption"
              value={
                form.afterChartCaption ||
                ""
              }
              onChange={
                handleChange
              }
              placeholder="Example: Result after target achievement"
            />
          </Field>

          {/* =================================================
              RESEARCH PDF
          ================================================= */}

          <Field label="Research PDF">
            <input
              type="file"
              name="researchPdf"
              accept="application/pdf"
              onChange={
                handleChange
              }
              disabled={
                saving ||
                removingPdf
              }
            />

            {form.researchPdf && (
              <small className="holding-selected-file">
                Selected:{" "}
                {
                  form.researchPdf
                    .name
                }
              </small>
            )}

            {form.researchPdfUrl &&
              !form.researchPdf && (
                <div className="holding-existing-file-actions">
                  <a
                    href={
                      form.researchPdfUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    View existing PDF
                  </a>

                  <button
                    type="button"
                    className="holding-remove-file-button"
                    onClick={
                      handleRemoveResearchPdf
                    }
                    disabled={
                      removingPdf
                    }
                  >
                    {removingPdf
                      ? "Removing..."
                      : "🗑 Remove PDF"}
                  </button>
                </div>
              )}
          </Field>

          {/* =================================================
              THESIS
          ================================================= */}

          <div className="holding-field holding-field-full">
            <label>
              Trade Thesis / Notes
            </label>

            <textarea
              name="thesis"
              value={
                form.thesis ||
                ""
              }
              onChange={
                handleChange
              }
              placeholder="Explain the setup, structure and reasoning..."
              rows={5}
            />
          </div>
        </div>

        {/* ===================================================
            ACTIONS
        =================================================== */}

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
            onClick={
              handleSubmit
            }
            disabled={
              saving ||
              fetchingCMP
            }
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

        {/* ===================================================
            DELETE CHART CONFIRMATION
        =================================================== */}

        {chartToRemove && (
          <div
            className="holding-confirm-overlay"
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                  event.currentTarget &&
                !removingChart
              ) {
                setChartToRemove(
                  null
                );
              }
            }}
          >
            <div
              className="holding-confirm-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="holding-confirm-title"
            >
              <div className="holding-confirm-icon">
                🗑️
              </div>

              <h3 id="holding-confirm-title">
                Remove{" "}
                {
                  chartToRemove.chartLabel
                }
                ?
              </h3>

              <p>
                The image will immediately
                disappear from the public and
                subscriber study pages. This
                action cannot be undone.
              </p>

              <div className="holding-confirm-actions">
                <button
                  type="button"
                  className="holding-confirm-cancel"
                  onClick={() =>
                    setChartToRemove(
                      null
                    )
                  }
                  disabled={
                    Boolean(
                      removingChart
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="holding-confirm-delete"
                  onClick={
                    confirmRemoveChart
                  }
                  disabled={
                    Boolean(
                      removingChart
                    )
                  }
                >
                  {removingChart
                    ? "Removing..."
                    : "Delete Image"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   FIELD COMPONENT
========================================================= */

function Field({
  label,
  children,
}) {
  return (
    <div className="holding-field">
      <label>{label}</label>

      {children}
    </div>
  );
}