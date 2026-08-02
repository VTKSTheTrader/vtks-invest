import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Pagination from "../../components/common/Pagination";

import {
  getSubscriberProfile,
  getSubscriberMembership,
  getSubscriberScanners,
} from "../../services/subscriberService";
import "./Scanner.css";
const ITEMS_PER_PAGE = 4;

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export default function Scanner() {
  const [profile, setProfile] = useState(null);
  const [membership, setMembership] = useState(null);
  const [scanners, setScanners] = useState([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("All");
  const [timeframeFilter, setTimeframeFilter] =
    useState("All");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    loadScannerPage();
  }, []);

  const loadScannerPage = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const profileData =
        await getSubscriberProfile();

      const membershipData =
        await getSubscriberMembership(
          profileData.email
        );

      const scannerRows =
        await getSubscriberScanners();

      setProfile(profileData);
      setMembership(membershipData);
      setScanners(scannerRows || []);
    } catch (error) {
      console.error(
        "Subscriber scanner error:",
        error
      );

      setLoadError(
        error?.message ||
          "Failed to load scanners."
      );
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = () => {
    if (!membership?.expiry_date) {
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(
      membership.expiry_date
    );

    expiry.setHours(23, 59, 59, 999);

    return Math.ceil(
      (expiry.getTime() -
        today.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  };

  const isExpired =
    !membership ||
    normalize(membership.status) ===
      "expired" ||
    getDaysLeft() <= 0;

  const sortedScanners = useMemo(() => {
    return [...scanners].sort(
      (first, second) => {
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

        const firstDate = new Date(
          first.updated_at || 0
        ).getTime();

        const secondDate = new Date(
          second.updated_at || 0
        ).getTime();

        return secondDate - firstDate;
      }
    );
  }, [scanners]);

  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(
        sortedScanners
          .map(
            (scanner) =>
              scanner.category || "General"
          )
          .sort()
      ),
    ];
  }, [sortedScanners]);

  const timeframes = useMemo(() => {
    return [
      "All",
      ...new Set(
        sortedScanners
          .map(
            (scanner) =>
              scanner.timeframe || ""
          )
          .filter(Boolean)
          .sort()
      ),
    ];
  }, [sortedScanners]);

  const filteredScanners = useMemo(() => {
    const query = normalize(search);

    return sortedScanners.filter(
      (scanner) => {
        const matchesSearch =
          !query ||
          normalize(scanner.title).includes(
            query
          ) ||
          normalize(
            scanner.description
          ).includes(query) ||
          normalize(
            scanner.category
          ).includes(query) ||
          normalize(
            scanner.timeframe
          ).includes(query);

        const matchesCategory =
          categoryFilter === "All" ||
          (scanner.category ||
            "General") ===
            categoryFilter;

        const matchesTimeframe =
          timeframeFilter === "All" ||
          scanner.timeframe ===
            timeframeFilter;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesTimeframe
        );
      }
    );
  }, [
    sortedScanners,
    search,
    categoryFilter,
    timeframeFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    categoryFilter,
    timeframeFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredScanners.length /
        ITEMS_PER_PAGE
    )
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedScanners = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      ITEMS_PER_PAGE;

    return filteredScanners.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [
    filteredScanners,
    currentPage,
  ]);

  const firstVisibleRecord =
    filteredScanners.length === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const lastVisibleRecord = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredScanners.length
  );

  const featuredCount = scanners.filter(
    (scanner) =>
      Boolean(scanner.featured)
  ).length;

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("All");
    setTimeframeFilter("All");
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <p style={loadingStyle}>
        Loading subscriber scanners...
      </p>
    );
  }

  if (loadError) {
    return (
      <main style={pageStyle}>
        <section style={errorBox}>
          <h2 style={{ marginTop: 0 }}>
            Unable to load scanners
          </h2>

          <p>{loadError}</p>

          <button
            type="button"
            onClick={loadScannerPage}
            style={retryButton}
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <span style={heroBadge}>
            VTKS Scanner Hub
          </span>

          <h1 style={heroTitle}>
            Subscriber Scanner Access
          </h1>

          <p style={heroText}>
            Welcome,{" "}
            {profile?.full_name ||
              "Subscriber"}
            . Access premium VTKS scanners
            and rule-based market
            opportunities.
          </p>
        </div>

        <Link
          to="/dashboard"
          style={backButton}
        >
          ← Dashboard
        </Link>
      </section>

      {isExpired ? (
        <section style={expiredBox}>
          <h2 style={{ marginTop: 0 }}>
            🔴 Subscription Expired
          </h2>

          <p>
            Scanner access is currently
            locked. Please renew your
            subscription to continue.
          </p>

          <Link
            to="/pricing"
            style={renewButton}
          >
            Renew Subscription
          </Link>
        </section>
      ) : (
        <>
          <section style={summaryGrid}>
            <div style={summaryCard}>
              <h2 style={summaryValue}>
                {scanners.length}
              </h2>

              <p style={summaryLabel}>
                Available Scanners
              </p>
            </div>

            <div style={summaryCard}>
              <h2
                style={{
                  ...summaryValue,
                  color: "#16a34a",
                }}
              >
                Active
              </h2>

              <p style={summaryLabel}>
                Subscription Status
              </p>
            </div>

            <div style={summaryCard}>
              <h2 style={summaryValue}>
                {membership?.plan || "-"}
              </h2>

              <p style={summaryLabel}>
                Current Plan
              </p>
            </div>

            <div style={summaryCard}>
              <h2 style={summaryValue}>
                {getDaysLeft()} Days
              </h2>

              <p style={summaryLabel}>
                Access Remaining
              </p>
            </div>

            <div style={summaryCard}>
              <h2 style={summaryValue}>
                {featuredCount}
              </h2>

              <p style={summaryLabel}>
                Featured Scanners
              </p>
            </div>
          </section>

          <section style={filterPanel}>
            <input
              type="search"
              placeholder="Search scanner, category or timeframe..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              style={inputStyle}
            />

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
              style={selectStyle}
            >
              {categories.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item === "All"
                    ? "All Categories"
                    : item}
                </option>
              ))}
            </select>

            <select
              value={timeframeFilter}
              onChange={(event) =>
                setTimeframeFilter(
                  event.target.value
                )
              }
              style={selectStyle}
            >
              {timeframes.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item === "All"
                    ? "All Timeframes"
                    : item}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={clearFilters}
              style={clearButton}
            >
              Clear Filters
            </button>
          </section>

          {filteredScanners.length ===
          0 ? (
            <section style={emptyState}>
              <h2>No scanners found</h2>

              <p>
                No scanner matches your
                selected filters, or the
                admin has not uploaded
                scanner links yet.
              </p>
            </section>
          ) : (
            <>
              <div style={resultSummary}>
                <span>
                  Showing{" "}
                  {firstVisibleRecord}–
                  {lastVisibleRecord} of{" "}
                  {filteredScanners.length}{" "}
                  scanners
                </span>

                <span>
                  Page {currentPage} of{" "}
                  {totalPages}
                </span>
              </div>

              <section className="subscriber-scanner-grid">
                {paginatedScanners.map(
                  (item) => (
                    <article
                      key={item.id}
                      style={scannerCard}
                    >
                      <div style={cardTopRow}>
                        <div style={scannerIcon}>
                          ⚡
                        </div>

                        {item.featured && (
                          <span
                            style={
                              featuredBadge
                            }
                          >
                            ⭐ Featured
                          </span>
                        )}
                      </div>

                      <div
                        style={scannerBadges}
                      >
                        <span
                          style={categoryBadge}
                        >
                          {item.category ||
                            "General"}
                        </span>

                        {item.timeframe && (
                          <span
                            style={
                              timeframeBadge
                            }
                          >
                            {
                              item.timeframe
                            }
                          </span>
                        )}
                      </div>

                      <h2 style={scannerTitle}>
                        {item.title ||
                          "VTKS Scanner"}
                      </h2>

                      <p
                        style={
                          scannerDescription
                        }
                      >
                        {item.description ||
                          "Subscriber-only VTKS market scanner."}
                      </p>

                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          style={openButton}
                        >
                          Open Scanner →
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          style={
                            disabledButton
                          }
                        >
                          Scanner URL
                          unavailable
                        </button>
                      )}
                    </article>
                  )
                )}
              </section>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </>
      )}
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "clamp(16px,3vw,32px)",
};

