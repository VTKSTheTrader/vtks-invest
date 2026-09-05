import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  calculateETFPortfolioTotals,
  getPublicETFIdsByAccumulationDate,
  getRecentPublicETFAccumulations,
  getPublicETFs,
} from "../../services/etfService";

import {
  loadSettings,
} from "../../services/settingsService";

import "./ETF.css";

/* =====================================================
   SIP CATEGORIES
===================================================== */

const ETF_TYPES = [
  "Commodity",
  "BEES",
  "Index ETF",
  "Sector ETF",
  "Stock SIP",
];

const getETFTypeLabel = (
  type
) => type;

/* =====================================================
   SORT OPTIONS
===================================================== */

const SORT_OPTIONS = [
  {
    value: "newest",
    label: "Newest Added",
  },
  {
    value: "name-asc",
    label: "Name A → Z",
  },
  {
    value: "return-desc",
    label:
      "Return %: High → Low",
  },
  {
    value: "return-asc",
    label:
      "Return %: Low → High",
  },
  {
    value: "invested-desc",
    label:
      "Invested: High → Low",
  },
  {
    value: "value-desc",
    label:
      "Current Value: High → Low",
  },
  {
    value: "cmp-desc",
    label:
      "CMP: High → Low",
  },
];

const PAGE_SIZE = 5;

/* =====================================================
   FORMATTERS
===================================================== */

const formatCurrency = (
  value,
  maximumFractionDigits = 2
) =>
  new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits,
    }
  ).format(
    Number(value || 0)
  );

const formatNumber = (
  value,
  digits = 2
) =>
  Number(
    value || 0
  ).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits:
        digits,
    }
  );

