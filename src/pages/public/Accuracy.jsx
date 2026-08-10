import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getHoldings,
  mapHoldingFromDB,
} from "../../services/holdingService";

import Pagination from "../../components/common/Pagination";
import "./Accuracy.css";
import SEO from "../../components/common/SEO";

import {
  calculatePerformanceSummary,
  getTradeROI,
  isActiveTrade,
  isRealisedTrade,
} from "../../utils/performanceUtils";

const ITEMS_PER_PAGE = 5;
const AUTO_REFRESH_INTERVAL = 60 * 1000;

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export default function Accuracy() {
  const [holdings, setHoldings] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [loadError, setLoadError] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [roiSort, setRoiSort] =
    useState("default");

  const requestInProgressRef =
    useRef(false);

  const mountedRef =
    useRef(true);

  /* =========================================================
     LOAD ACCURACY DATA
  ========================================================= */

  const loadAccuracy = useCallback(
    async ({
      showInitialLoader = false,
    } = {}) => {
      if (
        requestInProgressRef.current
      ) {
        return;
      }

      requestInProgressRef.current =
        true;

      try {
        if (showInitialLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setLoadError("");

        const rows =
          await getHoldings();

        if (!mountedRef.current) {
          return;
        }

        setHoldings(
          (rows || []).map(
            mapHoldingFromDB
          )
        );

        setLastUpdated(
          new Date()
        );
      } catch (error) {
        console.error(
          "Accuracy data load error:",
          error
        );

        if (!mountedRef.current) {
          return;
        }

        setLoadError(
          error?.message ||
            "Failed to load accuracy data."
        );
      } finally {
        requestInProgressRef.current =
          false;

        if (
          mountedRef.current
        ) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    []
  );

  /* =========================================================
     AUTO REFRESH
  ========================================================= */

  useEffect(() => {
    mountedRef.current = true;

    loadAccuracy({
      showInitialLoader: true,
    });

    const intervalId =
      window.setInterval(
        () => {
          if (
            document.visibilityState ===
            "visible"
          ) {
            loadAccuracy();
          }
        },
        AUTO_REFRESH_INTERVAL
      );

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          loadAccuracy();
        }
      };

    window.addEventListener(
      "focus",
      handleVisibilityChange
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      mountedRef.current = false;

      window.clearInterval(
        intervalId
      );

      window.removeEventListener(
        "focus",
        handleVisibilityChange
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [loadAccuracy]);

  /* =========================================================
     DISPLAY STATUS
  ========================================================= */

  const getStatus = useCallback(
    (holding) => {
      const manualStatus =
        String(
          holding.tradeStatus ||
            holding.trade_status ||
            ""
        ).trim();

      /*
        Respect all manually saved
        final outcomes.
      */
      if (
        [
          "Booked Profit",
          "Booked Loss",
          "Breakeven",
          "Cancelled",
        ].includes(
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
            0
        );

      const target2 =
        Number(
          holding.target2 ??
            0
        );

      const target3 =
        Number(
          holding.target3 ??
            0
        );

      if (
        stopLoss > 0 &&
        lowestPrice <=
          stopLoss
      ) {
        return "SL Hit";
      }

      if (
        target3 > 0 &&
        highestPrice >=
          target3
      ) {
        return "Target 3 Hit";
      }

      if (
        target2 > 0 &&
        highestPrice >=
          target2
      ) {
        return "Target 2 Hit";
      }

      if (
        target1 > 0 &&
        highestPrice >=
          target1
      ) {
        return "Target 1 Hit";
      }

      return "Active";
    },
    []
  );

  /* =========================================================
     ROI
  ========================================================= */

  const getROI = useCallback(
    (holding) =>
      getTradeROI(
        holding
      ),
    []
  );

  /* =========================================================
     PUBLIC ACCURACY HOLDINGS
  ========================================================= */

  const accuracyHoldings =
    useMemo(() => {
      return holdings.filter(
        (holding) => {
          const visibility =
            normalize(
              holding.visibility
            );

          const publishStatus =
            normalize(
              holding.publishStatus
            );

          const allowedVisibility =
            [
              "public",
              "subscriber",
              "community",
            ].includes(
              visibility
            );

          return (
            allowedVisibility &&
            visibility !==
              "private" &&
            publishStatus !==
              "draft" &&
            holding.accuracyShow !==
              false &&
            getStatus(
              holding
            ) !==
              "Cancelled"
          );
        }
      );
    }, [
      holdings,
      getStatus,
    ]);

  /* =========================================================
     PERFORMANCE SUMMARY
  ========================================================= */

  const performanceSummary =
    useMemo(
      () =>
        calculatePerformanceSummary(
          accuracyHoldings
        ),
      [accuracyHoldings]
    );

  const activeTrades =
    accuracyHoldings.filter(
      isActiveTrade
    );

  const realisedTrades =
    accuracyHoldings.filter(
      isRealisedTrade
    );

  const winRate =
    performanceSummary.winRate.toFixed(
      1
    );

  const activeAverageReturn =
    performanceSummary.activeAverageReturn.toFixed(
      2
    );

  const realisedAverageReturn =
    performanceSummary.realisedAverageReturn.toFixed(
      2
    );

  /* =========================================================
     BEST / WORST
  ========================================================= */

  const sortedByROI =
    useMemo(() => {
      return [
        ...accuracyHoldings,
      ].sort(
        (first, second) =>
          getROI(second) -
          getROI(first)
      );
    }, [
      accuracyHoldings,
      getROI,
    ]);

  const bestTrade =
    sortedByROI[0] ||
    null;

  const worstTrade =
    sortedByROI.length > 0
      ? sortedByROI[
          sortedByROI.length -
            1
        ]
      : null;

  /* =========================================================
     SORT TABLE
  ========================================================= */

  const sortedAccuracyHoldings =
    useMemo(() => {
      const rows = [
        ...accuracyHoldings,
      ];

      if (
        roiSort ===
        "high-to-low"
      ) {
        return rows.sort(
          (
            first,
            second
          ) =>
            getROI(second) -
            getROI(first)
        );
      }

      if (
        roiSort ===
        "low-to-high"
      ) {
        return rows.sort(
          (
            first,
            second
          ) =>
            getROI(first) -
            getROI(second)
        );
      }

      return rows;
    }, [
      accuracyHoldings,
      roiSort,
      getROI,
    ]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages =
    Math.max(
      1,

      Math.ceil(
        sortedAccuracyHoldings.length /
          ITEMS_PER_PAGE
      )
    );

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const paginatedHoldings =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      return sortedAccuracyHoldings.slice(
        startIndex,
        startIndex +
          ITEMS_PER_PAGE
      );
    }, [
      sortedAccuracyHoldings,
      currentPage,
    ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [roiSort]);

  /* =========================================================
     BLUR
  ========================================================= */

  const isBlurred = (
    holding
  ) =>
    Boolean(
      holding.accuracyBlur
    );

  /* =========================================================
     TARGET INDICATOR
  ========================================================= */

  const getTargetIndicator = (
    holding,
    type
  ) => {
    const status =
      getStatus(
        holding
      );

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

    const target1 =
      Number(
        holding.target1 ??
          0
      );

    const target2 =
      Number(
        holding.target2 ??
          0
      );

    const target3 =
      Number(
        holding.target3 ??
          0
      );

    const stopLoss =
      Number(
        holding.stopLoss ??
          holding.stop_loss ??
          0
      );

    const target1Hit =
      target1 > 0 &&
      highestPrice >=
        target1;

    const target2Hit =
      target2 > 0 &&
      highestPrice >=
        target2;

    const target3Hit =
      target3 > 0 &&
      highestPrice >=
        target3;

    const stopLossHit =
      stopLoss > 0 &&
      lowestPrice <=
        stopLoss;

    switch (type) {
      case "t1":
        return (
          target1Hit ||
          [
            "Target 1 Hit",
            "Target 2 Hit",
            "Target 3 Hit",
          ].includes(status)
        )
          ? " ✅"
          : "";

      case "t2":
        return (
          target2Hit ||
          [
            "Target 2 Hit",
            "Target 3 Hit",
          ].includes(status)
        )
          ? " 🚀"
          : "";

      case "t3":
        return (
          target3Hit ||
          status ===
            "Target 3 Hit"
        )
          ? " 🏆"
          : "";

      case "sl":
        return (
          stopLossHit ||
          status ===
            "SL Hit"
        )
          ? " 🛑"
          : "";

      default:
        return "";
    }
  };

  /* =========================================================
     FORMATTERS
  ========================================================= */

  const formatPrice = (
    value
  ) =>
    `₹${Number(
      value || 0
    ).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits:
          2,
      }
    )}`;

  const formatUpdatedTime =
    (value) => {
      if (!value) {
        return "";
      }

      return value.toLocaleTimeString(
        "en-IN",
        {
          hour:
            "2-digit",

          minute:
            "2-digit",

          second:
            "2-digit",
        }
      );
    };

  /* =========================================================
     PROTECTED TEXT
  ========================================================= */

  const renderProtectedText =
    (
      value,
      holding,
      fallback = "-"
    ) => {
      if (
        !isBlurred(
          holding
        )
      ) {
        return (
          value ||
          fallback
        );
      }

      return (
        <span
          className="accuracy-blurred-value"
          title="Subscriber study details are protected"
        >
          {value ||
            "Protected"}
        </span>
      );
    };

  const renderProtectedPrice =
    (
      value,
      holding
    ) => {
      if (
        !isBlurred(
          holding
        )
      ) {
        return formatPrice(
          value
        );
      }

      return (
        <span
          className="accuracy-blurred-value"
          title="Subscriber study details are protected"
        >
          ₹000.00
        </span>
      );
    };

  /* =========================================================
     TABLE DISPLAY PRICE
  ========================================================= */

  const getDisplayPrice = (
    holding
  ) => {
    if (
      isRealisedTrade(
        holding
      )
    ) {
      const exitPrice =
        holding.exitPrice ??
        holding.exit_price;

      if (
        exitPrice !== null &&
        exitPrice !== undefined &&
        exitPrice !== ""
      ) {
        return exitPrice;
      }
    }

    return holding.cmp;
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="accuracy-loading">
        Loading accuracy data...
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (
    loadError &&
    holdings.length ===
      0
  ) {
    return (
      <main className="accuracy-page">
        <section className="accuracy-empty-state">
          <h2>
            Unable to load performance
            data
          </h2>

          <p>
            {loadError}
          </p>

          <button
            type="button"
            onClick={() =>
              loadAccuracy({
                showInitialLoader:
                  true,
              })
            }
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <>
      <SEO
        title="VTKS Research Performance"
        description="Explore the performance of VTKS market studies through transparent statistics and realised outcomes."
      />

      <section className="accuracy-page">

        {/* ===================================================
            HERO
        =================================================== */}

        <div className="accuracy-hero">
          <span className="accuracy-badge">
            📊 VTKS Performance
          </span>

          <h1>
            Research Performance
          </h1>

          <p>
            Explore the performance of VTKS market
            studies through transparent statistics,
            including study outcomes and average
            performance. Member-exclusive study details
            remain protected until officially published.
          </p>

          <div className="accuracy-refresh-row">
            <span>
              {refreshing
                ? "Refreshing latest CMP data..."
                : lastUpdated
                  ? `Last updated: ${formatUpdatedTime(
                      lastUpdated
                    )}`
                  : "Waiting for latest data"}
            </span>

            <button
              type="button"
              className="accuracy-refresh-btn"
              onClick={() =>
                loadAccuracy()
              }
              disabled={
                refreshing
              }
            >
              {refreshing
                ? "Refreshing..."
                : "↻ Refresh Data"}
            </button>
          </div>
        </div>

        {/* INLINE ERROR */}

        {loadError && (
          <div className="accuracy-inline-error">
            {loadError}
          </div>
        )}

        {/* ===================================================
            STAT CARDS
        =================================================== */}

        <div className="accuracy-stats">
          <div className="accuracy-card">
            <h2>
              {
                performanceSummary.totalTrades
              }
            </h2>

            <p>
              Published Studies
            </p>
          </div>

          <div className="accuracy-card">
            <h2>
              {
                performanceSummary.activeTrades
              }
            </h2>

            <p>
              Active Studies
            </p>
          </div>

          <div className="accuracy-card">
            <h2>
              {
                performanceSummary.realisedTrades
              }
            </h2>

            <p>
              Closed Studies
            </p>
          </div>

          <div className="accuracy-card">
            <h2>
              {winRate}%
            </h2>

            <p>
              Win Rate
            </p>
          </div>

          <div
            className={`accuracy-card ${
              Number(
                activeAverageReturn
              ) >= 0
                ? "accuracy-card-positive"
                : "accuracy-card-negative"
            }`}
          >
            <h2>
              {Number(
                activeAverageReturn
              ) >= 0
                ? "+"
                : ""}

              {activeAverageReturn}%
            </h2>

            <p>
              Active Avg Return
            </p>
          </div>

          <div
            className={`accuracy-card ${
              Number(
                realisedAverageReturn
              ) >= 0
                ? "positive-card"
                : "negative-card"
            }`}
          >
            <h2>
              {Number(
                realisedAverageReturn
              ) >= 0
                ? "+"
                : ""}

              {realisedAverageReturn}%
            </h2>

            <p>
              Realised Avg Return
            </p>
          </div>

          <div className="accuracy-card">
            <h2>
              {
                performanceSummary.bookedProfitTrades
              }
            </h2>

            <p>
              Booked Profit
            </p>
          </div>

          <div className="accuracy-card">
            <h2>
              {
                performanceSummary.bookedLossTrades
              }
            </h2>

            <p>
              Booked Loss
            </p>
          </div>

          

          <div className="accuracy-card">
            <h2>
              {
                performanceSummary.slHitTrades
              }
            </h2>

            <p>
              SL Hit
            </p>
          </div>
        </div>

        {/* ===================================================
            BEST / WORST
        =================================================== */}

        <div className="accuracy-grid">
          <div className="accuracy-panel">
            <h3>
              🏆 Best Performer
            </h3>

            {bestTrade ? (
              <>
                <h2>
                  {renderProtectedText(
                    bestTrade.stock,
                    bestTrade
                  )}
                </h2>

                <p>
                  {bestTrade.sector ||
                    "General"}
                </p>

                <strong
                  className={
                    getROI(
                      bestTrade
                    ) >= 0
                      ? "positive"
                      : "negative"
                  }
                >
                  {getROI(
                    bestTrade
                  ) >= 0
                    ? "+"
                    : ""}

                  {getROI(
                    bestTrade
                  ).toFixed(2)}
                  %
                </strong>

                {isBlurred(
                  bestTrade
                ) && (
                  <span className="accuracy-protected-badge">
                    🔒 Subscriber Study
                  </span>
                )}
              </>
            ) : (
              <p>
                No data available
              </p>
            )}
          </div>

          <div className="accuracy-panel">
            <h3>
              ⚠️ Worst Performer
            </h3>

            {worstTrade ? (
              <>
                <h2>
                  {renderProtectedText(
                    worstTrade.stock,
                    worstTrade
                  )}
                </h2>

                <p>
                  {worstTrade.sector ||
                    "General"}
                </p>

                <strong
                  className={
                    getROI(
                      worstTrade
                    ) >= 0
                      ? "positive"
                      : "negative"
                  }
                >
                  {getROI(
                    worstTrade
                  ) >= 0
                    ? "+"
                    : ""}

                  {getROI(
                    worstTrade
                  ).toFixed(2)}
                  %
                </strong>

                {isBlurred(
                  worstTrade
                ) && (
                  <span className="accuracy-protected-badge">
                    🔒 Subscriber Study
                  </span>
                )}
              </>
            ) : (
              <p>
                No data available
              </p>
            )}
          </div>
        </div>

        {/* ===================================================
            TABLE
        =================================================== */}

        <div className="accuracy-table-wrap">
          <div className="accuracy-table-header">
            <div>
              <h2>
                Recent Analysis
              </h2>

              <p>
                Showing {ITEMS_PER_PAGE} studies per
                page. Subscriber stock identity and
                price levels remain blurred until the
                admin chooses to reveal them.
              </p>
            </div>

            <div
              className="accuracy-table-actions"
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "flex-end",

                flexWrap:
                  "wrap",

                gap:
                  "12px",
              }}
            >
              <span className="accuracy-protection-note">
                🔒 Protected subscriber details
              </span>

              <select
                className="accuracy-roi-sort"
                value={
                  roiSort
                }
                onChange={(event) =>
                  setRoiSort(
                    event.target.value
                  )
                }
                aria-label="Sort market studies by ROI"
                style={{
                  minHeight:
                    "42px",

                  padding:
                    "9px 38px 9px 13px",

                  border:
                    "1px solid #cbd5e1",

                  borderRadius:
                    "10px",

                  background:
                    "#ffffff",

                  color:
                    "#0f172a",

                  font:
                    "inherit",

                  fontSize:
                    "13px",

                  fontWeight:
                    700,

                  cursor:
                    "pointer",
                }}
              >
                <option value="default">
                  Sort by ROI
                </option>

                <option value="high-to-low">
                  ROI: High to Low
                </option>

                <option value="low-to-high">
                  ROI: Low to High
                </option>
              </select>
            </div>
          </div>

          {accuracyHoldings.length ===
          0 ? (
            <div className="accuracy-empty-state">
              <h3>
                No performance studies available
              </h3>

              <p>
                Published studies selected for the
                Accuracy page will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="accuracy-table-scroll">
                <table className="accuracy-table">
                  <thead>
                    <tr>
                      <th>
                        Stock
                      </th>

                      <th>
                        Sector
                      </th>

                      <th>
                        Trade Type
                      </th>

                      <th>
                        Entry
                      </th>

                      <th>
                        CMP / Exit
                      </th>

                      <th>
                        SL
                      </th>

                      <th>
                        Target 1
                      </th>

                      <th>
                        Target 2
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        ROI
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedHoldings.map(
                      (holding) => {
                        const roi =
                          getROI(
                            holding
                          );

                        const status =
                          getStatus(
                            holding
                          );

                        const realised =
                          isRealisedTrade(
                            holding
                          );

                        const displayPrice =
                          getDisplayPrice(
                            holding
                          );

                        return (
                          <tr
                            key={
                              holding.id
                            }
                          >
                            {/* STOCK */}

                            <td>
                              <div className="accuracy-stock-cell">
                                <strong>
                                  {renderProtectedText(
                                    holding.stock,
                                    holding
                                  )}
                                </strong>

                                {isBlurred(
                                  holding
                                ) && (
                                  <span className="accuracy-protected-badge">
                                    🔒 Protected
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* SECTOR */}

                            <td>
                              {holding.sector ||
                                "General"}
                            </td>

                            {/* TYPE */}

                            <td>
                              {holding.tradeType ||
                                "Swing"}
                            </td>

                            {/* ENTRY */}

                            <td>
                              {renderProtectedPrice(
                                holding.entry,
                                holding
                              )}
                            </td>

                            {/* CMP / EXIT */}

                            <td>
                              <div
                                style={{
                                  display:
                                    "flex",

                                  flexDirection:
                                    "column",

                                  gap:
                                    "3px",
                                }}
                              >
                                {renderProtectedPrice(
                                  displayPrice,
                                  holding
                                )}

                                {!isBlurred(
                                  holding
                                ) && (
                                  <small
                                    style={{
                                      color:
                                        "#64748b",

                                      fontWeight:
                                        700,
                                    }}
                                  >
                                    {realised
                                      ? "Exit Price"
                                      : "Live CMP"}
                                  </small>
                                )}
                              </div>
                            </td>

                            {/* SL */}

                            <td>
                              {renderProtectedPrice(
                                holding.stopLoss,
                                holding
                              )}

                              {!isBlurred(
                                holding
                              ) &&
                                getTargetIndicator(
                                  holding,
                                  "sl"
                                )}
                            </td>

                            {/* T1 */}

                            <td>
                              {renderProtectedPrice(
                                holding.target1,
                                holding
                              )}

                              {!isBlurred(
                                holding
                              ) &&
                                getTargetIndicator(
                                  holding,
                                  "t1"
                                )}
                            </td>

                            {/* T2 */}

                            <td>
                              {renderProtectedPrice(
                                holding.target2,
                                holding
                              )}

                              {!isBlurred(
                                holding
                              ) &&
                                getTargetIndicator(
                                  holding,
                                  "t2"
                                )}
                            </td>

                            {/* STATUS */}

                            <td>
                              <StatusBadge
                                status={
                                  status
                                }
                              />
                            </td>

                            {/* ROI */}

                            <td
                              className={
                                roi > 0
                                  ? "positive"
                                  : roi < 0
                                    ? "negative"
                                    : ""
                              }
                            >
                              {realised && (
                                <span
                                  className="accuracy-realised-label"
                                  title="Final realised return"
                                >
                                  ✓ Realised
                                </span>
                              )}

                              <span className="accuracy-roi-value">
                                {roi > 0
                                  ? "+"
                                  : ""}

                                {roi.toFixed(
                                  2
                                )}
                                %
                              </span>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={
                  currentPage
                }
                totalPages={
                  totalPages
                }
                onPageChange={
                  setCurrentPage
                }
              />
            </>
          )}
        </div>

        {/* ===================================================
            DISCLOSURE
        =================================================== */}

        <section className="accuracy-disclosure">
          <div className="accuracy-disclosure-icon">
            ⚠️
          </div>

          <div className="accuracy-disclosure-content">
            <div className="accuracy-disclosure-header">
              <span className="accuracy-disclosure-eyebrow">
                Important Information
              </span>

              <h2>
                Performance & Risk Disclosure
              </h2>
            </div>

            <div className="accuracy-disclosure-copy">
              <p>
                The historical performance presented on
                this page is shared solely for
                educational and research purposes. Past
                performance reflects prevailing market
                conditions at the time of publication
                and should not be interpreted as a
                guarantee of future returns or
                investment performance.
              </p>

              <p>
                Every market study is published using
                the information and market conditions
                available at the time of analysis.
                Future market conditions may differ
                significantly. Always conduct your own
                research, follow disciplined risk
                management, and make investment
                decisions according to your financial
                objectives and risk tolerance.
              </p>
            </div>

            <div className="accuracy-standard-disclaimer">
              <div className="accuracy-standard-disclaimer-title">
                <span>
                  📜
                </span>

                <strong>
                  Standard Disclaimer
                </strong>
              </div>

              <p>
                Investing in the securities market is
                subject to market risks. The value of
                investments and the income derived from
                them may fluctuate due to changing
                market conditions, and investors may
                lose part or all of their invested
                capital. Please read all related
                documents carefully, conduct your own
                research (DYOR), and consult a
                SEBI-registered investment adviser or
                other qualified financial professional
                if you require personalised investment
                advice. Invest only according to your
                financial objectives, investment
                horizon, and risk tolerance.
              </p>
            </div>
          </div>
        </section>
      </section>
    </>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}) {
  const normalizedStatus =
    String(
      status || "Active"
    )
      .trim()
      .toLowerCase()
      .replace(
        /\s+/g,
        "-"
      );

  const labels = {
    Active:
      "🟢 Active",

    "Target 1 Hit":
      "✅ Target 1 Hit",

    "Target 2 Hit":
      "🚀 Target 2 Hit",

    "Target 3 Hit":
      "🏆 Target 3 Hit",

    "Booked Profit":
      "💰 Booked Profit",

    "Booked Loss":
      "📉 Booked Loss",

    Breakeven:
      "⚖️ Breakeven",

    "SL Hit":
      "🛑 SL Hit",

    Cancelled:
      "⚪ Cancelled",
  };

  return (
    <span
      className={`accuracy-status accuracy-status-${normalizedStatus}`}
    >
      {labels[status] ||
        status ||
        "🟢 Active"}
    </span>
  );
}