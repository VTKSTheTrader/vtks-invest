import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useOutletContext,
} from "react-router-dom";

import EducationDisclosure from "../../components/home/EducationDisclosure";

import {
  getHoldings,
  mapHoldingFromDB,
} from "../../services/holdingService";

import {
  getApprovedTestimonials,
} from "../../services/testimonialService";

import "./Home.css";

const MAX_HOME_TRADES = 3;

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export default function Home() {
  const { settings } = useOutletContext();

  const showTestimonials = Boolean(
    settings?.website?.showTestimonial
  );

  const showAskVTKS = Boolean(
    settings?.website?.showAskVTKS
  );

  const showAnsweredQueries = Boolean(
    settings?.website?.showAnsweredQueries
  );

  const [holdings, setHoldings] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [testimonials, setTestimonials] =
    useState([]);

  const [
    testimonialsLoading,
    setTestimonialsLoading,
  ] = useState(false);

  useEffect(() => {
    loadHoldings();
  }, []);

  useEffect(() => {
    if (showTestimonials) {
      loadTestimonials();
    } else {
      setTestimonials([]);
      setTestimonialsLoading(false);
    }
  }, [showTestimonials]);

  const loadHoldings = async () => {
    try {
      setLoading(true);

      const rows = await getHoldings();

      setHoldings(
        (rows || []).map(mapHoldingFromDB)
      );
    } catch (error) {
      console.error(
        "Failed to load holdings:",
        error
      );

      setHoldings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTestimonials = async () => {
    try {
      setTestimonialsLoading(true);

      const rows =
        await getApprovedTestimonials();

      setTestimonials(
        (rows || []).slice(0, 3)
      );
    } catch (error) {
      console.error(
        "Failed to load testimonials:",
        error
      );

      setTestimonials([]);
    } finally {
      setTestimonialsLoading(false);
    }
  };

  const getStatus = (holding) => {
    const manualStatus = String(
      holding.tradeStatus || ""
    ).trim();

    const fixedStatuses = [
      "Booked Profit",
      "Cancelled",
      "SL Hit",
      "Target 1 Hit",
      "Target 2 Hit",
      "Target 3 Hit",
    ];

    if (
      fixedStatuses.includes(manualStatus)
    ) {
      return manualStatus;
    }

    const cmp = Number(
      holding.cmp || 0
    );

    const stopLoss = Number(
      holding.stopLoss || 0
    );

    const target1 = Number(
      holding.target1 || 0
    );

    const target2 = Number(
      holding.target2 || 0
    );

    const target3 = Number(
      holding.target3 || 0
    );

    if (
      stopLoss &&
      cmp <= stopLoss
    ) {
      return "SL Hit";
    }

    if (
      target3 &&
      cmp >= target3
    ) {
      return "Target 3 Hit";
    }

    if (
      target2 &&
      cmp >= target2
    ) {
      return "Target 2 Hit";
    }

    if (
      target1 &&
      cmp >= target1
    ) {
      return "Target 1 Hit";
    }

    return manualStatus || "Active";
  };

  const isCompletedIdea = (holding) =>
    [
      "Booked Profit",
      "SL Hit",
    ].includes(getStatus(holding));

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

    const status = getStatus(holding);

    if (status === "Target 1 Hit") {
      return Number(
        holding.target1 ||
          holding.cmp ||
          holding.entry ||
          0
      );
    }

    if (status === "Target 2 Hit") {
      return Number(
        holding.target2 ||
          holding.cmp ||
          holding.entry ||
          0
      );
    }

    if (status === "Target 3 Hit") {
      return Number(
        holding.target3 ||
          holding.cmp ||
          holding.entry ||
          0
      );
    }

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

  const getReturn = (holding) => {
    const entry = Number(
      holding.entry || 0
    );

    if (!entry) {
      return 0;
    }

    if (isCompletedIdea(holding)) {
      const savedRealisedReturn =
        holding.realisedReturn ??
        holding.realised_return;

      if (
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

      const exitPrice = getExitPrice(holding);

      return (
        ((exitPrice - entry) / entry) *
        100
      );
    }

    const cmp = Number(
      holding.cmp || entry
    );

    return (
      ((cmp - entry) / entry) *
      100
    );
  };

  const getStatusStyle = (status) => {
    if (status === "Booked Profit") {
      return {
        background: "#dcfce7",
        color: "#166534",
        border: "1px solid #22c55e",
      };
    }

    if (status === "SL Hit") {
      return {
        background: "#fee2e2",
        color: "#b91c1c",
        border: "1px solid #fecaca",
      };
    }

    if (status.includes("Target")) {
      return {
        background: "#ede9fe",
        color: "#6d28d9",
        border: "1px solid #c4b5fd",
      };
    }

    return {
      background: "#f1f5f9",
      color: "#334155",
      border: "1px solid #e2e8f0",
    };
  };

  const getStatusLabel = (status) => {
    if (status === "Booked Profit") {
      return "💰 Booked Profit";
    }

    if (status === "SL Hit") {
      return "🛑 SL Hit";
    }

    if (status === "Target 1 Hit") {
      return "🎯 Target 1 Hit";
    }

    if (status === "Target 2 Hit") {
      return "🚀 Target 2 Hit";
    }

    if (status === "Target 3 Hit") {
      return "🏆 Target 3 Hit";
    }

    return "Active";
  };

  const latestTrades = useMemo(() => {
    return holdings
      .filter((holding) => {
        const visibility = normalize(
          holding.visibility
        );

        const publishStatus = normalize(
          holding.publishStatus
        );

        const isPublicTrade =
          visibility === "public";

        const isRevealedSubscriberTrade =
          (visibility === "subscriber" ||
            visibility === "community") &&
          holding.accuracyBlur === false;

        const status =
          getStatus(holding);

        return (
          (isPublicTrade ||
            isRevealedSubscriberTrade) &&
          publishStatus !== "draft" &&
          holding.accuracyShow !== false &&
          status !== "Cancelled"
        );
      })
      .sort((first, second) => {
        const firstDate = new Date(
          first.recommendationDate ||
            first.createdAt ||
            0
        ).getTime();

        const secondDate = new Date(
          second.recommendationDate ||
            second.createdAt ||
            0
        ).getTime();

        if (
          secondDate !== firstDate
        ) {
          return (
            secondDate -
            firstDate
          );
        }

        return (
          Number(second.id || 0) -
          Number(first.id || 0)
        );
      })
      .slice(
        0,
        MAX_HOME_TRADES
      );
  }, [holdings]);

  const formatPrice = (value) => {
    const number = Number(
      value || 0
    );

    if (!number) {
      return "₹—";
    }

    return `₹${number.toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      }
    )}`;
  };

  return (
    <main className="home-page">
      {/* HERO */}
      <section className="hero-section">
        <span className="hero-badge">
          🚀 Professional Trading & Investment Platform
        </span>

        <h1>
          Trade with Structure.
          <br />
          Invest with Conviction.
        </h1>

        <p>
          VTKS INVEST combines structured
          trading education, portfolio
          tracking, rule-based indicators,
          market scanners and performance
          analytics in one professional
          platform.
        </p>

        <div className="hero-actions">
          <Link to="/funds">
            Explore VTKS Analysis
          </Link>

          <Link
            to="/indicators"
            className="outline-btn"
          >
            View Indicators
          </Link>
        </div>
      </section>

      {/* WHY VTKS */}
      <section className="why-section">
        <div className="section-title">
          <span>
            Why VTKS INVEST?
          </span>

          <h2>
            Everything a Trader Needs.
          </h2>

          <p>
            One platform to understand
            structured setups, analyse
            performance, manage risk, scan
            opportunities and develop
            long-term conviction.
          </p>
        </div>

        <div className="why-grid">
          <article className="why-card">
            <div className="why-icon">
              📊
            </div>

            <h3>
              Portfolio Management
            </h3>

            <p>
              Track trades with entry, CMP,
              targets, stop loss, ROI, status
              and performance.
            </p>
          </article>

          <article className="why-card">
            <div className="why-icon">
              📈
            </div>

            <h3>
              Professional Indicators
            </h3>

            <p>
              Learn rule-based indicators
              for swing, positional and
              investment frameworks.
            </p>
          </article>

          <article className="why-card">
            <div className="why-icon">
              ⚡
            </div>

            <h3>
              Market Scanners
            </h3>

            <p>
              Identify structured market
              opportunities using predefined
              VTKS conditions.
            </p>
          </article>

          <article className="why-card">
            <div className="why-icon">
              📚
            </div>

            <h3>
              Knowledge Library
            </h3>

            <p>
              Learn through structured
              videos, PDFs, recorded
              sessions and case studies.
            </p>
          </article>

          <article className="why-card">
            <div className="why-icon">
              🎯
            </div>

            <h3>
              Performance Analytics
            </h3>

            <p>
              Measure returns, win rate,
              best trades and overall
              framework performance.
            </p>
          </article>

          <article className="why-card">
            <div className="why-icon">
              👥
            </div>

            <h3>
              Private Community
            </h3>

            <p>
              Discuss markets, improve
              analysis and grow with
              discipline and accountability.
            </p>
          </article>
        </div>
      </section>

      <EducationDisclosure />

      
      {/* LATEST INSIGHTS */}
      <section className="latest-section">
        <div className="section-title">
          <span>
            📊 VTKS Knowledge Portfolio
          </span>

          <h2>
            Latest Insights
          </h2>

          <p>
            Discover recently published
            and publicly revealed VTKS
            Ideas backed by structured
            analysis and disciplined
            portfolio management.
          </p>
        </div>

        {loading ? (
          <p className="home-trade-message">
            Loading latest ideas...
          </p>
        ) : latestTrades.length > 0 ? (
          <div className="trade-grid">
            {latestTrades.map(
              (holding) => {
                const roi =
                  getReturn(holding);

                const status =
                  getStatus(holding);

                const completedIdea =
                  isCompletedIdea(holding);

                const displayPrice =
                  completedIdea
                    ? getExitPrice(holding)
                    : holding.cmp;

                return (
                  <Link
                    key={holding.id}
                    to={`/trade/${holding.id}`}
                    className="trade-card"
                  >
                    <div>
                      <h3>
                        {holding.stock ||
                          "VTKS Idea"}
                      </h3>

                      <p>
                        {holding.sector ||
                          "General"}
                      </p>
                    </div>

                    <div
                      className={
                        roi >= 0
                          ? "trade-return positive-return"
                          : "trade-return negative-return"
                      }
                      style={
                        completedIdea &&
                        roi >= 0
                          ? {
                              display: "inline-flex",
                              flexDirection: "column",
                              alignItems: "flex-start",
                              gap: "2px",
                              background:
                                "linear-gradient(135deg, #16a34a, #22c55e)",
                              color: "#ffffff",
                            }
                          : undefined
                      }
                    >
                      <small
                        style={{
                          color:
                            completedIdea
                              ? "rgba(255,255,255,0.85)"
                              : "#166534",
                          fontSize: "9px",
                          fontWeight: 800,
                          lineHeight: 1,
                          letterSpacing: "0.35px",
                          textTransform: "uppercase",
                        }}
                      >
                        {completedIdea
                          ? roi >= 0
                            ? "Realised Return"
                            : "Realised Loss"
                          : "Live Return"}
                      </small>

                      <span>
                        {roi >= 0 ? "+" : ""}
                        {roi.toFixed(2)}%
                      </span>
                    </div>

                    <div className="trade-meta">
                      <span>
                        Entry{" "}
                        {formatPrice(
                          holding.entry
                        )}
                      </span>

                      <span
                        style={
                          completedIdea
                            ? {
                                background: "#dcfce7",
                                color: "#166534",
                                border:
                                  "1px solid #86efac",
                              }
                            : undefined
                        }
                      >
                        {completedIdea
                          ? "Exit"
                          : "CMP"}{" "}
                        {formatPrice(
                          displayPrice
                        )}
                      </span>

                      <span
                        style={{
                          ...getStatusStyle(
                            status
                          ),
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minHeight: "34px",
                          padding: "7px 12px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                          boxSizing: "border-box",
                        }}
                      >
                        {getStatusLabel(
                          status
                        )}
                      </span>
                    </div>

                    <div className="trade-card-link">
                      View Analysis →
                    </div>
                  </Link>
                );
              }
            )}
          </div>
        ) : (
          <p className="home-trade-message">
            No public ideas are currently
            available.
          </p>
        )}

        <div className="center-btn">
          <Link to="/funds">
            Explore Complete Analysis →
          </Link>
        </div>
      </section>
{/* TESTIMONIALS */}
      {showTestimonials && (
        <section className="home-testimonials-section">
          <div className="section-title">
            <span>
              ⭐ Member Experiences
            </span>

            <h2>
              What Our Members Say
            </h2>

            <p>
              Genuine feedback from VTKS
              members learning structured
              trading, technical analysis
              and disciplined investing.
            </p>
          </div>

          {testimonialsLoading ? (
            <p className="home-testimonial-message">
              Loading testimonials...
            </p>
          ) : testimonials.length > 0 ? (
            <div className="home-testimonials-grid">
              {testimonials.map(
                (testimonial) => (
                  <article
                    key={testimonial.id}
                    className="home-testimonial-card"
                  >
                    <div className="home-testimonial-rating">
                      {"★".repeat(
                        Number(
                          testimonial.rating ||
                            0
                        )
                      )}
                    </div>

                    <p>
                      “
                      {
                        testimonial.message
                      }
                      ”
                    </p>

                    <div className="home-testimonial-footer">
                      <strong>
                        {testimonial.show_name ===
                        false
                          ? "VTKS Member"
                          : testimonial.name ||
                            "VTKS Member"}
                      </strong>

                      {testimonial.verified_member && (
                        <span>
                          Verified Member
                        </span>
                      )}
                    </div>
                  </article>
                )
              )}
            </div>
          ) : (
            <p className="home-testimonial-message">
              No approved testimonials are
              available yet.
            </p>
          )}

          <div className="center-btn">
            <Link to="/testimonials">
              View All Testimonials →
            </Link>
          </div>
        </section>
      )}

      {/* ASK VTKS */}
      {showAskVTKS && (
        <section className="ask-vtks-home">
          <div className="ask-vtks-content">
            <span className="ask-vtks-badge">
              💬 Stock Queries
            </span>

            <h2>
              Have a Question About Any
              Stock?
            </h2>

            <p>
              Submit your stock query and
              receive a structured
              educational explanation from
              the VTKS team through charts,
              videos or written analysis.
              Browse previously answered
              queries to learn from real
              market examples.
            </p>

            <div className="ask-vtks-buttons">
              <Link
                to="/ask-vtks"
                className="ask-primary-btn"
              >
                Ask Your Stock →
              </Link>

              {showAnsweredQueries && (
                <Link
                  to="/answered-queries"
                  className="ask-secondary-btn"
                >
                  View Answered Queries
                </Link>
              )}
            </div>
          </div>

          <div className="ask-vtks-stats">
            <div className="ask-stat-card">
              <h3>📈</h3>

              <strong>
                Chart Analysis
              </strong>

              <p>
                Educational chart-based
                responses.
              </p>
            </div>

            <div className="ask-stat-card">
              <h3>🎥</h3>

              <strong>
                Video Explanation
              </strong>

              <p>
                Upload or YouTube supported.
              </p>
            </div>

            <div className="ask-stat-card">
              <h3>📝</h3>

              <strong>
                Written View
              </strong>

              <p>
                Simple and structured
                explanation.
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}