import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import PageHeader from "../../components/admin/PageHeader";
import PrimaryButton from "../../components/admin/PrimaryButton";
import DataTable from "../../components/admin/DataTable";
import HoldingModal from "../../components/admin/modals/HoldingModal";
import Pagination from "../../components/common/Pagination";

import "./Holdings.css";

import {
  refreshCMP,
  getHoldings,
  addHolding,
  updateHolding,
  deleteHolding,
  mapHoldingFromDB,
  uploadHoldingFile,
} from "../../services/holdingService";

const ITEMS_PER_PAGE = 5;
const AUTO_REFRESH_INTERVAL_MS = 60 * 1000;

const MARKET_CATEGORIES = [
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

export default function Holdings() {
  const [showModal, setShowModal] = useState(false);
  const [editingHolding, setEditingHolding] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const refreshInProgressRef = useRef(false);

  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("All");
  const [marketCategoryFilter, setMarketCategoryFilter] =
    useState("All");
  const [tradeFilter, setTradeFilter] = useState("All");
  const [visibilityFilter, setVisibilityFilter] =
    useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roiSort, setRoiSort] = useState("default");

  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState([]);

  const loadHoldings = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const rows = await getHoldings();
      setData((rows || []).map(mapHoldingFromDB));
    } catch (error) {
      console.error("Load holdings error:", error);

      if (showLoader) {
        alert("Failed to load holdings from Supabase");
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  const handleRefreshCMP = useCallback(
    async (showMessage = true) => {
      if (refreshInProgressRef.current) {
        return;
      }

      try {
        refreshInProgressRef.current = true;
        setRefreshing(true);

        const result = await refreshCMP();
        await loadHoldings(false);

        if (showMessage) {
          alert(
            result?.message ||
              `✅ CMP refreshed for ${result?.updatedCount || 0} holding(s).`
          );
        }
      } catch (error) {
        console.error("Refresh CMP error:", error);

        if (showMessage) {
          alert(error?.message || "Failed to refresh CMP");
        }
      } finally {
        refreshInProgressRef.current = false;
        setRefreshing(false);
      }
    },
    [loadHoldings]
  );

  useEffect(() => {
    loadHoldings(true);
  }, [loadHoldings]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        handleRefreshCMP(false);
      }
    };

    // Refresh shortly after the page opens.
    const initialRefreshTimer = window.setTimeout(
      refreshWhenVisible,
      1500
    );

    // Refresh every 60 seconds while this page is open.
    const intervalId = window.setInterval(
      refreshWhenVisible,
      AUTO_REFRESH_INTERVAL_MS
    );

    // Refresh once when the user returns to this browser tab.
    document.addEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    return () => {
      window.clearTimeout(initialRefreshTimer);
      window.clearInterval(intervalId);
      document.removeEventListener(
        "visibilitychange",
        refreshWhenVisible
      );
    };
  }, [handleRefreshCMP]);

  const getReturn = (row) => {
    const entry = Number(row.entry || 0);
    const cmp = Number(row.cmp || 0);

    if (!entry) return "0.00";

    return (((cmp - entry) / entry) * 100).toFixed(2);
  };

  const getDisplayStatus = (row) => {
  const manualStatus = String(
    row.tradeStatus || row.trade_status || ""
  ).trim();

  if (
    manualStatus === "Booked Profit" ||
    manualStatus === "Cancelled"
  ) {
    return manualStatus;
  }

  const highestPrice = Number(
    row.highestPrice ??
    row.highest_price ??
    row.cmp ??
    0
  );

  const lowestPrice = Number(
    row.lowestPrice ??
    row.lowest_price ??
    row.cmp ??
    0
  );

  const stopLoss = Number(row.stopLoss || 0);
  const target1 = Number(row.target1 || 0);
  const target2 = Number(row.target2 || 0);
  const target3 = Number(row.target3 || 0);

  // Stop Loss
  if (
    stopLoss > 0 &&
    lowestPrice <= stopLoss
  ) {
    return "SL Hit";
  }

  // Highest Target Achieved
  if (
    target3 > 0 &&
    highestPrice >= target3
  ) {
    return "Target 3 Hit";
  }

  if (
    target2 > 0 &&
    highestPrice >= target2
  ) {
    return "Target 2 Hit";
  }

  if (
    target1 > 0 &&
    highestPrice >= target1
  ) {
    return "Target 1 Hit";
  }

  return "Active";
};

  const getHighestTargetReached = (row) => {
  const highestPrice = Number(
    row.highestPrice ??
    row.highest_price ??
    row.cmp ??
    0
  );

  const target1 = Number(row.target1 || 0);
  const target2 = Number(row.target2 || 0);
  const target3 = Number(row.target3 || 0);

  if (target3 > 0 && highestPrice >= target3)
    return "Target 3 Hit";

  if (target2 > 0 && highestPrice >= target2)
    return "Target 2 Hit";

  if (target1 > 0 && highestPrice >= target1)
    return "Target 1 Hit";

  return null;
};
  const getAchievedReturn = (row) => {
    const entry = Number(row.entry || 0);

    if (!entry) return "0.00";

    const currentStatus =
      getDisplayStatus(row);

    /*
      Realised ROI is shown only after
      the study is marked Booked Profit.
    */
    if (currentStatus !== "Booked Profit") {
      return getReturn(row);
    }

    const savedRealisedReturn =
      row.realisedReturn ??
      row.realised_return;

    if (
      savedRealisedReturn !== null &&
      savedRealisedReturn !== undefined &&
      savedRealisedReturn !== ""
    ) {
      const realisedReturn = Number(
        savedRealisedReturn
      );

      if (Number.isFinite(realisedReturn)) {
        return realisedReturn.toFixed(2);
      }
    }

    const savedExitPrice =
      row.exitPrice ??
      row.exit_price;

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
        ).toFixed(2);
      }
    }

    const cmp = Number(
      row.cmp || entry
    );

    return (
      ((cmp - entry) / entry) *
      100
    ).toFixed(2);
  };

  const statusBadge = (status) => {
    const styles = {
      Active: ["#dcfce7", "#166534", "🟢"],
      "Target 1 Hit": ["#e0f2fe", "#075985", "🎯"],
      "Target 2 Hit": ["#dcfce7", "#166534", "🚀"],
      "Target 3 Hit": ["#dcfce7", "#166534", "🏆"],
      "Booked Profit": ["#dcfce7", "#166534", "💰"],
      "SL Hit": ["#fee2e2", "#991b1b", "🛑"],
      Cancelled: ["#f1f5f9", "#475569", "⚪"],
    };

    const [background, color, icon] =
      styles[status] || styles.Active;

    return (
      <span
        style={{
          background,
          color,
          padding: "7px 12px",
          borderRadius: "20px",
          fontWeight: 700,
          fontSize: "13px",
          whiteSpace: "nowrap",
        }}
      >
        {icon} {status}
      </span>
    );
  };

  const badgeStyle = (value) => {
    const colors = {
      Swing: ["#fef3c7", "#92400e"],
      Positional: ["#dbeafe", "#1e40af"],
      Investment: ["#dcfce7", "#166534"],

      Public: ["#dcfce7", "#166534"],
      Subscriber: ["#dbeafe", "#1e40af"],
      Community: ["#ede9fe", "#6d28d9"],
      Private: ["#fee2e2", "#991b1b"],

      "Large Cap": ["#dbeafe", "#1e40af"],
      "Mid Cap": ["#ede9fe", "#6d28d9"],
      "Small Cap": ["#fef3c7", "#92400e"],
      "Micro Cap": ["#fee2e2", "#991b1b"],
      "Nifty Index": ["#dcfce7", "#166534"],
      "Bank Nifty": ["#ccfbf1", "#0f766e"],
      "Sectoral Index": ["#e0f2fe", "#0369a1"],
      ETF: ["#f3e8ff", "#7e22ce"],
      Commodity: ["#ffedd5", "#9a3412"],
      Other: ["#f1f5f9", "#334155"],
    };

    const [background, color] =
      colors[value] || ["#f1f5f9", "#334155"];

    return (
      <span
        style={{
          background,
          color,
          padding: "6px 10px",
          borderRadius: "20px",
          fontSize: "13px",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {value || "Other"}
      </span>
    );
  };

  const handleSaveHolding = async (holding) => {
    try {
      let chartImageUrl = holding.chartImageUrl || "";
      let researchPdfUrl =
        holding.researchPdfUrl || "";

      if (holding.chartImage) {
        chartImageUrl = await uploadHoldingFile(
          holding.chartImage,
          "charts"
        );
      }

      if (holding.researchPdf) {
        researchPdfUrl = await uploadHoldingFile(
          holding.researchPdf,
          "research"
        );
      }

      const cleanHolding = {
        ...holding,

        stock: holding.stock?.trim(),
        sector: holding.sector?.trim() || "General",
        marketCategory:
          holding.marketCategory || "Other",

        entry: Number(holding.entry),
        cmp: Number(holding.cmp),
        stopLoss: Number(holding.stopLoss || 0),
        target1: Number(holding.target1 || 0),
        target2: Number(holding.target2 || 0),
        target3: Number(holding.target3 || 0),

        chartImageUrl,
        researchPdfUrl,

        tradeStatus:
          holding.tradeStatus || "Active",

        visibility:
          holding.visibility || "Public",

        publishStatus:
          holding.publishStatus || "Published",

        accuracyShow:
          holding.accuracyShow ?? true,

        accuracyBlur:
          holding.accuracyBlur ?? false,
      };

      if (editingHolding) {
        const updated = await updateHolding(
          editingHolding.id,
          cleanHolding
        );

        setData((previous) =>
          previous.map((item) =>
            item.id === editingHolding.id
              ? mapHoldingFromDB(updated)
              : item
          )
        );

        setEditingHolding(null);
      } else {
        const inserted = await addHolding(cleanHolding);

        setData((previous) => [
          mapHoldingFromDB(inserted),
          ...previous,
        ]);

        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Save holding error:", error);
      alert(error.message || "Failed to save holding");
      throw error;
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this holding?"
    );

    if (!confirmed) return;

    try {
      await deleteHolding(id);

      setData((previous) =>
        previous.filter((item) => item.id !== id)
      );
    } catch (error) {
      console.error("Delete holding error:", error);
      alert(error.message || "Failed to delete holding");
    }
  };

  const sectors = useMemo(() => {
    return [
      "General",
      ...new Set(
        data
          .map((holding) => holding.sector)
          .filter(Boolean)
          .filter((item) => item !== "General")
          .sort()
      ),
    ];
  }, [data]);

  const availableMarketCategories = useMemo(() => {
    const savedCategories = data
      .map(
        (holding) =>
          holding.marketCategory || "Other"
      )
      .filter(Boolean);

    return [
      ...new Set([
        ...MARKET_CATEGORIES,
        ...savedCategories,
      ]),
    ];
  }, [data]);

  const totalHoldings = data.length;

  const activeCount = data.filter((holding) =>
    [
      "Active",
      "Target 1 Hit",
      "Target 2 Hit",
      "Target 3 Hit",
    ].includes(getDisplayStatus(holding))
  ).length;

  const t1HitCount = data.filter(
    (holding) =>
      getHighestTargetReached(holding) ===
      "Target 1 Hit"
  ).length;

  const t2HitCount = data.filter(
    (holding) =>
      getHighestTargetReached(holding) ===
      "Target 2 Hit"
  ).length;

  const t3HitCount = data.filter(
    (holding) =>
      getHighestTargetReached(holding) ===
      "Target 3 Hit"
  ).length;

  const bookedProfitCount = data.filter(
    (holding) =>
      getDisplayStatus(holding) ===
      "Booked Profit"
  ).length;

  const slHitCount = data.filter(
    (holding) =>
      getDisplayStatus(holding) === "SL Hit"
  ).length;

  const winningTrades = data.filter((holding) => {
    const currentStatus =
      getDisplayStatus(holding);

    const highestTarget =
      getHighestTargetReached(holding);

    return (
      currentStatus === "Booked Profit" ||
      highestTarget === "Target 1 Hit" ||
      highestTarget === "Target 2 Hit" ||
      highestTarget === "Target 3 Hit"
    );
  }).length;

  const closedTrades =
    winningTrades + slHitCount;

  const winRate =
    closedTrades > 0
      ? (
          (winningTrades / closedTrades) *
          100
        ).toFixed(1)
      : "0.0";

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();

    return data.filter((item) => {
      const matchesSearch =
        !query ||
        String(item.stock || "")
          .toLowerCase()
          .includes(query) ||
        String(item.sector || "")
          .toLowerCase()
          .includes(query) ||
        String(item.marketCategory || "")
          .toLowerCase()
          .includes(query) ||
        String(item.tradeType || "")
          .toLowerCase()
          .includes(query);

      const matchesSector =
        sectorFilter === "All" ||
        item.sector === sectorFilter;

      const matchesMarketCategory =
        marketCategoryFilter === "All" ||
        (item.marketCategory || "Other") ===
          marketCategoryFilter;

      const matchesTrade =
        tradeFilter === "All" ||
        item.tradeType === tradeFilter;

      const matchesVisibility =
        visibilityFilter === "All" ||
        item.visibility === visibilityFilter;

      const currentStatus =
        getDisplayStatus(item);

      const targetAchievement =
        getHighestTargetReached(item);

      const matchesStatus =
        statusFilter === "All" ||
        (
          statusFilter === "Target 1 Hit" &&
          targetAchievement === "Target 1 Hit"
        ) ||
        (
          statusFilter === "Target 2 Hit" &&
          targetAchievement === "Target 2 Hit"
        ) ||
        (
          statusFilter === "Target 3 Hit" &&
          targetAchievement === "Target 3 Hit"
        ) ||
        (
          ![
            "Target 1 Hit",
            "Target 2 Hit",
            "Target 3 Hit",
          ].includes(statusFilter) &&
          currentStatus === statusFilter
        );

      return (
        matchesSearch &&
        matchesSector &&
        matchesMarketCategory &&
        matchesTrade &&
        matchesVisibility &&
        matchesStatus
      );
    });
  }, [
    data,
    search,
    sectorFilter,
    marketCategoryFilter,
    tradeFilter,
    visibilityFilter,
    statusFilter,
  ]);

  const sortedFilteredData = useMemo(() => {
    const rows = [...filteredData];

    if (roiSort === "high") {
      rows.sort(
        (a, b) =>
          Number(getAchievedReturn(b)) -
          Number(getAchievedReturn(a))
      );
    }

    if (roiSort === "low") {
      rows.sort(
        (a, b) =>
          Number(getAchievedReturn(a)) -
          Number(getAchievedReturn(b))
      );
    }

    return rows;
  }, [filteredData, roiSort]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    sectorFilter,
    marketCategoryFilter,
    tradeFilter,
    visibilityFilter,
    statusFilter,
    roiSort,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      sortedFilteredData.length / ITEMS_PER_PAGE
    )
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedData = useMemo(() => {
    const startIndex =
      (currentPage - 1) * ITEMS_PER_PAGE;

    return sortedFilteredData.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [sortedFilteredData, currentPage]);

  const firstVisibleRecord =
    sortedFilteredData.length === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const lastVisibleRecord = Math.min(
    currentPage * ITEMS_PER_PAGE,
    sortedFilteredData.length
  );

  const columns = [
    {
      key: "recommendationDate",
      label: "Date",
      render: (row) =>
        row.recommendationDate
          ? new Date(
              `${row.recommendationDate}T00:00:00`
            ).toLocaleDateString("en-IN")
          : "-",
    },
    {
      key: "stock",
      label: "Stock",
    },
    {
      key: "sector",
      label: "Sector",
    },
    {
      key: "marketCategory",
      label: "Market Category",
      render: (row) =>
        badgeStyle(
          row.marketCategory || "Other"
        ),
    },
    {
      key: "tradeType",
      label: "Trade",
      render: (row) =>
        badgeStyle(row.tradeType),
    },
    {
      key: "entry",
      label: "Entry",
      render: (row) => `₹${row.entry}`,
    },
    {
      key: "cmp",
      label: "CMP / ROI",
      render: (row) => {
        const liveReturn = Number(getReturn(row));
        const achievedReturn = Number(
          getAchievedReturn(row)
        );
        const currentStatus =
          getDisplayStatus(row);

        const isCompleted =
          currentStatus === "Booked Profit";

        const displayedReturn = isCompleted
          ? achievedReturn
          : liveReturn;

        return (
          <div style={{ lineHeight: "1.5" }}>
            <strong>
              ₹
              {Number(row.cmp || 0).toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits: 2,
                }
              )}
            </strong>

            <br />

            <span
              style={{
                display: "inline-block",
                marginTop: "4px",
                padding: "3px 8px",
                borderRadius: "14px",
                background:
                  displayedReturn >= 0
                    ? isCompleted
                      ? "#dbeafe"
                      : "#dcfce7"
                    : "#fee2e2",
                color:
                  displayedReturn >= 0
                    ? isCompleted
                      ? "#1e40af"
                      : "#166534"
                    : "#991b1b",
                fontWeight: 700,
                fontSize: "12px",
                whiteSpace: "nowrap",
              }}
            >
              {isCompleted
                ? "Realised ROI"
                : "Live ROI"}{" "}
              {displayedReturn >= 0 ? "+" : ""}
              {displayedReturn.toFixed(2)}%
            </span>
          </div>
        );
      },
    },
    {
      key: "exitPrice",
      label: "Exit Price",
      render: (row) => {
        const currentStatus =
          getDisplayStatus(row);

        const isCompleted =
          currentStatus === "Booked Profit";

        if (!isCompleted) {
          return "₹—";
        }

        const exitPrice = Number(
          row.exitPrice ??
            row.exit_price ??
            0
        );

        if (!Number.isFinite(exitPrice) || exitPrice <= 0) {
          return (
            <span
              style={{
                color: "#94a3b8",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              Not added
            </span>
          );
        }

        return (
          <strong>
            ₹
            {exitPrice.toLocaleString(
              "en-IN",
              {
                maximumFractionDigits: 2,
              }
            )}
          </strong>
        );
      },
    },
    {
      key: "stopLoss",
      label: "SL",
      render: (row) =>
        row.stopLoss
          ? `₹${row.stopLoss}`
          : "₹—",
    },
    {
      key: "target1",
      label: "T1",
      render: (row) =>
        row.target1
          ? `₹${row.target1}`
          : "₹—",
    },
    {
      key: "target2",
      label: "T2",
      render: (row) =>
        row.target2
          ? `₹${row.target2}`
          : "₹—",
    },
    {
      key: "tradeStatus",
      label: "Trade Status",
      render: (row) =>
        statusBadge(
          getDisplayStatus(row)
        ),
    },
    {
      key: "visibility",
      label: "Visibility",
      render: (row) =>
        badgeStyle(row.visibility),
    },
    {
      key: "accuracy",
      label: "Accuracy",
      render: (row) => (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "5px",
          }}
        >
          <span
            style={{
              color: row.accuracyShow
                ? "#166534"
                : "#991b1b",
              fontWeight: 700,
              fontSize: "12px",
            }}
          >
            {row.accuracyShow
              ? "✓ Shown"
              : "✕ Hidden"}
          </span>

          {row.accuracyShow && (
            <span
              style={{
                color: row.accuracyBlur
                  ? "#92400e"
                  : "#1e40af",
                fontWeight: 700,
                fontSize: "12px",
              }}
            >
              {row.accuracyBlur
                ? "🔒 Blurred"
                : "🌐 Revealed"}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "action",
      label: "Action",
      render: (row) => (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "7px",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setEditingHolding(row);
              setShowModal(true);
            }}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "15px",
              padding: 0,
            }}
          >
            ✏️ Edit
          </button>

          <button
            type="button"
            onClick={() =>
              handleDelete(row.id)
            }
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: "15px",
              color: "#dc2626",
              padding: 0,
            }}
          >
            🗑 Delete
          </button>
        </div>
      ),
    },
  ];

  const clearFilters = () => {
    setSearch("");
    setSectorFilter("All");
    setMarketCategoryFilter("All");
    setTradeFilter("All");
    setStatusFilter("All");
    setVisibilityFilter("All");
    setRoiSort("default");
    setCurrentPage(1);
  };

  return (
    <section className="holdings-page">
      <PageHeader
        title="VTKS Market Studies"
        subtitle="Manage, monitor and review every VTKS market study from one centralized dashboard."
        action={
          <div className="holdings-header-actions">
            <button
              type="button"
              className="refresh-cmp-button"
              onClick={() => handleRefreshCMP(true)}
              disabled={refreshing}
            >
              {refreshing ? "Updating..." : "🔄 Refresh CMP"}
            </button>

            <PrimaryButton
              onClick={() => {
                setEditingHolding(null);
                setShowModal(true);
              }}
            >
              + Add Holding
            </PrimaryButton>
          </div>
        }
      />

      <div className="holdings-stats-grid">
        {[
          [totalHoldings, "Total Studies"],
          [activeCount, "Active"],
          [t1HitCount, "T1 Hit"],
          [t2HitCount, "T2 Hit"],
          [t3HitCount, "T3 Hit"],
          [bookedProfitCount, "Booked Profit"],
          [slHitCount, "SL Hit"],
          [`${winRate}%`, "Win Rate"],
        ].map(([value, label]) => (
          <article className="holdings-stat-card" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </div>

      <div className="holdings-filter-panel">
        <input
          className="holdings-search-input"
          type="search"
          placeholder="🔍 Search holdings..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select value={sectorFilter} onChange={(event) => setSectorFilter(event.target.value)}>
          <option value="All">🏢 All Sectors</option>
          {sectors.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>

        <select value={marketCategoryFilter} onChange={(event) => setMarketCategoryFilter(event.target.value)}>
          <option value="All">📊 All Market Categories</option>
          {availableMarketCategories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>

        <select value={tradeFilter} onChange={(event) => setTradeFilter(event.target.value)}>
          <option value="All">📈 All Trade Types</option>
          <option value="Swing">Swing</option>
          <option value="Positional">Positional</option>
          <option value="Investment">Investment</option>
        </select>

        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="All">📌 All Status</option>
          <option value="Active">Active</option>
          <option value="Target 1 Hit">Target 1 Hit</option>
          <option value="Target 2 Hit">Target 2 Hit</option>
          <option value="Target 3 Hit">Target 3 Hit</option>
          <option value="Booked Profit">Booked Profit</option>
          <option value="SL Hit">SL Hit</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          value={roiSort}
          onChange={(event) =>
            setRoiSort(event.target.value)
          }
        >
          <option value="default">📈 All ROI</option>
          <option value="high">📈 ROI High → Low</option>
          <option value="low">📉 ROI Low → High</option>
        </select>

        <select value={visibilityFilter} onChange={(event) => setVisibilityFilter(event.target.value)}>
          <option value="All">👁 All Visibility</option>
          <option value="Public">Public</option>
          <option value="Subscriber">Subscriber</option>
          <option value="Community">Community</option>
          <option value="Private">Private</option>
        </select>

        <button type="button" className="clear-filters-button" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {loading ? (
        <div className="holdings-loading">Loading holdings...</div>
      ) : (
        <>
          <div className="holdings-results-bar">
            <span>Showing {firstVisibleRecord}–{lastVisibleRecord} of {sortedFilteredData.length} holdings</span>
            <span>Page {currentPage} of {totalPages}</span>
          </div>

          <div className="holdings-table-shell">
            <DataTable columns={columns} data={paginatedData} />
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}

      {showModal && (
        <HoldingModal
          onClose={() => {
            setShowModal(false);
            setEditingHolding(null);
          }}
          onSave={handleSaveHolding}
          editingHolding={editingHolding}
        />
      )}
    </section>
  );
}