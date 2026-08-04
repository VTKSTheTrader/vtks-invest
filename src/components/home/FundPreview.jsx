import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";

import {
  getHoldings,
  mapHoldingFromDB,
} from "../../services/holdingService";

import "./FundPreview.css";

const MAX_HOME_IDEAS = 3;

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export default function FundPreview() {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
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
          "Failed to load market ideas."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (holding) => {
    const manualStatus = String(
      holding.tradeStatus ||
        holding.trade_status ||
        ""
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

  const isCompletedIdea = (holding) =>
    [
      "Booked Profit",
      "SL Hit",
      "Target 1 Hit",
      "Target 2 Hit",
      "Target 3 Hit",
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

  const getDisplayReturn = (holding) => {
    const entry = Number(holding.entry || 0);

    if (!entry) return 0;

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

    return ((cmp - entry) / entry) * 100;
  };

  const getStatusClass = (status) => {
    if (status === "Booked Profit") {
      return [
        "fund-preview-status",
        "fund-preview-status-booked",
      ].join(" ");
    }

    if (
      status === "Target 1 Hit" ||
      status === "Target 2 Hit" ||
      status === "Target 3 Hit"
    ) {
      return [
        "fund-preview-status",
        "fund-preview-status-target",
      ].join(" ");
    }

    if (status === "SL Hit") {
      return [
        "fund-preview-status",
        "fund-preview-status-sl",
      ].join(" ");
    }

    return [
      "fund-preview-status",
      "fund-preview-status-active",
    ].join(" ");
  };

  const getStatusLabel = (status) => {
    if (status === "Booked Profit") {
      return "💰 Booked Profit";
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

    if (status === "SL Hit") {
      return "🛑 SL Hit";
    }

    return "🟢 Active";
  };

  const latestIdeas = useMemo(() => {
    return holdings
      .filter((holding) => {
        const visibility = normalize(
          holding.visibility
        );

        const publishStatus = normalize(
          holding.publishStatus ||
            holding.publish_status
        );

        const isPublic =
          visibility === "public";

        const isRevealedSubscriber =
          (
            visibility === "subscriber" ||
            visibility === "community"
          ) &&
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
            first.created_at ||
            0
        ).getTime();

        const secondDate = new Date(
          second.recommendationDate ||
            second.createdAt ||
            second.created_at ||
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
      .slice(0, MAX_HOME_IDEAS);
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
          Loading latest market ideas...
        </p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="fund-preview-section">
        <div className="fund-preview-empty">
          <h3>
            Unable to load market ideas
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
          📊 VTKS Market Insights
        </span>

        <h2>Latest Insights</h2>

        <p>
          Discover recently published and publicly
          revealed VTKS ideas backed by structured
          analysis and disciplined portfolio
          management.
        </p>
      </div>

      {latestIdeas.length === 0 ? (
        <div className="fund-preview-empty">
          <h3>No public ideas available</h3>

          <p>
            Newly published and revealed ideas will
            appear here.
          </p>
        </div>
      ) : (
        <div className="fund-preview-grid">
          {latestIdeas.map((holding) => {
            const status = getStatus(holding);
            const completedIdea =
              isCompletedIdea(holding);

            const displayReturn =
              getDisplayReturn(holding);

            const displayPrice = completedIdea
              ? getExitPrice(holding)
              : Number(holding.cmp || 0);

            return (
              <Link
                key={holding.id}
                to={`/trade/${holding.id}`}
                className={`fund-preview-card ${
                  status === "Booked Profit"
                    ? "fund-preview-card-booked"
                    : ""
                }`}
              >
                <div className="fund-preview-card-top">
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

                  <span
                    className={getStatusClass(
                      status
                    )}
                  >
                    {getStatusLabel(status)}
                  </span>
                </div>

                <div
                  className={
                    displayReturn >= 0
                      ? `fund-preview-return fund-preview-return-positive ${
                          completedIdea
                            ? "fund-preview-return-realised"
                            : ""
                        }`
                      : "fund-preview-return fund-preview-return-negative"
                  }
                >
                  {completedIdea && (
                    <small className="fund-preview-return-label">
                      Realised Return
                    </small>
                  )}

                  <span>
                    {displayReturn >= 0
                      ? "+"
                      : ""}
                    {displayReturn.toFixed(2)}%
                  </span>
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

                  <span
                    className={
                      completedIdea
                        ? "fund-preview-exit-pill"
                        : ""
                    }
                  >
                    {completedIdea
                      ? "Exit"
                      : "CMP"}{" "}
                    <strong>
                      {formatPrice(
                        displayPrice
                      )}
                    </strong>
                  </span>

                  <span>
                    {holding.tradeType ||
                      holding.trade_type ||
                      "Swing"}
                  </span>
                </div>

                <div className="fund-preview-open">
                  View Analysis →
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
          Explore Complete Analysis →
        </Link>
      </div>
    </section>
  );
}