const loadingStyle = {
  padding: "40px",
  color: "#475569",
};

const heroStyle = {
  background:
    "linear-gradient(135deg, #0f172a, #1e3a8a)",
  color: "#ffffff",
  padding: "42px",
  borderRadius: "28px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "24px",
  marginBottom: "28px",
};

const heroBadge = {
  display: "inline-block",
  background: "rgba(255,255,255,.12)",
  border:
    "1px solid rgba(255,255,255,.18)",
  padding: "8px 14px",
  borderRadius: "999px",
  color: "#bfdbfe",
  fontWeight: 800,
  marginBottom: "14px",
};

const heroTitle = {
  margin: "0 0 10px",
  fontSize: "42px",
};

const heroText = {
  maxWidth: "720px",
  margin: 0,
  color: "#dbeafe",
  lineHeight: 1.7,
};

const backButton = {
  flexShrink: 0,
  textDecoration: "none",
  background: "#ffffff",
  color: "#2563eb",
  padding: "12px 20px",
  borderRadius: "12px",
  fontWeight: 800,
};

const expiredBox = {
  background: "#fee2e2",
  color: "#991b1b",
  padding: "30px",
  borderRadius: "22px",
};

const renewButton = {
  display: "inline-block",
  marginTop: "12px",
  background: "#dc2626",
  color: "#ffffff",
  textDecoration: "none",
  padding: "12px 18px",
  borderRadius: "12px",
  fontWeight: 800,
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "18px",
  marginBottom: "25px",
};

