import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  getHoldings,
  mapHoldingFromDB,
} from "../../services/holdingService";

import Pagination from "../common/Pagination";


const ITEMS_PER_PAGE = 6;
const AUTO_REFRESH_INTERVAL = 60 * 1000;

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export default function FundList() {
  const navigate = useNavigate();

  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const requestInProgressRef = useRef(false);
  const mountedRef = useRef(true);

  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All");
  const [status, setStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const loadFund = useCallback(
    async ({ showInitialLoader = false } = {}) => {
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
          "Public fund load error:",
          error
        );

        if (!mountedRef.current) {
          return;
        }

        setLoadError(
          error?.message ||
            "Failed to load portfolio trades."
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

    loadFund({
      showInitialLoader: true,
    });

    const intervalId = window.setInterval(
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          loadFund();
        }
      },
      AUTO_REFRESH_INTERVAL
    );

    const handleVisibilityChange = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        loadFund();
      }
    };

    const handleWindowFocus = () => {
      loadFund();
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener(
      "focus",
      handleWindowFocus
    );

    return () => {
      mountedRef.current = false;

      window.clearInterval(intervalId);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "focus",
        handleWindowFocus
      );
    };
  }, [loadFund]);

  const getStatus = (holding) => {
    const manualStatus = String(
      holding.tradeStatus || ""
    ).trim();

    const fixedStatuses = [
      "Booked Profit",
      "Cancelled",
      "SL Hit",
      "Target 1 Hit",
      "Target 2 Hit",
      "Target 3 Hit",
    ];

    if (fixedStatuses.includes(manualStatus)) {
      return manualStatus;
    }

    const cmp = Number(holding.cmp || 0);
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
  };

  const getReturn = (holding) => {
    const entry = Number(holding.entry || 0);

    if (!entry) return 0;

    const tradeStatus = getStatus(holding);
    const isBookedProfit =
      tradeStatus === "Booked Profit";

    if (isBookedProfit) {
      const savedRealisedReturn =
        holding.realisedReturn ??
        holding.realised_return;

      if (
        savedRealisedReturn !== null &&
        savedRealisedReturn !== undefined &&
        savedRealisedReturn !== ""
      ) {
        const realisedReturn = Number(
          savedRealisedReturn
        );

        if (Number.isFinite(realisedReturn)) {
          return realisedReturn;
        }
      }

      const savedExitPrice =
        holding.exitPrice ??
        holding.exit_price;

      if (
        savedExitPrice !== null &&
        savedExitPrice !== undefined &&
        savedExitPrice !== ""
      ) {
        const exitPrice = Number(
          savedExitPrice
        );

        if (
          Number.isFinite(exitPrice) &&
          exitPrice > 0
        ) {
          return (
            ((exitPrice - entry) / entry) *
            100
          );
        }
      }
    }

    const livePrice = Number(
      holding.cmp || entry
    );

    return (
      ((livePrice - entry) / entry) *
      100
    );
  };

  const visibleHoldings = useMemo(() => {
    return holdings.filter((holding) => {
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
        publishStatus !== "draft" &&
        holding.accuracyShow !== false &&
        getStatus(holding) !== "Cancelled"
      );
    });
  }, [holdings]);

  const sectors = useMemo(() => {
    return [
      "All",
      ...new Set(
        visibleHoldings
          .map(
            (holding) =>
              holding.sector || "General"
          )
          .sort()
      ),
    ];
  }, [visibleHoldings]);

  const filteredHoldings = useMemo(() => {
    const query = normalize(search);

    return visibleHoldings.filter(
      (holding) => {
        const visibility = normalize(
          holding.visibility
        );

        const isSubscriberTrade =
          visibility === "subscriber" ||
          visibility === "community";

        const protectedTrade =
          isSubscriberTrade &&
          Boolean(holding.accuracyBlur);

        const searchableValues =
          protectedTrade
            ? [
                holding.sector,
                holding.tradeType,
                getStatus(holding),
              ]
            : [
                holding.stock,
                holding.sector,
                holding.tradeType,
                getStatus(holding),
              ];

        const matchesSearch =
          !query ||
          searchableValues.some((value) =>
            normalize(value).includes(query)
          );

        const matchesSector =
          sector === "All" ||
          (holding.sector || "General") ===
            sector;

        const currentStatus = getStatus(holding);

        const exitPrice = Number(
          holding.exitPrice ??
            holding.exit_price ??
            holding.cmp ??
            0
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

        const hasReachedTarget1 =
          currentStatus === "Target 1 Hit" ||
          currentStatus === "Target 2 Hit" ||
          currentStatus === "Target 3 Hit" ||
          (
            currentStatus === "Booked Profit" &&
            target1 > 0 &&
            exitPrice >= target1
          );

        const hasReachedTarget2 =
          currentStatus === "Target 2 Hit" ||
          currentStatus === "Target 3 Hit" ||
          (
            currentStatus === "Booked Profit" &&
            target2 > 0 &&
            exitPrice >= target2
          );

        const hasReachedTarget3 =
          currentStatus === "Target 3 Hit" ||
          (
            currentStatus === "Booked Profit" &&
            target3 > 0 &&
            exitPrice >= target3
          );

        const matchesStatus =
          status === "All" ||
          (
            status === "Target 1 Hit" &&
            hasReachedTarget1
          ) ||
          (
            status === "Target 2 Hit" &&
            hasReachedTarget2
          ) ||
          (
            status === "Target 3 Hit" &&
            hasReachedTarget3
          ) ||
          (
            ![
              "Target 1 Hit",
              "Target 2 Hit",
              "Target 3 Hit",
            ].includes(status) &&
            currentStatus === status
          );

        return (
          matchesSearch &&
          matchesSector &&
          matchesStatus
        );
      }
    );
  }, [
    visibleHoldings,
    search,
    sector,
    status,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sector, status]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredHoldings.length /
        ITEMS_PER_PAGE
    )
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedHoldings = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      ITEMS_PER_PAGE;

    return filteredHoldings.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [
    filteredHoldings,
    currentPage,
  ]);

  const activeCount =
    visibleHoldings.filter(
      (holding) =>
        [
          "Active",
          "Target 1 Hit",
          "Target 2 Hit",
          "Target 3 Hit",
        ].includes(
          getStatus(holding)
        )
    ).length;

  const completedCount =
    visibleHoldings.filter(
      (holding) =>
        [
          "Booked Profit",
          "SL Hit",
        ].includes(
          getStatus(holding)
        )
    ).length;

  const formatPrice = (value) =>
    `₹${Number(value || 0).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      }
    )}`;

  const formatUpdatedTime = (value) => {
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

  if (loading) {
    return (
      <p style={loadingStyle}>
        Loading portfolio trades...
      </p>
    );
  }

  if (loadError && holdings.length === 0) {
    return (
      <section style={errorStyle}>
        <h3>Unable to load portfolio</h3>

        <p>{loadError}</p>

        <button
          type="button"
          onClick={() =>
            loadFund({
              showInitialLoader: true,
            })
          }
          style={retryButtonStyle}
        >
          Try Again
        </button>
      </section>
    );
  }

  return (
    <section style={wrapperStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>
            Market Case Studies
          </h2>

          <p style={subtitleStyle}>
            Educational market ideas are publicly available, while member-exclusive analysis details and price levels are released only after official publication.
          </p>
        </div>

        <div style={headerActionsStyle}>
          <span style={countBadgeStyle}>
            {filteredHoldings.length} Ideas
          </span>

          <button
            type="button"
            onClick={() => loadFund()}
            disabled={refreshing}
            style={{
              ...refreshButtonStyle,
              cursor: refreshing
                ? "not-allowed"
                : "pointer",
              opacity: refreshing ? 0.7 : 1,
            }}
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh Data"}
          </button>

          <small style={updatedTextStyle}>
            {lastUpdated
              ? `Last updated: ${formatUpdatedTime(
                  lastUpdated
                )}`
              : "Waiting for latest data"}
          </small>
        </div>
      </div>

      {loadError && (
        <div style={inlineErrorStyle}>
          {loadError}
        </div>
      )}

      <div style={summaryGridStyle}>
        <SummaryCard
          value={visibleHoldings.length}
          label="Total Tracked Studies"
        />

        <SummaryCard
          value={activeCount}
          label="Active Studies"
          valueColor="#16a34a"
        />

        <SummaryCard
          value={completedCount}
          label="Completed Studies"
        />
      </div>

      <div style={filtersStyle}>
        <input
          type="search"
          placeholder="Search stock, sector or study..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          style={inputStyle}
        />

        <select
          value={sector}
          onChange={(event) =>
            setSector(event.target.value)
          }
          style={selectStyle}
        >
          {sectors.map((item) => (
            <option key={item} value={item}>
              {item === "All"
                ? "🏢 All Sectors"
                : item}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
          style={selectStyle}
        >
          <option value="All">
            📌 All Status
          </option>

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

          <option value="SL Hit">
            SL Hit
          </option>
        </select>
      </div>

      {filteredHoldings.length === 0 ? (
        <div style={emptyStateStyle}>
          <h3>No portfolio trades found</h3>

          <p>
            No trade matches the selected filters.
          </p>
        </div>
      ) : (
        <>
          <div style={cardsGridStyle}>
            {paginatedHoldings.map(
              (holding) => (
                <PortfolioCard
                  key={holding.id}
                  holding={holding}
                  status={getStatus(holding)}
                  roi={getReturn(holding)}
                  formatPrice={formatPrice}
                  onViewTrade={() =>
                    navigate(
                      `/trade/${holding.id}`
                    )
                  }
                />
              )
            )}
          </div>

          <>
  <Pagination
    currentPage={currentPage}
    totalPages={totalPages}
    onPageChange={setCurrentPage}
  />

  <section style={learningDisclosureStyle}>
    <div style={learningDisclosureIconStyle}>
      🎓
    </div>

    <div style={learningDisclosureContentStyle}>
      <h2 style={learningDisclosureTitleStyle}>
        Learn Before You Invest
      </h2>
            <p style={learningDisclosureTextStyle}>
              Every market study published on VTKS is intended to help you understand market structure, disciplined decision-making, and risk management through real-world examples. Our objective is to help you build knowledge and confidence—not encourage blind trade execution.
            </p>
      

      <p style={learningDisclosureTextStyle}>
        The content on this platform is shared solely for educational and research purposes. It should not be considered investment advice, a buy or sell recommendation, or a guarantee of future returns. Always perform your own research and manage risk according to your financial goals and risk tolerance.
      </p>

      <p style={learningDisclosureTextStyle}>
        VTKS believes that consistent learning, disciplined execution and risk
        management are more valuable than blindly following any single market
        idea.
      </p>
    </div>
  </section>
</>
        </>
      )}
    </section>
  );
}

function SummaryCard({
  value,
  label,
  valueColor = "#2563eb",
}) {
  return (
    <div style={summaryCardStyle}>
      <h3
        style={{
          ...summaryValueStyle,
          color: valueColor,
        }}
      >
        {value}
      </h3>

      <p style={summaryLabelStyle}>
        {label}
      </p>
    </div>
  );
}

function PortfolioCard({
  holding,
  status,
  roi,
  formatPrice,
  onViewTrade,
}) {
  const visibility = normalize(
    holding.visibility
  );

  const isSubscriberTrade =
    visibility === "subscriber" ||
    visibility === "community";

  const protectedTrade =
    isSubscriberTrade &&
    Boolean(holding.accuracyBlur);

  const isBookedProfit =
    status === "Booked Profit";

  const savedExitPrice =
    holding.exitPrice ??
    holding.exit_price;

  const displayPrice =
    isBookedProfit && savedExitPrice
      ? savedExitPrice
      : holding.cmp;

  const displayPriceLabel =
    isBookedProfit
      ? "Exit Price"
      : "Live CMP";

  const returnLabel =
    isBookedProfit
      ? "Realised ROI"
      : "Live ROI";

  const protectedValue = (value) => {
    if (!protectedTrade) {
      return value;
    }

    return (
      <span
        style={blurredValueStyle}
        title="Subscriber trade details are protected"
      >
        {value}
      </span>
    );
  };

  const handleViewTrade = () => {
    if (protectedTrade) return;

    onViewTrade?.();
  };

  return (
    <article style={portfolioCardStyle}>
      <div style={cardTopRowStyle}>
        <span
          style={
            protectedTrade
              ? subscriberBadgeStyle
              : publicBadgeStyle
          }
        >
          {protectedTrade
            ? "🔒 Members-Only Market Study"
            : isSubscriberTrade
              ? "🌐 Featured Member Study"
              : "🌐 Published Market Study"}
        </span>

        <StatusBadge status={status} />
      </div>

      <h2 style={stockNameStyle}>
        {protectedValue(
          holding.stock || "VTKS Trade"
        )}
      </h2>

      <p style={sectorTextStyle}>
        {holding.sector || "General"}
      </p>

      <div style={detailsGridStyle}>
        <Detail
          label="Entry"
          value={protectedValue(
            formatPrice(holding.entry)
          )}
        />

        <Detail
          label={displayPriceLabel}
          value={protectedValue(
            displayPrice
              ? formatPrice(displayPrice)
              : "₹—"
          )}
        />

        <Detail
          label={returnLabel}
          value={protectedValue(
            <strong
              style={{
                color:
                  roi >= 0
                    ? "#16a34a"
                    : "#dc2626",
              }}
            >
              {roi >= 0 ? "+" : ""}
              {Number(roi || 0).toFixed(2)}%
            </strong>
          )}
        />

        <Detail
          label="Target 1"
          value={protectedValue(
            holding.target1
              ? formatPrice(holding.target1)
              : "₹—"
          )}
        />

        <Detail
          label="Target 2"
          value={protectedValue(
            holding.target2
              ? formatPrice(holding.target2)
              : "₹—"
          )}
        />

        <Detail
          label="Stop Loss"
          value={protectedValue(
            holding.stopLoss
              ? formatPrice(holding.stopLoss)
              : "₹—"
          )}
        />
      </div>

      

      <div style={cardFooterStyle}>
        <span style={tradeTypeStyle}>
          {holding.tradeType || "Swing"}
        </span>

        {protectedTrade ? (
          <span style={protectedNoticeStyle}>
            🔒 Details protected
          </span>
        ) : (
          <button
            type="button"
            onClick={handleViewTrade}
            style={viewTradeButtonStyle}
          >
            View Analysis →
          </button>
        )}
      </div>
    </article>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <span style={detailLabelStyle}>
        {label}
      </span>

      <div style={detailValueStyle}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const statusStyles = {
    Active: {
      background: "#dcfce7",
      color: "#166534",
    },

    "Target 1 Hit": {
      background: "#dbeafe",
      color: "#1d4ed8",
    },

    "Target 2 Hit": {
      background: "#dbeafe",
      color: "#1d4ed8",
    },

    "Target 3 Hit": {
      background: "#dcfce7",
      color: "#166534",
    },

    "Booked Profit": {
      background: "#dcfce7",
      color: "#166534",
    },

    "SL Hit": {
      background: "#fee2e2",
      color: "#991b1b",
    },
  };

  const style =
    statusStyles[status] ||
    statusStyles.Active;

  return (
    <span
      style={{
        ...statusBadgeBaseStyle,
        ...style,
      }}
    >
      {status}
    </span>
  );
}

const loadingStyle = {
  textAlign: "center",
  padding: "50px",
  color: "#64748b",
};

const errorStyle = {
  maxWidth: "700px",
  margin: "40px auto",
  padding: "35px",
  borderRadius: "20px",
  background: "#ffffff",
  textAlign: "center",
  color: "#64748b",
};

const retryButtonStyle = {
  marginTop: "12px",
  border: "none",
  borderRadius: "10px",
  padding: "11px 18px",
  background: "#2563eb",
  color: "#ffffff",
  fontWeight: 800,
  cursor: "pointer",
};

const wrapperStyle = {
  width: "100%",
  maxWidth: "1280px",
  margin: "0 auto",
  padding: "clamp(16px, 3vw, 30px)",
  borderRadius: "26px",
  background: "#ffffff",
  boxShadow:
    "0 15px 40px rgba(15,23,42,.06)",
  boxSizing: "border-box",
};

const headerStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "24px",
  flexWrap: "wrap",
};

const headerActionsStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "9px",
  minWidth: 0,
};

const titleStyle = {
  margin: "0 0 8px",
  color: "#0f172a",
  fontSize: "32px",
};

const subtitleStyle = {
  maxWidth: "760px",
  margin: 0,
  color: "#64748b",
  lineHeight: 1.7,
};

const countBadgeStyle = {
  flexShrink: 0,
  padding: "9px 15px",
  borderRadius: "999px",
  background: "#dbeafe",
  color: "#1e40af",
  fontSize: "13px",
  fontWeight: 800,
};

const refreshButtonStyle = {
  border: "1px solid #2563eb",
  borderRadius: "10px",
  padding: "10px 15px",
  background: "#ffffff",
  color: "#2563eb",
  fontSize: "13px",
  fontWeight: 800,
};

const updatedTextStyle = {
  color: "#64748b",
  fontSize: "12px",
};

const inlineErrorStyle = {
  marginBottom: "18px",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "#fee2e2",
  color: "#991b1b",
  fontSize: "13px",
  fontWeight: 700,
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "16px",
  marginBottom: "24px",
};

const summaryCardStyle = {
  padding: "20px",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  background: "#f8fafc",
};

const summaryValueStyle = {
  margin: "0 0 5px",
  fontSize: "28px",
};

const summaryLabelStyle = {
  margin: 0,
  color: "#64748b",
};

const filtersStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "14px",
  marginBottom: "28px",
};

const inputStyle = {
  flex: "1 1 280px",
  width: "100%",
  minWidth: 0,
  padding: "13px 15px",
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  boxSizing: "border-box",
};

const selectStyle = {
  flex: "1 1 190px",
  width: "100%",
  minWidth: 0,
  padding: "13px 15px",
  border: "1px solid #d1d5db",
  borderRadius: "12px",
  background: "#ffffff",
  boxSizing: "border-box",
};

const cardsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 310px), 1fr))",
  gap: "22px",
};

