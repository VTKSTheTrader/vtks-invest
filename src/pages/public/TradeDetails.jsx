import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useParams,
} from "react-router-dom";

import {
  getHoldings,
  mapHoldingFromDB,
} from "../../services/holdingService";

import "./TradeDetails.css";

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const REALISED_STATUSES = [
  "booked profit",
  "booked loss",
  "breakeven",
  "sl hit",
];

export default function TradeDetails() {
  const { id } = useParams();
  const { pathname } = useLocation();

  const isSubscriberView =
    pathname.startsWith(
      "/dashboard/trade/"
    );

  const [trade, setTrade] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [selectedChart, setSelectedChart] =
    useState(null);

  /* =========================================================
     LOAD
  ========================================================= */

  useEffect(() => {
    loadTrade();
  }, [
    id,
    isSubscriberView,
  ]);

  /* =========================================================
     ESCAPE CLOSES CHART
  ========================================================= */

  useEffect(() => {
    const handleEscape = (
      event
    ) => {
      if (
        event.key === "Escape"
      ) {
        setSelectedChart(null);
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  /* =========================================================
     LOAD TRADE
  ========================================================= */

  const loadTrade = async () => {
    try {
      setLoading(true);

      const rows =
        await getHoldings();

      const selected = (
        rows || []
      )
        .map(
          mapHoldingFromDB
        )
        .find(
          (item) =>
            String(
              item.id
            ) ===
            String(id)
        );

      if (!selected) {
        setTrade(null);
        return;
      }

      const visibility =
        normalize(
          selected.visibility
        );

      const publishStatus =
        normalize(
          selected.publishStatus ||
            selected.publish_status
        );

      const tradeStatus =
        normalize(
          selected.tradeStatus ||
            selected.trade_status
        );

      /* =====================================================
         ALWAYS BLOCK
      ===================================================== */

      if (
        publishStatus === "draft" ||
        tradeStatus === "cancelled"
      ) {
        setTrade(null);
        return;
      }

      /* =====================================================
         ACCESS CONTROL

         PUBLIC ROUTE:
         - Public
         - Revealed Subscriber
         - Revealed Community

         SUBSCRIBER ROUTE:
         - Public
         - Subscriber
         - Community

         PRIVATE:
         - Never publicly accessible
      ===================================================== */

      const isPublicStudy =
        visibility === "public";

      const isMemberStudy =
        visibility ===
          "subscriber" ||
        visibility ===
          "community";

      const isRevealedMemberStudy =
        isMemberStudy &&
        selected.accuracyBlur ===
          false;

      const canViewPublicly =
        isPublicStudy ||
        isRevealedMemberStudy;

      const canViewAsSubscriber =
        [
          "public",
          "subscriber",
          "community",
        ].includes(
          visibility
        );

      const hasAccess =
        isSubscriberView
          ? canViewAsSubscriber
          : canViewPublicly;

      if (!hasAccess) {
        setTrade(null);
        return;
      }

      setTrade(selected);
    } catch (error) {
      console.error(
        "Market study load error:",
        error
      );

      alert(
        error?.message ||
          "Failed to load market study"
      );

      setTrade(null);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     STATUS

     Final manually saved outcomes always
     override target/CMP calculations.
  ========================================================= */

  const getStatus = (
    holding
  ) => {
    const manualStatus =
      normalize(
        holding.tradeStatus ||
          holding.trade_status ||
          holding.status
      );

    const supportedStatuses = [
      "active",
      "target 1 hit",
      "target 2 hit",
      "target 3 hit",
      "booked profit",
      "booked loss",
      "breakeven",
      "sl hit",
      "cancelled",
    ];

    if (
      manualStatus &&
      manualStatus !== "active" &&
      supportedStatuses.includes(
        manualStatus
      )
    ) {
      return manualStatus;
    }

    const highestPrice =
      Number(
        holding.highestPrice ??
          holding.highest_price ??
          holding.cmp ??
          0
      );

    const lowestPrice =
      Number(
        holding.lowestPrice ??
          holding.lowest_price ??
          holding.cmp ??
          0
      );

    const stopLoss =
      Number(
        holding.stopLoss ??
          holding.stop_loss ??
          0
      );

    const target1 =
      Number(
        holding.target1 ??
          holding.target_1 ??
          0
      );

    const target2 =
      Number(
        holding.target2 ??
          holding.target_2 ??
          0
      );

    const target3 =
      Number(
        holding.target3 ??
          holding.target_3 ??
          0
      );

    if (
      stopLoss > 0 &&
      lowestPrice <=
        stopLoss
    ) {
      return "sl hit";
    }

    if (
      target3 > 0 &&
      highestPrice >=
        target3
    ) {
      return "target 3 hit";
    }

    if (
      target2 > 0 &&
      highestPrice >=
        target2
    ) {
      return "target 2 hit";
    }

    if (
      target1 > 0 &&
      highestPrice >=
        target1
    ) {
      return "target 1 hit";
    }

    return "active";
  };

  /* =========================================================
     FORMAT STATUS
  ========================================================= */

  const formatStatus = (
    value
  ) =>
    String(value || "")
      .split(" ")
      .map(
        (word) =>
          word
            .charAt(0)
            .toUpperCase() +
          word.slice(1)
      )
      .join(" ");

  /* =========================================================
     ROI
  ========================================================= */

  const getReturn = (
    holding
  ) => {
    const entry =
      Number(
        holding.entry || 0
      );

    if (!entry) {
      return 0;
    }

    const tradeStatus =
      getStatus(holding);

    const isRealisedTrade =
      REALISED_STATUSES.includes(
        tradeStatus
      );

    const realisedReturn =
      holding.realisedReturn ??
      holding.realised_return;

    if (
      isRealisedTrade &&
      realisedReturn !== null &&
      realisedReturn !==
        undefined &&
      realisedReturn !== ""
    ) {
      const parsedReturn =
        Number(
          realisedReturn
        );

      if (
        Number.isFinite(
          parsedReturn
        )
      ) {
        return parsedReturn;
      }
    }

    const exitPrice =
      holding.exitPrice ??
      holding.exit_price;

    if (
      isRealisedTrade &&
      exitPrice !== null &&
      exitPrice !==
        undefined &&
      exitPrice !== ""
    ) {
      const parsedExitPrice =
        Number(
          exitPrice
        );

      if (
        Number.isFinite(
          parsedExitPrice
        ) &&
        parsedExitPrice > 0
      ) {
        return (
          (
            parsedExitPrice -
            entry
          ) /
          entry
        ) * 100;
      }
    }

    const cmp =
      Number(
        holding.cmp ||
          entry
      );

    return (
      (
        cmp -
        entry
      ) /
      entry
    ) * 100;
  };

  /* =========================================================
     CURRENCY
  ========================================================= */

  const formatCurrency = (
    value
  ) => {
    const number =
      Number(
        value || 0
      );

    if (!number) {
      return "-";
    }

    return `₹${number.toLocaleString(
      "en-IN",
      {
        maximumFractionDigits:
          2,
      }
    )}`;
  };

  /* =========================================================
     DATE
  ========================================================= */

  const formatDate = (
    value
  ) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(
        `${value}T00:00:00`
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* =========================================================
     STATUS CLASS
  ========================================================= */

  const getStatusClass = (
    status
  ) => {
    if (
      status === "active"
    ) {
      return "trade-status-active";
    }

    if (
      status ===
        "booked loss" ||
      status ===
        "sl hit"
    ) {
      return "trade-status-loss";
    }

    if (
      status ===
        "booked profit"
    ) {
      return "trade-status-booked";
    }

    if (
      status ===
        "breakeven"
    ) {
      return "trade-status-neutral";
    }

    if (
      status ===
        "cancelled"
    ) {
      return "trade-status-cancelled";
    }

    if (
      status.includes(
        "target"
      )
    ) {
      return "trade-status-target";
    }

    return "trade-status-neutral";
  };

  /* =========================================================
     STATUS LABEL
  ========================================================= */

  const getStatusLabel = (
    status
  ) => {
    if (
      status ===
        "booked profit"
    ) {
      return "📈 Positive Outcome";
    }

    if (
      status ===
        "booked loss"
    ) {
      return "📉 Negative Outcome";
    }

    if (
      status ===
        "breakeven"
    ) {
      return "⚖️ Neutral Outcome";
    }

    if (
      status ===
        "sl hit"
    ) {
      return "⚠️ Risk Level Reached";
    }

    if (
      status ===
        "target 1 hit"
    ) {
      return "✓ Study Zone 1 Reached";
    }

    if (
      status ===
        "target 2 hit"
    ) {
      return "✓ Study Zone 2 Reached";
    }

    if (
      status ===
        "target 3 hit"
    ) {
      return "✓ Study Zone 3 Reached";
    }

    if (
      status ===
        "active"
    ) {
      return "🟢 Ongoing Study";
    }

    if (
      status ===
        "cancelled"
    ) {
      return "Study Closed";
    }

    return formatStatus(
      status
    );
  };

  /* =========================================================
     VISIBILITY
  ========================================================= */

  const getVisibilityClass = (
    visibility
  ) => {
    const value =
      normalize(
        visibility
      );

    if (
      value ===
        "subscriber" ||
      value ===
        "community"
    ) {
      return "trade-visibility-subscriber";
    }

    if (
      value === "private"
    ) {
      return "trade-visibility-private";
    }

    return "trade-visibility-public";
  };

  const getVisibilityLabel = (
    holding
  ) => {
    const visibility =
      normalize(
        holding.visibility
      );

    const isRevealedMemberStudy =
      (
        visibility ===
          "subscriber" ||
        visibility ===
          "community"
      ) &&
      holding.accuracyBlur ===
        false;

    if (
      isRevealedMemberStudy
    ) {
      return "⭐ Featured Member Study";
    }

    if (
      visibility ===
        "subscriber" ||
      visibility ===
        "community"
    ) {
      return "⭐ Member Study";
    }

    if (
      visibility ===
        "private"
    ) {
      return "🔒 Private Study";
    }

    return "🌐 Published Market Study";
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="trade-state-page">
        <div className="trade-loader" />

        <p>
          Loading market study...
        </p>
      </main>
    );
  }

  /* =========================================================
     NOT FOUND
  ========================================================= */

  if (!trade) {
    return (
      <main className="trade-state-page">
        <div className="trade-not-found-card">
          <span>
            📭
          </span>

          <h1>
            Trade Not Found
          </h1>

          <p>
            This market study may
            have been removed,
            protected or is no
            longer available.
          </p>

          <Link
            to={
              isSubscriberView
                ? "/dashboard"
                : "/funds"
            }
            className="trade-primary-button"
          >
            {isSubscriberView
              ? "Back to Dashboard"
              : "Back to Ideas"}
          </Link>
        </div>
      </main>
    );
  }

  /* =========================================================
     DISPLAY VALUES
  ========================================================= */

  const status =
    getStatus(trade);

  const isRealisedTrade =
    REALISED_STATUSES.includes(
      status
    );

  const isLossOutcome =
    status ===
      "booked loss" ||
    status ===
      "sl hit";

  const isProfitOutcome =
    status ===
      "booked profit";

  const savedExitPrice =
    trade.exitPrice ??
    trade.exit_price;

  const displayPrice =
    isRealisedTrade
      ? savedExitPrice ||
        trade.cmp
      : trade.cmp;

  const roi =
    getReturn(trade);

  const isPositive =
    roi >= 0;

  const roiLabel =
    isLossOutcome
      ? "Recorded Change"
      : isProfitOutcome
        ? "Recorded Change"
        : status ===
            "breakeven"
          ? "Recorded Change"
          : "Price Change";

  const priceLabel =
    isRealisedTrade
      ? "Closing Price"
      : "Current Price";

  const backPath =
    isSubscriberView
      ? "/dashboard"
      : "/funds";

  /* =========================================================
     TARGET ACHIEVEMENTS
  ========================================================= */

  const highestPrice =
    Number(
      trade.highestPrice ??
        trade.highest_price ??
        trade.cmp ??
        0
    );

  const lowestPrice =
    Number(
      trade.lowestPrice ??
        trade.lowest_price ??
        trade.cmp ??
        0
    );

  const target1 =
    Number(
      trade.target1 ||
        0
    );

  const target2 =
    Number(
      trade.target2 ||
        0
    );

  const stopLoss =
    Number(
      trade.stopLoss ||
        0
    );

  const target1Reached =
    target1 > 0 &&
    (
      highestPrice >=
        target1 ||
      [
        "target 1 hit",
        "target 2 hit",
        "target 3 hit",
      ].includes(
        status
      )
    );

  const target2Reached =
    target2 > 0 &&
    (
      highestPrice >=
        target2 ||
      [
        "target 2 hit",
        "target 3 hit",
      ].includes(
        status
      )
    );

  const stopLossReached =
    stopLoss > 0 &&
    (
      lowestPrice <=
        stopLoss ||
      status ===
        "sl hit"
    );

  /* =========================================================
     CHARTS
  ========================================================= */

  const beforeChartUrl =
    trade.beforeChartUrl ||
    trade.chartImageUrl ||
    "";

  const afterChartUrl =
    trade.afterChartUrl ||
    "";

  const hasChartComparison =
    Boolean(
      beforeChartUrl ||
        afterChartUrl
    );

  /* =========================================================
     METRIC CARDS
  ========================================================= */

  const metricCards = [
    {
      label:
        "Recorded Price",

      value:
        formatCurrency(
          trade.entry
        ),

      icon: "🎯",
    },

    {
      label:
        priceLabel,

      value:
        formatCurrency(
          displayPrice
        ),

      icon:
        isLossOutcome
          ? "📉"
          : isRealisedTrade
            ? "✅"
            : "📈",

      tone:
        isLossOutcome
          ? "loss"
          : "",
    },

    {
      label:
        "Risk Level",

      value:
        `${formatCurrency(
          trade.stopLoss
        )}${
          stopLossReached
            ? " ⚠️"
            : ""
        }`,

      icon:
        "🛡️",

      tone:
        "loss",
    },

    {
      label:
        "Study Zone 1",

      value:
        `${formatCurrency(
          trade.target1
        )}${
          target1Reached
            ? " ✓"
            : ""
        }`,

      icon:
        "1️⃣",
    },

    {
      label:
        "Study Zone 2",

      value:
        `${formatCurrency(
          trade.target2
        )}${
          target2Reached
            ? " ✓"
            : ""
        }`,

      icon:
        "2️⃣",
    },

    {
      label:
        "Study Published",

      value:
        formatDate(
          trade.recommendationDate ||
            trade.recommendation_date
        ),

      icon:
        "📅",
    },

    {
      label:
        "Study Closed",

      value:
        isRealisedTrade
          ? formatDate(
              trade.exitDate ||
                trade.exit_date
            )
          : "-",

      icon:
        "📆",
    },

    {
      label:
        "Study Horizon",

      value:
        trade.tradeType ||
        trade.trade_type ||
        "Swing",

      icon:
        "📊",
    },
  ];

  /* =========================================================
     UI
  ========================================================= */

  return (
    <main className="trade-details-page">
      <div className="trade-details-container">

        {/* BACK */}

        <Link
          to={backPath}
          className="trade-back-link"
        >
          ←{" "}
          {isSubscriberView
            ? "Back to Dashboard"
            : "Back to Ideas"}
        </Link>

        {/* ===================================================
            HERO
        =================================================== */}

        <section className="trade-hero-card">

          <div className="trade-hero-content">

            <div className="trade-badge-row">

              {/* STATUS */}

              <span
                className={`trade-status-badge ${getStatusClass(
                  status
                )}`}
              >
                {getStatusLabel(
                  status
                )}
              </span>

              {/* VISIBILITY */}

              <span
                className={`trade-visibility-badge ${getVisibilityClass(
                  trade.visibility
                )}`}
              >
                {getVisibilityLabel(
                  trade
                )}
              </span>

              {/* CATEGORY */}

              <span className="trade-market-category-badge">
                {trade.marketCategory ||
                  "Other"}
              </span>

            </div>

            {/* STOCK */}

            <h1>
              {trade.stock ||
                "Market Study"}
            </h1>

            <p>
              {trade.sector ||
                "General"}

              <span>
                •
              </span>

              {trade.tradeType ||
                "Swing"}

              {trade.tradingviewSymbol && (
                <>
                  <span>
                    •
                  </span>

                  {
                    trade.tradingviewSymbol
                  }
                </>
              )}
            </p>
          </div>

          {/* ROI */}

          <div
            className={`trade-roi-card ${
              isPositive
                ? "trade-roi-positive"
                : "trade-roi-negative"
            }`}
          >
            <span>
              {roiLabel}
            </span>

            <strong>
              {roi > 0
                ? "+"
                : ""}

              {roi.toFixed(
                2
              )}
              %
            </strong>

            <small>
              {formatCurrency(
                trade.entry
              )}{" "}
              →{" "}
              {formatCurrency(
                displayPrice
              )}
            </small>
          </div>
        </section>

        {/* ===================================================
            METRICS
        =================================================== */}

        <section className="trade-metrics-grid">
          {metricCards.map(
            (item) => (
              <article
                key={item.label}
                className={`trade-metric-card ${
                  item.tone ===
                  "loss"
                    ? "trade-metric-loss"
                    : ""
                }`}
              >
                <div className="trade-metric-icon">
                  {item.icon}
                </div>

                <div>
                  <span>
                    {item.label}
                  </span>

                  <strong>
                    {item.value}
                  </strong>
                </div>
              </article>
            )
          )}
        </section>

        {/* ===================================================
            CONTENT
        =================================================== */}

        <section className="trade-content-grid">

          {/* THESIS */}

          <article className="trade-section-card trade-thesis-card">

            <div className="trade-section-heading">
              <div>
                <span>
                  📝
                </span>

                <div>
                  <h2>
                    Market Study Thesis
                  </h2>

                  <p>
                    Setup, structure and
                    reasoning shared by VTKS.
                  </p>
                </div>
              </div>
            </div>

            <div className="trade-thesis-content">

              {trade.thesis ? (
                trade.thesis
                  .split("\n")
                  .filter(Boolean)
                  .map(
                    (
                      paragraph,
                      index
                    ) => (
                      <p
                        key={
                          index
                        }
                      >
                        {
                          paragraph
                        }
                      </p>
                    )
                  )
              ) : (
                <p>
                  Market study thesis
                  will be updated by
                  the VTKS team.
                </p>
              )}

            </div>
          </article>

          {/* SUMMARY */}

          <article className="trade-section-card trade-summary-card">

            <div className="trade-section-heading">
              <div>
                <span>
                  📌
                </span>

                <div>
                  <h2>
                    Study Summary
                  </h2>

                  <p>
                    Key classification
                    and access details.
                  </p>
                </div>
              </div>
            </div>

            <dl className="trade-summary-list">

              <div>
                <dt>
                  Status
                </dt>

                <dd>
                  {getStatusLabel(
                    status
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  Visibility
                </dt>

                <dd>
                  {getVisibilityLabel(
                    trade
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  Market Category
                </dt>

                <dd>
                  {trade.marketCategory ||
                    "Other"}
                </dd>
              </div>

              <div>
                <dt>
                  Sector
                </dt>

                <dd>
                  {trade.sector ||
                    "General"}
                </dd>
              </div>

              <div>
                <dt>
                  Published
                </dt>

                <dd>
                  {trade.publishStatus ||
                    "Published"}
                </dd>
              </div>

              <div>
                <dt>
                  Featured
                </dt>

                <dd>
                  {trade.featured
                    ? "Yes"
                    : "No"}
                </dd>
              </div>

            </dl>
          </article>

        </section>

        {/* ===================================================
            CHARTS
        =================================================== */}

        {hasChartComparison && (
          <section className="trade-section-card trade-chart-comparison-section">

            <div className="trade-section-heading">
              <div>
                <span>
                  📊
                </span>

                <div>
                  <h2>
                    Before & After Chart Analysis
                  </h2>

                  <p>
                    Compare the original setup
                    with the later market outcome.
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`trade-chart-comparison-grid ${
                beforeChartUrl &&
                afterChartUrl
                  ? ""
                  : "trade-chart-single"
              }`}
            >

              {/* BEFORE */}

              {beforeChartUrl && (
                <article className="trade-comparison-card">

                  <div className="trade-comparison-card-header">

                    <div>
                      <span className="trade-comparison-label trade-before-label">
                        Before
                      </span>

                      <h3>
                        Original Study
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedChart({
                          url:
                            beforeChartUrl,

                          title:
                            "Before Chart",
                        })
                      }
                      className="trade-chart-open-button"
                    >
                      View Full Size
                    </button>
                  </div>

                  {trade.beforeChartCaption && (
                    <p className="trade-chart-caption">
                      {
                        trade.beforeChartCaption
                      }
                    </p>
                  )}

                  <button
                    type="button"
                    className="trade-comparison-image-button"
                    onClick={() =>
                      setSelectedChart({
                        url:
                          beforeChartUrl,

                        title:
                          "Before Chart",
                      })
                    }
                  >
                    <img
                      src={
                        beforeChartUrl
                      }
                      alt={`${trade.stock} before analysis chart`}
                      loading="lazy"
                    />
                  </button>
                </article>
              )}

              {/* AFTER */}

              {afterChartUrl && (
                <article className="trade-comparison-card">

                  <div className="trade-comparison-card-header">

                    <div>
                      <span className="trade-comparison-label trade-after-label">
                        After
                      </span>

                      <h3>
                        Market Development
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedChart({
                          url:
                            afterChartUrl,

                          title:
                            "After Chart",
                        })
                      }
                      className="trade-chart-open-button"
                    >
                      View Full Size
                    </button>
                  </div>

                  {trade.afterChartCaption && (
                    <p className="trade-chart-caption">
                      {
                        trade.afterChartCaption
                      }
                    </p>
                  )}

                  <button
                    type="button"
                    className="trade-comparison-image-button"
                    onClick={() =>
                      setSelectedChart({
                        url:
                          afterChartUrl,

                        title:
                          "After Chart",
                      })
                    }
                  >
                    <img
                      src={
                        afterChartUrl
                      }
                      alt={`${trade.stock} after outcome chart`}
                      loading="lazy"
                    />
                  </button>
                </article>
              )}

            </div>
          </section>
        )}

        {/* ===================================================
            PDF
        =================================================== */}

        {trade.researchPdfUrl && (
          <section className="trade-section-card trade-research-section">

            <div className="trade-research-icon">
              📄
            </div>

            <div>
              <h2>
                Study Document Available
              </h2>

              <p>
                Open the detailed research PDF
                shared for this market study.
              </p>
            </div>

            <a
              href={
                trade.researchPdfUrl
              }
              target="_blank"
              rel="noreferrer"
              className="trade-primary-button"
            >
              View Study PDF
            </a>

          </section>
        )}

        {/* ===================================================
            DISCLAIMER
        =================================================== */}

        <section className="trade-disclaimer">

          <strong>
            Educational Disclosure
          </strong>

          <p>
            This market study is provided
            for educational and research
            purposes only. Please perform
            your own analysis and manage
            risk according to your financial
            objectives and risk tolerance.
          </p>

        </section>

      </div>

      {/* =====================================================
          CHART MODAL
      ===================================================== */}

      {selectedChart && (
        <div
          className="trade-chart-modal-backdrop"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedChart(
                null
              );
            }
          }}
        >
          <div
            className="trade-chart-modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              selectedChart.title
            }
          >

            <div className="trade-chart-modal-header">

              <h2>
                {
                  selectedChart.title
                }
              </h2>

              <button
                type="button"
                onClick={() =>
                  setSelectedChart(
                    null
                  )
                }
                aria-label="Close chart"
              >
                ×
              </button>

            </div>

            <img
              src={
                selectedChart.url
              }
              alt={
                selectedChart.title
              }
            />

          </div>
        </div>
      )}

    </main>
  );
}