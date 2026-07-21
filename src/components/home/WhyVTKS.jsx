import "./WhyVTKS.css";

const features = [
  {
    icon: "🎯",
    title: "STF Strategy",
    text: "Predefined support, resistance and decision zones before the market moves.",
  },
  {
    icon: "📊",
    title: "Portfolio",
    text: "Track holdings, returns and portfolio performance with complete transparency.",
  },
  {
    icon: "🧠",
    title: "Education First",
    text: "Build conviction through structured learning instead of depending on tips.",
  },
  {
    icon: "⚡",
    title: "Powerful Scanner",
    text: "Find high-probability trading opportunities using VTKS scanners and indicators.",
  },
];

export default function WhyVTKS() {
  return (
    <section className="why-vtks">

      <div className="why-container">

        <span className="section-tag">
          ⭐ Why VTKS
        </span>

        <h2>Everything You Need In One Platform</h2>

        <p>
          VTKS combines investing, trading, education and analytics into a
          single ecosystem built for disciplined market participants.
        </p>

        <div className="why-grid">

          {features.map((item) => (
            <div className="why-card" key={item.title}>

              <div className="icon">
                {item.icon}
              </div>

              <h3>{item.title}</h3>

              <p>{item.text}</p>

            </div>
          ))}

        </div>

      </div>

    </section>
  );
}