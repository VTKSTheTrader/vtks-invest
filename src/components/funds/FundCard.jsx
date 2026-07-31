import { Link } from "react-router-dom";
import "./FundCard.css";

export default function FundCard({ stock }) {
  const roi = Number(stock.returnPercent || 0);

  const getStatusClass = () => {
    const status = String(stock.status || "")
      .trim()
      .toLowerCase();

    if (status === "booked profit") return "status-booked";
    if (status.includes("target 3")) return "status-target";
    if (status.includes("target 2")) return "status-target";
    if (status.includes("target 1")) return "status-target";
    if (status === "sl hit") return "status-loss";
    if (status === "cancelled") return "status-cancelled";

    return "status-active";
  };

  return (
    <article className="fund-card">
      <div className="fund-card-content">
        <div className="fund-card-header">
          <div className="fund-title-area">
            <h2>{stock.name || "Stock"}</h2>
            <p>{stock.sector || "General"}</p>
          </div>

          <span className={`fund-status ${getStatusClass()}`}>
            {stock.status || "Active"}
          </span>
        </div>

        <div className="fund-values-grid">
          <div className="fund-value">
            <span>Entry</span>
            <strong>₹{stock.entry ?? "-"}</strong>
          </div>

          <div className="fund-value">
            <span>Live CMP</span>
            <strong>₹{stock.cmp ?? "-"}</strong>
          </div>

          <div className="fund-value">
            <span>ROI</span>
            <strong className={roi >= 0 ? "fund-profit" : "fund-loss"}>
              {roi >= 0 ? "+" : ""}
              {roi.toFixed(2)}%
            </strong>
          </div>

          <div className="fund-value">
            <span>Target 1</span>
            <strong>₹{stock.target1 || "-"}</strong>
          </div>

          <div className="fund-value">
            <span>Target 2</span>
            <strong>₹{stock.target2 || "-"}</strong>
          </div>

          <div className="fund-value">
            <span>Stop Loss</span>
            <strong>₹{stock.sl || "-"}</strong>
          </div>
        </div>

        <div className="fund-resources">
          {stock.chartImageUrl ? (
            <span className="fund-resource-available">
              📈 Chart Available
            </span>
          ) : (
            <span className="fund-resource-placeholder">
              Chart not uploaded
            </span>
          )}

          {stock.researchPdfUrl ? (
            <span className="fund-resource-available">
              📄 Research Available
            </span>
          ) : (
            <span className="fund-resource-placeholder">
              Research not uploaded
            </span>
          )}
        </div>
      </div>

      <Link className="fund-details-button" to={`/trade/${stock.id}`}>
        View Analysis →
      </Link>
    </article>
  );
}