const portfolioCardStyle = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  minWidth: 0,
  minHeight: "390px",
  padding: "clamp(20px, 3vw, 28px)",
  border: "1px solid #dbe3ee",
  borderRadius: "22px",
  background: "#ffffff",
  boxShadow:
    "0 14px 34px rgba(15,23,42,.07)",
  boxSizing: "border-box",
};

const cardTopRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "20px",
  flexWrap: "wrap",
};

const publicBadgeStyle = {
  padding: "7px 11px",
  borderRadius: "999px",
  background: "#dbeafe",
  color: "#1e40af",
  fontSize: "12px",
  fontWeight: 800,
};

const subscriberBadgeStyle = {
  padding: "7px 11px",
  borderRadius: "999px",
  background: "#fef3c7",
  color: "#92400e",
  fontSize: "12px",
  fontWeight: 800,
};

const statusBadgeBaseStyle = {
  padding: "7px 11px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const stockNameStyle = {
  margin: "0 0 5px",
  color: "#0f172a",
  fontSize: "clamp(24px, 4vw, 27px)",
  wordBreak: "break-word",
};

const sectorTextStyle = {
  margin: "0 0 25px",
  color: "#64748b",
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "22px 18px",
};

const detailLabelStyle = {
  display: "block",
  marginBottom: "5px",
  color: "#64748b",
  fontSize: "13px",
};

