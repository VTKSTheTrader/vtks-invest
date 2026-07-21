import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  getHoldings,
  mapHoldingFromDB,
} from "../../services/holdingService";

import "./FundPreview.css";

const MAX_HOME_TRADES = 3;

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export default function FundPreview() {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const rows = await getHoldings();

      setHoldings(
        (rows || []).map(mapHoldingFromDB)
      );
    } catch (error) {
      console.error(
        "Home fund preview error:",
        error
      );

      setLoadError(
        error?.message ||
          "Failed to load portfolio trades."
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
    const entry = Number(holding.entry || 0);
    const cmp = Number(holding.cmp || 0);

    if (!entry) return 0;

    return ((cmp - entry) / entry) * 100;
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

        /*
          Home page rule:

          Public trades are shown.

          Revealed subscriber/community trades
          are shown only when accuracyBlur is false.

          Protected subscriber trades are not shown
          on the home preview.

          Private, Draft, Cancelled and
          accuracyShow false are hidden.
        */
        const isPublic =
          visibility === "public";

        const isRevealedSubscriber =
          (visibility === "subscriber" ||
            visibility === "community") &&
          holding.accuracyBlur === false;

        return (
          (isPublic || isRevealedSubscriber) &&
          visibility !== "private" &&
          publishStatus !== "draft" &&
          holding.accuracyShow !== false &&
          getStatus(holding) !== "Cancelled"
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

        return Number(second.id || 0) -
          Number(first.id || 0);
      })
      .slice(0, MAX_HOME_TRADES);
  }, [holdings]);

  const formatPrice = (value) =>
    `₹${Number(value || 0).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      }
    )}`;

  if (loading) {
    return (
      <section className="fund-preview-section">
        <p className="fund-preview-message">
          Loading latest portfolio trades...
        </p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="fund-preview-section">
        <div className="fund-preview-empty">
          <h3>
            Unable to load portfolio trades
          </h3>

          <p>{loadError}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="fund-preview-section">
      <div className="fund-preview-heading">
        <span className="fund-preview-badge">
          📊 Live VTKS Fund
        </span>

        <h2>Latest Portfolio Trades</h2>

        <p>
          Discover the latest publicly revealed
          VTKS trades backed by structured analysis
          and disciplined portfolio management.
        </p>
      </div>

      {latestTrades.length === 0 ? (
        <div className="fund-preview-empty">
          <h3>No public trades available</h3>

          <p>
            Newly published and revealed trades
            will appear here.
          </p>
        </div>
      ) : (
        <div className="fund-preview-grid">
          {latestTrades.map((holding) => {
            const roi = getReturn(holding);
            const status = getStatus(holding);

            return (
              <Link
                key={holding.id}
                to={`/trade/${holding.id}`}
                className="fund-preview-card"
              >
                <div className="fund-preview-card-top">
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

                  <span
                    className={
                      status === "Active"
                        ? "fund-preview-status fund-preview-status-active"
                        : "fund-preview-status"
                    }
                  >
                    {status}
                  </span>
                </div>

                <div
                  className={
                    roi >= 0
                      ? "fund-preview-return fund-preview-return-positive"
                      : "fund-preview-return fund-preview-return-negative"
                  }
                >
                  {roi >= 0 ? "+" : ""}
                  {roi.toFixed(2)}%
                </div>

                <div className="fund-preview-meta">
                  <span>
                    Entry{" "}
                    <strong>
                      {formatPrice(
                        holding.entry
                      )}
                    </strong>
                  </span>

                  <span>
                    CMP{" "}
                    <strong>
                      {formatPrice(
                        holding.cmp
                      )}
                    </strong>
                  </span>

                  <span>
                    {holding.tradeType ||
                      "Swing"}
                  </span>
                </div>

                <div className="fund-preview-open">
                  View Trade →
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="fund-preview-action">
        <Link
          to="/funds"
          className="fund-preview-button"
        >
          Explore Complete Fund →
        </Link>
      </div>
    </section>
  );
}