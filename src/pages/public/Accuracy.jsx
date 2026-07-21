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

const ITEMS_PER_PAGE = 6;
const AUTO_REFRESH_INTERVAL = 60 * 1000;

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const WINNING_STATUSES = [
  "Target 1 Hit",
  "Target 2 Hit",
  "Target 3 Hit",
  "Booked Profit",
];

const CLOSED_STATUSES = [
  ...WINNING_STATUSES,
  "SL Hit",
];

export default function Accuracy() {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [loadError, setLoadError] =
    useState("");
  const [lastUpdated, setLastUpdated] =
    useState(null);

  const [currentPage, setCurrentPage] =
    useState(1);

  const requestInProgressRef = useRef(false);
  const mountedRef = useRef(true);

  const loadAccuracy = useCallback(
    async ({
      showInitialLoader = false,
    } = {}) => {
      if (requestInProgressRef.current) {
        return;
      }

      requestInProgressRef.current = true;

      try {
        if (showInitialLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setLoadError("");

        const rows = await getHoldings();

        if (!mountedRef.current) {
          return;
        }

        setHoldings(
          (rows || []).map(mapHoldingFromDB)
        );

        setLastUpdated(new Date());
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
        requestInProgressRef.current = false;

        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    mountedRef.current = true;

    loadAccuracy({
      showInitialLoader: true,
    });

    const intervalId = window.setInterval(
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

    const handleVisibilityChange = () => {
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

      window.clearInterval(intervalId);

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

  const getStatus = useCallback(
    (holding) => {
      const manualStatus = String(
        holding.tradeStatus || ""
      ).trim();

      const lockedStatuses = [
        "Booked Profit",
        "Cancelled",
        "SL Hit",
        "Target 1 Hit",
        "Target 2 Hit",
        "Target 3 Hit",
      ];

      if (
        lockedStatuses.includes(
          manualStatus
        )
      ) {
        return manualStatus;
      }

      const cmp = Number(
        holding.cmp || 0
      );

      const stopLoss = Number(
        holding.stopLoss || 0
      );

      const target1 = Number(
        holding.target1 || 0
      );

      const target2 = Number(
        holding.target2 || 0
      );

      const target3 = Number(
        holding.target3 || 0
      );

      if (stopLoss && cmp <= stopLoss) {
        return "SL Hit";
      }

      if (target3 && cmp >= target3) {
        return "Target 3 Hit";
      }

      if (target2 && cmp >= target2) {
        return "Target 2 Hit";
      }

      if (target1 && cmp >= target1) {
        return "Target 1 Hit";
      }

      return manualStatus || "Active";
    },
    []
  );

  const getROI = useCallback(
    (holding) => {
      const entry = Number(
        holding.entry || 0
      );

      if (!entry) return 0;

      const status = getStatus(
        holding
      );

      let exitPrice = Number(
        holding.cmp || entry
      );

      if (
        status === "Target 1 Hit"
      ) {
        exitPrice = Number(
          holding.target1 ||
            holding.cmp ||
            entry
        );
      }

      if (
        status === "Target 2 Hit"
      ) {
        exitPrice = Number(
          holding.target2 ||
            holding.cmp ||
            entry
        );
      }

      if (
        status === "Target 3 Hit"
      ) {
        exitPrice = Number(
          holding.target3 ||
            holding.cmp ||
            entry
        );
      }

      if (status === "SL Hit") {
        exitPrice = Number(
          holding.stopLoss ||
            holding.cmp ||
            entry
        );
      }

      if (
        status === "Booked Profit"
      ) {
        exitPrice = Number(
          holding.cmp || entry
        );
      }

      return (
        ((exitPrice - entry) /
          entry) *
        100
      );
    },
    [getStatus]
  );

  const accuracyHoldings = useMemo(
    () => {
      return holdings.filter(
        (holding) => {
          const visibility = normalize(
            holding.visibility
          );

          const publishStatus = normalize(
            holding.publishStatus
          );

          const allowedVisibility = [
            "public",
            "subscriber",
            "community",
          ].includes(visibility);

          return (
            allowedVisibility &&
            visibility !== "private" &&
            publishStatus !==
              "draft" &&
            holding.accuracyShow !==
              false &&
            getStatus(holding) !==
              "Cancelled"
          );
        }
      );
    },
    [holdings, getStatus]
  );

  const activeTrades =
    accuracyHoldings.filter(
      (holding) =>
        getStatus(holding) ===
        "Active"
    );

  const slTrades =
    accuracyHoldings.filter(
      (holding) =>
        getStatus(holding) ===
        "SL Hit"
    );

  const winningTrades =
    accuracyHoldings.filter(
      (holding) =>
        WINNING_STATUSES.includes(
          getStatus(holding)
        )
    );

  const closedTrades =
    accuracyHoldings.filter(
      (holding) =>
        CLOSED_STATUSES.includes(
          getStatus(holding)
        )
    );

  const winRate =
    closedTrades.length > 0
      ? (
          (winningTrades.length /
            closedTrades.length) *
          100
        ).toFixed(1)
      : "0.0";

  const avgReturn =
    accuracyHoldings.length > 0
      ? (
          accuracyHoldings.reduce(
            (sum, holding) =>
              sum + getROI(holding),
            0
          ) /
          accuracyHoldings.length
        ).toFixed(2)
      : "0.00";

  const sortedByROI = useMemo(
    () => {
      return [
        ...accuracyHoldings,
      ].sort(
        (first, second) =>
          getROI(second) -
          getROI(first)
      );
    },
    [accuracyHoldings, getROI]
  );

  const bestTrade =
    sortedByROI[0] || null;

  const worstTrade =
    sortedByROI.length > 0
      ? sortedByROI[
          sortedByROI.length - 1
        ]
      : null;

  const totalPages = Math.max(
    1,
    Math.ceil(
      accuracyHoldings.length /
        ITEMS_PER_PAGE
    )
  );

  useEffect(() => {
    if (
      currentPage > totalPages
    ) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedHoldings =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      return accuracyHoldings.slice(
        startIndex,
        startIndex +
          ITEMS_PER_PAGE
      );
    }, [
      accuracyHoldings,
      currentPage,
    ]);

  const isBlurred = (holding) =>
    Boolean(
      holding.accuracyBlur
    );

  const formatPrice = (value) =>
    `₹${Number(
      value || 0
    ).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const formatUpdatedTime = (
    value
  ) => {
    if (!value) return "";

    return value.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );
  };

  const renderProtectedText = (
    value,
    holding,
    fallback = "-"
  ) => {
    if (!isBlurred(holding)) {
      return value || fallback;
    }

    return (
      <span
        className="accuracy-blurred-value"
        title="Subscriber trade details are protected"
      >
        {value || "Protected"}
      </span>
    );
  };

  const renderProtectedPrice = (
    value,
    holding
  ) => {
    if (!isBlurred(holding)) {
      return formatPrice(value);
    }

    return (
      <span
        className="accuracy-blurred-value"
        title="Subscriber trade details are protected"
      >
        ₹000.00
      </span>
    );
  };

  if (loading) {
    return (
      <div className="accuracy-loading">
        Loading accuracy data...
      </div>
    );
  }

  if (
    loadError &&
    holdings.length === 0
  ) {
    return (
      <main className="accuracy-page">
        <section className="accuracy-empty-state">
          <h2>
            Unable to load performance
            data
          </h2>

          <p>{loadError}</p>

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

  return (
    <section className="accuracy-page">
      <div className="accuracy-hero">
        <span className="accuracy-badge">
          📊 VTKS Performance
        </span>

        <h1>
          Accuracy &amp; Performance
        </h1>

        <p>
          Track VTKS public and
          subscriber trade performance
          through transparent win rate,
          return and trade-status
          statistics. Subscriber trade
          details remain protected until
          publicly revealed.
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
            disabled={refreshing}
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh Data"}
          </button>
        </div>
      </div>

      {loadError && (
        <div className="accuracy-inline-error">
          {loadError}
        </div>
      )}

      <div className="accuracy-stats">
        <div className="accuracy-card">
          <h2>
            {accuracyHoldings.length}
          </h2>
          <p>Total Tracked Trades</p>
        </div>

        <div className="accuracy-card">
          <h2>
            {activeTrades.length}
          </h2>
          <p>Active Trades</p>
        </div>

        <div className="accuracy-card">
          <h2>
            {closedTrades.length}
          </h2>
          <p>Closed Trades</p>
        </div>

        <div className="accuracy-card">
          <h2>{winRate}%</h2>
          <p>Win Rate</p>
        </div>

        <div className="accuracy-card">
          <h2>{avgReturn}%</h2>
          <p>Average Return</p>
        </div>

        <div className="accuracy-card">
          <h2>
            {slTrades.length}
          </h2>
          <p>SL Hit</p>
        </div>
      </div>

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

              <strong className="positive">
                {getROI(bestTrade) >=
                0
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
                  🔒 Subscriber Trade
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
                  🔒 Subscriber Trade
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

      <div className="accuracy-table-wrap">
        <div className="accuracy-table-header">
          <div>
            <h2>Recent Trades</h2>

            <p>
              Showing {ITEMS_PER_PAGE}{" "}
              trades per page. Subscriber
              stock identity and price
              levels remain blurred until
              the admin chooses to reveal
              them.
            </p>
          </div>

          <span className="accuracy-protection-note">
            🔒 Protected subscriber
            details
          </span>
        </div>

        {accuracyHoldings.length ===
        0 ? (
          <div className="accuracy-empty-state">
            <h3>
              No performance trades
              available
            </h3>

            <p>
              Published trades selected
              for the Accuracy page will
              appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="accuracy-table-scroll">
              <table className="accuracy-table">
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Sector</th>
                    <th>Trade</th>
                    <th>Entry</th>
                    <th>CMP</th>
                    <th>SL</th>
                    <th>
                      Target 1
                    </th>
                    <th>
                      Target 2
                    </th>
                    <th>Status</th>
                    <th>ROI</th>
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

                      return (
                        <tr
                          key={
                            holding.id
                          }
                        >
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

                          <td>
                            {holding.sector ||
                              "General"}
                          </td>

                          <td>
                            {holding.tradeType ||
                              "Swing"}
                          </td>

                          <td>
                            {renderProtectedPrice(
                              holding.entry,
                              holding
                            )}
                          </td>

                          <td>
                            {renderProtectedPrice(
                              holding.cmp,
                              holding
                            )}
                          </td>

                          <td>
                            {renderProtectedPrice(
                              holding.stopLoss,
                              holding
                            )}
                          </td>

                          <td>
                            {renderProtectedPrice(
                              holding.target1,
                              holding
                            )}
                          </td>

                          <td>
                            {renderProtectedPrice(
                              holding.target2,
                              holding
                            )}
                          </td>

                          <td>
                            <StatusBadge
                              status={
                                status
                              }
                            />
                          </td>

                          <td
                            className={
                              roi >= 0
                                ? "positive"
                                : "negative"
                            }
                          >
                            {roi >= 0
                              ? "+"
                              : ""}
                            {roi.toFixed(
                              2
                            )}
                            %
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
    </section>
  );
}

function StatusBadge({ status }) {
  const normalizedStatus = String(
    status || "Active"
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

  return (
    <span
      className={`accuracy-status accuracy-status-${normalizedStatus}`}
    >
      {status || "Active"}
    </span>
  );
}
