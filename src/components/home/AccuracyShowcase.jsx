import "./AccuracyShowcase.css";

const accuracyItems = [
  {
    title: "Predefined Zones",
    text: "Support, resistance and decision zones marked before the move.",
  },
  {
    title: "Target Discipline",
    text: "Trades are tracked with entry, SL, targets and return visibility.",
  },
  {
    title: "No FOMO Trading",
    text: "VTKS focuses on preparation, structure and risk control.",
  },
];

export default function AccuracyShowcase() {
  return (
    <section className="accuracy-showcase">
      <div className="accuracy-container">
        <span className="section-tag">🎯 VTKS Accuracy</span>

        <h2>Precision Comes From Preparation</h2>

        <p>
          VTKS is built around predefined levels, structured execution and transparent performance tracking.
        </p>

        <div className="accuracy-grid">
          {accuracyItems.map((item) => (
            <div className="accuracy-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}