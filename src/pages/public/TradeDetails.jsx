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

  useEffect(() => {
    loadTrade();
  }, [id, isSubscriberView]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
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

  const loadTrade = async () => {
    try {
      setLoading(true);

      const rows =
        await getHoldings();

      const selected = (rows || [])
        .map(mapHoldingFromDB)
        .find(
          (item) =>
            String(item.id) ===
            String(id)
        );

      if (!selected) {
        setTrade(null);
        return;
      }

      const visibility = normalize(
        selected.visibility
      );

      const publishStatus = normalize(
        selected.publishStatus ||
          selected.publish_status
      );

      const tradeStatus = normalize(
        selected.tradeStatus ||
          selected.trade_status
      );

      if (
        publishStatus === "draft" ||
        tradeStatus === "cancelled"
      ) {
        setTrade(null);
        return;
      }

      const allowedVisibilities =
        isSubscriberView
          ? [
              "public",
              "subscriber",
              "community",
            ]
          : ["public"];

      if (
        !allowedVisibilities.includes(
          visibility
        )
      ) {
        setTrade(null);
        return;
      }

      setTrade(selected);
    } catch (error) {
      console.error(
        "Trade details load error:",
        error
      );

      alert(
        error?.message ||
          "Failed to load trade details"
      );

      setTrade(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (holding) => {
    const manualStatus = normalize(
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

    const cmp = Number(
      holding.cmp || 0
    );

    const stopLoss = Number(
      holding.stopLoss ??
        holding.stop_loss ??
        0
    );

    const target1 = Number(
      holding.target1 ??
        holding.target_1 ??
        0
    );

    const target2 = Number(
      holding.target2 ??
        holding.target_2 ??
        0
    );

    const target3 = Number(
      holding.target3 ??
        holding.target_3 ??
        0
    );

    if (
      target3 > 0 &&
      cmp >= target3
    ) {
      return "target 3 hit";
    }

    if (
      target2 > 0 &&
      cmp >= target2
    ) {
      return "target 2 hit";
    }

    if (
      target1 > 0 &&
      cmp >= target1
    ) {
      return "target 1 hit";
    }

    if (
      stopLoss > 0 &&
      cmp <= stopLoss
    ) {
      return "sl hit";
    }

    return "active";
  };

  const formatStatus = (value) =>
    String(value || "")
      .split(" ")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");

  const getReturn = (holding) => {
    const entry = Number(
      holding.entry || 0
    );

    if (!entry) return 0;

    const tradeStatus =
      getStatus(holding);

    const completedStatuses = [
      "booked profit",
      "sl hit",
      "target 1 hit",
      "target 2 hit",
      "target 3 hit",
    ];

    const isCompletedTrade =
      completedStatuses.includes(
        tradeStatus
      );

    const realisedReturn =
      holding.realisedReturn ??
      holding.realised_return;

    if (
      isCompletedTrade &&
      realisedReturn !== null &&
      realisedReturn !== undefined &&
      realisedReturn !== ""
    ) {
      const parsedReturn = Number(
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
      isCompletedTrade &&
      exitPrice !== null &&
      exitPrice !== undefined &&
      exitPrice !== ""
    ) {
      const parsedExitPrice =
        Number(exitPrice);

      if (
        Number.isFinite(
          parsedExitPrice
        ) &&
        parsedExitPrice > 0
      ) {
        return (
          ((parsedExitPrice - entry) /
            entry) *
          100
        );
      }
    }

    const cmp = Number(
      holding.cmp || entry
    );

    return (
      ((cmp - entry) / entry) *
      100
    );
  };

  const formatCurrency = (value) => {
    const number = Number(
      value || 0
    );

    if (!number) return "-";

    return `₹${number.toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(
      `${value}T00:00:00`
    );

    if (
      Number.isNaN(date.getTime())
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

  const getStatusClass = (
    status
  ) => {
    if (status === "active") {
      return "trade-status-active";
    }

    if (status === "sl hit") {
      return "trade-status-loss";
    }

    if (
      status === "booked profit"
    ) {
      return "trade-status-booked";
    }

    if (status === "cancelled") {
      return "trade-status-cancelled";
    }

    if (
      status.includes("target")
    ) {
      return "trade-status-target";
    }

    return "trade-status-neutral";
  };

  const getVisibilityClass = (
    visibility
  ) => {
    const value =
      normalize(visibility);

    if (value === "subscriber") {
      return "trade-visibility-subscriber";
    }

    if (value === "private") {
      return "trade-visibility-private";
    }

    return "trade-visibility-public";
  };

  if (loading) {
    return (
      <main className="trade-state-page">
        <div className="trade-loader" />

        <p>
          Loading trade details...
        </p>
      </main>
    );
  }

  if (!trade) {
    return (
      <main className="trade-state-page">
        <div className="trade-not-found-card">
          <span>📭</span>

          <h1>
            Trade Not Found
          </h1>

          <p>
            This trade may have been
            removed or is no longer
            available.
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
              : "Back to Portfolio"}
          </Link>
        </div>
      </main>
    );
  }

  const status =
    getStatus(trade);

  const completedStatuses = [
    "booked profit",
    "sl hit",
    "target 1 hit",
    "target 2 hit",
    "target 3 hit",
  ];

  const isCompletedTrade =
    completedStatuses.includes(
      status
    );

  const savedExitPrice =
    trade.exitPrice ??
    trade.exit_price;

  const displayPrice =
    isCompletedTrade
      ? savedExitPrice || trade.cmp
      : trade.cmp;

  const roi = getReturn(trade);
  const isPositive = roi >= 0;

  const roiLabel =
    isCompletedTrade
      ? "Realised ROI"
      : "Current ROI";

  const priceLabel =
    isCompletedTrade
      ? "Exit Price"
      : "Current Market Price";

  const backPath =
    isSubscriberView
      ? "/dashboard"
      : "/funds";

  const beforeChartUrl =
    trade.beforeChartUrl ||
    trade.chartImageUrl ||
    "";

  const afterChartUrl =
    trade.afterChartUrl || "";

  const hasChartComparison =
    Boolean(
      beforeChartUrl ||
        afterChartUrl
    );

  const metricCards = [
    {
      label: "Entry Price",
      value: formatCurrency(
        trade.entry
      ),
      icon: "🎯",
    },
    {
      label: priceLabel,
      value: formatCurrency(
        displayPrice
      ),
      icon: isCompletedTrade
        ? "✅"
        : "📈",
    },
    {
      label: "Stop Loss",
      value: formatCurrency(
        trade.stopLoss
      ),
      icon: "🛡️",
      tone: "loss",
    },
    {
      label: "Target 1",
      value: formatCurrency(
        trade.target1
      ),
      icon: "1️⃣",
    },
    {
      label: "Target 2",
      value: formatCurrency(
        trade.target2
      ),
      icon: "2️⃣",
    },
    {
      label: "Target 3",
      value: formatCurrency(
        trade.target3
      ),
      icon: "3️⃣",
    },
    {
      label:
        "Recommendation Date",
      value: formatDate(
        trade.recommendationDate
      ),
      icon: "📅",
    },
    {
      label: "Trade Type",
      value:
        trade.tradeType ||
        "Trade",
      icon: "📊",
    },
  ];

  return (
    <main className="trade-details-page">
      <div className="trade-details-container">
        <Link
          to={backPath}
          className="trade-back-link"
        >
          ←{" "}
          {isSubscriberView
            ? "Back to Dashboard"
            : "Back to Portfolio"}
        </Link>

        <section className="trade-hero-card">
          <div className="trade-hero-content">
            <div className="trade-badge-row">
              <span
                className={`trade-status-badge ${getStatusClass(
                  status
                )}`}
              >
                {formatStatus(
                  status
                )}
              </span>

              <span
                className={`trade-visibility-badge ${getVisibilityClass(
                  trade.visibility
                )}`}
              >
                {normalize(
                  trade.visibility
                ) === "subscriber"
                  ? "⭐ Subscriber Trade"
                  : normalize(
                        trade.visibility
                      ) === "private"
                    ? "🔒 Private Trade"
                    : "🌐 Public Trade"}
              </span>

              <span className="trade-market-category-badge">
                {trade.marketCategory ||
                  "Other"}
              </span>
            </div>

            <h1>
              {trade.stock ||
                "Trade"}
            </h1>

            <p>
              {trade.sector ||
                "General"}

              <span>•</span>

              {trade.tradeType ||
                "Trade"}

              {trade.tradingviewSymbol && (
                <>
                  <span>•</span>

                  {
                    trade.tradingviewSymbol
                  }
                </>
              )}
            </p>
          </div>

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
              {isPositive ? "+" : ""}
              {roi.toFixed(2)}%
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

        <section className="trade-metrics-grid">
          {metricCards.map(
            (item) => (
              <article
                key={item.label}
                className={`trade-metric-card ${
                  item.tone === "loss"
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

        <section className="trade-content-grid">
          <article className="trade-section-card trade-thesis-card">
            <div className="trade-section-heading">
              <div>
                <span>📝</span>

                <div>
                  <h2>
                    Trade Thesis
                  </h2>

                  <p>
                    Setup, structure and
                    reasoning shared by
                    VTKS.
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
                      <p key={index}>
                        {paragraph}
                      </p>
                    )
                  )
              ) : (
                <p>
                  Trade thesis will be
                  updated by the VTKS
                  team.
                </p>
              )}
            </div>
          </article>

          <article className="trade-section-card trade-summary-card">
            <div className="trade-section-heading">
              <div>
                <span>📌</span>

                <div>
                  <h2>
                    Trade Summary
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
                <dt>Status</dt>

                <dd>
                  {formatStatus(
                    status
                  )}
                </dd>
              </div>

              <div>
                <dt>Visibility</dt>

                <dd>
                  {trade.visibility ||
                    "Public"}
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
                <dt>Sector</dt>

                <dd>
                  {trade.sector ||
                    "General"}
                </dd>
              </div>

              <div>
                <dt>Published</dt>

                <dd>
                  {trade.publishStatus ||
                    "Published"}
                </dd>
              </div>

              <div>
                <dt>Featured</dt>

                <dd>
                  {trade.featured
                    ? "Yes"
                    : "No"}
                </dd>
              </div>
            </dl>
          </article>
        </section>

        {hasChartComparison && (
          <section className="trade-section-card trade-chart-comparison-section">
            <div className="trade-section-heading">
              <div>
                <span>📊</span>

                <div>
                  <h2>
                    Before & After
                    Chart Analysis
                  </h2>

                  <p>
                    Compare the original
                    setup with the later
                    market outcome.
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
              {beforeChartUrl && (
                <article className="trade-comparison-card">
                  <div className="trade-comparison-card-header">
                    <div>
                      <span className="trade-comparison-label trade-before-label">
                        Before
                      </span>

                      <h3>
                        Initial Analysis
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedChart({
                          url: beforeChartUrl,
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
                        url: beforeChartUrl,
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

              {afterChartUrl && (
                <article className="trade-comparison-card">
                  <div className="trade-comparison-card-header">
                    <div>
                      <span className="trade-comparison-label trade-after-label">
                        After
                      </span>

                      <h3>
                        Market Outcome
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedChart({
                          url: afterChartUrl,
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
                        url: afterChartUrl,
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

        {trade.researchPdfUrl && (
          <section className="trade-section-card trade-research-section">
            <div className="trade-research-icon">
              📄
            </div>

            <div>
              <h2>
                Research Report
                Available
              </h2>

              <p>
                Open the detailed
                research PDF shared for
                this trade.
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
              View Research PDF
            </a>
          </section>
        )}

        <section className="trade-disclaimer">
          <strong>
            Educational Disclosure
          </strong>

          <p>
            This trade information is
            provided for educational and
            research purposes. Please
            perform your own analysis and
            manage risk according to your
            financial situation.
          </p>
        </section>
      </div>

      {selectedChart && (
        <div
          className="trade-chart-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedChart(null);
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
                {selectedChart.title}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setSelectedChart(null)
                }
                aria-label="Close chart"
              >
                ×
              </button>
            </div>

            <img
              src={selectedChart.url}
              alt={selectedChart.title}
            />
          </div>
        </div>
      )}
    </main>
  );
}