const formatUpdateDate = (value) => {
  if (!value) return "";

  const date = new Date(
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

/* =====================================================
   MAIN PAGE
===================================================== */

export default function ETF() {
  const navigate =
    useNavigate();

  /* =====================================================
     BROWSER TAB TITLE
  ===================================================== */

  useEffect(() => {
    document.title =
      "SIP Tracker | VTKS INVEST";

    return () => {
      document.title =
        "VTKS INVEST";
    };
  }, []);

  const [
    etfs,
    setETFs,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    recentAccumulations,
    setRecentAccumulations,
  ] = useState([]);

  const [
    dismissedAccumulationIds,
    setDismissedAccumulationIds,
  ] = useState(() => {
    try {
      const saved = localStorage.getItem(
        "vtks-public-sip-dismissed"
      );

      const parsed = saved
        ? JSON.parse(saved)
        : [];

      return Array.isArray(parsed)
        ? parsed.map(String)
        : [];
    } catch {
      return [];
    }
  });

  const [
    showSipUpdates,
    setShowSipUpdates,
  ] = useState(false);

  const [
    pageEnabled,
    setPageEnabled,
  ] = useState(true);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("All");

  const [
    sortBy,
    setSortBy,
  ] = useState("newest");

  const [
    accumulationFromDate,
    setAccumulationFromDate,
  ] = useState("");

  const [
    accumulationToDate,
    setAccumulationToDate,
  ] = useState("");

  const [
    accumulationDateETFIds,
    setAccumulationDateETFIds,
  ] = useState([]);

  const [
    accumulationDateLoading,
    setAccumulationDateLoading,
  ] = useState(false);

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  /* =====================================================
     LOAD PAGE
  ===================================================== */

  useEffect(() => {
    const loadPage =
      async () => {
        try {
          setLoading(true);

          const [
            settings,
            data,
            sipUpdates,
          ] =
            await Promise.all([
              loadSettings(),
              getPublicETFs(),
              getRecentPublicETFAccumulations(20),
            ]);

          const enabled =
            settings?.website
              ?.showETF === true;

          setPageEnabled(
            enabled
          );

          if (enabled) {
            setETFs(
              data || []
            );

            setRecentAccumulations(
              sipUpdates || []
            );
          } else {
            setETFs([]);
            setRecentAccumulations([]);
          }
        } catch (error) {
          console.error(
            "Public SIP Tracker page load error:",
            error
          );

          setETFs([]);
          setRecentAccumulations([]);
        } finally {
          setLoading(false);
        }
      };

    loadPage();
  }, []);

  /* =====================================================
     ACCUMULATION DATE FILTER
  ===================================================== */

  useEffect(() => {
    let active = true;

    const loadAccumulationDateFilter =
      async () => {
        if (
          !accumulationFromDate &&
          !accumulationToDate
        ) {
          setAccumulationDateETFIds([]);
          setAccumulationDateLoading(false);
          return;
        }

        try {
          setAccumulationDateLoading(true);

          const ids =
            await getPublicETFIdsByAccumulationDate({
              fromDate: accumulationFromDate,
              toDate: accumulationToDate,
            });

          if (active) {
            setAccumulationDateETFIds(
              ids || []
            );
          }
        } catch (error) {
          console.error(
            "Public SIP accumulation date filter error:",
            error
          );

          if (active) {
            setAccumulationDateETFIds([]);
          }
        } finally {
          if (active) {
            setAccumulationDateLoading(false);
          }
        }
      };

    loadAccumulationDateFilter();

    return () => {
      active = false;
    };
  }, [
    accumulationFromDate,
    accumulationToDate,
  ]);

  /* =====================================================
     PUBLIC SIP UPDATE NOTIFICATIONS
  ===================================================== */

  const visibleSipUpdates =
    useMemo(() => {
      const dismissed =
        new Set(
          dismissedAccumulationIds.map(
            String
          )
        );

      return recentAccumulations.filter(
        (item) =>
          !dismissed.has(
            String(item.id)
          )
      );
    }, [
      recentAccumulations,
      dismissedAccumulationIds,
    ]);

  const saveDismissedSipUpdates =
    (ids) => {
      const uniqueIds = [
        ...new Set(
          ids.map(String)
        ),
      ];

      setDismissedAccumulationIds(
        uniqueIds
      );

      try {
        localStorage.setItem(
          "vtks-public-sip-dismissed",
          JSON.stringify(uniqueIds)
        );
      } catch (error) {
        console.error(
          "Unable to save dismissed SIP updates:",
          error
        );
      }
    };

  const dismissSipUpdate =
    (id) => {
      saveDismissedSipUpdates([
        ...dismissedAccumulationIds,
        String(id),
      ]);
    };

  const clearAllSipUpdates =
    () => {
      const allVisibleIds =
        visibleSipUpdates.map(
          (item) =>
            String(item.id)
        );

      saveDismissedSipUpdates([
        ...dismissedAccumulationIds,
        ...allVisibleIds,
      ]);
    };

  /* =====================================================
     FILTER + SORT
  ===================================================== */

  const filteredETFs =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      const filtered =
        etfs.filter(
          (etf) => {
            const matchesSearch =
              !query ||
              etf.name
                ?.toLowerCase()
                .includes(
                  query
                ) ||
              etf.symbol
                ?.toLowerCase()
                .includes(
                  query
                ) ||
              etf.fullName
                ?.toLowerCase()
                .includes(
                  query
                );

            const matchesType =
              typeFilter ===
                "All" ||
              etf.etfType ===
                typeFilter;

            const hasAccumulationDateFilter =
              Boolean(
                accumulationFromDate ||
                  accumulationToDate
              );

            const matchesAccumulationDate =
              !hasAccumulationDateFilter ||
              accumulationDateETFIds.includes(
                String(etf.id)
              );

            return (
              matchesSearch &&
              matchesType &&
              matchesAccumulationDate
            );
          }
        );

      return [
        ...filtered,
      ].sort(
        (a, b) => {
          switch (
            sortBy
          ) {
            case "name-asc":
              return String(
                a.name || ""
              ).localeCompare(
                String(
                  b.name || ""
                )
              );

            case "return-desc":
              return (
                Number(
                  b.returnPercentage ||
                    0
                ) -
                Number(
                  a.returnPercentage ||
                    0
                )
              );

            case "return-asc":
              return (
                Number(
                  a.returnPercentage ||
                    0
                ) -
                Number(
                  b.returnPercentage ||
                    0
                )
              );

            case "invested-desc":
              return (
                Number(
                  b.totalInvested ||
                    0
                ) -
                Number(
                  a.totalInvested ||
                    0
                )
              );

            case "value-desc":
              return (
                Number(
                  b.currentValue ||
                    0
                ) -
                Number(
                  a.currentValue ||
                    0
                )
              );

            case "cmp-desc":
              return (
                Number(
                  b.cmp || 0
                ) -
                Number(
                  a.cmp || 0
                )
              );

            case "newest":
            default:
              return (
                new Date(
                  b.createdAt ||
                    0
                ).getTime() -
                new Date(
                  a.createdAt ||
                    0
                ).getTime()
              );
          }
        }
      );
    }, [
      etfs,
      search,
      typeFilter,
      sortBy,
      accumulationFromDate,
      accumulationToDate,
      accumulationDateETFIds,
    ]);

  /* =====================================================
     RESET PAGE ON FILTER
  ===================================================== */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    typeFilter,
    sortBy,
    accumulationFromDate,
    accumulationToDate,
  ]);

  /* =====================================================
     TOTALS
  ===================================================== */

  const totals =
    useMemo(
      () =>
        calculateETFPortfolioTotals(
          etfs
        ),
      [etfs]
    );

  /* =====================================================
     PAGINATION
  ===================================================== */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredETFs.length /
          PAGE_SIZE
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

  const paginatedETFs =
    useMemo(() => {
      const startIndex =
        (
          currentPage - 1
        ) *
        PAGE_SIZE;

      return filteredETFs.slice(
        startIndex,
        startIndex +
          PAGE_SIZE
      );
    }, [
      filteredETFs,
      currentPage,
    ]);

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="public-etf-page">

        <div className="public-etf-state">
          Loading SIP Tracker...
        </div>

      </div>
    );
  }

  /* =====================================================
     PAGE DISABLED
  ===================================================== */

  if (!pageEnabled) {
    return (
      <div className="public-etf-page">

        <div className="public-etf-state">

          <h2>
            SIP Tracker is
            currently unavailable.
          </h2>

          <p>
            Please check back
            later.
          </p>

        </div>

      </div>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="public-etf-page">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="public-etf-hero" style={{ position: "relative" }}>

        <p className="public-etf-eyebrow">
          VTKS LONG-TERM SIP
          TRACKER
        </p>

        <h1>
          Building Wealth Through
          SIP
        </h1>

        <p className="public-etf-intro">
          A disciplined and
          transparent SIP
          accumulation framework
          with a 3-year minimum
          commitment, built for
          long-term wealth creation
          across 10, 15, and
          20-year horizons, with
          documented accumulation
          records and market-linked
          portfolio tracking.
        </p>


        {visibleSipUpdates.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "0",
              right: "0",
              zIndex: 30,
            }}
          >
            <button
              type="button"
              aria-label="Open SIP updates"
              title="SIP Updates"
              onClick={() =>
                setShowSipUpdates(
                  (open) => !open
                )
              }
              style={{
                position: "relative",
                width: "46px",
                height: "46px",
                border: "1px solid #bfdbfe",
                borderRadius: "50%",
                background: "#eff6ff",
                color: "#1d4ed8",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow:
                  "0 8px 20px rgba(37, 99, 235, 0.14)",
                fontSize: "20px",
              }}
            >
              🔔

              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  minWidth: "20px",
                  height: "20px",
                  padding: "0 5px",
                  borderRadius: "999px",
                  background: "#2563eb",
                  color: "#ffffff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: 700,
                  lineHeight: 1,
                  border: "2px solid #ffffff",
                }}
              >
                {visibleSipUpdates.length}
              </span>
            </button>

            {showSipUpdates && (
              <div
                style={{
                  position: "absolute",
                  top: "56px",
                  right: "0",
                  width:
                    "min(420px, calc(100vw - 40px))",
                  border: "1px solid #dbeafe",
                  borderRadius: "14px",
                  background: "#ffffff",
                  boxShadow:
                    "0 18px 45px rgba(15, 23, 42, 0.18)",
                  overflow: "hidden",
                  zIndex: 40,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "space-between",
                    gap: "10px",
                    padding: "11px 12px",
                    background: "#eff6ff",
                    borderBottom:
                      "1px solid #dbeafe",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        fontSize: "15px",
                      }}
                    >
                      🔔
                    </span>

                    <strong
                      style={{
                        color: "#1d4ed8",
                        fontSize: "13px",
                        letterSpacing: ".03em",
                      }}
                    >
                      SIP UPDATES
                    </strong>

                    <span
                      style={{
                        minWidth: "20px",
                        height: "20px",
                        padding: "0 6px",
                        borderRadius: "999px",
                        background: "#2563eb",
                        color: "#ffffff",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent:
                          "center",
                        fontSize: "10px",
                        fontWeight: 700,
                      }}
                    >
                      {visibleSipUpdates.length}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={
                        clearAllSipUpdates
                      }
                      style={{
                        border: "none",
                        background:
                          "transparent",
                        color: "#64748b",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: "4px 5px",
                      }}
                    >
                      Clear All
                    </button>

                    <button
                      type="button"
                      aria-label="Close SIP updates"
                      title="Close"
                      onClick={() =>
                        setShowSipUpdates(
                          false
                        )
                      }
                      style={{
                        width: "26px",
                        height: "26px",
                        border:
                          "1px solid #e2e8f0",
                        borderRadius: "7px",
                        background: "#ffffff",
                        color: "#64748b",
                        display:
                          "inline-flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        cursor: "pointer",
                        fontSize: "15px",
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    height: "138px",
                    overflowY: "auto",
                    overflowX: "hidden",
                  }}
                >
                  {visibleSipUpdates.map(
                    (update, index) => (
                      <div
                        key={update.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent:
                            "space-between",
                          gap: "10px",
                          height: "69px",
                          minHeight: "69px",
                          boxSizing:
                            "border-box",
                          padding: "9px 10px",
                          borderBottom:
                            index ===
                            visibleSipUpdates.length -
                              1
                              ? "none"
                              : "1px solid #eef2f7",
                          background:
                            index === 0
                              ? "#f8fbff"
                              : "#ffffff",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems:
                              "flex-start",
                            gap: "8px",
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              fontSize: "14px",
                              lineHeight: 1.4,
                              flexShrink: 0,
                            }}
                          >
                            🔔
                          </span>

                          <div
                            style={{
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems:
                                  "center",
                                gap: "6px",
                                minWidth: 0,
                              }}
                            >
                              <strong
                                style={{
                                  color:
                                    "#0f172a",
                                  fontSize:
                                    "13px",
                                  overflow:
                                    "hidden",
                                  textOverflow:
                                    "ellipsis",
                                  whiteSpace:
                                    "nowrap",
                                }}
                              >
                                {update.etfName}
                              </strong>

                              {index ===
                                0 && (
                                <span
                                  style={{
                                    background:
                                      "#dbeafe",
                                    color:
                                      "#1d4ed8",
                                    borderRadius:
                                      "999px",
                                    padding:
                                      "1px 5px",
                                    fontSize:
                                      "8px",
                                    fontWeight:
                                      700,
                                    flexShrink:
                                      0,
                                  }}
                                >
                                  NEW
                                </span>
                              )}
                            </div>

                            <span
                              style={{
                                display:
                                  "block",
                                marginTop:
                                  "3px",
                                color:
                                  "#64748b",
                                fontSize:
                                  "11px",
                                lineHeight:
                                  1.3,
                              }}
                            >
                              Added on{" "}
                              {formatUpdateDate(
                                update.accumulationDate
                              )}
                            </span>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems:
                              "center",
                            gap: "5px",
                            flexShrink: 0,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setShowSipUpdates(
                                false
                              );
                              navigate(
                                `/etf/${update.etfId}`
                              );
                            }}
                            style={{
                              border:
                                "1px solid #bfdbfe",
                              background:
                                "#eff6ff",
                              color:
                                "#1d4ed8",
                              borderRadius:
                                "8px",
                              padding:
                                "6px 8px",
                              fontSize:
                                "10px",
                              fontWeight:
                                700,
                              cursor:
                                "pointer",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            View
                          </button>

                          <button
                            type="button"
                            aria-label="Dismiss SIP update"
                            title="Dismiss"
                            onClick={() =>
                              dismissSipUpdate(
                                update.id
                              )
                            }
                            style={{
                              width: "26px",
                              height:
                                "26px",
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              border:
                                "1px solid #e2e8f0",
                              borderRadius:
                                "7px",
                              background:
                                "#ffffff",
                              color:
                                "#64748b",
                              cursor:
                                "pointer",
                              fontSize:
                                "15px",
                              lineHeight: 1,
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </section>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <section className="public-etf-summary-grid">

        <article className="public-etf-summary-card">

          <span>
            SIPs Tracked
          </span>

          <strong>
            {totals.etfCount}
          </strong>

          <small>
            Published SIP records
          </small>

        </article>

        <article className="public-etf-summary-card">

          <span>
            Total Invested
          </span>

          <strong>
            {formatCurrency(
              totals.totalInvested
            )}
          </strong>

          <small>
            Across published SIP
            accumulations
          </small>

        </article>

        <article className="public-etf-summary-card">

          <span>
            Current Value
          </span>

          <strong>
            {formatCurrency(
              totals.currentValue
            )}
          </strong>

          <small>
            Based on current CMP
          </small>

        </article>

        <article className="public-etf-summary-card">

          <span>
            Overall Change
          </span>

          <strong
            className={
              totals.gainLoss >=
              0
                ? "public-etf-positive"
                : "public-etf-negative"
            }
          >
            {totals.gainLoss >=
            0
              ? "+"
              : ""}

            {formatCurrency(
              totals.gainLoss
            )}
          </strong>

          <small
            className={
              totals.returnPercentage >=
              0
                ? "public-etf-positive"
                : "public-etf-negative"
            }
          >
            {totals.returnPercentage >=
            0
              ? "+"
              : ""}

            {Number(
              totals.returnPercentage ||
                0
            ).toFixed(2)}
            %
          </small>

        </article>

      </section>

      {/* =================================================
          FILTERS
      ================================================= */}

      <section className="public-etf-toolbar">

        <input
          type="text"
          value={search}
          onChange={(
            event
          ) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search SIP name or symbol..."
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "48px",
            padding: "0 12px",
            border: "1px solid #dbe3ef",
            borderRadius: "10px",
            background: "#ffffff",
            whiteSpace: "nowrap",
          }}
        >
          <strong
            style={{
              fontSize: "12px",
              color: "#64748b",
            }}
          >
            Accumulated
          </strong>

          <input
            type="date"
            value={accumulationFromDate}
            max={accumulationToDate || undefined}
            onChange={(event) =>
              setAccumulationFromDate(
                event.target.value
              )
            }
            aria-label="Accumulated from date"
            style={{
              width: "132px",
              border: "none",
              outline: "none",
              background: "transparent",
              padding: "0",
              minHeight: "34px",
              fontSize: "13px",
              color: "#0f172a",
            }}
          />

          <span
            style={{
              color: "#64748b",
              fontSize: "12px",
            }}
          >
            to
          </span>

          <input
            type="date"
            value={accumulationToDate}
            min={accumulationFromDate || undefined}
            onChange={(event) =>
              setAccumulationToDate(
                event.target.value
              )
            }
            aria-label="Accumulated to date"
            style={{
              width: "132px",
              border: "none",
              outline: "none",
              background: "transparent",
              padding: "0",
              minHeight: "34px",
              fontSize: "13px",
              color: "#0f172a",
            }}
          />

          {accumulationDateLoading && (
            <span
              style={{
                color: "#2563eb",
                fontSize: "11px",
              }}
            >
              ...
            </span>
          )}
        </div>

        <select
          value={
            typeFilter
          }
          onChange={(
            event
          ) =>
            setTypeFilter(
              event.target.value
            )
          }
        >

          <option value="All">
            All SIP Categories
          </option>

          {ETF_TYPES.map(
            (type) => (

              <option
                key={type}
                value={type}
              >
                {getETFTypeLabel(
                  type
                )}
              </option>

            )
          )}

        </select>

        <select
          value={sortBy}
          onChange={(
            event
          ) =>
            setSortBy(
              event.target.value
            )
          }
        >

          {SORT_OPTIONS.map(
            (option) => (

              <option
                key={
                  option.value
                }
                value={
                  option.value
                }
              >
                {
                  option.label
                }
              </option>

            )
          )}

        </select>

        {(search ||
          typeFilter !==
            "All" ||
          sortBy !==
            "newest" ||
          accumulationFromDate ||
          accumulationToDate) && (

          <button
            type="button"
            className="public-etf-clear"
            onClick={() => {
              setSearch("");
              setTypeFilter(
                "All"
              );
              setSortBy(
                "newest"
              );
              setAccumulationFromDate("");
              setAccumulationToDate("");
              setAccumulationDateETFIds([]);
              setCurrentPage(
                1
              );
            }}
          >
            Clear
          </button>

        )}

      </section>

      {/* =================================================
          TABLE
      ================================================= */}

      <section className="public-etf-table-card">

        {filteredETFs.length ===
        0 ? (

          <div className="public-etf-state">
            No published SIP
            records found.
          </div>

        ) : (

          <div className="public-etf-table-wrap">

            <table className="public-etf-table">

              <thead>

                <tr>

                  <th>
                    SIP
                  </th>

                  <th>
                    Category
                  </th>

                  <th>
                    CMP
                  </th>

                  <th>
                    Avg Price
                  </th>

                  <th>
                    Invested
                  </th>

                  <th>
                    Units
                  </th>

                  <th>
                    Current Value
                  </th>

                  <th>
                    Change
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {paginatedETFs.map(
                  (etf) => {
                    const positive =
                      Number(
                        etf.returnPercentage ||
                          0
                      ) >= 0;

                    return (

                      <tr
                        key={
                          etf.id
                        }
                      >

                        {/* SIP / UNDERLYING INSTRUMENT */}

                        <td>

                          <div className="public-etf-name-cell">

                            <strong>
                              {
                                etf.name
                              }
                            </strong>

                            <span>
                              {
                                etf.symbol
                              }
                            </span>

                            {etf.fullName && (

                              <small>
                                {
                                  etf.fullName
                                }
                              </small>

                            )}

                          </div>

                        </td>

                        {/* SIP CATEGORY */}

                        <td>

                          <span className="public-etf-type">
                            {getETFTypeLabel(
                              etf.etfType
                            )}
                          </span>

                        </td>

                        {/* CMP */}

                        <td>
                          {formatCurrency(
                            etf.cmp
                          )}
                        </td>

                        {/* AVG */}

                        <td>
                          {formatCurrency(
                            etf.averagePrice
                          )}
                        </td>

                        {/* INVESTED */}

                        <td>
                          {formatCurrency(
                            etf.totalInvested
                          )}
                        </td>

                        {/* UNITS */}

                        <td>
                          {formatNumber(
                            etf.totalUnits,
                            4
                          )}
                        </td>

                        {/* VALUE */}

                        <td>
                          {formatCurrency(
                            etf.currentValue
                          )}
                        </td>

                        {/* CHANGE */}

                        <td>

                          <div
                            className={
                              positive
                                ? "public-etf-positive"
                                : "public-etf-negative"
                            }
                          >

                            <strong>

                              {positive
                                ? "+"
                                : ""}

                              {Number(
                                etf.returnPercentage ||
                                  0
                              ).toFixed(
                                2
                              )}
                              %

                            </strong>

                            <small>

                              {Number(
                                etf.gainLoss ||
                                  0
                              ) >= 0
                                ? "+"
                                : ""}

                              {formatCurrency(
                                etf.gainLoss
                              )}

                            </small>

                          </div>

                        </td>

                        {/* ACTION */}

                        <td>

                          <button
                            type="button"
                            className="public-etf-view-button"
                            onClick={() =>
                              navigate(
                                `/etf/${etf.id}`
                              )
                            }
                          >
                            View Details →
                          </button>

                        </td>

                      </tr>

                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

      {/* =================================================
          PAGINATION
      ================================================= */}

      {filteredETFs.length >
        0 && (

        <div className="public-etf-pagination">

          <span>

            Showing{" "}

            {(currentPage -
              1) *
              PAGE_SIZE +
              1}

            {" - "}

            {Math.min(
              currentPage *
                PAGE_SIZE,
              filteredETFs.length
            )}

            {" of "}

            {
              filteredETFs.length
            }

            {" SIPs"}

          </span>

          <div>

            <button
              type="button"
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.max(
                      1,
                      page - 1
                    )
                )
              }
              disabled={
                currentPage ===
                1
              }
            >
              Previous
            </button>

            <strong>
              Page{" "}
              {currentPage}{" "}
              of{" "}
              {totalPages}
            </strong>

            <button
              type="button"
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.min(
                      totalPages,
                      page + 1
                    )
                )
              }
              disabled={
                currentPage ===
                totalPages
              }
            >
              Next
            </button>

          </div>

        </div>

      )}

      {/* =================================================
          DISCLOSURE
      ================================================= */}

      <p className="public-etf-disclaimer">

        <strong>
          Disclosure:
        </strong>{" "}

        The VTKS Long-Term SIP
        Tracker is presented solely
        for educational and
        informational purposes and
        documents a structured,
        market-linked accumulation
        approach. The framework is
        designed with a minimum
        commitment period of 3 years
        and long-term horizons such
        as 10, 15, or 20 years. It
        does not constitute
        investment advice, portfolio
        management, a mutual fund
        scheme, or an offer,
        recommendation or
        solicitation to buy or sell
        any security. The underlying
        instruments, prices,
        portfolio values and returns
        are market-linked and may
        fluctuate. Past performance
        does not guarantee future
        results. Investors should
        independently assess their
        financial objectives, risk
        tolerance and suitability,
        conduct their own research,
        and where appropriate consult
        a SEBI-registered investment
        adviser before making
        investment decisions.

      </p>

    </div>
  );
}