import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import SEO from "../../components/common/SEO";
import EducationDisclosure from "../../components/home/EducationDisclosure";

import {
  getHoldings,
  mapHoldingFromDB,
} from "../../services/holdingService";

import "./Home.css";

const MAX_HOME_TRADES = 3;

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export default function Home() {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHoldings();
  }, []);

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
    } finally {
      setLoading(false);
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

    if (fixedStatuses.includes(manualStatus)) {
      return manualStatus;
    }

    const cmp = Number(holding.cmp || 0);
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

    if (stopLoss && cmp <= stopLoss) {
      return "SL Hit";
    }

    if (target3 && cmp >= target3) {
      return "Target 3 Hit";
    }

    if (target2 && cmp >= target2) {
      return "Target 2 Hit";
    }

    if (target1 && cmp >= target1) {
      return "Target 1 Hit";
    }

    return manualStatus || "Active";
  };

  const getReturn = (holding) => {
    const entry = Number(
      holding.entry || 0
    );

    const cmp = Number(
      holding.cmp || 0
    );

    if (!entry) {
      return 0;
    }

    return (
      ((cmp - entry) / entry) *
      100
    );
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

        const status = getStatus(holding);

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

        if (secondDate !== firstDate) {
          return secondDate - firstDate;
        }

        return (
          Number(second.id || 0) -
          Number(first.id || 0)
        );
      })
      .slice(0, MAX_HOME_TRADES);
  }, [holdings]);

  const formatPrice = (value) => {
    const number = Number(value || 0);

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
    <>
      <SEO
        title="VTKS Hub | Structured Trading & Investment Education"
        description="VTKS Hub is a stock market education platform for structured trading, swing trading, technical analysis, market scanners, portfolio tracking and disciplined investing."
        keywords="VTKS, stock market education, swing trading India, technical analysis, trading indicators, market scanners, portfolio tracking, investment education"
      />

      <main className="home-page">
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
            VTKS HUB combines structured trading education,
            portfolio tracking, rule-based indicators, market
            scanners and performance analytics in one
            professional platform.
          </p>

          <div className="hero-actions">
            <Link to="/funds">
              Explore VTKS Fund
            </Link>

            <Link
              to="/indicators"
              className="outline-btn"
            >
              View Indicators
            </Link>
          </div>
        </section>

        <section className="why-section">
          <div className="section-title">
            <span>Why VTKS HUB?</span>

            <h2>
              Everything a Trader Needs.
            </h2>

            <p>
              One platform to understand structured setups,
              analyse performance, manage risk, scan
              opportunities and develop long-term conviction.
            </p>
          </div>

          <div className="why-grid">
            <article className="why-card">
              <div className="why-icon">
                📊
              </div>

              <h3>Portfolio Management</h3>

              <p>
                Track trades with entry, CMP, targets, stop
                loss, ROI, status and performance.
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
                Learn rule-based indicators for swing,
                positional and investment frameworks.
              </p>
            </article>

            <article className="why-card">
              <div className="why-icon">
                ⚡
              </div>

              <h3>Market Scanners</h3>

              <p>
                Identify structured market opportunities
                using predefined VTKS conditions.
              </p>
            </article>

            <article className="why-card">
              <div className="why-icon">
                📚
              </div>

              <h3>Knowledge Library</h3>

              <p>
                Learn through structured videos, PDFs,
                recorded sessions and case studies.
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
                Measure returns, win rate, best trades and
                overall framework performance.
              </p>
            </article>

            <article className="why-card">
              <div className="why-icon">
                👥
              </div>

              <h3>Private Community</h3>

              <p>
                Discuss markets, improve analysis and grow
                with discipline and accountability.
              </p>
            </article>
          </div>
        </section>

        <EducationDisclosure />

        <section className="latest-section">
          <div className="section-title">
            <span>📊 VTKS Fund Portfolio</span>

            <h2>
              Latest Portfolio Trades
            </h2>

            <p>
              Discover recently published and publicly
              revealed VTKS trades backed by structured
              analysis and disciplined portfolio management.
            </p>
          </div>

          {loading ? (
            <p className="home-trade-message">
              Loading latest trades...
            </p>
          ) : latestTrades.length > 0 ? (
            <div className="trade-grid">
              {latestTrades.map((holding) => {
                const roi = getReturn(holding);
                const status = getStatus(holding);

                return (
                  <Link
                    key={holding.id}
                    to={`/trade/${holding.id}`}
                    className="trade-card"
                  >
                    <div>
                      <h3>
                        {holding.stock ||
                          "VTKS Trade"}
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
                    >
                      {roi >= 0 ? "+" : ""}
                      {roi.toFixed(2)}%
                    </div>

                    <div className="trade-meta">
                      <span>
                        Entry{" "}
                        {formatPrice(
                          holding.entry
                        )}
                      </span>

                      <span>
                        CMP{" "}
                        {formatPrice(
                          holding.cmp
                        )}
                      </span>

                      <span>{status}</span>
                    </div>

                    <div className="trade-card-link">
                      View Trade →
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="home-trade-message">
              No public trades are currently available.
            </p>
          )}

          <div className="center-btn">
            <Link to="/funds">
              Explore Complete Fund →
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}