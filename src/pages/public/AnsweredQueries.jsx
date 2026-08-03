import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getPublishedStockQueries,
} from "../../services/stockQueryService";

import "./AnsweredQueries.css";

const ITEMS_PER_PAGE = 6;

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getYouTubeEmbedUrl = (url) => {
  if (!url) return "";

  try {
    const parsedUrl = new URL(url);

    if (
      parsedUrl.hostname.includes(
        "youtu.be"
      )
    ) {
      const videoId =
        parsedUrl.pathname
          .replace("/", "")
          .split("?")[0];

      return videoId
        ? `https://www.youtube.com/embed/${videoId}`
        : "";
    }

    if (
      parsedUrl.hostname.includes(
        "youtube.com"
      )
    ) {
      const videoId =
        parsedUrl.searchParams.get("v");

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      if (
        parsedUrl.pathname.includes(
          "/embed/"
        )
      ) {
        return url;
      }

      if (
        parsedUrl.pathname.includes(
          "/shorts/"
        )
      ) {
        const shortsId =
          parsedUrl.pathname
            .split("/shorts/")[1]
            ?.split("/")[0];

        return shortsId
          ? `https://www.youtube.com/embed/${shortsId}`
          : "";
      }
    }

    return "";
  } catch {
    return "";
  }
};

const createPageNumbers = (
  currentPage,
  totalPages
) => {
  if (totalPages <= 5) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1
    );
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, totalPages];
  }

  if (
    currentPage >=
    totalPages - 2
  ) {
    return [
      1,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    totalPages,
  ];
};

