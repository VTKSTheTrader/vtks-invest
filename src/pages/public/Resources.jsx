import { useEffect, useMemo, useState } from "react";
import Pagination from "../../components/common/Pagination";

import {
  getResources,
  mapResourceFromDB,
} from "../../services/libraryService";

import {
  getScanners,
  mapScannerFromDB,
} from "../../services/scannerService";

import "./Resources.css";

const ITEMS_PER_PAGE = 6;

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [scanners, setScanners] = useState([]);

  const [activeTab, setActiveTab] = useState("Videos");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadPageData = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const [resourceRows, scannerRows] = await Promise.all([
        getResources(),
        getScanners(),
      ]);

      const publicResources = (resourceRows || [])
        .map(mapResourceFromDB)
        .filter((item) => {
          const access = normalize(item.access);
          const status = normalize(item.status);

          return (
            access === "public" &&
            ["published", "active"].includes(status)
          );
        });

      const publicScanners = (scannerRows || [])
        .map(mapScannerFromDB)
        .filter((item) => {
          const access = normalize(item.access);
          const status = normalize(item.status);

          return access === "public" && status === "active";
        });

      setResources(publicResources);
      setScanners(publicScanners);
    } catch (error) {
      console.error("Public resources load error:", error);

      setLoadError(
        error?.message || "Failed to load public resources."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  const videos = useMemo(
    () =>
      resources.filter((item) => {
        const type = normalize(item.type);
        const sourceType = normalize(item.sourceType);
        const url = normalize(item.url);

        return (
          type === "video" ||
          type === "youtube" ||
          sourceType === "youtube" ||
          url.includes("youtube.com") ||
          url.includes("youtu.be")
        );
      }),
    [resources]
  );

  const categories = useMemo(() => {
    const source = activeTab === "Videos" ? videos : scanners;

    return [
      "All",
      ...new Set(
        source
          .map((item) => item.category || "General")
          .filter(Boolean)
          .sort()
      ),
    ];
  }, [activeTab, videos, scanners]);

  const tabItems = useMemo(
    () => (activeTab === "Videos" ? videos : scanners),
    [activeTab, videos, scanners]
  );

  const filteredItems = useMemo(() => {
    const query = normalize(search);

    return tabItems.filter((item) => {
      const name = item.title || item.name || "VTKS Resource";

      const matchesSearch =
        !query ||
        normalize(name).includes(query) ||
        normalize(item.description).includes(query) ||
        normalize(item.category).includes(query) ||
        normalize(item.timeframe).includes(query);

      const matchesCategory =
        categoryFilter === "All" ||
        (item.category || "General") === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [tabItems, search, categoryFilter]);

  useEffect(() => {
    setCurrentPage(1);
    setCategoryFilter("All");
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredItems.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredItems, currentPage]);

  const firstVisibleRecord =
    filteredItems.length === 0
      ? 0
      : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const lastVisibleRecord = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredItems.length
  );

  const getResourceUrl = (item) =>
    item.url ||
    item.videoUrl ||
    item.fileUrl ||
    item.resourceUrl ||
    item.link ||
    "";

  const getYouTubeThumbnail = (url) => {
    if (!url) return "";

    let videoId = "";

    if (url.includes("watch?v=")) {
      videoId = url.split("watch?v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("youtube.com/embed/")) {
      videoId = url.split("youtube.com/embed/")[1].split("?")[0];
    }

    return videoId
      ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      : "";
  };

  const getActionText = () =>
    activeTab === "Videos"
      ? "Watch Video ↗"
      : "Open Scanner ↗";

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("All");
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <main className="resources-page">
        <div className="resources-state">
          Loading public resources...
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="resources-page">
        <div className="resources-state resources-error">
          <h2>Unable to load resources</h2>
          <p>{loadError}</p>

          <button type="button" onClick={loadPageData}>
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="resources-page">
      <section className="resources-hero">
        <div className="resources-hero-content">
          <span className="resources-eyebrow">
            📚 VTKS Learning Resources
          </span>

          <h1>
            Learn with structure.
            <br />
            Trade with clarity.
          </h1>

          <p>
            Explore free educational resources, including VTKS
            videos and market scanners designed to help traders
            build a structured trading approach.
          </p>
        </div>

        <div className="resources-hero-stats">
          <div>
            <strong>{videos.length}</strong>
            <span>Videos</span>
          </div>

          <div>
            <strong>{scanners.length}</strong>
            <span>Scanners</span>
          </div>
        </div>
      </section>

      <section className="resources-content">
        <div className="resources-toolbar">
          <div className="resources-tabs">
            <button
              type="button"
              className={
                activeTab === "Videos"
                  ? "resource-tab active"
                  : "resource-tab"
              }
              onClick={() => setActiveTab("Videos")}
            >
              🎥 Videos
              <span>{videos.length}</span>
            </button>

            <button
              type="button"
              className={
                activeTab === "Scanners"
                  ? "resource-tab active"
                  : "resource-tab"
              }
              onClick={() => setActiveTab("Scanners")}
            >
              ⚡ Scanners
              <span>{scanners.length}</span>
            </button>
          </div>

          <div className="resources-filters">
            <input
              type="search"
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Categories" : item}
                </option>
              ))}
            </select>

            {(search || categoryFilter !== "All") && (
              <button
                type="button"
                className="resources-clear-button"
                onClick={clearFilters}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="resources-section-heading">
          <div>
            <h2>{activeTab}</h2>

            <p>
              Explore public VTKS {activeTab.toLowerCase()} and
              learning tools.
            </p>
          </div>

          {filteredItems.length > 0 && (
            <span>
              Showing {firstVisibleRecord}–{lastVisibleRecord} of{" "}
              {filteredItems.length}
            </span>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="resources-state">
            <h2>No {activeTab.toLowerCase()} found</h2>

            <p>
              No public item matches your current filters.
            </p>
          </div>
        ) : (
          <>
            <div className="resources-grid">
              {paginatedItems.map((item) => {
                const title =
                  item.title || item.name || "VTKS Resource";

                const url = getResourceUrl(item);

                const thumbnail =
                  activeTab === "Videos"
                    ? getYouTubeThumbnail(url)
                    : "";

                return (
                  <article
                    key={`${activeTab}-${item.id}`}
                    className="public-resource-card"
                  >
                    <div className="resource-media">
                      {thumbnail ? (
                        <img src={thumbnail} alt={title} />
                      ) : (
                        <div className="resource-placeholder">
                          {activeTab === "Videos" ? "🎥" : "⚡"}
                        </div>
                      )}

                      {item.featured && (
                        <span className="resource-featured">
                          ⭐ Featured
                        </span>
                      )}
                    </div>

                    <div className="resource-card-body">
                      <div className="resource-card-badges">
                        <span>{item.category || "General"}</span>

                        <span>
                          {activeTab === "Scanners"
                            ? item.timeframe || "Scanner"
                            : item.type || "Video"}
                        </span>
                      </div>

                      <h3>{title}</h3>

                      <p>
                        {item.description ||
                          `Explore this public VTKS ${
                            activeTab === "Videos"
                              ? "video"
                              : "scanner"
                          } resource.`}
                      </p>

                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="resource-open-button"
                        >
                          {getActionText()}
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="resource-disabled-button"
                        >
                          Resource unavailable
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </section>
    </main>
  );
}
