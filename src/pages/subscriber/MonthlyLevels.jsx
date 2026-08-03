import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getSubscriberMonthlyLevels,
} from "../../services/monthlyLevelsService";
import "../public/MonthlyLevels.css";
import "./MonthlyLevels.css";
import { useNavigate } from "react-router-dom";
const formatNumber = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return "-";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "-";
  }

  return number.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
};

const capitalize = (value) => {
  const text = String(value || "").trim();

  if (!text) return "-";

  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  );
};

const ITEMS_PER_PAGE = 6;

export default function SubscriberMonthlyLevels() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [selectedLevel, setSelectedLevel] =
    useState(null);

  const [currentPage, setCurrentPage] =
    useState(1);
  const navigate = useNavigate();  

  useEffect(() => {
    document.title =
      "Subscriber Market Outlook | VTKS Hub";
  }, []);

  useEffect(() => {
    loadLevels();
  }, []);

  const loadLevels = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const rows =
        await getSubscriberMonthlyLevels();

      setLevels(rows || []);
    } catch (error) {
      console.error(
        "Subscriber monthly levels load error:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to load subscriber market levels."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredLevels = useMemo(() => {
    if (categoryFilter === "all") {
      return levels;
    }

    return levels.filter(
      (level) =>
        level.category === categoryFilter
    );
  }, [levels, categoryFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredLevels.length / ITEMS_PER_PAGE
    )
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedLevels = useMemo(() => {
    const startIndex =
      (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredLevels.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredLevels, currentPage]);

  const firstVisibleRecord =
    filteredLevels.length === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const lastVisibleRecord = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredLevels.length
  );

  return (
    <main className="public-monthly-levels-page">
      {/* =====================================================
          HERO
      ===================================================== */}

     <section className="public-monthly-levels-hero">
  <div className="subscriber-outlook-hero-inner">
    <span className="public-monthly-levels-badge">
      🔐 VTKS Subscriber Market Outlook
    </span>

    <h1>Subscriber Market Outlook</h1>

    <p>
      Access public and subscriber-only technical key
      levels for indices and commodities, supported by
      charts, market bias, technical outlook and
      educational observations.
    </p>

    <div className="subscriber-outlook-back-row">
      <button
        type="button"
        className="subscriber-outlook-back-btn"
        onClick={() => navigate("/dashboard")}
      >
        <span aria-hidden="true">←</span>
        Back to Dashboard
      </button>
    </div>
  </div>
</section>

      {/* =====================================================
          LEVEL CARDS
      ===================================================== */}

      <section className="public-monthly-levels-section">
        <div className="public-monthly-levels-toolbar">
          <div>
            <h2>Subscriber Market Levels</h2>

            <p>
              Select an instrument to review its
              market structure, charts, key levels and
              subscriber outlook.
            </p>
          </div>

          <div className="public-monthly-levels-filters">
            <button
              type="button"
              className={
                categoryFilter === "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setCategoryFilter("all")
              }
            >
              All
            </button>

            <button
              type="button"
              className={
                categoryFilter === "index"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setCategoryFilter("index")
              }
            >
              Indices
            </button>

            <button
              type="button"
              className={
                categoryFilter === "commodity"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setCategoryFilter("commodity")
              }
            >
              Commodities
            </button>
          </div>
        </div>

        {loading ? (
          <div className="public-monthly-levels-state">
            Loading monthly market levels...
          </div>
        ) : errorMessage ? (
          <div className="public-monthly-levels-state error">
            <h3>Unable to load levels</h3>

            <p>{errorMessage}</p>

            <button
              type="button"
              onClick={loadLevels}
            >
              Try Again
            </button>
          </div>
        ) : filteredLevels.length === 0 ? (
          <div className="public-monthly-levels-state">
            <h3>
              No subscriber market levels available
            </h3>

            <p>
              Published public and subscriber-only
              levels will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="public-monthly-levels-grid">
              {paginatedLevels.map((level) => (
                <article
                  key={level.id}
                  className="public-monthly-level-card"
                >
                <div className="public-monthly-level-card-top">
                  <span className="public-monthly-level-category">
                    {capitalize(level.category)}
                  </span>

                  <span
                    className={`public-monthly-level-bias public-monthly-level-bias-${
                      level.bias || "neutral"
                    }`}
                  >
                    {capitalize(level.bias)}
                  </span>
                </div>

                <h3>{level.instrument}</h3>

                <p className="public-monthly-level-month">
                  {level.month}
                </p>

                <div className="public-monthly-level-summary">
                  <div>
                    <span>Pivot</span>

                    <strong>
                      {formatNumber(level.pivot)}
                    </strong>
                  </div>

                  <div>
                    <span>Resistance 1</span>

                    <strong>
                      {formatNumber(
                        level.resistance1
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Support 1</span>

                    <strong>
                      {formatNumber(
                        level.support1
                      )}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="public-monthly-level-view-button"
                  onClick={() =>
                    setSelectedLevel(level)
                  }
                >
                  View Market Levels →
                </button>
                </article>
              ))}
            </div>

            <div className="public-monthly-pagination-wrapper">
              <div className="public-monthly-pagination-summary">
                Showing {firstVisibleRecord}–
                {lastVisibleRecord} of{" "}
                {filteredLevels.length} records
              </div>

              {totalPages > 1 && (
                <div className="public-monthly-pagination">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((previous) =>
                        Math.max(1, previous - 1)
                      )
                    }
                  >
                    ← Previous
                  </button>

                  <div className="public-monthly-page-numbers">
                    {Array.from(
                      { length: totalPages },
                      (_, index) => index + 1
                    ).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        className={
                          currentPage === pageNumber
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          setCurrentPage(pageNumber)
                        }
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={
                      currentPage === totalPages
                    }
                    onClick={() =>
                      setCurrentPage((previous) =>
                        Math.min(
                          totalPages,
                          previous + 1
                        )
                      )
                    }
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {selectedLevel && (
        <MonthlyLevelDetails
          level={selectedLevel}
          onClose={() =>
            setSelectedLevel(null)
          }
        />
      )}
    </main>
  );
}

/* =========================================================
   MONTHLY LEVEL DETAILS
========================================================= */

function MonthlyLevelDetails({
  level,
  onClose,
}) {
  const hasBeforeChart = Boolean(
    level.beforeChartUrl
  );

  const hasAfterChart = Boolean(
    level.afterChartUrl
  );

  const [activeChart, setActiveChart] =
    useState(
      hasBeforeChart ? "before" : "after"
    );

  const [previewImage, setPreviewImage] =
    useState("");

  useEffect(() => {
    if (
      activeChart === "before" &&
      !hasBeforeChart &&
      hasAfterChart
    ) {
      setActiveChart("after");
    }

    if (
      activeChart === "after" &&
      !hasAfterChart &&
      hasBeforeChart
    ) {
      setActiveChart("before");
    }
  }, [
    activeChart,
    hasBeforeChart,
    hasAfterChart,
  ]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;

      if (previewImage) {
        setPreviewImage("");
        return;
      }

      onClose();
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
  }, [onClose, previewImage]);

  const selectedChartUrl =
    activeChart === "after"
      ? level.afterChartUrl
      : level.beforeChartUrl;

  const selectedChartTitle =
    activeChart === "after"
      ? "Market Outcome"
      : "Initial Study";

  return (
    <>
      <div
        className="public-monthly-detail-overlay"
        onMouseDown={(event) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            onClose();
          }
        }}
      >
        <section
          className="public-monthly-detail-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="monthly-detail-title"
        >
          <header className="public-monthly-detail-header">
            <div>
              <span>
                {capitalize(level.category)} •{" "}
                {level.month}
              </span>

              <h2 id="monthly-detail-title">
                {level.instrument}
              </h2>

              <p>
                {level.trend ||
                  "Technical market structure"}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
            >
              ✕
            </button>
          </header>

          <div className="public-monthly-detail-content">
            {/* LEVELS */}

            <div className="public-monthly-detail-levels">
              <LevelRow
                label="Resistance 3"
                value={level.resistance3}
                type="resistance"
              />

              <LevelRow
                label="Resistance 2"
                value={level.resistance2}
                type="resistance"
              />

              <LevelRow
                label="Resistance 1"
                value={level.resistance1}
                type="resistance"
              />

              <LevelRow
                label="Pivot"
                value={level.pivot}
                type="pivot"
              />

              <LevelRow
                label="Support 1"
                value={level.support1}
                type="support"
              />

              <LevelRow
                label="Support 2"
                value={level.support2}
                type="support"
              />

              <LevelRow
                label="Support 3"
                value={level.support3}
                type="support"
              />
            </div>

            {/* MARKET SUMMARY */}

            <div className="public-monthly-detail-insight">
              <div>
                <span>Market Bias</span>

                <strong>
                  {capitalize(level.bias)}
                </strong>
              </div>

              <div>
                <span>Trend</span>

                <strong>
                  {level.trend || "-"}
                </strong>
              </div>

              <div>
                <span>Momentum</span>

                <strong>
                  {level.momentum || "-"}
                </strong>
              </div>
            </div>

            {/* CHART COMPARISON */}

            {(hasBeforeChart ||
              hasAfterChart) && (
              <section className="public-monthly-chart-section">
                <div className="public-monthly-chart-header">
                  <div>
                    <span className="public-monthly-chart-eyebrow">
                      Chart Analysis
                    </span>

                    <h3>
                      Initial Study & Market Outcome
                    </h3>

                    <p>
                      Compare the original market
                      framework with the subsequent
                      movement and outcome.
                    </p>
                  </div>

                  <div className="public-monthly-chart-tabs">
                    <button
                      type="button"
                      className={
                        activeChart === "before"
                          ? "active"
                          : ""
                      }
                      disabled={!hasBeforeChart}
                      onClick={() =>
                        setActiveChart("before")
                      }
                    >
                      Initial Study
                    </button>

                    <button
                      type="button"
                      className={
                        activeChart === "after"
                          ? "active"
                          : ""
                      }
                      disabled={!hasAfterChart}
                      onClick={() =>
                        setActiveChart("after")
                      }
                    >
                      Market Outcome
                    </button>
                  </div>
                </div>

                {selectedChartUrl ? (
                  <div className="public-monthly-chart-display">
                    <div className="public-monthly-chart-label">
                      <div>
                        <span>
                          {activeChart === "before"
                            ? "BEFORE"
                            : "AFTER"}
                        </span>

                        <strong>
                          {selectedChartTitle}
                        </strong>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage(
                            selectedChartUrl
                          )
                        }
                      >
                        View Full Screen ↗
                      </button>
                    </div>

                    <button
                      type="button"
                      className="public-monthly-chart-image-button"
                      onClick={() =>
                        setPreviewImage(
                          selectedChartUrl
                        )
                      }
                      aria-label={`Open ${selectedChartTitle} chart in full screen`}
                    >
                      <img
                        src={selectedChartUrl}
                        alt={`${level.instrument} ${selectedChartTitle}`}
                      />
                    </button>
                  </div>
                ) : (
                  <div className="public-monthly-chart-empty">
                    <span>🖼️</span>

                    <h4>
                      Chart not available yet
                    </h4>

                    <p>
                      The administrator can publish
                      this chart when the market
                      update is available.
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* TRADING PLAN */}

            <div className="public-monthly-detail-plan-grid">
              <article className="public-monthly-plan-card public-monthly-plan-above">
                <span className="public-monthly-plan-icon">
                  ↗
                </span>

                <div>
                  <h3>Above Pivot</h3>

                  <p>
                    {level.abovePivotPlan ||
                      "No plan added."}
                  </p>
                </div>
              </article>

              <article className="public-monthly-plan-card public-monthly-plan-below">
                <span className="public-monthly-plan-icon">
                  ↘
                </span>

                <div>
                  <h3>Below Pivot</h3>

                  <p>
                    {level.belowPivotPlan ||
                      "No plan added."}
                  </p>
                </div>
              </article>
            </div>

            {level.observation && (
              <article className="public-monthly-detail-observation">
                <h3>Key Observation</h3>

                <p>{level.observation}</p>
              </article>
            )}

            <p className="public-monthly-detail-disclaimer">
              VTKS market levels and technical observations
              are provided for educational and analytical
              purposes only. They do not constitute investment
              advice or a recommendation to buy or sell any
              security.
            </p>
          </div>
        </section>
      </div>

      {/* FULL-SCREEN CHART */}

      {previewImage && (
        <div
          className="public-monthly-image-lightbox"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setPreviewImage("");
            }
          }}
        >
          <div className="public-monthly-image-lightbox-content">
            <button
              type="button"
              className="public-monthly-image-lightbox-close"
              onClick={() =>
                setPreviewImage("")
              }
              aria-label="Close chart preview"
            >
              ✕
            </button>

            <img
              src={previewImage}
              alt={`${level.instrument} expanded market chart`}
            />
          </div>
        </div>
      )}
    </>
  );
}

/* =========================================================
   LEVEL CARD
========================================================= */

function LevelRow({
  label,
  value,
  type,
}) {
  return (
    <div
      className={`public-monthly-detail-level public-monthly-detail-level-${type}`}
    >
      <span>{label}</span>

      <strong>
        {formatNumber(value)}
      </strong>
    </div>
  );
}