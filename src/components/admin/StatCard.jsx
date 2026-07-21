import "./StatCard.css";

export default function StatCard({
  title,
  value,
  color = "#2563eb",
}) {
  return (
    <div className="stat-card-admin">
      <h2 style={{ color }}>{value}</h2>
      <p>{title}</p>
    </div>
  );
}