const summaryCard = {
  background: "#ffffff",
  padding: "25px",
  borderRadius: "20px",
  boxShadow:
    "0 12px 30px rgba(15,23,42,.06)",
};

const summaryValue = {
  margin: "0 0 6px",
  color: "#2563eb",
  fontSize: "30px",
};

const summaryLabel = {
  margin: 0,
  color: "#64748b",
};

const filterPanel = {
  background: "#ffffff",
  padding: "20px",
  borderRadius: "20px",
  marginBottom: "26px",
  boxShadow:
    "0 12px 30px rgba(15,23,42,.05)",
  display: "flex",
  flexWrap: "wrap",
  gap: "14px",
};

const inputStyle = {
  flex: "1 1 300px",
  boxSizing: "border-box",
  padding: "14px 16px",
  border: "1px solid #dbe3ee",
  borderRadius: "12px",
  outline: "none",
};

const selectStyle = {
  minWidth: "180px",
  boxSizing: "border-box",
  padding: "13px 15px",
  border: "1px solid #dbe3ee",
  borderRadius: "12px",
  background: "#ffffff",
};

const clearButton = {
  minHeight: "46px",
  padding: "12px 16px",
  border: "1px solid #cbd5e1",
  borderRadius: "12px",
  background: "#ffffff",
  color: "#475569",
  fontWeight: 800,
  cursor: "pointer",
};

const resultSummary = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "16px",
  color: "#64748b",
  fontSize: "14px",
  fontWeight: 600,
  flexWrap: "wrap",
};


const scannerCard = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  minHeight: "280px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  padding: "22px",
  boxShadow:
    "0 12px 30px rgba(15,23,42,.05)",
};

const cardTopRow = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "16px",
};

const scannerIcon = {
  width: "52px",
  height: "52px",
  display: "grid",
  placeItems: "center",
  background: "#dbeafe",
  borderRadius: "15px",
  fontSize: "25px",
};

const scannerBadges = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginBottom: "14px",
};

const categoryBadge = {
  background: "#e0f2fe",
  color: "#0369a1",
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 800,
};

const timeframeBadge = {
  background: "#f1f5f9",
  color: "#475569",
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 800,
};

const featuredBadge = {
  background: "#fef3c7",
  color: "#92400e",
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 800,
};

const scannerTitle = {
  color: "#0f172a",
  margin: "0 0 10px",
  fontSize: "22px",
  lineHeight: "1.3",
  wordBreak: "break-word",
  whiteSpace: "normal",
};

const scannerDescription = {
  color: "#64748b",
  lineHeight: 1.7,
  minHeight: "70px",
  margin: "0 0 18px",
};

const openButton = {
  display: "inline-block",
  width: "fit-content",
  marginTop: "auto",
  background: "#2563eb",
  color: "#ffffff",
  textDecoration: "none",
  padding: "11px 15px",
  borderRadius: "10px",
  fontSize: "14px",
  fontWeight: 800,
};

const disabledButton = {
  width: "fit-content",
  marginTop: "auto",
  background: "#e2e8f0",
  color: "#64748b",
  border: "none",
  padding: "12px 18px",
  borderRadius: "12px",
  fontWeight: 800,
};

const emptyState = {
  background: "#ffffff",
  padding: "45px",
  textAlign: "center",
  borderRadius: "22px",
  color: "#64748b",
};

const errorBox = {
  maxWidth: "720px",
  margin: "50px auto",
  background: "#ffffff",
  padding: "35px",
  textAlign: "center",
  borderRadius: "22px",
  color: "#64748b",
  boxShadow:
    "0 12px 30px rgba(15,23,42,.06)",
};

const retryButton = {
  marginTop: "12px",
  border: "none",
  borderRadius: "12px",
  padding: "12px 18px",
  background: "#2563eb",
  color: "#ffffff",
  fontWeight: 800,
  cursor: "pointer",
};