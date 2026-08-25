import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

import {
  getHoldings,
  mapHoldingFromDB,
} from "../../services/holdingService";

import {
  getTradeROI,
  isRealisedTrade,
} from "../../utils/performanceUtils";

import SEO from "../../components/common/SEO";
import Pagination from "../../components/common/Pagination";

import "./Accuracy.css";

const ITEMS_PER_PAGE = 3;
const AUTO_REFRESH_INTERVAL = 60 * 1000;

const normalize = (value) =>
  String(value || "").trim().toLowerCase();

const getNumber = (...values) => {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      const number = Number(value);

      if (Number.isFinite(number)) {
        return number;
      }
    }
  }

  return 0;
};

const formatPrice = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "-";
  }

  return `₹${number.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

export default function Accuracy() {
  const [holdings, setHoldings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [sortMode, setSortMode] = useState("newest");
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const mountedRef = useRef(true);
  const requestRef = useRef(false);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadData = useCallback(
    async ({ initial = false } = {}) => {
      if (requestRef.current) return;

      requestRef.current = true;

      try {
        if (initial) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const rows = await getHoldings();

        if (!mountedRef.current) return;

        setHoldings(
          (rows || []).map(mapHoldingFromDB)
        );

        setLastUpdated(new Date());
      } catch (err) {
        console.error(
          "Market study load error:",
          err
        );

        if (mountedRef.current) {
          setError(
            err?.message ||
              "Unable to load market studies."
          );
        }
      } finally {
        requestRef.current = false;

        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    []
  );

  /* =========================================================
     REALTIME + AUTO REFRESH
  ========================================================= */

  useEffect(() => {
    mountedRef.current = true;

    loadData({ initial: true });

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadData();
      }
    }, AUTO_REFRESH_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadData();
      }
    };

    window.addEventListener(
      "focus",
      handleVisibility
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    const channel = supabase
      .channel("market-study-library-summary")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "holdings",
        },
        () => {
          if (
            document.visibilityState ===
            "visible"
          ) {
            loadData();
          }
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;

      window.clearInterval(interval);

      window.removeEventListener(
        "focus",
        handleVisibility
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );

      supabase.removeChannel(channel);
    };
  }, [loadData]);

  /* =========================================================
     INTERNAL STATUS
  ========================================================= */

  const getInternalStatus = useCallback(
    (holding) => {
      const manualStatus = String(
        holding.tradeStatus ||
          holding.trade_status ||
          ""
      ).trim();

      if (
        [
          "Booked Profit",
          "Booked Loss",
          "Breakeven",
          "Cancelled",
        ].includes(manualStatus)
      ) {
        return manualStatus;
      }

      const highestPrice = getNumber(
        holding.highestPrice,
        holding.highest_price,
        holding.cmp
      );

      const lowestPrice = getNumber(
        holding.lowestPrice,
        holding.lowest_price,
        holding.cmp
      );

      const stopLoss = getNumber(
        holding.stopLoss,
        holding.stop_loss
      );

      const target1 = getNumber(
        holding.target1
      );

      const target2 = getNumber(
        holding.target2
      );

      const target3 = getNumber(
        holding.target3
      );

      if (
        stopLoss > 0 &&
        lowestPrice <= stopLoss
      ) {
        return "SL Hit";
      }

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
    },
    []
  );

  /* =========================================================
     COMPLETED
  ========================================================= */

  const isCompleted = useCallback(
    (holding) => {
      const status =
        getInternalStatus(holding);

      if (
        [
          "Booked Profit",
          "Booked Loss",
          "Breakeven",
          "SL Hit",
        ].includes(status)
      ) {
        return true;
      }

      return isRealisedTrade(holding);
    },
    [getInternalStatus]
  );

  /* =========================================================
     PRICE MOVEMENT
  ========================================================= */

  const getMovement = useCallback(
    (holding) => {
      const value = Number(
        getTradeROI(holding) || 0
      );

      return Number.isFinite(value)
        ? value
        : 0;
    },
    []
  );

  /* =========================================================
     PUBLISHED STUDIES
  ========================================================= */

  const publishedStudies = useMemo(() => {
    return holdings.filter((holding) => {
      const visibility = normalize(
        holding.visibility
      );

      const publishStatus = normalize(
        holding.publishStatus ||
          holding.publish_status
      );

      return (
        [
          "public",
          "subscriber",
          "community",
        ].includes(visibility) &&
        publishStatus !== "draft" &&
        holding.accuracyShow !== false &&
        holding.accuracy_show !== false &&
        getInternalStatus(holding) !==
          "Cancelled"
      );
    });
  }, [
    holdings,
    getInternalStatus,
  ]);

  /* =========================================================
     PROTECTION
  ========================================================= */

  const isProtected = useCallback(
    (holding) => {
      const visibility = normalize(
        holding.visibility
      );

      const blur = Boolean(
        holding.accuracyBlur ??
          holding.accuracy_blur
      );

      return (
        [
          "subscriber",
          "community",
        ].includes(visibility) &&
        blur
      );
    },
    []
  );

  const isPublicStudy = useCallback(
    (holding) =>
      !isProtected(holding),
    [isProtected]
  );

  /* =========================================================
     SUMMARY + MEDIAN
  ========================================================= */

  const summary = useMemo(() => {
    const completed =
      publishedStudies.filter(isCompleted);

    const ongoing =
      publishedStudies.filter(
        (holding) =>
          !isCompleted(holding)
      );

    const positive =
      completed.filter(
        (holding) =>
          getMovement(holding) > 0
      );

    const negative =
      completed.filter(
        (holding) =>
          getMovement(holding) < 0
      );

    const neutral =
      completed.filter(
        (holding) =>
          getMovement(holding) === 0
      );

    const movements = completed
      .map((holding) =>
        getMovement(holding)
      )
      .filter(Number.isFinite)
      .sort((a, b) => a - b);

    let medianMovement = 0;

    if (movements.length > 0) {
      const middle = Math.floor(
        movements.length / 2
      );

      if (
        movements.length % 2 === 0
      ) {
        medianMovement =
          (
            movements[middle - 1] +
            movements[middle]
          ) / 2;
      } else {
        medianMovement =
          movements[middle];
      }
    }

    return {
      total:
        publishedStudies.length,

      ongoing:
        ongoing.length,

      completed:
        completed.length,

      positive:
        positive.length,

      negative:
        negative.length,

      neutral:
        neutral.length,

      medianMovement,
    };
  }, [
    publishedStudies,
    isCompleted,
    getMovement,
  ]);

  /* =========================================================
     MOVEMENT DISTRIBUTION
  ========================================================= */

  const movementDistribution =
    useMemo(() => {
      const completed =
        publishedStudies.filter(
          isCompleted
        );

      const buckets = [
        {
          label: "Below 0%",
          count: 0,
          type: "negative",
        },
        {
          label: "0% to 10%",
          count: 0,
          type: "orange",
        },
        {
          label: "10% to 25%",
          count: 0,
          type: "light-green",
        },
        {
          label: "25% to 50%",
          count: 0,
          type: "green",
        },
        {
          label: "50% and above",
          count: 0,
          type: "dark-green",
        },
      ];

      completed.forEach(
        (holding) => {
          const movement =
            getMovement(holding);

          if (movement < 0) {
            buckets[0].count += 1;
          } else if (
            movement < 10
          ) {
            buckets[1].count += 1;
          } else if (
            movement < 25
          ) {
            buckets[2].count += 1;
          } else if (
            movement < 50
          ) {
            buckets[3].count += 1;
          } else {
            buckets[4].count += 1;
          }
        }
      );

      return buckets;
    }, [
      publishedStudies,
      isCompleted,
      getMovement,
    ]);

  /* =========================================================
     SECTORS
  ========================================================= */

  const sectors = useMemo(() => {
    return Array.from(
      new Set(
        publishedStudies
          .map(
            (holding) =>
              holding.sector ||
              "General"
          )
          .filter(Boolean)
      )
    ).sort();
  }, [publishedStudies]);

  /* =========================================================
     DATE
  ========================================================= */

  const getDateValue = (
    holding
  ) =>
    holding.recommendationDate ||
    holding.recommendation_date ||
    holding.createdAt ||
    holding.created_at ||
    null;

  const formatDate = (
    holding
  ) => {
    const value =
      getDateValue(holding);

    if (!value) return "-";

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
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

  const getTimestamp = (
    holding
  ) => {
    const value =
      getDateValue(holding);

    if (!value) return 0;

    const timestamp =
      new Date(value).getTime();

    return Number.isNaN(timestamp)
      ? 0
      : timestamp;
  };

  /* =========================================================
     FILTER + SORT
  ========================================================= */

  const filteredStudies =
    useMemo(() => {
      let result = [
        ...publishedStudies,
      ];

      if (
        statusFilter ===
        "ongoing"
      ) {
        result =
          result.filter(
            (holding) =>
              !isCompleted(
                holding
              )
          );
      }

      if (
        statusFilter ===
        "completed"
      ) {
        result =
          result.filter(
            isCompleted
          );
      }

      if (
        accessFilter ===
        "public"
      ) {
        result =
          result.filter(
            isPublicStudy
          );
      }

      if (
        accessFilter ===
        "protected"
      ) {
        result =
          result.filter(
            isProtected
          );
      }

      if (
        sectorFilter !==
        "all"
      ) {
        result =
          result.filter(
            (holding) =>
              (
                holding.sector ||
                "General"
              ) ===
              sectorFilter
          );
      }

      const query =
        normalize(search);

      if (query) {
        result =
          result.filter(
            (holding) => {
              const protectedStudy =
                isProtected(
                  holding
                );

              const searchable =
                protectedStudy
                  ? [
                      holding.sector,
                      holding.tradeType,
                      holding.trade_type,
                    ]
                  : [
                      holding.stock,
                      holding.symbol,
                      holding.sector,
                      holding.tradeType,
                      holding.trade_type,
                    ];

              return searchable
                .join(" ")
                .toLowerCase()
                .includes(
                  query
                );
            }
          );
      }

      if (
        sortMode ===
        "newest"
      ) {
        result.sort(
          (a, b) =>
            getTimestamp(b) -
            getTimestamp(a)
        );
      }

      if (
        sortMode ===
        "oldest"
      ) {
        result.sort(
          (a, b) =>
            getTimestamp(a) -
            getTimestamp(b)
        );
      }

      if (
        sortMode ===
        "movement-high"
      ) {
        result.sort(
          (a, b) =>
            getMovement(b) -
            getMovement(a)
        );
      }

      if (
        sortMode ===
        "movement-low"
      ) {
        result.sort(
          (a, b) =>
            getMovement(a) -
            getMovement(b)
        );
      }

      return result;
    }, [
      publishedStudies,
      statusFilter,
      accessFilter,
      sectorFilter,
      sortMode,
      search,
      isCompleted,
      isProtected,
      isPublicStudy,
      getMovement,
    ]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    statusFilter,
    accessFilter,
    sectorFilter,
    sortMode,
    search,
  ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredStudies.length /
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

  const paginatedStudies =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      return filteredStudies.slice(
        start,
        start +
          ITEMS_PER_PAGE
      );
    }, [
      filteredStudies,
      currentPage,
    ]);

  /* =========================================================
     DONUT
  ========================================================= */

  const positivePercentage =
    summary.completed > 0
      ? (
          summary.positive /
          summary.completed
        ) * 100
      : 0;

  const negativePercentage =
    summary.completed > 0
      ? (
          summary.negative /
          summary.completed
        ) * 100
      : 0;

  const donutStyle = {
    background: `conic-gradient(
      #16a34a 0% ${positivePercentage}%,
      #ef4444 ${positivePercentage}% ${
        positivePercentage +
        negativePercentage
      }%,
      #94a3b8 ${
        positivePercentage +
        negativePercentage
      }% 100%
    )`,
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="study-library-loading">
        Loading market studies...
      </div>
    );
  }

  return (
    <>
      <SEO
        title="VTKS Market Study"
        description="Documented educational market studies, reference structures and historical market observations."
      />

      <main className="study-library-page">

        <div className="study-library-layout">

          {/* =================================================
              LEFT
          ================================================= */}

          <div className="study-library-main">

            {/* HEADER */}

            <section className="library-header">

              <div>

                <div className="library-title-row">

                  <h1>
                    VTKS Market Study
                  </h1>

                  <span className="library-research-pill">
                    Educational Research
                  </span>

                </div>

                <div className="library-values">

                  <strong>
                    Tracked
                  </strong>

                  <span>
                    •
                  </span>

                  <strong>
                    Documented
                  </strong>

                  <span>
                    •
                  </span>

                  <strong>
                    Reviewed
                  </strong>

                </div>

                <p className="library-description">
                  Documenting market structure,
                  reference levels and subsequent
                  price behaviour for research and
                  learning.
                </p>

              </div>

              <div className="library-refresh">

                {lastUpdated && (
                  <span>
                    Last updated:{" "}
                    {lastUpdated.toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                    ,{" "}
                    {lastUpdated.toLocaleTimeString(
                      "en-IN",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() =>
                    loadData()
                  }
                  disabled={
                    refreshing
                  }
                >
                  ↻{" "}
                  {refreshing
                    ? "Refreshing..."
                    : "Refresh Data"}
                </button>

              </div>

            </section>

            {/* SUMMARY */}

            <section className="library-compact-summary">

              <CompactStat
                value={
                  summary.total
                }
                label="Studies"
                tone="blue"
              />

              <CompactStat
                value={
                  summary.ongoing
                }
                label="Ongoing"
                tone="green"
              />

              <CompactStat
                value={
                  summary.completed
                }
                label="Completed"
                tone="purple"
              />

              <CompactStat
                value={`${summary.positive} / ${summary.completed}`}
                label="Positive"
                tone="orange"
              />

            </section>

            {/* FILTERS */}

            <section className="library-filter-bar">

              <div className="library-tabs">

                <button
                  type="button"
                  className={
                    statusFilter ===
                    "all"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setStatusFilter(
                      "all"
                    )
                  }
                >
                  All Studies
                </button>

                <button
                  type="button"
                  className={
                    statusFilter ===
                    "ongoing"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setStatusFilter(
                      "ongoing"
                    )
                  }
                >
                  Ongoing
                </button>

                <button
                  type="button"
                  className={
                    statusFilter ===
                    "completed"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setStatusFilter(
                      "completed"
                    )
                  }
                >
                  Completed
                </button>

              </div>

              <div className="library-filters">

                <div className="library-search">

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search studies, sectors..."
                  />

                  <span>
                    ⌕
                  </span>

                </div>

                <select
                  value={
                    accessFilter
                  }
                  onChange={(event) =>
                    setAccessFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="all">
                    All Access
                  </option>

                  <option value="public">
                    Published
                  </option>

                  <option value="protected">
                    Members-Only
                  </option>

                </select>

                <select
                  value={
                    sectorFilter
                  }
                  onChange={(event) =>
                    setSectorFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="all">
                    All Sectors
                  </option>

                  {sectors.map(
                    (sector) => (
                      <option
                        key={
                          sector
                        }
                        value={
                          sector
                        }
                      >
                        {sector}
                      </option>
                    )
                  )}

                </select>

                <select
                  value={
                    sortMode
                  }
                  onChange={(event) =>
                    setSortMode(
                      event.target.value
                    )
                  }
                >
                  <option value="newest">
                    Newest First
                  </option>

                  <option value="oldest">
                    Oldest First
                  </option>

                  <option value="movement-high">
                    Movement High-Low
                  </option>

                  <option value="movement-low">
                    Movement Low-High
                  </option>

                </select>

              </div>

            </section>

            {error && (
              <div className="library-error">
                {error}
              </div>
            )}

            {/* STUDIES */}

            <section className="study-card-list">

              {paginatedStudies.map(
                (holding) => (
                  <StudyCard
                    key={
                      holding.id
                    }
                    holding={
                      holding
                    }
                    protectedStudy={isProtected(
                      holding
                    )}
                    completed={isCompleted(
                      holding
                    )}
                    movement={getMovement(
                      holding
                    )}
                    formatDate={
                      formatDate
                    }
                  />
                )
              )}

              {paginatedStudies.length ===
                0 && (
                <div className="library-empty">
                  No studies match the
                  selected filters.
                </div>
              )}

            </section>

            {/* PAGINATION */}

            {filteredStudies.length >
              0 && (
              <section className="library-pagination">

                <span>
                  Showing{" "}
                  {Math.min(
                    (currentPage - 1) *
                      ITEMS_PER_PAGE +
                      1,
                    filteredStudies.length
                  )}{" "}
                  to{" "}
                  {Math.min(
                    currentPage *
                      ITEMS_PER_PAGE,
                    filteredStudies.length
                  )}{" "}
                  of{" "}
                  {
                    filteredStudies.length
                  }{" "}
                  studies
                </span>

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

              </section>
            )}

          </div>

          {/* =================================================
              RIGHT SIDEBAR
          ================================================= */}

          <aside className="study-library-sidebar">

            {/* MEDIAN */}

            <section className="median-side-card">

              <div className="median-side-icon">
                ↝
              </div>

              <div className="median-side-content">

                <span className="median-side-label">
                  Median Price Movement
                </span>

                <strong
                  className={
                    summary.medianMovement > 0
                      ? "median-positive"
                      : summary.medianMovement < 0
                        ? "median-negative"
                        : "median-neutral"
                  }
                >
                  {summary.medianMovement > 0
                    ? "+"
                    : ""}

                  {summary.medianMovement.toFixed(
                    2
                  )}

                  %
                </strong>

                <small>
                  Based on completed studies
                </small>

              </div>

            </section>

            {/* OUTCOME */}

            <section className="library-side-card">

              <div className="side-card-title">

                <div className="side-card-icon">
                  ◎
                </div>

                <div>

                  <h2>
                    Study Outcome Summary
                  </h2>

                  <p>
                    Completed studies only
                  </p>

                </div>

              </div>

              <div className="outcome-body">

                <div
                  className="outcome-donut"
                  style={
                    donutStyle
                  }
                >

                  <div>

                    <strong>
                      {summary.completed}
                    </strong>

                    <span>
                      Total
                    </span>

                  </div>

                </div>

                <div className="outcome-stats">

                  <OutcomeRow
                    label="Positive"
                    count={
                      summary.positive
                    }
                    total={
                      summary.completed
                    }
                    type="positive"
                  />

                  <OutcomeRow
                    label="Negative"
                    count={
                      summary.negative
                    }
                    total={
                      summary.completed
                    }
                    type="negative"
                  />

                  <OutcomeRow
                    label="Neutral"
                    count={
                      summary.neutral
                    }
                    total={
                      summary.completed
                    }
                    type="neutral"
                  />

                </div>

              </div>

              <p className="side-footer-text">
                Based on{" "}
                {summary.completed}{" "}
                completed studies
              </p>

            </section>

            {/* DISTRIBUTION */}

            <section className="library-side-card">

              <div className="side-card-title">

                <div className="side-card-icon">
                  ▥
                </div>

                <div>

                  <h2>
                    Price Movement Distribution
                  </h2>

                  <p>
                    Completed studies only
                  </p>

                </div>

              </div>

              <div className="movement-list">

                {movementDistribution.map(
                  (item) => (
                    <MovementRow
                      key={
                        item.label
                      }
                      item={
                        item
                      }
                      total={
                        summary.completed
                      }
                    />
                  )
                )}

              </div>

              <p className="side-footer-text">
                {summary.completed}{" "}
                completed studies
              </p>

            </section>

            {/* RISK */}

            <section className="sidebar-disclaimer">

              <div className="sidebar-warning">
                !
              </div>

              <div>

                <h3>
                  Market Risk Note
                </h3>

                <p>
                  Historical price movement and
                  documented reference levels are
                  presented for research
                  transparency and should not be
                  interpreted as assurance of
                  future performance.
                </p>

              </div>

            </section>

          </aside>

        </div>

        {/* =================================================
            BOTTOM INFO
        ================================================= */}

        <section className="library-bottom-grid">

          <InfoCard
            icon="◇"
            title="Data Transparency"
          >
            Reference prices are captured from the
            documented study record at publication.
            Subsequent price movement is tracked
            against that original reference for
            historical evaluation and transparency.
          </InfoCard>

          <InfoCard
            icon="◆"
            title="Learn Before You Invest"
          >
            Market studies are intended to help users
            understand market structure, disciplined
            decision-making and risk management through
            documented historical examples.
          </InfoCard>

          <InfoCard
            icon="▤"
            title="Educational Purpose"
          >
            Content available on VTKS is intended
            solely for educational and research
            purposes and should not be interpreted as
            investment advice or a buy or sell
            recommendation.
          </InfoCard>

        </section>

        {/* DISCLOSURE */}

        <section className="library-sebi-disclosure">

          <div className="library-sebi-icon">
            ⚖
          </div>

          <div className="library-sebi-content">

            <h3>
              Important Securities Market Disclosure
            </h3>

            <p>
              Investments in securities markets are
              subject to market risks. Historical
              price movement, documented reference
              levels and past study outcomes do not
              guarantee or indicate future
              performance.
            </p>

            <p>
              Information displayed on this page is
              presented for educational, research and
              market-study purposes only. It should
              not be construed as investment advice,
              a buy or sell recommendation,
              solicitation, personalised advice or
              promise of returns. Users should
              independently evaluate the risks
              involved, conduct their own research
              and make informed investment decisions.
            </p>

          </div>

        </section>

        {/* FINAL NOTE */}

        <section className="library-bottom-note">

          <span>
            ⓘ
          </span>

          <p>
            VTKS believes that consistent learning,
            disciplined decision-making and risk
            management are more valuable than blindly
            following any single market idea.
          </p>

        </section>

      </main>
    </>
  );
}

/* =========================================================
   COMPACT STAT
========================================================= */

function CompactStat({
  value,
  label,
  tone,
}) {
  return (
    <article
      className={`library-compact-stat ${tone}`}
    >
      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>
    </article>
  );
}

/* =========================================================
   STUDY CARD
========================================================= */

function StudyCard({
  holding,
  protectedStudy,
  completed,
  movement,
  formatDate,
}) {
  const sector =
    holding.sector ||
    "General";

  const studyType =
    holding.tradeType ||
    holding.trade_type ||
    "Swing";

  const entry =
    getNumber(
      holding.entry
    );

  const currentPrice =
    getNumber(
      completed
        ? holding.exitPrice ??
            holding.exit_price ??
            holding.cmp
        : holding.cmp
    );

  const stopLoss =
    getNumber(
      holding.stopLoss,
      holding.stop_loss
    );

  const target1 =
    getNumber(
      holding.target1
    );

  const target2 =
    getNumber(
      holding.target2
    );

  const protectedValue = (
    <span className="locked-value">
      •••••
    </span>
  );

  return (
    <article className="study-library-card">

      <div className="study-card-header">

        <div className="study-card-identity">

          <div
            className={`study-card-avatar ${
              protectedStudy
                ? "protected"
                : ""
            }`}
          >
            {protectedStudy
              ? "🔒"
              : "◎"}
          </div>

          <div>

            <div className="study-name-row">

              <h2>
                {protectedStudy
                  ? "Protected Market Study"
                  : holding.stock}
              </h2>

              <span
                className={
                  protectedStudy
                    ? "study-access protected"
                    : "study-access public"
                }
              >
                {protectedStudy
                  ? "Members-Only"
                  : "Published Study"}
              </span>

            </div>

            <div className="study-meta">

              <span>
                {sector}
              </span>

              <b>•</b>

              <span>
                {studyType}
              </span>

              <b>•</b>

              <span>
                Published{" "}
                {formatDate(
                  holding
                )}
              </span>

            </div>

          </div>

        </div>

        <div
          className={`study-card-status ${
            completed
              ? "completed"
              : ""
          }`}
        >
          <span />

          {completed
            ? "Completed"
            : "Ongoing"}
        </div>

      </div>

      <div className="study-card-content">

        <div className="study-stat-grid">

          <StudyStat
            title="Reference Price"
            value={
              protectedStudy
                ? protectedValue
                : formatPrice(
                    entry
                  )
            }
          />

          <StudyStat
            title={
              completed
                ? "Closing Reference"
                : "Current Reference"
            }
            value={
              protectedStudy
                ? protectedValue
                : formatPrice(
                    currentPrice
                  )
            }
          />

          <StudyStat
            title="Price Movement"
            value={
              protectedStudy ? (
                protectedValue
              ) : (
                <span
                  className={
                    movement > 0
                      ? "movement-positive"
                      : movement < 0
                        ? "movement-negative"
                        : "movement-neutral"
                  }
                >
                  {movement > 0
                    ? "+"
                    : ""}

                  {movement.toFixed(
                    2
                  )}

                  %
                </span>
              )
            }
          />

        </div>

        <div className="study-reference-panel">

          <h4>
            Documented Reference Structure
          </h4>

          {protectedStudy ? (
            <ProtectedStructure />
          ) : (
            <ReferenceStructure
              stopLoss={
                stopLoss
              }
              entry={
                entry
              }
              target1={
                target1
              }
              target2={
                target2
              }
            />
          )}

        </div>

      </div>

    </article>
  );
}

/* =========================================================
   STUDY STAT
========================================================= */

function StudyStat({
  title,
  value,
}) {
  return (
    <div className="study-stat">

      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

/* =========================================================
   PROTECTED STRUCTURE
========================================================= */

function ProtectedStructure() {
  const items = [
    "Invalidation",
    "Reference",
    "Zone 1",
    "Zone 2",
  ];

  return (
    <div className="protected-structure">

      {items.map(
        (label) => (
          <div key={label}>

            <span className="protected-lock">
              🔒
            </span>

            <strong>
              •••••
            </strong>

            <small>
              {label}
            </small>

          </div>
        )
      )}

    </div>
  );
}

/* =========================================================
   REFERENCE STRUCTURE
========================================================= */

function ReferenceStructure({
  stopLoss,
  entry,
  target1,
  target2,
}) {
  const items = [
    {
      value:
        stopLoss,
      label:
        "Invalidation",
      type:
        "red",
    },
    {
      value:
        entry,
      label:
        "Reference",
      type:
        "blue",
    },
    {
      value:
        target1,
      label:
        "Zone 1",
      type:
        "green",
    },
    {
      value:
        target2,
      label:
        "Zone 2",
      type:
        "green",
    },
  ];

  return (
    <div className="reference-structure">

      <div className="reference-line" />

      {items.map(
        (item) => (
          <div
            className="reference-point"
            key={
              item.label
            }
          >

            <span
              className={`reference-dot ${item.type}`}
            />

            <strong>
              {formatPrice(
                item.value
              )}
            </strong>

            <small>
              {item.label}
            </small>

          </div>
        )
      )}

    </div>
  );
}

/* =========================================================
   OUTCOME
========================================================= */

function OutcomeRow({
  label,
  count,
  total,
  type,
}) {
  const percentage =
    total > 0
      ? (
          (count / total) *
          100
        ).toFixed(2)
      : "0.00";

  return (
    <div className="outcome-row">

      <span
        className={`outcome-dot ${type}`}
      />

      <strong>
        {label}
      </strong>

      <b>
        {count}
      </b>

      <small>
        ({percentage}%)
      </small>

    </div>
  );
}

/* =========================================================
   MOVEMENT ROW
========================================================= */

function MovementRow({
  item,
  total,
}) {
  const percentage =
    total > 0
      ? (
          item.count /
          total
        ) * 100
      : 0;

  return (
    <div className="movement-row">

      <strong>
        {item.label}
      </strong>

      <div className="movement-track">

        <div
          className={`movement-fill ${item.type}`}
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

      <b>
        {item.count}
      </b>

      <span>
        ({percentage.toFixed(
          2
        )}%)
      </span>

    </div>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  icon,
  title,
  children,
}) {
  return (
    <article className="library-info-card">

      <div className="library-info-card-icon">
        {icon}
      </div>

      <div>

        <h3>
          {title}
        </h3>

        <p>
          {children}
        </p>

      </div>

    </article>
  );
}