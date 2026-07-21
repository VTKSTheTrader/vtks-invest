import "./PerformanceDashboard.css";

const stats = [
  {
    title: "Total Investment",
    value: "₹23,40,319",
  },
  {
    title: "Current Value",
    value: "₹26,11,928",
  },
  {
    title: "Net Profit",
    value: "₹2,71,609",
  },
  {
    title: "XIRR",
    value: "22.53%",
  },
  {
    title: "Cash Available",
    value: "₹1,78,527",
  },
  {
    title: "Average PE",
    value: "46.10",
  },
];

export default function PerformanceDashboard() {
  return (
    <section className="performance">
      <div className="performance-container">
        <span className="section-tag">📈 VTKS Performance</span>

        <h2>VTKS Fund Performance</h2>

        <p>
          Track portfolio value, profit, XIRR and key metrics in one structured dashboard.
        </p>

        <div className="stats-grid">
          {stats.map((item) => (
            <div className="stat-card" key={item.title}>
              <h3>{item.value}</h3>
              <span>{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}