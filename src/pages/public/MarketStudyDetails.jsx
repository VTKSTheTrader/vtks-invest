import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getHoldings,
  mapHoldingFromDB,
} from "../../services/holdingService";

import "./MarketStudyDetails.css";

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const CLOSED_STATUSES = [
  "booked profit",
  "booked loss",
  "breakeven",
  "sl hit",
];

export default function MarketStudyDetails() {
  const { id } = useParams();

  const [study, setStudy] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [
    selectedChart,
    setSelectedChart,
  ] = useState(null);

  /* =========================================================
     LOAD
  ========================================================= */

  useEffect(() => {
    loadStudy();
  }, [id]);

  /* =========================================================
     ESCAPE CLOSE CHART
  ========================================================= */

  useEffect(() => {
    const handleEscape = (
      event
    ) => {
      if (
        event.key === "Escape"
      ) {
        setSelectedChart(
          null
        );
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
     LOAD STUDY
  ========================================================= */

  const loadStudy = async () => {
    try {
      setLoading(true);

      const rows =
        await getHoldings();

      console.log(
        "MarketStudy rows:",
        rows
      );

      console.log(
        "Requested ID:",
        id
      );

      const mappedRows = (
        rows || []
      ).map(
        mapHoldingFromDB
      );

      console.log(
        "Mapped MarketStudy rows:",
        mappedRows
      );

      const selected =
        mappedRows.find(
          (item) =>
            String(
              item.id
            ) ===
            String(id)
        );

      console.log(
        "Selected MarketStudy:",
        selected
      );

      if (!selected) {
        setStudy(null);
        return;
      }

      /* =====================================================
         TEST PAGE ACCESS

         This is a separate experimental page.

         Do not apply the existing public/subscriber
         visibility restriction here.

         Only draft and cancelled records are blocked.
      ===================================================== */

      const publishStatus =
        normalize(
          selected.publishStatus ||
            selected.publish_status
        );

      const tradeStatus =
        normalize(
          selected.tradeStatus ||
            selected.trade_status ||
            selected.status
        );

      if (
        publishStatus ===
          "draft" ||
        tradeStatus ===
          "cancelled"
      ) {
        setStudy(null);
        return;
      }

      setStudy(selected);
    } catch (error) {
      console.error(
        "Market study load error:",
        error
      );

      alert(
        error?.message ||
          "Failed to load market study"
      );

      setStudy(null);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     FORMAT CURRENCY
  ========================================================= */

  const formatCurrency = (
    value
  ) => {
    const number =
      Number(value || 0);

    if (
      !Number.isFinite(
        number
      )
    ) {
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
     FORMAT DATE
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
     STATUS
  ========================================================= */

  const rawStatus =
    useMemo(() => {
      if (!study) {
        return "";
      }

      return normalize(
        study.tradeStatus ||
          study.trade_status ||
          study.status
      );
    }, [study]);

  const isClosed =
    useMemo(
      () =>
        CLOSED_STATUSES.includes(
          rawStatus
        ),
      [rawStatus]
    );

  /* =========================================================
     DISPLAY PRICE
  ========================================================= */

  const displayPrice =
    useMemo(() => {
      if (!study) {
        return 0;
      }

      if (isClosed) {
        return Number(
          study.exitPrice ??
            study.exit_price ??
            study.cmp ??
            0
        );
      }

      return Number(
        study.cmp || 0
      );
    }, [
      study,
      isClosed,
    ]);

  /* =========================================================
     REFERENCE PRICE
  ========================================================= */

  const referencePrice =
    useMemo(
      () =>
        Number(
          study?.entry || 0
        ),
      [study]
    );

  /* =========================================================
     PRICE MOVEMENT
  ========================================================= */

  const movement =
    useMemo(() => {
      if (!referencePrice) {
        return {
          amount: 0,
          percent: 0,
        };
      }

      const amount =
        displayPrice -
        referencePrice;

      const percent =
        (
          amount /
          referencePrice
        ) * 100;

      return {
        amount,
        percent,
      };
    }, [
      displayPrice,
      referencePrice,
    ]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="msd-state-page">

        <div className="msd-loader" />

        <p>
          Loading market study...
        </p>

      </main>
    );
  }

  /* =========================================================
     NOT FOUND
  ========================================================= */

  if (!study) {
    return (
      <main className="msd-state-page">

        <div className="msd-not-found">

          <span>
            📭
          </span>

          <h1>
            Market Study Not Found
          </h1>

          <p>
            This study may be
            private, unpublished,
            removed or no longer
            available.
          </p>

          <Link
            to="/funds"
            className="msd-primary-button"
          >
            Back to Market Studies
          </Link>

        </div>

      </main>
    );
  }

  /* =========================================================
     DISPLAY VALUES
  ========================================================= */

  const studyStatus =
    isClosed
      ? "Historical Review"
      : "Ongoing Study";

  const publishedDate =
    study.recommendationDate ||
    study.recommendation_date;

  const endDate =
    study.exitDate ||
    study.exit_date;

  const stockName =
    study.stock ||
    study.symbol ||
    "Market Study";

  const exchange =
    study.exchange ||
    "NSE";

  const symbol =
    study.tradingviewSymbol ||
    study.tradingview_symbol ||
    study.symbol ||
    stockName;

  const sector =
    study.sector ||
    "General";

  const studyHorizon =
    study.tradeType ||
    study.trade_type ||
    "Swing";

  const marketCategory =
    study.marketCategory ||
    study.market_category ||
    "Other";

  const isPositive =
    movement.percent >= 0;

  /* =========================================================
     CHARTS
  ========================================================= */

  const beforeChartUrl =
    study.beforeChartUrl ||
    study.before_chart_url ||
    study.chartImageUrl ||
    study.chart_image_url ||
    "";

  const afterChartUrl =
    study.afterChartUrl ||
    study.after_chart_url ||
    "";

  const hasCharts =
    Boolean(
      beforeChartUrl ||
        afterChartUrl
    );

  /* =========================================================
     DYNAMIC OVERVIEW
     NO NEW ADMIN FIELD REQUIRED
  ========================================================= */

  const overviewText =
    `This market study was published on ${formatDate(
      publishedDate
    )} when ${stockName} was observed around ${formatCurrency(
      referencePrice
    )}. The information is presented as an educational market observation under the VTKS framework and is intended for research and learning purposes.`;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <main className="msd-page">

      <div className="msd-container">

        {/* BACK */}

        <Link
          to="/funds"
          className="msd-back-link"
        >
          ← Back to Market Studies
        </Link>

        {/* ===================================================
            HERO
        =================================================== */}

        <section className="msd-hero">

          <div className="msd-hero-left">

            <div className="msd-badge-row">

              <span className="msd-badge msd-badge-green">
                ● {studyStatus}
              </span>

              <span className="msd-badge msd-badge-blue">
                ◉ Published Market Study
              </span>

              <span className="msd-badge msd-badge-purple">
                {marketCategory}
              </span>

            </div>

            <h1>
              {stockName}
            </h1>

            <p className="msd-hero-meta">

              {exchange}:{symbol}

              <span>
                •
              </span>

              {sector}

              <span>
                •
              </span>

              {studyHorizon}

            </p>

            <div className="msd-hero-note">

              <span>
                📅
              </span>

              <span>
                Study published on{" "}

                <strong>
                  {formatDate(
                    publishedDate
                  )}
                </strong>
              </span>

            </div>

            <p className="msd-hero-disclosure">
              Educational market study
              only. Not a buy/sell
              recommendation or
              investment advice.
            </p>

          </div>

          {/* PRICE */}

          <div className="msd-hero-price-card">

            <span>
              {isClosed
                ? "Closing Reference Price"
                : "Latest Market Price"}
            </span>

            <strong>
              {formatCurrency(
                displayPrice
              )}
            </strong>

            <div className="msd-hero-divider" />

            <small>
              Price movement since
              publication
            </small>

            <b
              className={
                isPositive
                  ? "msd-positive"
                  : "msd-negative"
              }
            >
              {movement.percent >
              0
                ? "+"
                : ""}

              {movement.percent.toFixed(
                2
              )}
              %
            </b>

          </div>

        </section>

        {/* ===================================================
            METRICS
        =================================================== */}

        <section className="msd-metrics">

          {/* PUBLICATION PRICE */}

          <article className="msd-metric-card">

            <div className="msd-icon msd-icon-blue">
              📘
            </div>

            <div>

              <span>
                Study Reference Price
              </span>

              <strong>
                {formatCurrency(
                  referencePrice
                )}
              </strong>

              <small>
                {formatDate(
                  publishedDate
                )}
              </small>

            </div>

          </article>

          {/* CURRENT PRICE */}

          <article className="msd-metric-card">

            <div className="msd-icon msd-icon-green">
              📈
            </div>

            <div>

              <span>
                {isClosed
                  ? "Closing Reference Price"
                  : "Latest Market Price"}
              </span>

              <strong>
                {formatCurrency(
                  displayPrice
                )}
              </strong>

              <small>
                {isClosed &&
                endDate
                  ? formatDate(
                      endDate
                    )
                  : "Current observation"}
              </small>

            </div>

          </article>

          {/* MOVEMENT */}

          <article className="msd-metric-card">

            <div className="msd-icon msd-icon-purple">
              ◉
            </div>

            <div>

              <span>
                Price Movement
              </span>

              <strong
                className={
                  isPositive
                    ? "msd-positive"
                    : "msd-negative"
                }
              >
                {movement.percent >
                0
                  ? "+"
                  : ""}

                {movement.percent.toFixed(
                  2
                )}
                %
              </strong>

              <small>
                Since publication
              </small>

            </div>

          </article>

          {/* HORIZON */}

          <article className="msd-metric-card">

            <div className="msd-icon msd-icon-orange">
              ⏳
            </div>

            <div>

              <span>
                Study Horizon
              </span>

              <strong>
                {studyHorizon}
              </strong>

              <small>
                {studyStatus}
              </small>

            </div>

          </article>

        </section>

        {/* ===================================================
            OVERVIEW + INFORMATION
        =================================================== */}

        <section className="msd-two-column">

          {/* OVERVIEW */}

          <article className="msd-panel">

            <div className="msd-section-title">

              <span>
                📖
              </span>

              <div>

                <h2>
                  Market Study Overview
                </h2>

                <p>
                  Educational overview
                  generated from saved
                  study information.
                </p>

              </div>

            </div>

            <p className="msd-overview-text">
              {overviewText}
            </p>

            <div className="msd-info-box">
              ⓘ All observations are
              presented for educational
              and research review only.
            </div>

          </article>

          {/* INFO */}

          <article className="msd-panel">

            <div className="msd-section-title">

              <span>
                ℹ️
              </span>

              <div>

                <h2>
                  Study Information
                </h2>

                <p>
                  Classification and
                  publication details.
                </p>

              </div>

            </div>

            <dl className="msd-study-info">

              <div>

                <dt>
                  Instrument
                </dt>

                <dd>
                  {stockName}
                </dd>

              </div>

              <div>

                <dt>
                  Exchange
                </dt>

                <dd>
                  {exchange}
                </dd>

              </div>

              <div>

                <dt>
                  Sector
                </dt>

                <dd>
                  {sector}
                </dd>

              </div>

              <div>

                <dt>
                  Category
                </dt>

                <dd>
                  {marketCategory}
                </dd>

              </div>

              <div>

                <dt>
                  Study Horizon
                </dt>

                <dd>
                  {studyHorizon}
                </dd>

              </div>

              <div>

                <dt>
                  Published
                </dt>

                <dd>
                  {formatDate(
                    publishedDate
                  )}
                </dd>

              </div>

              <div>

                <dt>
                  Status
                </dt>

                <dd>

                  <span className="msd-status-dot" />

                  {studyStatus}

                </dd>

              </div>

            </dl>

          </article>

        </section>

        {/* ===================================================
            CHARTS
        =================================================== */}

        {hasCharts && (
          <section className="msd-panel">

            <div className="msd-section-title">

              <span>
                📊
              </span>

              <div>

                <h2>
                  Market Structure Review
                </h2>

                <p>
                  Original observation
                  compared with subsequent
                  market development.
                </p>

              </div>

            </div>

            <div
              className={`msd-chart-grid ${
                beforeChartUrl &&
                afterChartUrl
                  ? ""
                  : "msd-chart-grid-single"
              }`}
            >

              {/* BEFORE */}

              {beforeChartUrl && (
                <article className="msd-chart-card">

                  <div className="msd-chart-card-header">

                    <div>

                      <span className="msd-chart-label msd-before-label">
                        ORIGINAL
                      </span>

                      <h3>
                        Original Market
                        Observation
                      </h3>

                      <small>
                        Published{" "}
                        {formatDate(
                          publishedDate
                        )}
                      </small>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedChart(
                          {
                            url:
                              beforeChartUrl,

                            title:
                              "Original Market Observation",
                          }
                        )
                      }
                    >
                      View Full Size
                    </button>

                  </div>

                  {study.beforeChartCaption && (
                    <p className="msd-chart-caption">
                      {
                        study.beforeChartCaption
                      }
                    </p>
                  )}

                  <button
                    type="button"
                    className="msd-image-button"
                    onClick={() =>
                      setSelectedChart(
                        {
                          url:
                            beforeChartUrl,

                          title:
                            "Original Market Observation",
                        }
                      )
                    }
                  >
                    <img
                      src={
                        beforeChartUrl
                      }
                      alt={`${stockName} original market observation`}
                      loading="lazy"
                    />
                  </button>

                </article>
              )}

              {/* AFTER */}

              {afterChartUrl && (
                <article className="msd-chart-card">

                  <div className="msd-chart-card-header">

                    <div>

                      <span className="msd-chart-label msd-after-label">
                        UPDATE
                      </span>

                      <h3>
                        Subsequent Market
                        Development
                      </h3>

                      <small>
                        Updated review
                      </small>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedChart(
                          {
                            url:
                              afterChartUrl,

                            title:
                              "Subsequent Market Development",
                          }
                        )
                      }
                    >
                      View Full Size
                    </button>

                  </div>

                  {study.afterChartCaption && (
                    <p className="msd-chart-caption">
                      {
                        study.afterChartCaption
                      }
                    </p>
                  )}

                  <button
                    type="button"
                    className="msd-image-button"
                    onClick={() =>
                      setSelectedChart(
                        {
                          url:
                            afterChartUrl,

                          title:
                            "Subsequent Market Development",
                        }
                      )
                    }
                  >
                    <img
                      src={
                        afterChartUrl
                      }
                      alt={`${stockName} subsequent market development`}
                      loading="lazy"
                    />
                  </button>

                </article>
              )}

            </div>

          </section>
        )}

        {/* ===================================================
            HISTORICAL PRICE REVIEW
        =================================================== */}

        <section className="msd-panel">

          <div className="msd-section-title">

            <span>
              📈
            </span>

            <div>

              <h2>
                Historical Price Review
              </h2>

              <p>
                Factual comparison between
                the saved study reference
                price and observed market
                price.
              </p>

            </div>

          </div>

          <div className="msd-price-review">

            <div>

              <span>
                Study Reference Price
              </span>

              <strong>
                {formatCurrency(
                  referencePrice
                )}
              </strong>

              <small>
                {formatDate(
                  publishedDate
                )}
              </small>

            </div>

            <b className="msd-arrow">
              →
            </b>

            <div>

              <span>
                {isClosed
                  ? "Closing Reference"
                  : "Latest Market Price"}
              </span>

              <strong>
                {formatCurrency(
                  displayPrice
                )}
              </strong>

              <small>
                {isClosed &&
                endDate
                  ? formatDate(
                      endDate
                    )
                  : "Observed market price"}
              </small>

            </div>

            <b className="msd-arrow">
              →
            </b>

            <div>

              <span>
                Price Movement
              </span>

              <strong
                className={
                  isPositive
                    ? "msd-positive"
                    : "msd-negative"
                }
              >
                {movement.percent >
                0
                  ? "+"
                  : ""}

                {movement.percent.toFixed(
                  2
                )}
                %
              </strong>

              <small>
                Since publication
              </small>

            </div>

          </div>

          <div className="msd-info-box">
            ⓘ Historical price movement
            is shown solely as a factual
            market comparison for
            educational review. It does
            not represent an assurance
            of future returns.
          </div>

        </section>

        {/* ===================================================
            NOTES + PDF
        =================================================== */}

        <section className="msd-two-column">

          {/* NOTES */}

          <article className="msd-panel">

            <div className="msd-section-title">

              <span>
                📝
              </span>

              <div>

                <h2>
                  Market Study Notes
                </h2>

                <p>
                  Structure and reasoning
                  recorded with this
                  study.
                </p>

              </div>

            </div>

            <div className="msd-notes">

              {study.thesis ? (
                study.thesis
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
                  No additional market
                  study notes have been
                  added.
                </p>
              )}

            </div>

          </article>

          {/* PDF */}

          <article className="msd-panel">

            <div className="msd-section-title">

              <span>
                📄
              </span>

              <div>

                <h2>
                  Study Documents
                </h2>

                <p>
                  Supporting educational
                  material attached with
                  this study.
                </p>

              </div>

            </div>

            {study.researchPdfUrl ? (

              <a
                href={
                  study.researchPdfUrl
                }
                target="_blank"
                rel="noreferrer"
                className="msd-document-row"
              >

                <div>

                  <span>
                    📑
                  </span>

                  <div>

                    <strong>
                      Study Document
                    </strong>

                    <small>
                      Open supporting
                      research material
                    </small>

                  </div>

                </div>

                <b>
                  View PDF ↗
                </b>

              </a>

            ) : (

              <div className="msd-empty-document">
                No study document
                attached.
              </div>

            )}

          </article>

        </section>

        {/* ===================================================
            DISCLAIMER
        =================================================== */}

        <section className="msd-disclaimer">

          <div className="msd-disclaimer-icon">
            🛡️
          </div>

          <div>

            <strong>
              Educational & Research
              Disclosure
            </strong>

            <p>
              This market study is shared
              solely for educational and
              research purposes. It does
              not constitute a buy/sell
              recommendation, investment
              advice, solicitation or an
              assurance of return.
              Historical market movements
              do not guarantee future
              performance. Please conduct
              your own independent
              analysis before making any
              investment decision.
            </p>

          </div>

        </section>

      </div>

      {/* =====================================================
          CHART MODAL
      ===================================================== */}

      {selectedChart && (

        <div
          className="msd-modal-backdrop"
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
            className="msd-modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              selectedChart.title
            }
          >

            <div className="msd-modal-header">

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