const detailValueStyle = {
  color: "#0f172a",
  fontSize: "18px",
  fontWeight: 800,
  wordBreak: "break-word",
};

const blurredValueStyle = {
  display: "inline-block",
  filter: "blur(6px)",
  opacity: 0.82,
  userSelect: "none",
  pointerEvents: "none",
};

const cardFooterStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  marginTop: "auto",
  paddingTop: "25px",
  flexWrap: "wrap",
};

const tradeTypeStyle = {
  padding: "7px 10px",
  borderRadius: "999px",
  background: "#f1f5f9",
  color: "#334155",
  fontSize: "12px",
  fontWeight: 800,
};

const protectedNoticeStyle = {
  color: "#92400e",
  fontSize: "12px",
  fontWeight: 800,
};

const viewTradeButtonStyle = {
  border: "none",
  borderRadius: "12px",
  padding: "11px 18px",
  background: "#2563eb",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: 900,
  cursor: "pointer",
};

const emptyStateStyle = {
  padding: "35px",
  borderRadius: "18px",
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center",
};
const learningDisclosureStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "20px",
  marginTop: "42px",
  padding: "32px",
  borderRadius: "22px",
  background: "#f8fbff",
  border: "1px solid #dbeafe",
  boxShadow: "0 15px 35px rgba(15,23,42,.05)",
};

const learningDisclosureIconStyle = {
  width: "58px",
  height: "58px",
  borderRadius: "16px",
  background: "#dbeafe",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "30px",
  flexShrink: 0,
};

const learningDisclosureContentStyle = {
  flex: 1,
};

const learningDisclosureTitleStyle = {
  margin: "0 0 12px",
  color: "#1e3a8a",
  fontSize: "24px",
  fontWeight: 800,
};

const learningDisclosureTextStyle = {
  margin: "0 0 12px",
  color: "#475569",
  fontSize: "16px",
  lineHeight: 1.8,
};