export default function AnsweredQueries() {
  const [queries, setQueries] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [
    perspectiveFilter,
    setPerspectiveFilter,
  ] = useState("All");

  const [
    selectedChart,
    setSelectedChart,
  ] = useState("");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  useEffect(() => {
    const previousTitle =
      document.title;

    document.title =
      "Answered Stock Queries | VTKS Hub";

    return () => {
      document.title =
        previousTitle;
    };
  }, []);

  const loadQueries = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await getPublishedStockQueries();

      setQueries(data || []);
    } catch (loadError) {
      console.error(
        "Load published stock queries error:",
        loadError
      );

      setError(
        loadError?.message ||
          "Unable to load answered queries."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueries();
  }, []);

  const filteredQueries = useMemo(() => {
    const normalizedSearch =
      searchTerm
        .trim()
        .toLowerCase();

    return queries.filter((query) => {
      const searchableText = [
        query.stock_name,
        query.question,
        query.response_text,
        query.timeframe,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(
          normalizedSearch
        );

      const matchesPerspective =
        perspectiveFilter === "All" ||
        query.timeframe ===
          perspectiveFilter;

      return (
        matchesSearch &&
        matchesPerspective
      );
    });
  }, [
    queries,
    searchTerm,
    perspectiveFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    perspectiveFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredQueries.length /
        ITEMS_PER_PAGE
    )
  );

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const paginatedQueries =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      const endIndex =
        startIndex +
        ITEMS_PER_PAGE;

      return filteredQueries.slice(
        startIndex,
        endIndex
      );
    }, [
      filteredQueries,
      currentPage,
    ]);

  const pageNumbers =
    useMemo(
      () =>
        createPageNumbers(
          currentPage,
          totalPages
        ),
      [
        currentPage,
        totalPages,
      ]
    );

  const startResult =
    filteredQueries.length === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const endResult = Math.min(
    currentPage *
      ITEMS_PER_PAGE,
    filteredQueries.length
  );

  const handlePageChange = (
    page
  ) => {
    if (
      page < 1 ||
      page > totalPages ||
      page === currentPage
    ) {
      return;
    }

    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleChartClose = () => {
    setSelectedChart("");
  };

  useEffect(() => {
    const handleEscape = (
      event
    ) => {
      if (
        event.key === "Escape"
      ) {
        setSelectedChart("");
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  return (
    <main className="answered-queries-page">
      <section className="answered-queries-hero">
        <div className="answered-queries-hero-content">
          <span className="answered-queries-badge">
            VTKS Analysis Library
          </span>

          <h1>
            Answered Stock Queries
          </h1>

          <p>
            Explore selected public
            queries answered through
            charts, videos and
            educational explanations.
          </p>
        </div>
      </section>

      <section className="answered-queries-content">
        <div className="answered-queries-toolbar">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            placeholder="Search stock or query..."
            aria-label="Search answered queries"
          />

          <select
            value={perspectiveFilter}
            onChange={(event) =>
              setPerspectiveFilter(
                event.target.value
              )
            }
            aria-label="Filter by perspective"
          >
            <option value="All">
              All perspectives
            </option>

            <option value="Intraday">
              Intraday
            </option>

            <option value="Swing">
              Swing
            </option>

            <option value="Positional">
              Positional
            </option>

            <option value="Long-Term">
              Long-Term
            </option>
          </select>
        </div>

        {!loading &&
          !error &&
          filteredQueries.length >
            0 && (
            <div className="answered-queries-results-row">
              <p>
                Showing{" "}
                <strong>
                  {startResult}–
                  {endResult}
                </strong>{" "}
                of{" "}
                <strong>
                  {
                    filteredQueries.length
                  }
                </strong>{" "}
                answered queries
              </p>

              <button
                type="button"
                className="answered-queries-refresh"
                onClick={loadQueries}
              >
                ↻ Refresh
              </button>
            </div>
          )}

        {error && (
          <div
            className="answered-queries-alert"
            role="alert"
          >
            {error}

            <button
              type="button"
              onClick={loadQueries}
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="answered-queries-state">
            Loading answered
            queries...
          </div>
        ) : filteredQueries.length ===
          0 ? (
          <div className="answered-queries-state">
            <h2>
              No answered queries
              found
            </h2>

            <p>
              Published VTKS responses
              will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="answered-queries-grid">
              {paginatedQueries.map(
                (query) => {
                  const youtubeEmbedUrl =
                    getYouTubeEmbedUrl(
                      query.response_video_url
                    );

                  return (
                    <article
                      key={query.id}
                      className="answered-query-card"
                    >
                      <header className="answered-query-card-header">
                        <div>
                          <span className="answered-query-stock">
                            {
                              query.stock_name
                            }
                          </span>

                          <h2>
                            {
                              query.question
                            }
                          </h2>
                        </div>

                        <span className="answered-query-perspective">
                          {query.timeframe ||
                            "Swing"}
                        </span>
                      </header>

                      <div className="answered-query-meta">
                        Answered on{" "}
                        {formatDate(
                          query.updated_at
                        )}
                      </div>

                      {query.response_text && (
                        <div className="answered-query-response-text">
                          <span>
                            VTKS Response
                          </span>

                          <p>
                            {
                              query.response_text
                            }
                          </p>
                        </div>
                      )}

                      {query.response_chart_url && (
                        <button
                          type="button"
                          className="answered-query-chart-button"
                          onClick={() =>
                            setSelectedChart(
                              query.response_chart_url
                            )
                          }
                        >
                          <img
                            src={
                              query.response_chart_url
                            }
                            alt={`${query.stock_name} chart analysis`}
                            loading="lazy"
                          />

                          <span>
                            View Full Chart
                          </span>
                        </button>
                      )}

                      {query.response_video_url &&
                        youtubeEmbedUrl && (
                          <div className="answered-query-video">
                            <iframe
                              src={
                                youtubeEmbedUrl
                              }
                              title={`${query.stock_name} video response`}
                              loading="lazy"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        )}

                      {query.response_video_url &&
                        !youtubeEmbedUrl && (
                          <div className="answered-query-video">
                            <video
                              controls
                              preload="metadata"
                              src={
                                query.response_video_url
                              }
                            >
                              Your browser does
                              not support video
                              playback.
                            </video>
                          </div>
                        )}

                      <div className="answered-query-disclaimer">
                        This response is
                        shared for
                        educational purposes
                        only and should not
                        be considered
                        investment advice.
                      </div>
                    </article>
                  );
                }
              )}
            </div>

            {totalPages > 1 && (
              <nav
                className="answered-pagination"
                aria-label="Answered queries pagination"
              >
                <button
                  type="button"
                  className="answered-pagination-navigation"
                  onClick={() =>
                    handlePageChange(
                      currentPage - 1
                    )
                  }
                  disabled={
                    currentPage === 1
                  }
                >
                  ← Previous
                </button>

                <div className="answered-pagination-pages">
                  {pageNumbers.map(
                    (
                      page,
                      index
                    ) => {
                      const previousPage =
                        pageNumbers[
                          index - 1
                        ];

                      const showEllipsis =
                        index > 0 &&
                        page -
                          previousPage >
                          1;

                      return (
                        <div
                          key={page}
                          className="answered-pagination-page-group"
                        >
                          {showEllipsis && (
                            <span className="answered-pagination-ellipsis">
                              …
                            </span>
                          )}

                          <button
                            type="button"
                            className={
                              page ===
                              currentPage
                                ? "answered-pagination-page active"
                                : "answered-pagination-page"
                            }
                            onClick={() =>
                              handlePageChange(
                                page
                              )
                            }
                            aria-current={
                              page ===
                              currentPage
                                ? "page"
                                : undefined
                            }
                          >
                            {page}
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>

                <button
                  type="button"
                  className="answered-pagination-navigation"
                  onClick={() =>
                    handlePageChange(
                      currentPage + 1
                    )
                  }
                  disabled={
                    currentPage ===
                    totalPages
                  }
                >
                  Next →
                </button>
              </nav>
            )}
          </>
        )}
      </section>

      {selectedChart && (
        <div
          className="answered-chart-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleChartClose();
            }
          }}
        >
          <div
            className="answered-chart-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Full chart analysis"
          >
            <button
              type="button"
              className="answered-chart-close"
              onClick={
                handleChartClose
              }
              aria-label="Close chart"
            >
              ×
            </button>

            <img
              src={selectedChart}
              alt="VTKS full chart analysis"
            />
          </div>
        </div>
      )}
    </main>
  );
}