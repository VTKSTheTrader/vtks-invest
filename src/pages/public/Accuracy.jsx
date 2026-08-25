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

import { supabase } from "../../lib/supabase";

import Pagination from "../../components/common/Pagination";
import SEO from "../../components/common/SEO";

import {
  getTradeROI,
  isRealisedTrade,
} from "../../utils/performanceUtils";

import "./Accuracy.css";

const ITEMS_PER_PAGE = 5;
const AUTO_REFRESH_INTERVAL = 60 * 1000;

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getNumericValue = (...values) => {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      const number = Number(value);

      if (!Number.isNaN(number)) {
        return number;
      }
    }
  }

  return 0;
};

export default function Accuracy() {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);

  const [visibilityFilter, setVisibilityFilter] =
    useState("all");

  const [studyStatusFilter, setStudyStatusFilter] =
    useState("all");

  const [sectorFilter, setSectorFilter] =
    useState("all");

  const [sortMode, setSortMode] =
    useState("newest");

  const requestInProgressRef = useRef(false);
  const mountedRef = useRef(true);

  /* =========================================================
     LOAD DATA
  ========================================================= */

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
          "Market studies data load error:",
          error
        );

        if (!mountedRef.current) {
          return;
        }

        setLoadError(
          error?.message ||
            "Failed to load market studies."
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

  /* =========================================================
     AUTO REFRESH + REALTIME
  ========================================================= */

  useEffect(() => {
    mountedRef.current = true;

    loadAccuracy({
      showInitialLoader: true,
    });

    const intervalId = window.setInterval(
      () => {
        if (
          document.visibilityState === "visible"
        ) {
          loadAccuracy();
        }
      },
      AUTO_REFRESH_INTERVAL
    );

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible"
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

    const realtimeChannel = supabase
      .channel("market-studies-holdings-realtime")
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
            loadAccuracy();
          }
        }
      )
      .subscribe((status) => {
        console.log(
          "Market studies realtime status:",
          status
        );
      });

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

      supabase.removeChannel(realtimeChannel);
    };
  }, [loadAccuracy]);

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

      const highestPrice = getNumericValue(
        holding.highestPrice,
        holding.highest_price,
        holding.cmp
      );

      const lowestPrice = getNumericValue(
        holding.lowestPrice,
        holding.lowest_price,
        holding.cmp
      );

      const stopLoss = getNumericValue(
        holding.stopLoss,
        holding.stop_loss
      );

      const target1 = getNumericValue(
        holding.target1
      );

      const target2 = getNumericValue(
        holding.target2
      );

      const target3 = getNumericValue(
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
     PRICE MOVEMENT
  ========================================================= */

  const getPriceMovement = useCallback(
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
     COMPLETED STUDY
  ========================================================= */

  const isCompletedStudy = useCallback(
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
     PUBLIC STATUS
  ========================================================= */

  const getPublicStatus = useCallback(
    (holding) => {
      const status =
        getInternalStatus(holding);

      if (status === "SL Hit") {
        return "Invalidated";
      }

      if (isCompletedStudy(holding)) {
        return "Completed";
      }

      return "Ongoing";
    },
    [
      getInternalStatus,
      isCompletedStudy,
    ]
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
     BLUR
  ========================================================= */

  const isBlurred = useCallback(
    (holding) =>
      Boolean(
        holding.accuracyBlur ??
          holding.accuracy_blur
      ),
    []
  );

  /* =========================================================
     VISIBILITY FILTER
  ========================================================= */

  const visibilityFilteredStudies =
    useMemo(() => {
      return publishedStudies.filter(
        (holding) => {
          const visibility = normalize(
            holding.visibility
          );

          const blurred =
            isBlurred(holding);

          const isPublic =
            visibility === "public";

          const isMember = [
            "subscriber",
            "community",
          ].includes(visibility);

          const isRevealedMember =
            isMember && !blurred;

          const isProtected =
            isMember && blurred;

          if (
            visibilityFilter === "public"
          ) {
            return (
              isPublic ||
              isRevealedMember
            );
          }

          if (
            visibilityFilter ===
            "protected"
          ) {
            return isProtected;
          }

          return true;
        }
      );
    }, [
      publishedStudies,
      visibilityFilter,
      isBlurred,
    ]);

  /* =========================================================
     SUMMARY + MEDIAN
  ========================================================= */

  const summary = useMemo(() => {
    const completed =
      publishedStudies.filter(
        isCompletedStudy
      );

    const ongoing =
      publishedStudies.filter(
        (holding) =>
          !isCompletedStudy(holding)
      );

    const positive =
      completed.filter(
        (holding) =>
          getPriceMovement(holding) > 0
      );

    const negative =
      completed.filter(
        (holding) =>
          getPriceMovement(holding) < 0
      );

    const neutral =
      completed.filter(
        (holding) =>
          getPriceMovement(holding) === 0
      );

    const completedMovements = completed
      .map((holding) =>
        Number(
          getPriceMovement(holding)
        )
      )
      .filter((value) =>
        Number.isFinite(value)
      )
      .sort((a, b) => a - b);

    let medianPriceMovement = 0;

    if (
      completedMovements.length > 0
    ) {
      const middle = Math.floor(
        completedMovements.length / 2
      );

      if (
        completedMovements.length % 2 ===
        0
      ) {
        medianPriceMovement =
          (
            completedMovements[
              middle - 1
            ] +
            completedMovements[middle]
          ) / 2;
      } else {
        medianPriceMovement =
          completedMovements[middle];
      }
    }

    return {
      total: publishedStudies.length,
      ongoing: ongoing.length,
      completed: completed.length,
      positive: positive.length,
      negative: negative.length,
      neutral: neutral.length,
      medianPriceMovement,
    };
  }, [
    publishedStudies,
    isCompletedStudy,
    getPriceMovement,
  ]);

  /* =========================================================
     SECTOR OPTIONS
  ========================================================= */

  const sectorOptions = useMemo(() => {
    return Array.from(
      new Set(
        publishedStudies
          .map((holding) =>
            String(
              holding.sector ||
                "General"
            ).trim()
          )
          .filter(Boolean)
      )
    ).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [publishedStudies]);

  /* =========================================================
     PUBLICATION DATE
  ========================================================= */

  const getPublishedDateValue = (
    holding
  ) =>
    holding.recommendationDate ||
    holding.recommendation_date ||
    holding.createdAt ||
    holding.created_at ||
    null;

  const getPublishedTimestamp = (
    holding
  ) => {
    const value =
      getPublishedDateValue(holding);

    if (!value) {
      return 0;
    }

    const timestamp =
      new Date(value).getTime();

    return Number.isNaN(timestamp)
      ? 0
      : timestamp;
  };

  const formatPublishedDate = (
    holding
  ) => {
    const value =
      getPublishedDateValue(holding);

    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
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

  /* =========================================================
     FILTER + SORT
  ========================================================= */

  const filteredStudies = useMemo(() => {
    let rows = [
      ...visibilityFilteredStudies,
    ];

    if (
      studyStatusFilter === "ongoing"
    ) {
      rows = rows.filter(
        (holding) =>
          !isCompletedStudy(holding)
      );
    }

    if (
      studyStatusFilter === "completed"
    ) {
      rows = rows.filter(
        isCompletedStudy
      );
    }

    if (
      sectorFilter !== "all"
    ) {
      rows = rows.filter(
        (holding) =>
          String(
            holding.sector ||
              "General"
          ).trim() === sectorFilter
      );
    }

    if (
      sortMode === "newest"
    ) {
      rows.sort(
        (a, b) =>
          getPublishedTimestamp(b) -
          getPublishedTimestamp(a)
      );
    }

    if (
      sortMode === "oldest"
    ) {
      rows.sort(
        (a, b) =>
          getPublishedTimestamp(a) -
          getPublishedTimestamp(b)
      );
    }

    if (
      sortMode ===
      "movement-high"
    ) {
      rows.sort(
        (a, b) =>
          getPriceMovement(b) -
          getPriceMovement(a)
      );
    }

    if (
      sortMode ===
      "movement-low"
    ) {
      rows.sort(
        (a, b) =>
          getPriceMovement(a) -
          getPriceMovement(b)
      );
    }

    return rows;
  }, [
    visibilityFilteredStudies,
    studyStatusFilter,
    sectorFilter,
    sortMode,
    isCompletedStudy,
    getPriceMovement,
  ]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredStudies.length /
        ITEMS_PER_PAGE
    )
  );

  useEffect(() => {
    if (
      currentPage > totalPages
    ) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    visibilityFilter,
    studyStatusFilter,
    sectorFilter,
    sortMode,
  ]);

  const paginatedStudies = useMemo(
    () => {
      const start =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      return filteredStudies.slice(
        start,
        start + ITEMS_PER_PAGE
      );
    },
    [
      filteredStudies,
      currentPage,
    ]
  );

  /* =========================================================
     MOVEMENT DISTRIBUTION
  ========================================================= */

  const movementDistribution =
    useMemo(() => {
      const completed =
        publishedStudies.filter(
          isCompletedStudy
        );

      const buckets = [
        {
          label: "< 0%",
          count: 0,
          className: "loss",
        },
        {
          label: "0% - 10%",
          count: 0,
          className: "low",
        },
        {
          label: "10% - 25%",
          count: 0,
          className: "medium",
        },
        {
          label: "25%+",
          count: 0,
          className: "high",
        },
      ];

      completed.forEach(
        (holding) => {
          const movement =
            getPriceMovement(
              holding
            );

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
          } else {
            buckets[3].count += 1;
          }
        }
      );

      const maxCount = Math.max(
        ...buckets.map(
          (item) => item.count
        ),
        1
      );

      return buckets.map(
        (item) => ({
          ...item,

          height:
            (item.count /
              maxCount) *
            100,
        })
      );
    }, [
      publishedStudies,
      isCompletedStudy,
      getPriceMovement,
    ]);

  /* =========================================================
     FORMATTERS
  ========================================================= */

  const formatPrice = (
    value
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "-";
    }

    const number = Number(value);

    if (
      Number.isNaN(number)
    ) {
      return "-";
    }

    return `₹${number.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const formatUpdatedTime = (
    value
  ) => {
    if (!value) {
      return "";
    }

    return value.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatUpdatedDate = (
    value
  ) => {
    if (!value) {
      return "";
    }

    return value.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* =========================================================
     PROTECTED VALUES
  ========================================================= */

  const renderProtectedText = (
    value,
    holding,
    fallback = "-"
  ) => {
    if (
      !isBlurred(holding)
    ) {
      return value || fallback;
    }

    return (
      <span
        className="accuracy-blurred-value"
        title="Subscriber study details are protected"
      >
        {value || "Protected"}
      </span>
    );
  };

  const renderProtectedPrice = (
    value,
    holding
  ) => {
    if (
      !isBlurred(holding)
    ) {
      return formatPrice(value);
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
     CURRENT / CLOSING REFERENCE
  ========================================================= */

  const getDisplayPrice = (
    holding
  ) => {
    if (
      isCompletedStudy(holding)
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
     DONUT
  ========================================================= */

  const completedTotal =
    summary.completed || 0;

  const positivePercent =
    completedTotal > 0
      ? (summary.positive /
          completedTotal) *
        100
      : 0;

  const negativePercent =
    completedTotal > 0
      ? (summary.negative /
          completedTotal) *
        100
      : 0;

  const donutStyle = {
    background: `conic-gradient(
      #22c55e 0% ${positivePercent}%,
      #ef4444 ${positivePercent}% ${
        positivePercent +
        negativePercent
      }%,
      #cbd5e1 ${
        positivePercent +
        negativePercent
      }% 100%
    )`,
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="accuracy-loading">
        Loading market studies...
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (
    loadError &&
    holdings.length === 0
  ) {
    return (
      <main className="accuracy-page">

        <section className="accuracy-empty-state">

          <h2>
            Unable to load market studies
          </h2>

          <p>
            {loadError}
          </p>

          <button
            type="button"
            onClick={() =>
              loadAccuracy({
                showInitialLoader: true,
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
        title="VTKS Market Studies"
        description="Explore timestamped VTKS educational market studies, reference levels and subsequent market observations."
      />

      <main className="accuracy-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="accuracy-topbar">

          <div className="accuracy-title-area">

            <div className="accuracy-title-line">

              <h1>
                VTKS Market Studies
              </h1>

              <span className="accuracy-research-badge">
                Educational Research
              </span>

            </div>

            <p className="accuracy-philosophy">

              <span>
                Objective
              </span>

              <span className="accuracy-philosophy-dot">
                •
              </span>

              <span>
                Structured
              </span>

              <span className="accuracy-philosophy-dot">
                •
              </span>

              <span>
                Educational
              </span>

            </p>

          </div>

          <div className="accuracy-refresh-area">

            <div className="accuracy-last-updated">

              {lastUpdated ? (
                <span>
                  Last updated:{" "}
                  {formatUpdatedDate(
                    lastUpdated
                  )}
                  ,{" "}
                  {formatUpdatedTime(
                    lastUpdated
                  )}
                </span>
              ) : (
                <span>
                  Waiting for latest data
                </span>
              )}

            </div>

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

        </section>

        {loadError && (
          <div className="accuracy-inline-error">
            {loadError}
          </div>
        )}

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <section className="accuracy-stats">

          <SummaryCard
            icon="▤"
            value={summary.total}
            title="Published Studies"
            subtitle="All-time studies shared"
            tone="blue"
          />

          <SummaryCard
            icon="↗"
            value={summary.ongoing}
            title="Ongoing Studies"
            subtitle="Currently being tracked"
            tone="green"
          />

          <SummaryCard
            icon="✓"
            value={summary.completed}
            title="Completed Studies"
            subtitle="Studies with closing update"
            tone="purple"
          />

          <SummaryCard
            icon="◎"
            value={`${summary.positive} / ${summary.completed}`}
            title="Positive Price Movement"
            subtitle="Completed studies only"
            tone="orange"
          />

          <SummaryCard
            icon="⌁"
            value={`${
              summary.medianPriceMovement >
              0
                ? "+"
                : ""
            }${summary.medianPriceMovement.toFixed(
              2
            )}%`}
            title="Median Price Movement"
            subtitle="Completed studies only"
            tone="teal"
          />

        </section>

        {/* =================================================
            EDUCATIONAL BANNER
        ================================================= */}

        <section className="accuracy-education-banner">

          <div className="accuracy-info-icon">
            i
          </div>

          <div>

            <strong>
              Educational Market Studies
            </strong>

            <p>
              The studies and levels shown
              here are presented for
              educational and research
              purposes only. They are not
              buy/sell recommendations,
              investment advice, or tips.
              Markets are dynamic. Please
              conduct your own research
              before making investment
              decisions.
            </p>

          </div>

        </section>

        {/* =================================================
            MAIN GRID
        ================================================= */}

        <section className="accuracy-main-grid">

          {/* ===============================================
              STUDY ARCHIVE
          =============================================== */}

          <div className="accuracy-track-card">

            <div className="accuracy-track-header">

              <div className="accuracy-archive-title">

                <div className="accuracy-archive-icon">
                  ▣
                </div>

                <div>

                  <h2>
                    Study Archive
                  </h2>

                  <p>
                    Historical market
                    studies and documented
                    outcomes
                  </p>

                </div>

              </div>

              <div className="accuracy-track-controls">

                <select
                  className="accuracy-table-select"
                  value={
                    visibilityFilter
                  }
                  onChange={(event) =>
                    setVisibilityFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="all">
                    All Access
                  </option>

                  <option value="public">
                    Public & Revealed
                  </option>

                  <option value="protected">
                    Protected Studies
                  </option>
                </select>

                <select
                  className="accuracy-table-select"
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

                  {sectorOptions.map(
                    (sector) => (
                      <option
                        key={sector}
                        value={sector}
                      >
                        {sector}
                      </option>
                    )
                  )}
                </select>

                <select
                  className="accuracy-table-select"
                  value={sortMode}
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
                    Movement: High to Low
                  </option>

                  <option value="movement-low">
                    Movement: Low to High
                  </option>
                </select>

              </div>

            </div>

            {/* STATUS FILTER */}

            <div className="accuracy-status-tabs">

              <button
                type="button"
                className={
                  studyStatusFilter ===
                  "all"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setStudyStatusFilter(
                    "all"
                  )
                }
              >
                All Studies
              </button>

              <button
                type="button"
                className={
                  studyStatusFilter ===
                  "ongoing"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setStudyStatusFilter(
                    "ongoing"
                  )
                }
              >
                Ongoing
              </button>

              <button
                type="button"
                className={
                  studyStatusFilter ===
                  "completed"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setStudyStatusFilter(
                    "completed"
                  )
                }
              >
                Completed
              </button>

            </div>

            {/* TABLE */}

            {filteredStudies.length ===
            0 ? (
              <div className="accuracy-empty-state">

                <h3>
                  No studies found
                </h3>

                <p>
                  No market studies match
                  the selected filters.
                </p>

              </div>
            ) : (
              <>

                <div className="accuracy-table-scroll">

                  <table className="accuracy-table">

                    <thead>

                      <tr>

                        <th>
                          Study
                        </th>

                        <th>
                          Sector
                        </th>

                        <th>
                          Study Type
                        </th>

                        <th>
                          Published On
                        </th>

                        <th>
                          Reference Price
                          <small>
                            At Publication
                          </small>
                        </th>

                        <th>
                          Invalidation Level
                          <small>
                            If Broken
                          </small>
                        </th>

                        <th>
                          Reference Zone 1
                          <small>
                            Study Level
                          </small>
                        </th>

                        <th>
                          Reference Zone 2
                          <small>
                            Extended Level
                          </small>
                        </th>

                        <th>
                          Current / Closing
                          Reference
                          <small>
                            Live / Closing
                          </small>
                        </th>

                        <th>
                          Price Movement
                          <small>
                            Since Publication
                          </small>
                        </th>

                        <th>
                          Status
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {paginatedStudies.map(
                        (holding) => {

                          const movement =
                            getPriceMovement(
                              holding
                            );

                          const completed =
                            isCompletedStudy(
                              holding
                            );

                          const publicStatus =
                            getPublicStatus(
                              holding
                            );

                          const displayPrice =
                            getDisplayPrice(
                              holding
                            );

                          const studyType =
                            holding.tradeType ||
                            holding.trade_type ||
                            "-";

                          return (
                            <tr
                              key={
                                holding.id
                              }
                            >

                              <td>

                                <div className="accuracy-study-cell">

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

                                <span className="accuracy-study-type-pill">
                                  {studyType}
                                </span>

                              </td>

                              <td>
                                {formatPublishedDate(
                                  holding
                                )}
                              </td>

                              <td>
                                {renderProtectedPrice(
                                  holding.entry,
                                  holding
                                )}
                              </td>

                              <td>

                                <span className="accuracy-invalidation-value">

                                  {renderProtectedPrice(
                                    holding.stopLoss ??
                                      holding.stop_loss,
                                    holding
                                  )}

                                </span>

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

                                <div className="accuracy-reference-cell">

                                  {renderProtectedPrice(
                                    displayPrice,
                                    holding
                                  )}

                                  {!isBlurred(
                                    holding
                                  ) && (
                                    <small>
                                      {completed
                                        ? "Closing Reference"
                                        : "Live Reference"}
                                    </small>
                                  )}

                                </div>

                              </td>

                              <td>

                                <div
                                  className={`accuracy-movement ${
                                    movement > 0
                                      ? "positive"
                                      : movement < 0
                                        ? "negative"
                                        : "neutral"
                                  }`}
                                >

                                  <strong>

                                    {movement > 0
                                      ? "+"
                                      : ""}

                                    {movement.toFixed(
                                      2
                                    )}

                                    %

                                  </strong>

                                  <MiniTrend
                                    positive={
                                      movement >=
                                      0
                                    }
                                  />

                                </div>

                              </td>

                              <td>

                                <PublicStatusBadge
                                  status={
                                    publicStatus
                                  }
                                />

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>

                <div className="accuracy-pagination-row">

                  <span>

                    Showing{" "}

                    {Math.min(
                      (currentPage - 1) *
                        ITEMS_PER_PAGE +
                        1,
                      filteredStudies.length
                    )}

                    {" "}to{" "}

                    {Math.min(
                      currentPage *
                        ITEMS_PER_PAGE,
                      filteredStudies.length
                    )}

                    {" "}of{" "}

                    {
                      filteredStudies.length
                    }

                    {" "}studies

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

                </div>

              </>
            )}

          </div>

          {/* ===============================================
              RIGHT SIDE CHARTS
          =============================================== */}

          <aside className="accuracy-side-column">

            {/* OUTCOME SUMMARY */}

            <section className="accuracy-side-card">

              <div className="accuracy-side-heading">

                <h3>
                  Study Outcome Summary
                </h3>

                <span>
                  Completed studies
                </span>

              </div>

              <div className="accuracy-outcome-content">

                <div
                  className="accuracy-donut"
                  style={donutStyle}
                >

                  <div className="accuracy-donut-center">

                    <strong>
                      {summary.completed}
                    </strong>

                    <span>
                      Total
                    </span>

                  </div>

                </div>

                <div className="accuracy-outcome-list">

                  <OutcomeRow
                    color="green"
                    label="Positive"
                    value={
                      summary.positive
                    }
                    total={
                      summary.completed
                    }
                  />

                  <OutcomeRow
                    color="red"
                    label="Negative"
                    value={
                      summary.negative
                    }
                    total={
                      summary.completed
                    }
                  />

                  <OutcomeRow
                    color="gray"
                    label="Neutral"
                    value={
                      summary.neutral
                    }
                    total={
                      summary.completed
                    }
                  />

                </div>

              </div>

            </section>

            {/* MOVEMENT DISTRIBUTION */}

            <section className="accuracy-side-card">

              <div className="accuracy-side-heading">

                <h3>
                  Movement Distribution
                </h3>

                <span>
                  Completed studies
                </span>

              </div>

              <div className="accuracy-bar-chart">

                {movementDistribution.map(
                  (item) => (
                    <div
                      className="accuracy-bar-column"
                      key={item.label}
                    >

                      <div className="accuracy-bar-value">
                        {item.count}
                      </div>

                      <div className="accuracy-bar-track">

                        <div
                          className={`accuracy-bar-fill ${item.className}`}
                          style={{
                            height: `${Math.max(
                              item.height,
                              item.count > 0
                                ? 12
                                : 0
                            )}%`,
                          }}
                        />

                      </div>

                      <strong>
                        {item.label}
                      </strong>

                      <small>

                        {item.count}{" "}

                        {item.count === 1
                          ? "Study"
                          : "Studies"}

                      </small>

                    </div>
                  )
                )}

              </div>

              <p className="accuracy-distribution-note">
                Distribution based on
                price movement since
                publication.
              </p>

            </section>

          </aside>

        </section>

        {/* =================================================
            DATA TRANSPARENCY
            MOVED OUTSIDE MAIN GRID
        ================================================= */}

        <section className="accuracy-transparency-wide">

          <div className="accuracy-shield">
            ◈
          </div>

          <div>

            <strong>
              Data Transparency
            </strong>

            <p>
              Reference prices are captured
              from the documented study
              record at publication.
              Subsequent market movement is
              tracked against that original
              reference, while completed
              studies use their documented
              closing reference.
            </p>

          </div>

        </section>

        {/* =================================================
            HOW WE TRACK
        ================================================= */}

        <section className="accuracy-process-section">

          <h2>
            How We Track Studies
          </h2>

          <div className="accuracy-process-grid">

            <ProcessStep
              number="1"
              icon="▤"
              title="Study Published"
              text="A market study is documented with its publication date, reference price and key reference levels."
            />

            <ProcessStep
              number="2"
              icon="↗"
              title="Market Progress"
              text="Subsequent market price movement is tracked from the original documented reference."
            />

            <ProcessStep
              number="3"
              icon="◎"
              title="Study Outcome"
              text="The study remains ongoing or is recorded as completed or invalidated according to the documented structure."
            />

            <ProcessStep
              number="4"
              icon="✓"
              title="Archived"
              text="Completed studies remain in the historical archive for transparency, research and learning."
            />

          </div>

        </section>

        {/* =================================================
            DISCLAIMER
        ================================================= */}

        <section className="accuracy-final-disclaimer">

          <div className="accuracy-disclaimer-icon">
            ⚖
          </div>

          <div>

            <strong>
              Disclaimer
            </strong>

            <p>
              VTKS Market Studies are
              presented for educational and
              research purposes only.
              Historical price movement is
              not indicative of future
              results and should not be
              interpreted as investment
              advice, a recommendation, or
              an assurance of returns.
              Investing in securities is
              subject to market risks.
              Please conduct your own
              research before making any
              investment decision.
            </p>

          </div>

        </section>

      </main>
    </>
  );
}


/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon,
  value,
  title,
  subtitle,
  tone,
}) {
  return (
    <article
      className={`accuracy-summary-card ${tone}`}
    >

      <div
        className={`accuracy-summary-icon ${tone}`}
      >
        {icon}
      </div>

      <div className="accuracy-summary-content">

        <h2>
          {value}
        </h2>

        <strong>
          {title}
        </strong>

        <p>
          {subtitle}
        </p>

      </div>

    </article>
  );
}


/* =========================================================
   PUBLIC STATUS
========================================================= */

function PublicStatusBadge({
  status,
}) {
  const className = normalize(
    status
  ).replace(/\s+/g, "-");

  return (
    <span
      className={`accuracy-public-status ${className}`}
    >

      <span className="accuracy-status-dot" />

      {status}

    </span>
  );
}


/* =========================================================
   OUTCOME ROW
========================================================= */

function OutcomeRow({
  color,
  label,
  value,
  total,
}) {
  const percentage =
    total > 0
      ? (
          (value / total) *
          100
        ).toFixed(2)
      : "0.00";

  return (
    <div className="accuracy-outcome-row">

      <span
        className={`accuracy-outcome-dot ${color}`}
      />

      <span className="accuracy-outcome-label">
        {label}
      </span>

      <strong>

        {value}

        <small>
          {" "}
          ({percentage}%)
        </small>

      </strong>

    </div>
  );
}


/* =========================================================
   MINI TREND
========================================================= */

function MiniTrend({
  positive,
}) {
  return (
    <svg
      className={
        positive
          ? "accuracy-mini-trend positive"
          : "accuracy-mini-trend negative"
      }
      viewBox="0 0 72 24"
      aria-hidden="true"
    >
      <polyline
        points={
          positive
            ? "1,20 10,17 17,18 25,12 33,15 42,9 49,11 58,5 71,3"
            : "1,5 10,8 17,7 25,13 33,10 42,15 49,13 58,19 71,21"
        }
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


/* =========================================================
   PROCESS STEP
========================================================= */

function ProcessStep({
  number,
  icon,
  title,
  text,
}) {
  return (
    <article className="accuracy-process-step">

      <div className="accuracy-process-icon">
        {icon}
      </div>

      <div>

        <span>
          {number}. {title}
        </span>

        <p>
          {text}
        </p>

      </div>

    </article>
  );
}