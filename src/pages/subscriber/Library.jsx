import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Pagination from "../../components/common/Pagination";

import {
  getSubscriberLibrary,
  getSubscriberMembership,
  getSubscriberProfile,
} from "../../services/subscriberService";

const ITEMS_PER_PAGE = 8;

export default function Library() {
  const [profile, setProfile] = useState(null);
  const [membership, setMembership] = useState(null);
  const [resources, setResources] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [type, setType] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const profileData = await getSubscriberProfile();

      const membershipData = await getSubscriberMembership(
        profileData.email
      );

      const resourceRows = await getSubscriberLibrary();

      setProfile(profileData);
      setMembership(membershipData);
      setResources(resourceRows || []);
    } catch (error) {
      console.error("Subscriber library error:", error);

      setLoadError(
        error?.message || "Failed to load subscriber library."
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

  const isExpired =
    !membership ||
    String(membership.status || "")
      .trim()
      .toLowerCase() === "expired" ||
    getDaysLeft() <= 0;

  const sortedResources = useMemo(() => {
    return [...resources].sort((first, second) => {
      if (first.pinned && !second.pinned) return -1;
      if (!first.pinned && second.pinned) return 1;

      if (first.featured && !second.featured) return -1;
      if (!first.featured && second.featured) return 1;

      const firstDate = new Date(
        first.created_at || first.updated_at || 0
      ).getTime();

      const secondDate = new Date(
        second.created_at || second.updated_at || 0
      ).getTime();

      return secondDate - firstDate;
    });
  }, [resources]);

  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(
        sortedResources
          .map((item) => item.category || "General")
          .sort()
      ),
    ];
  }, [sortedResources]);

  const types = useMemo(() => {
    return [
      "All",
      ...new Set(
        sortedResources
          .map((item) => item.type || "Resource")
          .sort()
      ),
    ];
  }, [sortedResources]);

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sortedResources.filter((item) => {
      const matchesSearch =
        !query ||
        String(item.title || "")
          .toLowerCase()
          .includes(query) ||
        String(item.description || "")
          .toLowerCase()
          .includes(query) ||
        String(item.category || "")
          .toLowerCase()
          .includes(query) ||
        String(item.type || "")
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        category === "All" ||
        (item.category || "General") === category;

      const matchesType =
        type === "All" ||
        (item.type || "Resource") === type;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [sortedResources, search, category, type]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, category, type]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredResources.length / ITEMS_PER_PAGE)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedResources = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredResources.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredResources, currentPage]);

  const firstVisibleRecord =
    filteredResources.length === 0
      ? 0
      : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const lastVisibleRecord = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredResources.length
  );

  const totalVideos = resources.filter((item) =>
    String(item.type || "")
      .toLowerCase()
      .includes("video")
  ).length;

  const totalPdfs = resources.filter((item) =>
    String(item.type || "")
      .toLowerCase()
      .includes("pdf")
  ).length;

  const getResourceUrl = (item) =>
    item.video_url ||
    item.file_url ||
    item.resource_url ||
    item.url ||
    "";

  const getActionText = (item) => {
    const resourceType = String(item.type || "").toLowerCase();

    if (resourceType.includes("video")) {
      return "Watch Video →";
    }

    if (resourceType.includes("pdf")) {
      return "Open PDF →";
    }

    if (resourceType.includes("link")) {
      return "Open Resource →";
    }

    return "View Resource →";
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setType("All");
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <p style={loadingStyle}>
        Loading subscriber library...
      </p>
    );
  }

  if (loadError) {
    return (
      <main style={pageStyle}>
        <section style={errorBox}>
          <h2 style={{ marginTop: 0 }}>
            Unable to load library
          </h2>

          <p>{loadError}</p>

          <button
            type="button"
            onClick={loadLibrary}
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
            VTKS Knowledge Vault
          </span>

          <h1 style={heroTitle}>
            Subscriber Library
          </h1>

          <p style={heroText}>
            Welcome, {profile?.full_name || "Subscriber"}.
            Access your premium VTKS videos, PDFs and
            structured learning resources.
          </p>
        </div>

        <Link to="/dashboard" style={backButton}>
          ← Dashboard
        </Link>
      </section>

      {isExpired ? (
        <section style={expiredBox}>
          <h2 style={{ marginTop: 0 }}>
            🔴 Subscription Expired
          </h2>

          <p>
            Your premium library access is currently
            unavailable. Please renew your subscription
            to continue.
          </p>

          <Link to="/pricing" style={renewButton}>
            Renew Subscription
          </Link>
        </section>
      ) : (
        <>
          <section style={summaryGrid}>
            <div style={summaryCard}>
              <h2 style={summaryValue}>
                {resources.length}
              </h2>

              <p style={summaryLabel}>
                Total Resources
              </p>
            </div>

            <div style={summaryCard}>
              <h2 style={summaryValue}>
                {totalVideos}
              </h2>

              <p style={summaryLabel}>
                Videos
              </p>
            </div>

            <div style={summaryCard}>
              <h2 style={summaryValue}>
                {totalPdfs}
              </h2>

              <p style={summaryLabel}>
                PDFs
              </p>
            </div>

            <div style={summaryCard}>
              <h2
                style={{
                  ...summaryValue,
                  color: "#16a34a",
                }}
              >
                {getDaysLeft()} Days
              </h2>

              <p style={summaryLabel}>
                Access Remaining
              </p>
            </div>
          </section>

          <section style={filterPanel}>
            <input
              type="search"
              placeholder="Search videos, PDFs or categories..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              style={inputStyle}
            />

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              style={selectStyle}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "All"
                    ? "All Categories"
                    : item}
                </option>
              ))}
            </select>

            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value)
              }
              style={selectStyle}
            >
              {types.map((item) => (
                <option key={item} value={item}>
                  {item === "All"
                    ? "All Resource Types"
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

          {filteredResources.length === 0 ? (
            <div style={emptyState}>
              <h2>No resources found</h2>

              <p>
                No library item matches your filters, or
                the admin has not uploaded content yet.
              </p>
            </div>
          ) : (
            <>
              <div style={resultSummary}>
                <span>
                  Showing {firstVisibleRecord}–
                  {lastVisibleRecord} of{" "}
                  {filteredResources.length} resources
                </span>

                <span>
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <section style={resourceGrid}>
                {paginatedResources.map((item) => {
                  const resourceUrl =
                    getResourceUrl(item);

                  return (
                    <article
                      key={item.id}
                      style={resourceCard}
                    >
                      <div style={resourceTop}>
                        <span style={typeBadge}>
                          {item.type || "Resource"}
                        </span>

                        <span style={categoryBadge}>
                          {item.category || "General"}
                        </span>
                      </div>

                      <div style={resourceFlags}>
                        {item.pinned && (
                          <span style={pinnedBadge}>
                            📌 Pinned
                          </span>
                        )}

                        {item.featured && (
                          <span style={featuredBadge}>
                            ⭐ Featured
                          </span>
                        )}
                      </div>

                      <h2 style={resourceTitle}>
                        {item.title || "VTKS Resource"}
                      </h2>

                      <p style={resourceDescription}>
                        {item.description ||
                          "Premium VTKS learning resource for subscribers."}
                      </p>

                      {resourceUrl ? (
                        <a
                          href={resourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={openButton}
                        >
                          {getActionText(item)}
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          style={disabledButton}
                        >
                          Resource unavailable
                        </button>
                      )}
                    </article>
                  );
                })}
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
  padding: "40px",
};

const loadingStyle = {
  padding: "40px",
  color: "#475569",
};

const heroStyle = {
  background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
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
  border: "1px solid rgba(255,255,255,.18)",
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
    "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "18px",
  marginBottom: "25px",
};

const summaryCard = {
  background: "#ffffff",
  padding: "25px",
  borderRadius: "20px",
  boxShadow: "0 12px 30px rgba(15,23,42,.06)",
};

const summaryValue = {
  margin: "0 0 6px",
  color: "#2563eb",
  fontSize: "32px",
};

const summaryLabel = {
  margin: 0,
  color: "#64748b",
};

const filterPanel = {
  background: "#ffffff",
  padding: "20px",
  borderRadius: "20px",
  display: "flex",
  flexWrap: "wrap",
  gap: "14px",
  marginBottom: "26px",
  boxShadow: "0 12px 30px rgba(15,23,42,.05)",
};

const inputStyle = {
  flex: "1 1 300px",
  padding: "13px 15px",
  border: "1px solid #dbe3ee",
  borderRadius: "12px",
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle = {
  minWidth: "190px",
  padding: "13px 15px",
  border: "1px solid #dbe3ee",
  borderRadius: "12px",
  background: "#ffffff",
  boxSizing: "border-box",
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

const resourceGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(290px, 1fr))",
  gap: "22px",
};

const resourceCard = {
  display: "flex",
  flexDirection: "column",
  minHeight: "300px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "22px",
  padding: "26px",
  boxShadow: "0 12px 30px rgba(15,23,42,.05)",
};

const resourceTop = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  marginBottom: "12px",
};

const resourceFlags = {
  minHeight: "26px",
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginBottom: "12px",
};

const typeBadge = {
  background: "#dbeafe",
  color: "#1e40af",
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 800,
};

const categoryBadge = {
  background: "#f1f5f9",
  color: "#475569",
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
};

const pinnedBadge = {
  background: "#fef3c7",
  color: "#92400e",
  padding: "5px 9px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 800,
};

const featuredBadge = {
  background: "#ede9fe",
  color: "#6d28d9",
  padding: "5px 9px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 800,
};

const resourceTitle = {
  margin: "0 0 12px",
  color: "#0f172a",
  fontSize: "23px",
};

const resourceDescription = {
  minHeight: "75px",
  margin: "0 0 12px",
  color: "#64748b",
  lineHeight: 1.7,
};

const openButton = {
  display: "inline-block",
  width: "fit-content",
  marginTop: "auto",
  background: "#2563eb",
  color: "#ffffff",
  textDecoration: "none",
  padding: "12px 18px",
  borderRadius: "12px",
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
  boxShadow: "0 12px 30px rgba(15,23,42,.05)",
};

const errorBox = {
  maxWidth: "720px",
  margin: "50px auto",
  background: "#ffffff",
  padding: "35px",
  textAlign: "center",
  borderRadius: "22px",
  color: "#64748b",
  boxShadow: "0 12px 30px rgba(15,23,42,.06)",
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