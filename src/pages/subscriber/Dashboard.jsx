import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import ChangePassword from "../../components/auth/ChangePassword";
import NotificationBell from "../../components/subscriber/NotificationBell";
import Pagination from "../../components/common/Pagination";

import { logoutUser } from "../../services/authService";

import {
  getHoldings,
  mapHoldingFromDB,
  refreshCMP,
} from "../../services/holdingService";

import {
  getSubscriberProfile,
  getSubscriberMembership,
  getSubscriberLibrary,
  getSubscriberScanners,
} from "../../services/subscriberService";

import {
  getSubscriberCommunityLinks,
} from "../../services/communityService";

import {
  getSubscriberMonthlyLevels,
} from "../../services/monthlyLevelsService";

import "./Dashboard.css";

const PORTFOLIO_ITEMS_PER_PAGE = 5;
const DASHBOARD_PREVIEW_ITEMS = 3;

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export default function Dashboard() {
  const [profile, setProfile] =
    useState(null);

  const [membership, setMembership] =
    useState(null);

  const [holdings, setHoldings] =
    useState([]);

  const [library, setLibrary] =
    useState([]);

  const [scanners, setScanners] =
    useState([]);

  const [
    communityLinks,
    setCommunityLinks,
  ] = useState([]);

  const [
    monthlyLevels,
    setMonthlyLevels,
  ] = useState([]);

  const [
    portfolioPage,
    setPortfolioPage,
  ] = useState(1);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  /* =========================================================
     PORTFOLIO FILTERS
  ========================================================= */

  const [
    portfolioSearch,
    setPortfolioSearch,
  ] = useState("");

  const [
    portfolioSector,
    setPortfolioSector,
  ] = useState("all");

  const [
    portfolioTradeType,
    setPortfolioTradeType,
  ] = useState("all");

  const [
    portfolioStatus,
    setPortfolioStatus,
  ] = useState("all");

  const [
    portfolioAccess,
    setPortfolioAccess,
  ] = useState("all");

  const [
    portfolioRoiSort,
    setPortfolioRoiSort,
  ] = useState("latest");

  /* =========================================================
     LOAD
  ========================================================= */

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard =
    async () => {
      try {
        setLoading(true);
        setLoadError("");

        const profileData =
          await getSubscriberProfile();

        const membershipData =
          await getSubscriberMembership(
            profileData.email
          );

        /*
          Refresh Dhan CMP before reading holdings.

          This keeps the subscriber dashboard independent
          of the Admin page. If the live refresh fails,
          the dashboard still loads using the last CMP
          already stored in Supabase.
        */
        try {
          const cmpRefreshResult =
            await refreshCMP();

          console.log(
            "Subscriber CMP refresh:",
            cmpRefreshResult
          );
        } catch (cmpError) {
          console.warn(
            "Subscriber CMP refresh skipped/failed:",
            cmpError
          );
        }

        const [
          holdingRows,
          libraryRows,
          scannerRows,
          communityRows,
          monthlyRows,
        ] = await Promise.all([
          getHoldings(),
          getSubscriberLibrary(),
          getSubscriberScanners(),
          getSubscriberCommunityLinks(),
          getSubscriberMonthlyLevels(),
        ]);

        const visibleHoldings =
          (holdingRows || [])
            .map(
              mapHoldingFromDB
            )
            .filter(
              (holding) => {
                const visibility =
                  normalize(
                    holding.visibility
                  );

                const publishStatus =
                  normalize(
                    holding.publishStatus
                  );

                const tradeStatus =
                  normalize(
                    holding.tradeStatus
                  );

                return (
                  [
                    "public",
                    "subscriber",
                    "community",
                  ].includes(
                    visibility
                  ) &&
                  publishStatus !==
                    "draft" &&
                  tradeStatus !==
                    "cancelled"
                );
              }
            );

        setProfile(
          profileData
        );

        setMembership(
          membershipData
        );

        setHoldings(
          visibleHoldings
        );

        setLibrary(
          libraryRows || []
        );

        setScanners(
          scannerRows || []
        );

        setCommunityLinks(
          communityRows || []
        );

        setMonthlyLevels(
          monthlyRows || []
        );
      } catch (error) {
        console.error(
          "Subscriber dashboard error:",
          error
        );

        setLoadError(
          error?.message ||
            "Failed to load subscriber dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     MEMBERSHIP
  ========================================================= */

  const getDaysLeft = () => {
    if (
      !membership?.expiry_date
    ) {
      return 0;
    }

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const expiry =
      new Date(
        membership.expiry_date
      );

    expiry.setHours(
      23,
      59,
      59,
      999
    );

    return Math.ceil(
      (
        expiry.getTime() -
        today.getTime()
      ) /
        (
          1000 *
          60 *
          60 *
          24
        )
    );
  };

  const membershipStatus =
    normalize(
      membership?.status
    );

  const isExpired =
    !membership ||
    membershipStatus ===
      "expired" ||
    membershipStatus ===
      "inactive" ||
    getDaysLeft() <= 0;

  /* =========================================================
     STATUS
  ========================================================= */

  const getTradeStatus = (
    holding
  ) =>
    String(
      holding.tradeStatus ||
        holding.trade_status ||
        holding.status ||
        "Active"
    ).trim();

  /* =========================================================
     CLOSED STUDIES
  ========================================================= */

  const isClosedTrade = (
    holding
  ) =>
    [
      "Booked Profit",
      "Booked Loss",
      "Breakeven",
      "SL Hit",
    ].includes(
      getTradeStatus(
        holding
      )
    );

  const isLossTrade = (
    holding
  ) =>
    [
      "Booked Loss",
      "SL Hit",
    ].includes(
      getTradeStatus(
        holding
      )
    );

  /* =========================================================
     EXIT PRICE
  ========================================================= */

  const getExitPrice = (
    holding
  ) => {
    const savedExitPrice =
      Number(
        holding.exitPrice ??
          holding.exit_price ??
          0
      );

    if (
      Number.isFinite(
        savedExitPrice
      ) &&
      savedExitPrice > 0
    ) {
      return savedExitPrice;
    }

    const status =
      getTradeStatus(
        holding
      );

    if (
      status === "SL Hit"
    ) {
      return Number(
        holding.stopLoss ||
          holding.cmp ||
          holding.entry ||
          0
      );
    }

    return Number(
      holding.cmp ||
        holding.entry ||
        0
    );
  };

  /* =========================================================
     ROI
  ========================================================= */

  const calculateReturn = (
    holding
  ) => {
    const entry =
      Number(
        holding.entry || 0
      );

    if (
      !Number.isFinite(
        entry
      ) ||
      entry <= 0
    ) {
      return 0;
    }

    const closedTrade =
      isClosedTrade(
        holding
      );

    const savedRealisedReturn =
      holding.realisedReturn ??
      holding.realised_return;

    if (
      closedTrade &&
      savedRealisedReturn !==
        null &&
      savedRealisedReturn !==
        undefined &&
      savedRealisedReturn !==
        ""
    ) {
      const realisedReturn =
        Number(
          savedRealisedReturn
        );

      if (
        Number.isFinite(
          realisedReturn
        )
      ) {
        return realisedReturn;
      }
    }

    if (
      closedTrade
    ) {
      const exitPrice =
        getExitPrice(
          holding
        );

      if (
        Number.isFinite(
          exitPrice
        ) &&
        exitPrice > 0
      ) {
        return (
          (
            exitPrice -
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

    if (
      !Number.isFinite(
        cmp
      ) ||
      cmp <= 0
    ) {
      return 0;
    }

    return (
      (
        cmp -
        entry
      ) /
      entry
    ) * 100;
  };

  /* =========================================================
     FORMAT
  ========================================================= */

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "-";
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatPrice = (
    value
  ) => {
    const number =
      Number(
        value || 0
      );

    if (!number) {
      return "₹-";
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
     FILTER OPTIONS
  ========================================================= */

  const portfolioSectors =
    useMemo(() => {
      return [
        ...new Set(
          holdings
            .map(
              (holding) =>
                String(
                  holding.sector ||
                    "General"
                ).trim()
            )
            .filter(Boolean)
        ),
      ].sort(
        (
          first,
          second
        ) =>
          first.localeCompare(
            second
          )
      );
    }, [holdings]);

  const portfolioTradeTypes =
    useMemo(() => {
      return [
        ...new Set(
          holdings
            .map(
              (holding) =>
                String(
                  holding.tradeType ||
                    holding.trade_type ||
                    "Swing"
                ).trim()
            )
            .filter(Boolean)
        ),
      ].sort(
        (
          first,
          second
        ) =>
          first.localeCompare(
            second
          )
      );
    }, [holdings]);

  /* =========================================================
     FILTER + SORT
  ========================================================= */

  const filteredHoldings =
    useMemo(() => {
      const query =
        normalize(
          portfolioSearch
        );

      const rows =
        holdings.filter(
          (holding) => {
            const stock =
              normalize(
                holding.stock
              );

            const sector =
              normalize(
                holding.sector ||
                  "General"
              );

            const tradeType =
              normalize(
                holding.tradeType ||
                  holding.trade_type ||
                  "Swing"
              );

            const status =
              normalize(
                getTradeStatus(
                  holding
                )
              );

            const visibility =
              normalize(
                holding.visibility
              );

            const matchesSearch =
              !query ||
              stock.includes(
                query
              ) ||
              sector.includes(
                query
              );

            const matchesSector =
              portfolioSector ===
                "all" ||
              sector ===
                normalize(
                  portfolioSector
                );

            const matchesTradeType =
              portfolioTradeType ===
                "all" ||
              tradeType ===
                normalize(
                  portfolioTradeType
                );

            const matchesStatus =
              portfolioStatus ===
                "all" ||
              status ===
                normalize(
                  portfolioStatus
                );

            const isSubscriberAccess =
              visibility ===
                "subscriber" ||
              visibility ===
                "community";

            const matchesAccess =
              portfolioAccess ===
                "all" ||
              (
                portfolioAccess ===
                  "public" &&
                visibility ===
                  "public"
              ) ||
              (
                portfolioAccess ===
                  "subscriber" &&
                isSubscriberAccess
              );

            return (
              matchesSearch &&
              matchesSector &&
              matchesTradeType &&
              matchesStatus &&
              matchesAccess
            );
          }
        );

      return [
        ...rows,
      ].sort(
        (
          first,
          second
        ) => {
          if (
            portfolioRoiSort ===
            "high"
          ) {
            return (
              calculateReturn(
                second
              ) -
              calculateReturn(
                first
              )
            );
          }

          if (
            portfolioRoiSort ===
            "low"
          ) {
            return (
              calculateReturn(
                first
              ) -
              calculateReturn(
                second
              )
            );
          }

          const firstDate =
            new Date(
              first.recommendationDate ||
                first.createdAt ||
                first.created_at ||
                0
            ).getTime();

          const secondDate =
            new Date(
              second.recommendationDate ||
                second.createdAt ||
                second.created_at ||
                0
            ).getTime();

          if (
            secondDate !==
            firstDate
          ) {
            return (
              secondDate -
              firstDate
            );
          }

          return (
            Number(
              second.id || 0
            ) -
            Number(
              first.id || 0
            )
          );
        }
      );
    }, [
      holdings,
      portfolioSearch,
      portfolioSector,
      portfolioTradeType,
      portfolioStatus,
      portfolioAccess,
      portfolioRoiSort,
    ]);

  /* =========================================================
     ACTIVE FILTER
  ========================================================= */

  const hasActivePortfolioFilters =
    portfolioSearch !== "" ||
    portfolioSector !== "all" ||
    portfolioTradeType !== "all" ||
    portfolioStatus !== "all" ||
    portfolioAccess !== "all" ||
    portfolioRoiSort !== "latest";

  /* =========================================================
     CLEAR FILTERS
  ========================================================= */

  const clearPortfolioFilters =
    () => {
      setPortfolioSearch("");

      setPortfolioSector(
        "all"
      );

      setPortfolioTradeType(
        "all"
      );

      setPortfolioStatus(
        "all"
      );

      setPortfolioAccess(
        "all"
      );

      setPortfolioRoiSort(
        "latest"
      );

      setPortfolioPage(1);
    };

  /* =========================================================
     RESET PAGINATION
  ========================================================= */

  useEffect(() => {
    setPortfolioPage(1);
  }, [
    portfolioSearch,
    portfolioSector,
    portfolioTradeType,
    portfolioStatus,
    portfolioAccess,
    portfolioRoiSort,
  ]);

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPortfolioPages =
    Math.max(
      1,
      Math.ceil(
        filteredHoldings.length /
          PORTFOLIO_ITEMS_PER_PAGE
      )
    );

  useEffect(() => {
    if (
      portfolioPage >
      totalPortfolioPages
    ) {
      setPortfolioPage(
        totalPortfolioPages
      );
    }
  }, [
    portfolioPage,
    totalPortfolioPages,
  ]);

  const paginatedHoldings =
    useMemo(() => {
      const startIndex =
        (
          portfolioPage -
          1
        ) *
        PORTFOLIO_ITEMS_PER_PAGE;

      return filteredHoldings.slice(
        startIndex,
        startIndex +
          PORTFOLIO_ITEMS_PER_PAGE
      );
    }, [
      filteredHoldings,
      portfolioPage,
    ]);

  const firstPortfolioRecord =
    filteredHoldings.length ===
    0
      ? 0
      : (
          portfolioPage -
          1
        ) *
          PORTFOLIO_ITEMS_PER_PAGE +
        1;

  const lastPortfolioRecord =
    Math.min(
      portfolioPage *
        PORTFOLIO_ITEMS_PER_PAGE,
      filteredHoldings.length
    );

  /* =========================================================
     PREVIEWS
  ========================================================= */

  const latestLibraryResources =
    useMemo(() => {
      return [
        ...library,
      ]
        .sort(
          (
            first,
            second
          ) => {
            if (
              first.pinned &&
              !second.pinned
            ) {
              return -1;
            }

            if (
              !first.pinned &&
              second.pinned
            ) {
              return 1;
            }

            if (
              first.featured &&
              !second.featured
            ) {
              return -1;
            }

            if (
              !first.featured &&
              second.featured
            ) {
              return 1;
            }

            const firstDate =
              new Date(
                first.updated_at ||
                  first.created_at ||
                  0
              ).getTime();

            const secondDate =
              new Date(
                second.updated_at ||
                  second.created_at ||
                  0
              ).getTime();

            return (
              secondDate -
              firstDate
            );
          }
        )
        .slice(
          0,
          DASHBOARD_PREVIEW_ITEMS
        );
    }, [library]);

  const latestScanners =
    useMemo(() => {
      return [
        ...scanners,
      ]
        .sort(
          (
            first,
            second
          ) => {
            if (
              first.featured &&
              !second.featured
            ) {
              return -1;
            }

            if (
              !first.featured &&
              second.featured
            ) {
              return 1;
            }

            const firstDate =
              new Date(
                first.updated_at ||
                  first.updatedAt ||
                  0
              ).getTime();

            const secondDate =
              new Date(
                second.updated_at ||
                  second.updatedAt ||
                  0
              ).getTime();

            return (
              secondDate -
              firstDate
            );
          }
        )
        .slice(
          0,
          DASHBOARD_PREVIEW_ITEMS
        );
    }, [scanners]);

  const latestCommunityLinks =
    useMemo(() => {
      return [
        ...communityLinks,
      ]
        .sort(
          (
            first,
            second
          ) => {
            if (
              first.featured &&
              !second.featured
            ) {
              return -1;
            }

            if (
              !first.featured &&
              second.featured
            ) {
              return 1;
            }

            const firstOrder =
              Number(
                first.sortOrder ??
                  first.sort_order ??
                  0
              );

            const secondOrder =
              Number(
                second.sortOrder ??
                  second.sort_order ??
                  0
              );

            if (
              firstOrder !==
              secondOrder
            ) {
              return (
                firstOrder -
                secondOrder
              );
            }

            return (
              Number(
                first.id || 0
              ) -
              Number(
                second.id || 0
              )
            );
          }
        )
        .slice(
          0,
          DASHBOARD_PREVIEW_ITEMS
        );
    }, [
      communityLinks,
    ]);

  const latestMonthlyLevels =
    useMemo(() => {
      return [
        ...monthlyLevels,
      ]
        .sort(
          (
            first,
            second
          ) =>
            String(
              first.instrument ||
                ""
            ).localeCompare(
              String(
                second.instrument ||
                  ""
              )
            )
        )
        .slice(
          0,
          DASHBOARD_PREVIEW_ITEMS
        );
    }, [
      monthlyLevels,
    ]);

  const getResourceUrl = (
    item
  ) =>
    item.video_url ||
    item.file_url ||
    item.resource_url ||
    item.url ||
    "";

  const getScannerTitle = (
    scanner
  ) =>
    scanner.title ||
    scanner.name ||
    "VTKS Scanner";

  const getScannerUrl = (
    scanner
  ) =>
    scanner.url ||
    scanner.link ||
    "";

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout =
    async () => {
      try {
        await logoutUser();
      } catch (error) {
        console.error(
          "Logout error:",
          error
        );
      } finally {
        localStorage.clear();

        window.location.href =
          "/login";
      }
    };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="subscriber-dashboard-loading">
        Loading subscriber dashboard...
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (loadError) {
    return (
      <main className="subscriber-dashboard-page">

        <section className="subscriber-error-box">

          <h2>
            Unable to load dashboard
          </h2>

          <p>
            {loadError}
          </p>

          <button
            type="button"
            onClick={
              loadDashboard
            }
            className="subscriber-retry-button"
          >
            Try Again
          </button>

        </section>

      </main>
    );
  }

  return (
    <main className="subscriber-dashboard-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="subscriber-hero">

        <div>

          <span className="subscriber-hero-badge">
            VTKS Subscriber Dashboard
          </span>

          <h1>
            Welcome,{" "}
            {profile?.full_name ||
              "Subscriber"}{" "}
            👋
          </h1>

          <p>
            {profile?.email}
          </p>

        </div>

        <div className="subscriber-hero-actions">
  <NotificationBell />

  <button
    type="button"
    onClick={handleLogout}
    className="subscriber-logout-button"
  >
    Logout
  </button>
</div>

      </section>

      {/* =====================================================
          STATS
      ===================================================== */}

      <section className="subscriber-stats-grid">

        <SummaryCard
          value={
            membership?.plan ||
            "-"
          }
          label="Subscription Plan"
        />

        <SummaryCard
          value={
            formatDate(
              membership?.start_date
            )
          }
          label="Subscribed On"
          compact
        />

        <SummaryCard
          value={
            formatDate(
              membership?.expiry_date
            )
          }
          label="Expires On"
          compact
        />

        <SummaryCard
          value={
            isExpired
              ? "Expired"
              : `${getDaysLeft()} Days Left`
          }
          label="Subscription Status"
          tone={
            isExpired
              ? "red"
              : "green"
          }
        />

      </section>

      {isExpired ? (
        <section className="subscriber-expired-box">

          <h2>
            🔴 Subscription Expired
          </h2>

          <p>
            Please renew your subscription
            to continue accessing subscriber
            studies, scanners and the
            knowledge library.
          </p>

          <Link
            to="/pricing"
            className="subscriber-renew-button"
          >
            Renew Subscription
          </Link>

        </section>
      ) : (
        <>

          {/* =================================================
              PORTFOLIO
          ================================================= */}

          <section className="subscriber-section-card">

            <div className="subscriber-section-header">

              <div>

                <h2>
                  📊 VTKS Market Studies
                </h2>

                <p>
                  Browse public and subscriber
                  studies with complete VTKS
                  analysis details.
                </p>

              </div>

              <span className="subscriber-trade-count">
                {filteredHoldings.length} Studies
              </span>

            </div>

            {/* =================================================
                FILTERS
            ================================================= */}

            <div className="subscriber-portfolio-filters">

              <input
                type="search"
                className="subscriber-filter-input"
                placeholder="🔍 Search stock or sector..."
                value={
                  portfolioSearch
                }
                onChange={(
                  event
                ) =>
                  setPortfolioSearch(
                    event.target.value
                  )
                }
              />

              <select
                className="subscriber-filter-select"
                value={
                  portfolioSector
                }
                onChange={(
                  event
                ) =>
                  setPortfolioSector(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  🏢 All Sectors
                </option>

                {portfolioSectors.map(
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
                className="subscriber-filter-select"
                value={
                  portfolioTradeType
                }
                onChange={(
                  event
                ) =>
                  setPortfolioTradeType(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  📊 All Study Horizons
                </option>

                {portfolioTradeTypes.map(
                  (type) => (
                    <option
                      key={
                        type
                      }
                      value={
                        type
                      }
                    >
                      {type}
                    </option>
                  )
                )}
              </select>

              <select
                className="subscriber-filter-select"
                value={
                  portfolioStatus
                }
                onChange={(
                  event
                ) =>
                  setPortfolioStatus(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  📌 All Status
                </option>

                <option value="Active">
                   Ongoing
                 </option>

                <option value="Target 1 Hit">
                   Zone 1 Reached
                 </option>

                <option value="Target 2 Hit">
                   Zone 2 Reached
                 </option>

                <option value="Target 3 Hit">
                   Zone 3 Reached
                 </option>

                <option value="Booked Profit">
                   Positive Outcome
                 </option>

                <option value="Booked Loss">
                   Negative Outcome
                 </option>

                <option value="Breakeven">
                   Neutral Outcome
                 </option>

                <option value="SL Hit">
                   Risk Level Reached
                 </option>
              </select>

              <select
                className="subscriber-filter-select"
                value={
                  portfolioAccess
                }
                onChange={(
                  event
                ) =>
                  setPortfolioAccess(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  👁 All Access
                </option>

                <option value="public">
                  🌐 Public
                </option>

                <option value="subscriber">
                   🔒 Member
                 </option>
              </select>

              <select
                className="subscriber-filter-select"
                value={
                  portfolioRoiSort
                }
                onChange={(
                  event
                ) =>
                  setPortfolioRoiSort(
                    event.target.value
                  )
                }
              >
                <option value="latest">
                  🕒 Latest First
                </option>

                <option value="high">
                  📈 Price Change High → Low
                </option>

                <option value="low">
                  📉 Price Change Low → High
                </option>
              </select>

              <button
                type="button"
                className="subscriber-clear-filters"
                onClick={
                  clearPortfolioFilters
                }
                disabled={
                  !hasActivePortfolioFilters
                }
              >
                 Clear Filters
              </button>

            </div>

            {/* =================================================
                RESULTS
            ================================================= */}

            {filteredHoldings.length ===
            0 ? (
              <div className="subscriber-empty-studies">

                <p>
                  No market studies match
                  the selected filters.
                </p>

                {hasActivePortfolioFilters && (
                  <button
                    type="button"
                    onClick={
                      clearPortfolioFilters
                    }
                    className="subscriber-empty-clear-btn"
                  >
                    Clear Filters
                  </button>
                )}

              </div>
            ) : (
              <>

                <div className="subscriber-results-summary">

                  <span>
                    Showing{" "}
                    {
                      firstPortfolioRecord
                    }
                    –
                    {
                      lastPortfolioRecord
                    }{" "}
                    of{" "}
                    {
                      filteredHoldings.length
                    }{" "}
                    studies
                  </span>

                  <span>
                    Page{" "}
                    {
                      portfolioPage
                    }{" "}
                    of{" "}
                    {
                      totalPortfolioPages
                    }
                  </span>

                </div>

                <div className="subscriber-study-table-wrapper">
  <table className="subscriber-study-table">
    <thead>
      <tr>
        <th>Stock</th>
        <th>Sector</th>
        <th>Recorded Price</th>
        <th>CMP / Close</th>
        <th>Price Change</th>
        <th>Zone-1</th>
        <th>Risk Level</th>
        <th>Status</th>
        <th>Access</th>
        <th>Action</th>
      </tr>
    </thead>

    <tbody>
      {paginatedHoldings.map((holding) => {
        const roi = calculateReturn(holding);

        const tradeStatus = getTradeStatus(holding);

        const closedTrade = isClosedTrade(holding);

        const exitPrice = getExitPrice(holding);

        const visibility = normalize(
          holding.visibility
        );

        const isSubscriberTrade =
          visibility === "subscriber" ||
          visibility === "community";

        const getStatusClass = () => {
          if (
            tradeStatus === "Booked Loss" ||
            tradeStatus === "SL Hit"
          ) {
            return "negative";
          }

          if (tradeStatus === "Booked Profit") {
            return "positive";
          }

          if (tradeStatus === "Breakeven") {
            return "neutral";
          }

          if (tradeStatus.includes("Target")) {
            return "target";
          }

          return "ongoing";
        };

        const getStatusLabel = () => {
          if (tradeStatus === "Booked Profit") {
            return "📈 Positive Outcome";
          }

          if (tradeStatus === "Booked Loss") {
            return "📉 Negative Outcome";
          }

          if (tradeStatus === "Breakeven") {
            return "⚖️ Neutral Outcome";
          }

          if (tradeStatus === "SL Hit") {
            return "⚠️ Risk Level Reached";
          }

          if (tradeStatus === "Target 1 Hit") {
            return "📍 Zone 1 Reached";
          }

          if (tradeStatus === "Target 2 Hit") {
            return "📍 Zone 2 Reached";
          }

          if (tradeStatus === "Target 3 Hit") {
            return "📍 Zone 3 Reached";
          }

          return "🟢 Ongoing";
        };

        return (
          <tr key={holding.id}>
            <td>
              <div className="subscriber-study-stock">
                <strong>
                  {holding.stock || "Stock"}
                </strong>
              </div>
            </td>

            <td>
              <span className="subscriber-study-sector">
                {holding.sector || "General"}
              </span>
            </td>

            <td className="subscriber-study-number">
              {formatPrice(holding.entry)}
            </td>

            <td className="subscriber-study-number">
              {formatPrice(
                closedTrade
                  ? exitPrice
                  : holding.cmp
              )}
            </td>

            <td>
              <span
                className={`subscriber-study-change ${
                  roi >= 0
                    ? "positive"
                    : "negative"
                }`}
              >
                {roi >= 0 ? "+" : ""}
                {roi.toFixed(2)}%
              </span>
            </td>

            <td className="subscriber-study-number">
              {formatPrice(holding.target1)}
            </td>

            <td className="subscriber-study-number">
              {formatPrice(holding.stopLoss)}
            </td>

            <td>
              <span
                className={`subscriber-study-status ${getStatusClass()}`}
              >
                {getStatusLabel()}
              </span>
            </td>

            <td>
              <span
                className={
                  isSubscriberTrade
                    ? "subscriber-access-badge premium"
                    : "subscriber-access-badge public"
                }
              >
                {isSubscriberTrade
                  ? "🔒 Member"
                  : "🌐 Public"}
              </span>
            </td>

            <td>
              <Link
                to={`/dashboard/trade/${holding.id}`}
                className="subscriber-study-view-button"
              >
                View Analysis →
              </Link>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>

                <Pagination
                  currentPage={
                    portfolioPage
                  }
                  totalPages={
                    totalPortfolioPages
                  }
                  onPageChange={
                    setPortfolioPage
                  }
                />

              </>
            )}

          </section>

          {/* =================================================
              FEATURE CARDS
          ================================================= */}

          <section className="subscriber-feature-grid">

            <FeatureCard
              title="📊 Market Outlook"
              subtitle="Technical support, resistance, charts and technical outlook."
              link="/dashboard/monthly-levels"
              emptyMessage="No market outlook available."
              items={
                latestMonthlyLevels.map(
                  (item) => ({
                    id:
                      item.id,

                    title:
                      item.instrument ||
                      "Market Outlook",

                    meta:
                      `${
                        item.month ||
                        "Current Month"
                      } • ${
                        item.bias ||
                        "Neutral"
                      }`,

                    internalUrl:
                      "/dashboard/monthly-levels",
                  })
                )
              }
            />

            <FeatureCard
              title="📚 Knowledge Library"
              subtitle="Latest premium videos, PDFs and recorded sessions."
              link="/dashboard/library"
              emptyMessage="No library content uploaded yet."
              items={
                latestLibraryResources.map(
                  (item) => ({
                    id:
                      item.id,

                    title:
                      item.title ||
                      "VTKS Resource",

                    meta:
                      `${
                        item.category ||
                        "General"
                      } • ${
                        item.type ||
                        "Resource"
                      }`,

                    url:
                      getResourceUrl(
                        item
                      ),
                  })
                )
              }
            />

            <FeatureCard
              title="⚡ Scanner Access"
              subtitle="Latest VTKS market scanners."
              link="/dashboard/scanner"
              dashboardLink="https://chartink.com/dashboard/324723"
              dashboardLabel="Dashboard"
              emptyMessage="No scanners uploaded yet."
              items={
                latestScanners.map(
                  (scanner) => ({
                    id:
                      scanner.id,

                    title:
                      getScannerTitle(
                        scanner
                      ),

                    meta:
                      `${
                        scanner.category ||
                        "General"
                      } • ${
                        scanner.timeframe ||
                        "Scanner"
                      }`,

                    url:
                      getScannerUrl(
                        scanner
                      ),
                  })
                )
              }
            />

          </section>

          {/* =================================================
              COMMUNITY + FEEDBACK
          ================================================= */}

          <section className="subscriber-community-feedback-grid">

            <FeatureCard
              title="📢 Community Access"
              subtitle="Join active VTKS Telegram groups and subscriber channels."
              emptyMessage="No community links are currently available."
              items={
                latestCommunityLinks.map(
                  (item) => ({
                    id:
                      item.id,

                    title:
                      item.title ||
                      "VTKS Community",

                    meta:
                      `${
                        item.platform ||
                        "Telegram"
                      } • ${
                        item.description ||
                        "Subscriber Access"
                      }`,

                    url:
                      item.url ||
                      "",
                  })
                )
              }
            />

            <article className="subscriber-feature-card subscriber-feedback-card">

              <div className="subscriber-feature-header">

                <div>

                  <h2>
                    ⭐ Share Your Experience
                  </h2>

                  <p>
                    Help fellow traders by sharing
                    your VTKS learning journey.
                  </p>

                </div>

              </div>

              <div className="subscriber-feedback-content">

                <div
                  className="subscriber-feedback-stars"
                  aria-label="Five-star feedback"
                >
                  ⭐⭐⭐⭐⭐
                </div>

                <p className="subscriber-feedback-description">
                  Your feedback helps improve VTKS
                  and inspires other traders to learn
                  with confidence.
                </p>

                <div className="subscriber-feedback-badge">
                  ✔ Verified Members Only
                </div>

                <Link
                  to="/subscriber/feedback"
                  className="subscriber-feedback-button"
                >
                  Share Feedback →
                </Link>

              </div>

            </article>

          </section>

        </>
      )}

      {/* =====================================================
          SECURITY
      ===================================================== */}

      <section className="subscriber-section-card">

        <div className="subscriber-section-header">

          <div>

            <h2>
              🔐 Account Security
            </h2>

            <p>
              Change your VTKS login password securely.
            </p>

          </div>

        </div>

        <ChangePassword />

      </section>

    </main>
  );
}

/* =========================================================
   SUMMARY
========================================================= */

function SummaryCard({
  value,
  label,
  tone = "default",
  compact = false,
}) {
  return (
    <article
      className={`subscriber-summary-card subscriber-tone-${tone}`}
    >
      <strong
        className={
          compact
            ? "compact-value"
            : ""
        }
      >
        {value}
      </strong>

      <span>
        {label}
      </span>
    </article>
  );
}

/* =========================================================
   VALUE
========================================================= */

function ValueItem({
  label,
  value,
  tone = "default",
}) {
  return (
    <div className="subscriber-value-item">

      <small>
        {label}
      </small>

      <strong
        className={`subscriber-value-${tone}`}
      >
        {value}
      </strong>

    </div>
  );
}

/* =========================================================
   FEATURE CARD
========================================================= */

function FeatureCard({
  title,
  subtitle,
  link,
  dashboardLink,
  dashboardLabel = "Dashboard",
  items,
  emptyMessage,
}) {
  return (
    <article className="subscriber-feature-card">

      <div className="subscriber-feature-header">

        <div>

          <h2>
            {title}
          </h2>

          <p>
            {subtitle}
          </p>

        </div>

        <div className="subscriber-feature-actions">

          {dashboardLink && (
            <a
              href={
                dashboardLink
              }
              target="_blank"
              rel="noreferrer"
              className="subscriber-dashboard-link"
            >
              {
                dashboardLabel
              }
            </a>
          )}

          {link && (
            <Link
              to={link}
              className="subscriber-small-link"
            >
              View All →
            </Link>
          )}

        </div>

      </div>

      {items.length === 0 ? (
        <div className="subscriber-feature-empty">
          {emptyMessage}
        </div>
      ) : (
        items.map(
          (item) => (
            <div
              key={
                item.id
              }
              className="subscriber-list-item"
            >

              <div>

                <strong>
                  {item.title}
                </strong>

                <p>
                  {item.meta}
                </p>

              </div>

              {item.internalUrl ? (
                <Link
                  to={
                    item.internalUrl
                  }
                >
                  Open →
                </Link>
              ) : item.url ? (
                <a
                  href={
                    item.url
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Open →
                </a>
              ) : (
                <span>
                  Unavailable
                </span>
              )}

            </div>
          )
        )
      )}

    </article>
  );
}