import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import {
  calculateAmountBasedAccumulation,
  calculatePercentageBasedAccumulation,
  getETFAnalysis,
} from "../../services/etfService";
import { loadSettings } from "../../services/settingsService";
import "./ETFAnalysis.css";

const getETFTypeLabel = (type) =>
  type === "Other ETF" ? "Diversified ETF" : type;

const money = (value, digits = 2) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(Number(value || 0));

const number = (value, digits = 4) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: digits,
  });

const shortDate = (value) => {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const buildChartData = (accumulations = []) => {
  let totalAmount = 0;
  let totalUnits = 0;

  return accumulations.map((item) => {
    totalAmount += Number(item.amount || 0);
    totalUnits += Number(item.units || 0);

    const runningAverage =
      totalUnits > 0 ? totalAmount / totalUnits : 0;

    return {
      date: shortDate(item.accumulationDate),
      price: Number(item.price || 0),
      runningAverage: Number(runningAverage.toFixed(4)),
      amount: Number(item.amount || 0),
      units: Number(item.units || 0),
    };
  });
};

export default function ETFAnalysis() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [etf, setETF] = useState(null);
  const [accumulations, setAccumulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageEnabled, setPageEnabled] = useState(true);

  const [calculatorMode, setCalculatorMode] =
    useState("amount");
  const [investmentAmount, setInvestmentAmount] =
    useState(5000);
  const [portfolioAmount, setPortfolioAmount] =
    useState(100000);
  const [percentage, setPercentage] = useState(10);
  /* =====================================================
   BROWSER TAB TITLE
===================================================== */

useEffect(() => {
  if (etf?.name) {
    document.title = `${etf.name} SIP Analysis | VTKS INVEST`;
  } else {
    document.title = "SIP Analysis | VTKS INVEST";
  }

  return () => {
    document.title = "VTKS INVEST";
  };
}, [etf]);

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);

        const settings = await loadSettings();
        const enabled =
          settings?.website?.showETF === true;

        setPageEnabled(enabled);

        if (!enabled) return;

        const result = await getETFAnalysis(id);

        setETF(result.etf);
        setAccumulations(result.accumulations || []);
      } catch (error) {
        console.error("ETF analysis load error:", error);
        setETF(null);
        setAccumulations([]);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [id]);

  const chartData = useMemo(
    () => buildChartData(accumulations),
    [accumulations]
  );

  const history = useMemo(() => {
    let totalAmount = 0;
    let totalUnits = 0;

    return accumulations.map((item) => {
      totalAmount += Number(item.amount || 0);
      totalUnits += Number(item.units || 0);

      return {
        ...item,
        runningAverage:
          totalUnits > 0 ? totalAmount / totalUnits : 0,
      };
    });
  }, [accumulations]);

  const calculatorResult = useMemo(() => {
    if (!etf) return null;

    if (calculatorMode === "percentage") {
      return calculatePercentageBasedAccumulation({
        portfolioAmount,
        percentage,
        price: etf.cmp,
      });
    }

    return calculateAmountBasedAccumulation({
      amount: investmentAmount,
      price: etf.cmp,
      portfolioAmount,
    });
  }, [
    calculatorMode,
    investmentAmount,
    portfolioAmount,
    percentage,
    etf,
  ]);

  if (loading) {
    return (
      <div className="etfa-page">
        <div className="etfa-state">Loading ETF analysis...</div>
      </div>
    );
  }

  if (!pageEnabled) {
    return (
      <div className="etfa-page">
        <div className="etfa-state">
          <h2>SIP Portfolio is currently unavailable.</h2>
          <button onClick={() => navigate("/")}>Go Home</button>
        </div>
      </div>
    );
  }

  if (!etf) {
    return (
      <div className="etfa-page">
        <div className="etfa-state">
          <h2>SIP analysis not found.</h2>
          <p>This SIP may not be published.</p>
          <button onClick={() => navigate("/etf")}>
            Back to SIP Portfolio
          </button>
        </div>
      </div>
    );
  }

  const positive = Number(etf.gainLoss || 0) >= 0;

  return (
    <div className="etfa-page">
      <button
        className="etfa-back"
        type="button"
        onClick={() => navigate("/etf")}
      >
        ← Back to SIP Tracker
      </button>

      <section className="etfa-header">
        <div>
          <div className="etfa-header-tags">
            <span>{getETFTypeLabel(etf.etfType)}</span>
            <span>{etf.status}</span>
          </div>

          <h1>{etf.name}</h1>
          <h2>{etf.symbol}</h2>

          {etf.fullName && <p>{etf.fullName}</p>}
        </div>

        <div className="etfa-return-box">
          <span>Overall Change</span>
          <strong className={positive ? "gain" : "loss"}>
            {positive ? "+" : ""}
            {Number(etf.returnPercentage || 0).toFixed(2)}%
          </strong>
          <small className={positive ? "gain" : "loss"}>
            {Number(etf.gainLoss || 0) >= 0 ? "+" : ""}
            {money(etf.gainLoss)}
          </small>
        </div>
      </section>

      <section className="etfa-kpis">
        <article>
          <span>Current Price</span>
          <strong>{money(etf.cmp)}</strong>
          <small>Latest recorded CMP</small>
        </article>

        <article>
          <span>Average Accumulation Price</span>
          <strong>{money(etf.averagePrice)}</strong>
          <small>Weighted portfolio average</small>
        </article>

        <article>
          <span>Total Invested</span>
          <strong>{money(etf.totalInvested)}</strong>
          <small>{etf.accumulationCount} accumulation entries</small>
        </article>

        <article>
          <span>Current Value</span>
          <strong>{money(etf.currentValue)}</strong>
          <small>Based on current CMP</small>
        </article>

        <article>
          <span>Total Units</span>
          <strong>{number(etf.totalUnits, 4)}</strong>
          <small>Accumulated units</small>
        </article>
      </section>

      <section className="etfa-grid">
        <article className="etfa-card etfa-chart-card">
          <div className="etfa-section-head">
            <div>
              <span>ACCUMULATION JOURNEY</span>
              <h3>Price & Running Average</h3>
            </div>
            <p>
              Accumulation price compared with the weighted
              running average.
            </p>
          </div>

          {chartData.length ? (
            <div className="etfa-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 15, right: 20, left: 5, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e8edf5"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      money(value),
                      name === "price"
                        ? "Accumulation Price"
                        : "Running Average",
                    ]}
                  />
                  <Legend />
                  <ReferenceLine
                    y={Number(etf.cmp || 0)}
                    stroke="#2563eb"
                    strokeDasharray="6 5"
                    label={{
                      value: `CMP ₹${Number(etf.cmp || 0).toFixed(2)}`,
                      position: "insideTopRight",
                      fill: "#2563eb",
                      fontSize: 11,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    name="Accumulation Price"
                    stroke="#0f766e"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="runningAverage"
                    name="Running Average"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="etfa-empty">
              No accumulation history available for charting.
            </div>
          )}
        </article>

        <article className="etfa-card etfa-value-card">
          <div className="etfa-section-head">
            <div>
              <span>PORTFOLIO POSITION</span>
              <h3>Investment Growth</h3>
            </div>
          </div>

          <div className="etfa-growth-row">
            <div>
              <span>Invested</span>
              <strong>{money(etf.totalInvested)}</strong>
            </div>
            <div>
              <span>Current Value</span>
              <strong>{money(etf.currentValue)}</strong>
            </div>
          </div>

          <div className="etfa-growth-track">
            <div
              className={positive ? "positive" : "negative"}
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    8,
                    etf.totalInvested > 0
                      ? (etf.currentValue / etf.totalInvested) * 70
                      : 0
                  )
                )}%`,
              }}
            />
          </div>

          <div className="etfa-growth-result">
            <span>Absolute Change</span>
            <strong className={positive ? "gain" : "loss"}>
              {positive ? "+" : ""}
              {money(etf.gainLoss)}
            </strong>
          </div>

          <div className="etfa-growth-result">
            <span>Return</span>
            <strong className={positive ? "gain" : "loss"}>
              {positive ? "+" : ""}
              {Number(etf.returnPercentage || 0).toFixed(2)}%
            </strong>
          </div>

          <div className="etfa-growth-result">
            <span>Average vs CMP</span>
            <strong>
              {money(etf.averagePrice)} → {money(etf.cmp)}
            </strong>
          </div>
        </article>
      </section>

      {(etf.description || etf.notes) && (
        <section className="etfa-card etfa-study">
          <div className="etfa-section-head">
            <div>
              <span>VTKS STUDY</span>
              <h3>Portfolio Notes</h3>
            </div>
          </div>

          {etf.description && <p>{etf.description}</p>}
          {etf.notes && <p>{etf.notes}</p>}
        </section>
      )}

      <section className="etfa-card">
        <div className="etfa-section-head">
          <div>
            <span>TRANSPARENT TRACKING</span>
            <h3>Accumulation History</h3>
          </div>
          <p>Every published accumulation used in the portfolio average.</p>
        </div>

        {history.length ? (
          <div className="etfa-table-wrap">
            <table className="etfa-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Price</th>
                  <th>Amount</th>
                  <th>Units Added</th>
                  <th>Running Avg</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>{shortDate(item.accumulationDate)}</td>
                    <td>{money(item.price)}</td>
                    <td>{money(item.amount)}</td>
                    <td>{number(item.units, 4)}</td>
                    <td>{money(item.runningAverage)}</td>
                    <td>{item.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="etfa-empty">No accumulation entries available.</div>
        )}
      </section>

      <section className="etfa-card etfa-calculator">
        <div className="etfa-section-head">
          <div>
            <span>PUBLIC TOOL</span>
            <h3>SIP Accumulation Calculator</h3>
          </div>
          <p>
            Simulation only. Calculator entries are not saved to the
            VTKS portfolio.
          </p>
        </div>

        <div className="etfa-mode-tabs">
          <button
            type="button"
            className={calculatorMode === "amount" ? "active" : ""}
            onClick={() => setCalculatorMode("amount")}
          >
            Amount Based
          </button>
          <button
            type="button"
            className={calculatorMode === "percentage" ? "active" : ""}
            onClick={() => setCalculatorMode("percentage")}
          >
            Percentage Based
          </button>
        </div>

        <div className="etfa-calc-grid">
          <div className="etfa-calc-form">
            {calculatorMode === "amount" ? (
              <>
                <label>
                  Investment Amount
                  <input
                    type="number"
                    min="0"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                  />
                </label>

                <div className="etfa-presets">
                  {[2500, 5000, 10000, 20000, 50000].map((value) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setInvestmentAmount(value)}
                    >
                      {money(value, 0)}
                    </button>
                  ))}
                </div>

                <label>
                  Portfolio Amount <small>(optional)</small>
                  <input
                    type="number"
                    min="0"
                    value={portfolioAmount}
                    onChange={(e) => setPortfolioAmount(e.target.value)}
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  Portfolio Amount
                  <input
                    type="number"
                    min="0"
                    value={portfolioAmount}
                    onChange={(e) => setPortfolioAmount(e.target.value)}
                  />
                </label>

                <label>
                  Accumulation Percentage
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                  />
                </label>

                <div className="etfa-presets">
                  {[5, 10, 15, 20, 25].map((value) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setPercentage(value)}
                    >
                      {value}%
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="etfa-price-field">
              <span>ETF Price Used</span>
              <strong>{money(etf.cmp)}</strong>
            </div>
          </div>

          <div className="etfa-calc-result">
            <span>ESTIMATED ALLOCATION</span>

            <div>
              <small>Amount</small>
              <strong>
                {money(
                  calculatorMode === "amount"
                    ? calculatorResult?.amount
                    : calculatorResult?.amount
                )}
              </strong>
            </div>

            <div>
              <small>Estimated Units</small>
              <strong>{number(calculatorResult?.units, 4)}</strong>
            </div>

            {calculatorMode === "amount" && (
              <div>
                <small>Equivalent Portfolio Allocation</small>
                <strong>
                  {Number(
                    calculatorResult?.equivalentPercentage || 0
                  ).toFixed(2)}
                  %
                </strong>
              </div>
            )}

            {calculatorMode === "percentage" && (
              <div>
                <small>Portfolio Allocation</small>
                <strong>
                  {Number(calculatorResult?.percentage || 0).toFixed(2)}%
                </strong>
              </div>
            )}
          </div>
        </div>
      </section>

      <p className="etfa-disclaimer">
        <strong>Disclosure:</strong> This analysis forms part of the VTKS
        Long-Term SIP Portfolio and is presented solely for educational
        and informational purposes. The portfolio follows a structured
        accumulation approach with an intended long-term investment
        horizon of approximately 10–20 years. It is not an investment
        advisory service, portfolio management service, mutual fund, or
        a recommendation or solicitation to buy or sell any security.
        INSTRUMENT prices and returns are market-linked and may fluctuate, and
        past performance does not guarantee future results. Investors
        should conduct their own research, assess suitability and risk
        tolerance, and where appropriate consult a SEBI-registered
        investment adviser before making investment decisions.
      </p>
    </div>
  );
}
