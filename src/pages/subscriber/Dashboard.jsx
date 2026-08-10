import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";

import ChangePassword from "../../components/auth/ChangePassword";
import Pagination from "../../components/common/Pagination";
import { logoutUser } from "../../services/authService";

import {
  getHoldings,
  mapHoldingFromDB,
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

import "./Dashboard.css";
import {
  getSubscriberMonthlyLevels,
} from "../../services/monthlyLevelsService";
const PORTFOLIO_ITEMS_PER_PAGE = 4;
const DASHBOARD_PREVIEW_ITEMS = 3;

const normalize = (value) =>
  String(value || "").trim().toLowerCase();

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [membership, setMembership] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [library, setLibrary] = useState([]);
  const [scanners, setScanners] = useState([]);
  const [communityLinks, setCommunityLinks] = useState([]);
  const [monthlyLevels, setMonthlyLevels] = useState([]);
  const [portfolioPage, setPortfolioPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const profileData = await getSubscriberProfile();
      const membershipData = await getSubscriberMembership(
        profileData.email
      );

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

      const visibleHoldings = (holdingRows || [])
        .map(mapHoldingFromDB)
        .filter((holding) => {
          const visibility = normalize(holding.visibility);
          const publishStatus = normalize(holding.publishStatus);
          const tradeStatus = normalize(holding.tradeStatus);

          return (
            ["public", "subscriber", "community"].includes(
              visibility
            ) &&
            publishStatus !== "draft" &&
            tradeStatus !== "cancelled"
          );
        });

      setProfile(profileData);
      setMembership(membershipData);
      setHoldings(visibleHoldings);
      setLibrary(libraryRows || []);
      setScanners(scannerRows || []);
      setCommunityLinks(communityRows || []);
      setMonthlyLevels(monthlyRows || []);
    } catch (error) {
      console.error("Subscriber dashboard error:", error);
      setLoadError(
        error?.message ||
          "Failed to load subscriber dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = () => {
    if (!membership?.expiry_date) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(membership.expiry_date);
    expiry.setHours(23, 59, 59, 999);

    return Math.ceil(
      (expiry.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  };

  const membershipStatus = normalize(membership?.status);

  const isExpired =
    !membership ||
    membershipStatus === "expired" ||
    membershipStatus === "inactive" ||
    getDaysLeft() <= 0;

  const getTradeStatus = (holding) =>
    String(
      holding.tradeStatus ||
        holding.trade_status ||
        holding.status ||
        "Active"
    ).trim();

  /* =========================================================
     REALISED / CLOSED STUDIES

     Target 1 / 2 / 3 Hit remain open studies.
     They continue to use Live CMP + Live ROI until
     a final outcome is saved by Admin.
  ========================================================= */

  const isClosedTrade = (holding) =>
    [
      "Booked Profit",
      "Booked Loss",
      "Breakeven",
      "SL Hit",
    ].includes(getTradeStatus(holding));

  const isLossTrade = (holding) =>
    [
      "Booked Loss",
      "SL Hit",
    ].includes(getTradeStatus(holding));

  const getExitPrice = (holding) => {
    const savedExitPrice = Number(
      holding.exitPrice ??
        holding.exit_price ??
        0
    );

    if (
      Number.isFinite(savedExitPrice) &&
      savedExitPrice > 0
    ) {
      return savedExitPrice;
    }

    const status = getTradeStatus(holding);

    /*
      Fallback for older SL Hit records where an
      explicit exit price was not stored.
    */
    if (status === "SL Hit") {
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

  const calculateReturn = (holding) => {
    const entry = Number(holding.entry || 0);

    if (
      !Number.isFinite(entry) ||
      entry <= 0
    ) {
      return 0;
    }

    const closedTrade = isClosedTrade(holding);

    const savedRealisedReturn =
      holding.realisedReturn ??
      holding.realised_return;

    /* Closed studies use the final saved realised ROI. */
    if (
      closedTrade &&
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

    /*
      If realised ROI is unavailable, calculate it
      from Entry -> Exit Price.
    */
    if (closedTrade) {
      const exitPrice = getExitPrice(holding);

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

    /* Open studies use live CMP. */
    const cmp = Number(holding.cmp || entry);

    if (
      !Number.isFinite(cmp) ||
      cmp <= 0
    ) {
      return 0;
    }

    return (
      ((cmp - entry) / entry) *
      100
    );
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (value) => {
    const number = Number(value || 0);
    if (!number) return "₹-";

    return `₹${number.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };

  const sortedHoldings = useMemo(() => {
    return [...holdings].sort((first, second) => {
      const firstDate = new Date(
        first.recommendationDate || first.createdAt || 0
      ).getTime();

      const secondDate = new Date(
        second.recommendationDate || second.createdAt || 0
      ).getTime();

      if (secondDate !== firstDate) {
        return secondDate - firstDate;
      }

      return Number(second.id || 0) - Number(first.id || 0);
    });
  }, [holdings]);

  const totalPortfolioPages = Math.max(
    1,
    Math.ceil(
      sortedHoldings.length / PORTFOLIO_ITEMS_PER_PAGE
    )
  );

  useEffect(() => {
    if (portfolioPage > totalPortfolioPages) {
      setPortfolioPage(totalPortfolioPages);
    }
  }, [portfolioPage, totalPortfolioPages]);

  const paginatedHoldings = useMemo(() => {
    const startIndex =
      (portfolioPage - 1) * PORTFOLIO_ITEMS_PER_PAGE;

    return sortedHoldings.slice(
      startIndex,
      startIndex + PORTFOLIO_ITEMS_PER_PAGE
    );
  }, [sortedHoldings, portfolioPage]);

  const firstPortfolioRecord =
    sortedHoldings.length === 0
      ? 0
      : (portfolioPage - 1) *
          PORTFOLIO_ITEMS_PER_PAGE +
        1;

  const lastPortfolioRecord = Math.min(
    portfolioPage * PORTFOLIO_ITEMS_PER_PAGE,
    sortedHoldings.length
  );

  const latestLibraryResources = useMemo(() => {
    return [...library]
      .sort((first, second) => {
        if (first.pinned && !second.pinned) return -1;
        if (!first.pinned && second.pinned) return 1;
        if (first.featured && !second.featured) return -1;
        if (!first.featured && second.featured) return 1;

        const firstDate = new Date(
          first.updated_at || first.created_at || 0
        ).getTime();

        const secondDate = new Date(
          second.updated_at || second.created_at || 0
        ).getTime();

        return secondDate - firstDate;
      })
      .slice(0, DASHBOARD_PREVIEW_ITEMS);
  }, [library]);

  const latestScanners = useMemo(() => {
    return [...scanners]
      .sort((first, second) => {
        if (first.featured && !second.featured) return -1;
        if (!first.featured && second.featured) return 1;

        const firstDate = new Date(
          first.updated_at || first.updatedAt || 0
        ).getTime();

        const secondDate = new Date(
          second.updated_at || second.updatedAt || 0
        ).getTime();

        return secondDate - firstDate;
      })
      .slice(0, DASHBOARD_PREVIEW_ITEMS);
  }, [scanners]);

  const latestCommunityLinks = useMemo(() => {
    return [...communityLinks]
      .sort((first, second) => {
        if (first.featured && !second.featured) return -1;
        if (!first.featured && second.featured) return 1;

        const firstOrder = Number(
          first.sortOrder ?? first.sort_order ?? 0
        );
        const secondOrder = Number(
          second.sortOrder ?? second.sort_order ?? 0
        );

        if (firstOrder !== secondOrder) {
          return firstOrder - secondOrder;
        }

        return Number(first.id || 0) - Number(second.id || 0);
      })
      .slice(0, DASHBOARD_PREVIEW_ITEMS);
  }, [communityLinks]);
  const latestMonthlyLevels = useMemo(() => {
    return [...monthlyLevels]
      .sort((first, second) =>
        String(first.instrument || "").localeCompare(
          String(second.instrument || "")
        )
      )
      .slice(0, DASHBOARD_PREVIEW_ITEMS);
  }, [monthlyLevels]);

  const getResourceUrl = (item) =>
    item.video_url ||
    item.file_url ||
    item.resource_url ||
    item.url ||
    "";

  const getScannerTitle = (scanner) =>
    scanner.title || scanner.name || "VTKS Scanner";

  const getScannerUrl = (scanner) =>
    scanner.url || scanner.link || "";

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  if (loading) {
    return (
      <div className="subscriber-dashboard-loading">
        Loading subscriber dashboard...
      </div>
    );
  }

  if (loadError) {
    return (
      <main className="subscriber-dashboard-page">
        <section className="subscriber-error-box">
          <h2>Unable to load dashboard</h2>
          <p>{loadError}</p>

          <button
            type="button"
            onClick={loadDashboard}
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
      <section className="subscriber-hero">
        <div>
          <span className="subscriber-hero-badge">
            VTKS Subscriber Dashboard
          </span>

          <h1>
            Welcome, {profile?.full_name || "Subscriber"} 👋
          </h1>

          <p>{profile?.email}</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="subscriber-logout-button"
        >
          Logout
        </button>
      </section>

      <section className="subscriber-stats-grid">
        <SummaryCard
          value={membership?.plan || "-"}
          label="Subscription Plan"
        />

        <SummaryCard
          value={formatDate(membership?.start_date)}
          label="Subscribed On"
          compact
        />

        <SummaryCard
          value={formatDate(membership?.expiry_date)}
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
          tone={isExpired ? "red" : "green"}
        />
      </section>

      {isExpired ? (
        <section className="subscriber-expired-box">
          <h2>🔴 Subscription Expired</h2>
          <p>
            Please renew your subscription to continue
            accessing subscriber trades, scanners and the
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
          <section className="subscriber-section-card">
            <div className="subscriber-section-header">
              <div>
                <h2>📊 VTKS Portfolio Access</h2>
                <p>
                  Browse public and subscriber trades with
                  complete VTKS trade details.
                </p>
              </div>

              <span className="subscriber-trade-count">
                {sortedHoldings.length} Trades
              </span>
            </div>

            {sortedHoldings.length === 0 ? (
              <div className="subscriber-empty-state">
                No public or subscriber trades are currently
                available.
              </div>
            ) : (
              <>
                <div className="subscriber-results-summary">
                  <span>
                    Showing {firstPortfolioRecord}–
                    {lastPortfolioRecord} of{" "}
                    {sortedHoldings.length} trades
                  </span>

                  <span>
                    Page {portfolioPage} of{" "}
                    {totalPortfolioPages}
                  </span>
                </div>

                <div className="subscriber-trade-grid">
                  {paginatedHoldings.map((holding) => {
                    const roi = calculateReturn(holding);
                    const tradeStatus =
                      getTradeStatus(holding);
                    const closedTrade =
                      isClosedTrade(holding);
                    const exitPrice =
                      getExitPrice(holding);

                    const visibility = normalize(
                      holding.visibility
                    );

                    const isSubscriberTrade =
                      visibility === "subscriber" ||
                      visibility === "community";

                    return (
                      <article
                        key={holding.id}
                        className="subscriber-trade-card"
                      >
                        <div className="subscriber-trade-header">
                          <div>
                            <h3>
                              {holding.stock || "Stock"}
                            </h3>
                            <p>
                              {holding.sector || "General"}
                            </p>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              flexWrap: "wrap",
                              gap: "8px",
                            }}
                          >
                            <span
                              className={
                                isSubscriberTrade
                                  ? "subscriber-access-badge premium"
                                  : "subscriber-access-badge public"
                              }
                            >
                              {isSubscriberTrade
                                ? "⭐ Subscriber"
                                : "🌐 Public"}
                            </span>

                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "7px 11px",
                                borderRadius: "999px",
                                background:
                                  tradeStatus === "Booked Loss" ||
                                  tradeStatus === "SL Hit"
                                    ? "#fee2e2"
                                    : tradeStatus === "Booked Profit"
                                      ? "#dcfce7"
                                      : tradeStatus === "Breakeven"
                                        ? "#f1f5f9"
                                        : tradeStatus.includes("Target")
                                          ? "#dbeafe"
                                          : "#dcfce7",
                                color:
                                  tradeStatus === "Booked Loss" ||
                                  tradeStatus === "SL Hit"
                                    ? "#991b1b"
                                    : tradeStatus === "Booked Profit"
                                      ? "#166534"
                                      : tradeStatus === "Breakeven"
                                        ? "#475569"
                                        : tradeStatus.includes("Target")
                                          ? "#1d4ed8"
                                          : "#166534",
                                fontSize: "12px",
                                fontWeight: 800,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {tradeStatus === "Booked Profit"
                                ? "💰 Booked Profit"
                                : tradeStatus === "Booked Loss"
                                  ? "📉 Booked Loss"
                                  : tradeStatus === "Breakeven"
                                    ? "⚖️ Breakeven"
                                    : tradeStatus === "SL Hit"
                                      ? "🛑 SL Hit"
                                      : tradeStatus === "Target 1 Hit"
                                        ? "🎯 Target 1 Hit"
                                        : tradeStatus === "Target 2 Hit"
                                          ? "🚀 Target 2 Hit"
                                          : tradeStatus === "Target 3 Hit"
                                            ? "🏆 Target 3 Hit"
                                            : "🟢 Active"}
                            </span>
                          </div>
                        </div>

                        <div className="subscriber-values-grid">
                          <ValueItem
                            label="Entry"
                            value={formatPrice(holding.entry)}
                          />
                          <ValueItem
                            label={
                              closedTrade
                                ? "Exit Price"
                                : "CMP"
                            }
                            value={formatPrice(
                              closedTrade
                                ? exitPrice
                                : holding.cmp
                            )}
                          />

                          <ValueItem
                            label={
                              closedTrade
                                ? isLossTrade(holding)
                                  ? "Realised Loss"
                                  : "Realised ROI"
                                : "ROI"
                            }
                            value={`${
                              roi >= 0 ? "+" : ""
                            }${roi.toFixed(2)}%`}
                            tone={
                              roi >= 0
                                ? "green"
                                : "red"
                            }
                          />
                        </div>

                        <div className="subscriber-target-grid">
                          <ValueItem
                            label="Target 1"
                            value={formatPrice(
                              holding.target1
                            )}
                          />
                          <ValueItem
                            label="Stop Loss"
                            value={formatPrice(
                              holding.stopLoss
                            )}
                          />
                        </div>

                        <Link
  to={`/dashboard/trade/${holding.id}`}
  className="subscriber-view-trade"
>
  View Analysis →
</Link>
                      </article>
                    );
                  })}
                </div>

                <Pagination
                  currentPage={portfolioPage}
                  totalPages={totalPortfolioPages}
                  onPageChange={setPortfolioPage}
                />
              </>
            )}
          </section>

          <section className="subscriber-feature-grid">
            <FeatureCard
              title="📊 Market Outlook"
              subtitle="Technical support, resistance, charts and technical outlook."
              link="/dashboard/monthly-levels"
              emptyMessage="No market outlook available."
              items={latestMonthlyLevels.map((item) => ({
                id: item.id,
                title: item.instrument || "Market Outlook",
                meta: `${item.month || "Current Month"} • ${
                  item.bias || "Neutral"
                }`,
                internalUrl: "/dashboard/monthly-levels",
              }))}
            />

            <FeatureCard
              title="📚 Knowledge Library"
              subtitle="Latest premium videos, PDFs and recorded sessions."
              link="/dashboard/library"
              emptyMessage="No library content uploaded yet."
              items={latestLibraryResources.map((item) => ({
                id: item.id,
                title: item.title || "VTKS Resource",
                meta: `${item.category || "General"} • ${
                  item.type || "Resource"
                }`,
                url: getResourceUrl(item),
              }))}
            />

            <FeatureCard
  title="⚡ Scanner Access"
  subtitle="Latest VTKS market scanners."
  link="/dashboard/scanner"
  dashboardLink="https://chartink.com/dashboard/324723"
  dashboardLabel="Dashboard"
  emptyMessage="No scanners uploaded yet."
  items={latestScanners.map((scanner) => ({
    id: scanner.id,
    title: getScannerTitle(scanner),
    meta: `${scanner.category || "General"} • ${
      scanner.timeframe || "Scanner"
    }`,
    url: getScannerUrl(scanner),
  }))}
/>
          </section>

          <section className="subscriber-community-feedback-grid">
            <FeatureCard
              title="📢 Community Access"
              subtitle="Join active VTKS Telegram groups and subscriber channels."
              emptyMessage="No community links are currently available."
              items={latestCommunityLinks.map((item) => ({
                id: item.id,
                title: item.title || "VTKS Community",
                meta: `${item.platform || "Telegram"} • ${
                  item.description || "Subscriber Access"
                }`,
                url: item.url || "",
              }))}
            />

            <article className="subscriber-feature-card subscriber-feedback-card">
              <div className="subscriber-feature-header">
                <div>
                  <h2>⭐ Share Your Experience</h2>
                  <p>
                    Help fellow traders by sharing your VTKS
                    learning journey.
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
                  Your feedback helps improve VTKS and inspires
                  other traders to learn with confidence.
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

      <section className="subscriber-section-card">
        <div className="subscriber-section-header">
          <div>
            <h2>🔐 Account Security</h2>
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
      <strong className={compact ? "compact-value" : ""}>
        {value}
      </strong>
      <span>{label}</span>
    </article>
  );
}

function ValueItem({
  label,
  value,
  tone = "default",
}) {
  return (
    <div className="subscriber-value-item">
      <small>{label}</small>
      <strong
        className={`subscriber-value-${tone}`}
      >
        {value}
      </strong>
    </div>
  );
}

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
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <div className="subscriber-feature-actions">
          {dashboardLink && (
            <a
              href={dashboardLink}
              target="_blank"
              rel="noreferrer"
              className="subscriber-dashboard-link"
            >
              {dashboardLabel}
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
        items.map((item) => (
          <div
            key={item.id}
            className="subscriber-list-item"
          >
            <div>
              <strong>{item.title}</strong>
              <p>{item.meta}</p>
            </div>

            {item.internalUrl ? (
              <Link to={item.internalUrl}>
                Open →
              </Link>
            ) : item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
              >
                Open →
              </a>
            ) : (
              <span>Unavailable</span>
            )}
          </div>
        ))
      )}
    </article>
  );
}
