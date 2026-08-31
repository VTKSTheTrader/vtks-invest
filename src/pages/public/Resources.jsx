import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();


const getAnalysisPreview = (value, maxLength = 180) => {
  const clean = String(value || "")
    .replace(/\s+/g, " " )
    .trim();

  if (!clean) {
    return "No analysis notes have been added yet.";
  }

  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, maxLength).trim()}…`;
};

const formatAnalysisDate = (value) => {
  if (!value) return "";

  const date = new Date(
    `${value}T00:00:00`
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
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

export default function Resources() {
  const [resources, setResources] =
    useState([]);

  const [scanners, setScanners] =
    useState([]);

  const [
    activeTab,
    setActiveTab,
  ] = useState("Videos");

  const [search, setSearch] =
    useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("All");

  /*
    STOCK ANALYSIS FILTERS
  */

  const [
    stockFilter,
    setStockFilter,
  ] = useState("All");

  const [
    mediaTypeFilter,
    setMediaTypeFilter,
  ] = useState("All");

  const [
    dateSort,
    setDateSort,
  ] = useState("Latest");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [loading, setLoading] =
    useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  /*
    INTERNAL PREVIEW
  */

  const [
    previewItem,
    setPreviewItem,
  ] = useState(null);

  /*
    CHART ZOOM
  */

  const [
    chartZoom,
    setChartZoom,
  ] = useState(1);

  const [
    chartFullscreen,
    setChartFullscreen,
  ] = useState(false);

  const chartViewerRef =
    useRef(null);

  const dragStateRef =
    useRef({
      dragging: false,

      startX: 0,
      startY: 0,

      scrollLeft: 0,
      scrollTop: 0,
    });

  /* ===================================================
     LOAD DATA
  =================================================== */

  const loadPageData = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const [
        resourceRows,
        scannerRows,
      ] = await Promise.all([
        getResources(),
        getScanners(),
      ]);

      const publicResources =
        (resourceRows || [])
          .map(
            mapResourceFromDB
          )
          .filter((item) => {
            const access =
              normalize(
                item.access
              );

            const status =
              normalize(
                item.status
              );

            return (
              access ===
                "public" &&
              [
                "published",
                "active",
              ].includes(
                status
              )
            );
          });

      const publicScanners =
        (scannerRows || [])
          .map(
            mapScannerFromDB
          )
          .filter((item) => {
            const access =
              normalize(
                item.access
              );

            const status =
              normalize(
                item.status
              );

            return (
              access ===
                "public" &&
              status ===
                "active"
            );
          });

      setResources(
        publicResources
      );

      setScanners(
        publicScanners
      );
    } catch (error) {
      console.error(
        "Public resources load error:",
        error
      );

      setLoadError(
        error?.message ||
          "Failed to load public resources."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  /* ===================================================
     STOCK ANALYSIS
  =================================================== */

  const stockAnalysis =
    useMemo(() => {
      return resources.filter(
        (item) =>
          normalize(
            item.category
          ) ===
          "stock analysis"
      );
    }, [resources]);

  /* ===================================================
     STOCK NAME OPTIONS
  =================================================== */

  const stockNames =
    useMemo(() => {
      return [
        ...new Set(
          stockAnalysis
            .map(
              (item) =>
                item.stockName
            )
            .filter(Boolean)
        ),
      ].sort((a, b) =>
        a.localeCompare(b)
      );
    }, [stockAnalysis]);

  /* ===================================================
     VIDEOS
  =================================================== */

  const videos =
    useMemo(() => {
      return resources.filter(
        (item) => {
          const category =
            normalize(
              item.category
            );

          if (
            category ===
            "stock analysis"
          ) {
            return false;
          }

          const type =
            normalize(
              item.type
            );

          const sourceType =
            normalize(
              item.sourceType
            );

          const url =
            normalize(
              item.url
            );

          return (
            type ===
              "video" ||
            type ===
              "youtube" ||
            sourceType ===
              "youtube" ||
            url.includes(
              "youtube.com"
            ) ||
            url.includes(
              "youtu.be"
            )
          );
        }
      );
    }, [resources]);

  /* ===================================================
     CURRENT TAB
  =================================================== */

  const tabItems =
    useMemo(() => {
      if (
        activeTab ===
        "Videos"
      ) {
        return videos;
      }

      if (
        activeTab ===
        "Stock Analysis"
      ) {
        return stockAnalysis;
      }

      return scanners;
    }, [
      activeTab,
      videos,
      stockAnalysis,
      scanners,
    ]);

  /* ===================================================
     NORMAL CATEGORIES
  =================================================== */

  const categories =
    useMemo(() => {
      return [
        "All",

        ...new Set(
          tabItems
            .map(
              (item) =>
                item.category ||
                "General"
            )
            .filter(Boolean)
            .sort()
        ),
      ];
    }, [tabItems]);

  /* ===================================================
     FILTER + SORT
  =================================================== */

  const filteredItems =
    useMemo(() => {
      const query =
        normalize(search);

      let result =
        tabItems.filter(
          (item) => {
            const title =
              item.title ||
              item.name ||
              "VTKS Resource";

            const stockName =
              item.stockName ||
              "";

            const matchesSearch =
              !query ||
              normalize(
                title
              ).includes(
                query
              ) ||
              normalize(
                stockName
              ).includes(
                query
              ) ||
              normalize(
                item.description
              ).includes(
                query
              ) ||
              normalize(
                item.category
              ).includes(
                query
              ) ||
              normalize(
                item.timeframe
              ).includes(
                query
              );

            /*
              STOCK ANALYSIS
            */

            if (
              activeTab ===
              "Stock Analysis"
            ) {
              const matchesStock =
                stockFilter ===
                  "All" ||
                item.stockName ===
                  stockFilter;

              const matchesType =
                mediaTypeFilter ===
                  "All" ||
                normalize(
                  item.type
                ) ===
                  normalize(
                    mediaTypeFilter
                  );

              return (
                matchesSearch &&
                matchesStock &&
                matchesType
              );
            }

            /*
              VIDEOS / SCANNERS
            */

            const matchesCategory =
              categoryFilter ===
                "All" ||
              (item.category ||
                "General") ===
                categoryFilter;

            return (
              matchesSearch &&
              matchesCategory
            );
          }
        );

      /*
        DATE SORT
        Applies to Videos, Stock Analysis and Scanners.
      */

      const getItemTimestamp = (item) => {
        const dateValue =
          item.analysisDate ||
          item.createdAt ||
          item.created_at ||
          item.updatedAt ||
          item.updated_at ||
          "";

        if (!dateValue) {
          return 0;
        }

        const normalizedDate =
          /^\\d{4}-\\d{2}-\\d{2}$/.test(
            String(dateValue)
          )
            ? `${dateValue}T00:00:00`
            : dateValue;

        const timestamp =
          new Date(
            normalizedDate
          ).getTime();

        return Number.isFinite(
          timestamp
        )
          ? timestamp
          : 0;
      };

      result = [
        ...result,
      ].sort(
        (
          first,
          second
        ) => {
          const firstDate =
            getItemTimestamp(
              first
            );

          const secondDate =
            getItemTimestamp(
              second
            );

          if (
            dateSort ===
            "Oldest"
          ) {
            return (
              firstDate -
              secondDate
            );
          }

          return (
            secondDate -
            firstDate
          );
        }
      );

      return result;
    }, [
      tabItems,
      search,
      activeTab,
      categoryFilter,
      stockFilter,
      mediaTypeFilter,
      dateSort,
    ]);

  /* ===================================================
     TAB CHANGE
  =================================================== */

  useEffect(() => {
    setSearch("");

    setCategoryFilter(
      "All"
    );

    setStockFilter(
      "All"
    );

    setMediaTypeFilter(
      "All"
    );

    setDateSort(
      "Latest"
    );

    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    categoryFilter,
    stockFilter,
    mediaTypeFilter,
    dateSort,
  ]);

  /* ===================================================
     PAGINATION
  =================================================== */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredItems.length /
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

  const paginatedItems =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      return filteredItems.slice(
        startIndex,
        startIndex +
          ITEMS_PER_PAGE
      );
    }, [
      filteredItems,
      currentPage,
    ]);

  const firstVisibleRecord =
    filteredItems.length ===
    0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const lastVisibleRecord =
    Math.min(
      currentPage *
        ITEMS_PER_PAGE,
      filteredItems.length
    );

  /* ===================================================
     RESOURCE URL
  =================================================== */

  const getResourceUrl = (
    item
  ) =>
    item.url ||
    item.videoUrl ||
    item.fileUrl ||
    item.resourceUrl ||
    item.link ||
    "";

  /* ===================================================
     YOUTUBE ID
  =================================================== */

  const getYouTubeVideoId = (
    url
  ) => {
    if (!url) return "";

    try {
      if (
        url.includes(
          "watch?v="
        )
      ) {
        return url
          .split(
            "watch?v="
          )[1]
          .split("&")[0];
      }

      if (
        url.includes(
          "youtu.be/"
        )
      ) {
        return url
          .split(
            "youtu.be/"
          )[1]
          .split("?")[0];
      }

      if (
        url.includes(
          "youtube.com/embed/"
        )
      ) {
        return url
          .split(
            "youtube.com/embed/"
          )[1]
          .split("?")[0];
      }

      if (
        url.includes(
          "youtube.com/shorts/"
        )
      ) {
        return url
          .split(
            "youtube.com/shorts/"
          )[1]
          .split("?")[0];
      }
    } catch {
      return "";
    }

    return "";
  };

  const getYouTubeThumbnail = (
    url
  ) => {
    const videoId =
      getYouTubeVideoId(
        url
      );

    return videoId
      ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      : "";
  };

  /* ===================================================
     THUMBNAIL
  =================================================== */

  const getThumbnail = (
    item
  ) => {
    const url =
      getResourceUrl(
        item
      );

    if (!url) return "";

    const youtube =
      getYouTubeThumbnail(
        url
      );

    if (youtube) {
      return youtube;
    }

    if (
      normalize(
        item.type
      ) === "image"
    ) {
      return url;
    }

    return "";
  };

  /* ===================================================
     PLACEHOLDER
  =================================================== */

  const getPlaceholder = (
    item
  ) => {
    if (
      activeTab ===
      "Stock Analysis"
    ) {
      if (
        normalize(
          item.type
        ) === "video"
      ) {
        return "🎥";
      }

      return "📊";
    }

    if (
      activeTab ===
      "Videos"
    ) {
      return "🎥";
    }

    return "⚡";
  };

  /* ===================================================
     PREVIEW
  =================================================== */

  const openPreview = (
    item
  ) => {
    setChartZoom(1);
    setChartFullscreen(false);

    setPreviewItem(
      item
    );

    document.body.style.overflow =
      "hidden";

    setTimeout(() => {
      if (
        chartViewerRef.current
      ) {
        chartViewerRef.current.scrollLeft =
          0;

        chartViewerRef.current.scrollTop =
          0;
      }
    }, 0);
  };

  const closePreview =
    () => {
      setPreviewItem(
        null
      );

      setChartZoom(1);
      setChartFullscreen(false);

      document.body.style.overflow =
        "";
    };

  useEffect(() => {
    return () => {
      document.body.style.overflow =
        "";
    };
  }, []);

  /* ===================================================
     ESC
  =================================================== */

  useEffect(() => {
    const handleKeyDown = (
      event
    ) => {
      if (
        event.key ===
          "Escape" &&
        previewItem
      ) {
        closePreview();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [previewItem]);

  /* ===================================================
     ZOOM
  =================================================== */

  const zoomInChart =
    () => {
      setChartZoom(
        (previous) =>
          Math.min(
            previous +
              ZOOM_STEP,
            MAX_ZOOM
          )
      );
    };

  const zoomOutChart =
    () => {
      setChartZoom(
        (previous) =>
          Math.max(
            previous -
              ZOOM_STEP,
            MIN_ZOOM
          )
      );
    };

  const resetChartZoom =
    () => {
      setChartZoom(1);

      if (
        chartViewerRef.current
      ) {
        chartViewerRef.current.scrollLeft =
          0;

        chartViewerRef.current.scrollTop =
          0;
      }
    };

  const fitChartToScreen = () => {
    setChartZoom(1);

    requestAnimationFrame(() => {
      if (chartViewerRef.current) {
        chartViewerRef.current.scrollLeft = 0;
        chartViewerRef.current.scrollTop = 0;
      }
    });
  };

  const toggleChartFullscreen = () => {
    setChartFullscreen((previous) => !previous);

    requestAnimationFrame(() => {
      if (chartViewerRef.current) {
        chartViewerRef.current.scrollLeft = 0;
        chartViewerRef.current.scrollTop = 0;
      }
    });
  };

  const handleChartDoubleClick = () => {
    setChartZoom((previous) =>
      previous < 1.5 ? 1.5 : 1
    );
  };

  const handleChartWheel = (
    event
  ) => {
    event.preventDefault();

    if (
      event.deltaY < 0
    ) {
      setChartZoom(
        (previous) =>
          Math.min(
            previous +
              ZOOM_STEP,
            MAX_ZOOM
          )
      );
    } else {
      setChartZoom(
        (previous) =>
          Math.max(
            previous -
              ZOOM_STEP,
            MIN_ZOOM
          )
      );
    }
  };

  /* ===================================================
     DRAG / PAN
  =================================================== */

  const handlePointerDown = (
    event
  ) => {
    const viewer =
      chartViewerRef.current;

    if (!viewer || chartZoom <= 1) return;

    dragStateRef.current = {
      dragging: true,

      startX:
        event.clientX,

      startY:
        event.clientY,

      scrollLeft:
        viewer.scrollLeft,

      scrollTop:
        viewer.scrollTop,
    };

    viewer.setPointerCapture?.(
      event.pointerId
    );
  };

  const handlePointerMove = (
    event
  ) => {
    const viewer =
      chartViewerRef.current;

    const drag =
      dragStateRef.current;

    if (
      !viewer ||
      !drag.dragging
    ) {
      return;
    }

    const differenceX =
      event.clientX -
      drag.startX;

    const differenceY =
      event.clientY -
      drag.startY;

    viewer.scrollLeft =
      drag.scrollLeft -
      differenceX;

    viewer.scrollTop =
      drag.scrollTop -
      differenceY;
  };

  const endChartDrag =
    () => {
      dragStateRef.current.dragging =
        false;
    };

  /* ===================================================
     TEXT
  =================================================== */

  const getSectionDescription =
    () => {
      if (
        activeTab ===
        "Videos"
      ) {
        return "Explore free VTKS educational videos and market-learning content.";
      }

      if (
        activeTab ===
        "Stock Analysis"
      ) {
        return "Explore public VTKS stock observations, charts and educational analysis.";
      }

      return "Explore public VTKS market scanners and structured market tools.";
    };

  const getSearchPlaceholder =
    () => {
      if (
        activeTab ===
        "Stock Analysis"
      ) {
        return "Search stock or analysis...";
      }

      if (
        activeTab ===
        "Videos"
      ) {
        return "Search videos...";
      }

      return "Search scanners...";
    };

  /* ===================================================
     CLEAR
  =================================================== */

  const clearFilters = () => {
    setSearch("");

    setCategoryFilter(
      "All"
    );

    setStockFilter(
      "All"
    );

    setMediaTypeFilter(
      "All"
    );

    setDateSort(
      "Latest"
    );

    setCurrentPage(1);
  };

  const hasStockFilters =
    search ||
    stockFilter !==
      "All" ||
    mediaTypeFilter !==
      "All" ||
    dateSort !==
      "Latest";

  const hasNormalFilters =
    search ||
    categoryFilter !==
      "All" ||
    dateSort !==
      "Latest";

  /* ===================================================
     LOADING
  =================================================== */

  if (loading) {
    return (
      <main className="resources-page">
        <div className="resources-state">
          Loading public
          resources...
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="resources-page">
        <div className="resources-state resources-error">
          <h2>
            Unable to load
            resources
          </h2>

          <p>
            {loadError}
          </p>

          <button
            type="button"
            onClick={
              loadPageData
            }
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  /* ===================================================
     PAGE
  =================================================== */

  return (
    <main className="resources-page">
      {/* HERO */}

      <section className="resources-hero">
        <div className="resources-hero-content">
          <span className="resources-eyebrow">
            📚 VTKS Learning Resources
          </span>

          <h1>
            Learn with structure.
            <br />
            Study with clarity.
          </h1>

          <p>
            Explore free VTKS
            educational videos,
            stock analysis and
            market scanners designed
            to support a structured
            market-learning approach.
          </p>
        </div>

        <div className="resources-hero-stats">
          <div>
            <strong>
              {videos.length}
            </strong>

            <span>
              Learning Videos
            </span>
          </div>

          <div>
            <strong>
              {
                stockAnalysis.length
              }
            </strong>

            <span>
              Stock Analysis
            </span>
          </div>

          <div>
            <strong>
              {scanners.length}
            </strong>

            <span>
              Scanners
            </span>
          </div>
        </div>
      </section>

      {/* CONTENT */}

      <section className="resources-content">
        <div
          className={`resources-toolbar ${
            activeTab === "Stock Analysis"
              ? "resources-toolbar-stock"
              : ""
          }`}
        >
          {/* TABS */}

          <div className="resources-tabs">
            <button
              type="button"
              className={
                activeTab ===
                "Videos"
                  ? "resource-tab active"
                  : "resource-tab"
              }
              onClick={() =>
                setActiveTab(
                  "Videos"
                )
              }
            >
              🎥 Learning Videos
              <span>
                {videos.length}
              </span>
            </button>

            <button
              type="button"
              className={
                activeTab ===
                "Stock Analysis"
                  ? "resource-tab active"
                  : "resource-tab"
              }
              onClick={() =>
                setActiveTab(
                  "Stock Analysis"
                )
              }
            >
              📈 Stock Analysis

              <span>
                {
                  stockAnalysis.length
                }
              </span>
            </button>

            <button
              type="button"
              className={
                activeTab ===
                "Scanners"
                  ? "resource-tab active"
                  : "resource-tab"
              }
              onClick={() =>
                setActiveTab(
                  "Scanners"
                )
              }
            >
              ⚡ Scanners

              <span>
                {scanners.length}
              </span>
            </button>
          </div>

          {/* ===========================================
              STOCK FILTERS
          =========================================== */}

          {activeTab ===
          "Stock Analysis" ? (
            <div className="resources-filters stock-analysis-filters">
              <input
                type="search"
                placeholder={
                  getSearchPlaceholder()
                }
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
              />

              {/* STOCK */}

              <select
                value={
                  stockFilter
                }
                onChange={(
                  event
                ) =>
                  setStockFilter(
                    event.target
                      .value
                  )
                }
              >
                <option value="All">
                  All Stocks
                </option>

                {stockNames.map(
                  (stock) => (
                    <option
                      key={
                        stock
                      }
                      value={
                        stock
                      }
                    >
                      {stock}
                    </option>
                  )
                )}
              </select>

              {/* IMAGE / VIDEO */}

              <select
                value={
                  mediaTypeFilter
                }
                onChange={(
                  event
                ) =>
                  setMediaTypeFilter(
                    event.target
                      .value
                  )
                }
              >
                <option value="All">
                  All Types
                </option>

                <option value="Image">
                  📊 Images / Charts
                </option>

                <option value="Video">
                  🎥 Videos
                </option>

                <option value="Link">
                  🔗 Links
                </option>
              </select>

              {/* DATE SORT */}

              <select
                value={
                  dateSort
                }
                onChange={(
                  event
                ) =>
                  setDateSort(
                    event.target
                      .value
                  )
                }
              >
                <option value="Latest">
                  📅 Latest First
                </option>

                <option value="Oldest">
                  📅 Oldest First
                </option>
              </select>

              {hasStockFilters && (
                <button
                  type="button"
                  className="resources-clear-button"
                  onClick={
                    clearFilters
                  }
                >
                  Clear
                </button>
              )}
            </div>
          ) : (
            /* NORMAL FILTERS */

            <div className="resources-filters">
              <input
                type="search"
                placeholder={
                  getSearchPlaceholder()
                }
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
              />

              <select
                value={
                  categoryFilter
                }
                onChange={(
                  event
                ) =>
                  setCategoryFilter(
                    event.target
                      .value
                  )
                }
              >
                {categories.map(
                  (item) => (
                    <option
                      key={
                        item
                      }
                      value={
                        item
                      }
                    >
                      {item ===
                      "All"
                        ? "All Categories"
                        : item}
                    </option>
                  )
                )}
              </select>

              <select
                value={
                  dateSort
                }
                onChange={(
                  event
                ) =>
                  setDateSort(
                    event.target
                      .value
                  )
                }
              >
                <option value="Latest">
                  📅 Latest First
                </option>

                <option value="Oldest">
                  📅 Oldest First
                </option>
              </select>

              {hasNormalFilters && (
                <button
                  type="button"
                  className="resources-clear-button"
                  onClick={
                    clearFilters
                  }
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* HEADING */}

        <div className="resources-section-heading">
          <div>
            <h2>
              {activeTab}
            </h2>

            <p>
              {
                getSectionDescription()
              }
            </p>
          </div>

          {filteredItems.length >
            0 && (
            <span>
              Showing{" "}
              {firstVisibleRecord}–
              {lastVisibleRecord}{" "}
              of{" "}
              {
                filteredItems.length
              }
            </span>
          )}
        </div>

        {/* ITEMS */}

        {filteredItems.length ===
        0 ? (
          <div className="resources-state">
            <h2>
              No{" "}
              {activeTab.toLowerCase()}{" "}
              found
            </h2>

            <p>
              No public item
              matches your
              current filters.
            </p>
          </div>
        ) : (
          <>
            <div className="resources-grid">
              {paginatedItems.map(
                (item) => {
                  const title =
                    item.title ||
                    item.name ||
                    "VTKS Resource";

                  const stockName =
                    item.stockName ||
                    "";

                  const url =
                    getResourceUrl(
                      item
                    );

                  const thumbnail =
                    getThumbnail(
                      item
                    );

                  const isStock =
                    activeTab ===
                    "Stock Analysis";

                  const dateLabel =
                    formatAnalysisDate(
                      item.analysisDate
                    );

                  return (
                    <article
                      key={`${activeTab}-${item.id}`}
                      className={
                        isStock
                          ? "public-resource-card stock-analysis-card"
                          : "public-resource-card"
                      }
                    >
                      {/* MEDIA */}

                      <div className="resource-media">
                        {thumbnail ? (
                          <img
                            src={
                              thumbnail
                            }
                            alt={
                              stockName ||
                              title
                            }
                          />
                        ) : (
                          <div className="resource-placeholder">
                            {
                              getPlaceholder(
                                item
                              )
                            }
                          </div>
                        )}

                        {item.featured && (
                          <span className="resource-featured">
                            ⭐ Featured
                          </span>
                        )}
                      </div>

                      {/* BODY */}

                      <div className="resource-card-body">
                        <div className="resource-card-badges">
                          {isStock ? (
                            <>
                              <span>
                                📈 Stock Analysis
                              </span>

                              <span>
                                {item.type ||
                                  "Analysis"}
                              </span>

                              {dateLabel && (
                                <span>
                                  📅{" "}
                                  {
                                    dateLabel
                                  }
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <span>
                                {item.category ||
                                  "General"}
                              </span>

                              <span>
                                {activeTab ===
                                "Scanners"
                                  ? item.timeframe ||
                                    "Scanner"
                                  : item.type ||
                                    "Video"}
                              </span>
                            </>
                          )}
                        </div>

                        {/* STOCK TITLE */}

                        {isStock ? (
                          <>
                            <h3 className="stock-analysis-stock-name">
                              {stockName ||
                                title}
                            </h3>

                            {stockName &&
                              title &&
                              normalize(
                                stockName
                              ) !==
                                normalize(
                                  title
                                ) && (
                                <h4 className="stock-analysis-title">
                                  {
                                    title
                                  }
                                </h4>
                              )}
                          </>
                        ) : (
                          <h3>
                            {title}
                          </h3>
                        )}

                        {/* DESCRIPTION */}

                        {isStock ? (
                          <div className="stock-analysis-preview">
                            {getAnalysisPreview(
                              item.description
                            )}
                          </div>
                        ) : (
                          <p>
                            {item.description ||
                              (activeTab ===
                              "Videos"
                                ? "Explore this public VTKS educational video."
                                : "Explore this public VTKS market scanner.")}
                          </p>
                        )}

                        {/* ACTION */}

                        {url ? (
                          activeTab ===
                          "Scanners" ? (
                            <a
                              href={
                                url
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="resource-open-button"
                            >
                              Open Scanner ↗
                            </a>
                          ) : (
                            <button
                              type="button"
                              className="resource-open-button resource-preview-trigger"
                              onClick={() =>
                                openPreview(
                                  item
                                )
                              }
                            >
                              {isStock
                                ? normalize(
                                    item.type
                                  ) ===
                                  "image"
                                  ? "🔍 View Full Chart"
                                  : "▶ Watch Analysis"
                                : "▶ Watch Video"}
                            </button>
                          )
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
                }
              )}
            </div>

            {totalPages > 1 && (
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
            )}
          </>
        )}
      </section>

      {/* =================================================
          INTERNAL VTKS MODAL
      ================================================= */}

      {previewItem && (
        <div
          className="vtks-resource-modal-overlay"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closePreview();
            }
          }}
        >
          <div
            className={
              chartFullscreen
                ? "vtks-resource-modal is-fullscreen"
                : "vtks-resource-modal"
            }
          >
            {/* HEADER */}

            <div className="vtks-resource-modal-header">
              <div>
                {normalize(
                  previewItem.category
                ) ===
                  "stock analysis" && (
                  <span className="vtks-resource-modal-label">
                    📈 Stock Analysis
                  </span>
                )}

                <h2>
                  {previewItem.stockName ||
                    previewItem.title ||
                    "VTKS Resource"}
                </h2>

                {previewItem.stockName &&
                  previewItem.title && (
                    <p>
                      {
                        previewItem.title
                      }
                    </p>
                  )}

                {previewItem.analysisDate && (
                  <div className="vtks-resource-modal-date">
                    📅{" "}
                    {formatAnalysisDate(
                      previewItem.analysisDate
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="vtks-resource-modal-close"
                onClick={
                  closePreview
                }
              >
                ✕
              </button>
            </div>

            {/* CONTENT */}

            <div className="vtks-resource-modal-content">
              {(() => {
                const url =
                  getResourceUrl(
                    previewItem
                  );

                const videoId =
                  getYouTubeVideoId(
                    url
                  );

                const type =
                  normalize(
                    previewItem.type
                  );

                /* VIDEO */

                if (videoId) {
                  return (
                    <div className="vtks-video-wrapper">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={
                          previewItem.title ||
                          "VTKS Video"
                        }
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  );
                }

                /* IMAGE */

                if (
                  type === "image"
                ) {
                  return (
                    <div className="vtks-chart-viewer vtks-pro-chart-viewer">
                      {/* PRO TOOLBAR */}

                      <div className="vtks-chart-toolbar vtks-pro-chart-toolbar">
                        <div className="vtks-chart-toolbar-left">
                          <div className="vtks-chart-toolbar-title">
                            📊 VTKS Pro Chart Viewer
                          </div>

                          <div className="vtks-chart-toolbar-subtitle">
                            {previewItem.stockName ||
                              previewItem.title ||
                              "Chart"}
                          </div>
                        </div>

                        <div className="vtks-chart-zoom-controls vtks-pro-chart-controls">
                          <button
                            type="button"
                            className="vtks-chart-fit"
                            onClick={fitChartToScreen}
                            title="Fit chart to screen"
                          >
                            Fit
                          </button>

                          <button
                            type="button"
                            onClick={zoomOutChart}
                            disabled={chartZoom <= MIN_ZOOM}
                            title="Zoom out"
                            aria-label="Zoom out"
                          >
                            −
                          </button>

                          <span className="vtks-chart-zoom-value">
                            {Math.round(chartZoom * 100)}%
                          </span>

                          <button
                            type="button"
                            onClick={zoomInChart}
                            disabled={chartZoom >= MAX_ZOOM}
                            title="Zoom in"
                            aria-label="Zoom in"
                          >
                            +
                          </button>

                          <button
                            type="button"
                            className="vtks-chart-reset"
                            onClick={resetChartZoom}
                            title="Reset zoom"
                          >
                            100%
                          </button>

                          <button
                            type="button"
                            className="vtks-chart-fullscreen-button"
                            onClick={toggleChartFullscreen}
                            title={
                              chartFullscreen
                                ? "Exit fullscreen"
                                : "Fullscreen chart"
                            }
                          >
                            {chartFullscreen ? "↙ Exit" : "⛶ Fullscreen"}
                          </button>
                        </div>
                      </div>

                      {/* CHART */}

                      <div
                        ref={chartViewerRef}
                        className={
                          chartZoom > 1
                            ? "vtks-chart-zoom-area is-zoomed"
                            : "vtks-chart-zoom-area"
                        }
                        onWheel={handleChartWheel}
                        onDoubleClick={handleChartDoubleClick}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={endChartDrag}
                        onPointerCancel={endChartDrag}
                        onPointerLeave={endChartDrag}
                      >
                        <div
                          className="vtks-chart-image-container"
                          style={{
                            width: `${chartZoom * 100}%`,
                          }}
                        >
                          <img
                            src={url}
                            alt={
                              previewItem.stockName ||
                              previewItem.title ||
                              "VTKS Chart"
                            }
                            draggable={false}
                          />
                        </div>
                      </div>

                      <div className="vtks-chart-help">
                        <span>Wheel: zoom</span>
                        <span>Double-click: 150% / 100%</span>
                        <span>Drag: pan when zoomed</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="vtks-resource-modal-message">
                    Preview unavailable
                    for this resource
                    type.
                  </div>
                );
              })()}

              {/* ANALYSIS */}

              {previewItem.description && (
                <div className="vtks-resource-modal-analysis">
                  <h3>
                    Analysis Notes
                  </h3>

                  <div>
                    {
                      previewItem.description
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}