import "./StatsSection.css";

function StatsSection() {
  const stats = [
  {
    title: "Portfolio Value",
    value: "₹2.61 Cr",
    color: "#22C55E",
  },
  {
    title: "XIRR",
    value: "22.53%",
    color: "#3B82F6",
  },
  {
    title: "Accuracy",
    value: "92%",
    color: "#F59E0B",
  },
  {
    title: "Active Holdings",
    value: "19",
    color: "#A855F7",
  },
  {
    title: "Sectors",
    value: "8",
    color: "#14B8A6",
  },
  {
    title: "Years",
    value: "7+",
    color: "#EF4444",
  },
];

  return (
    <section className="stats">

      <div className="stats-container">

        {stats.map((item) => (
          <div className="stat-card" key={item.title}>

            <h3>{item.title}</h3>

            <h2 style={{ color: item.color }}>
              {item.value}
            </h2>

          </div>
        ))}

      </div>

    </section>
  );
}

export default StatsSection;