import "./Indicators.css";
import SEO from "../../components/common/SEO";

export default function Indicators() {
  const tools = [
    {
      icon: "🎯",
      title: "VTKS Target Framework",
      subtitle: "Swing • Positional • Multibagger • Hybrid",
      text: "The VTKS Target Framework is divided into four structured models, each designed for a different time horizon, holding capacity and risk profile.",
      points: [
        "VTKS-1: Swing Trading Target",
        "VTKS-1B: Positional Trading",
        "VTKS-2: Multibagger Framework",
        "VTKS-3: Hybrid Framework",
      ],
    },
    {
      icon: "📈",
      title: "VTKS Strategy",
      subtitle: "8-Confirmation Working Framework",
      text: "VTKS Strategy is a multi-confirmation market reading system. Each component has a specific role, and when they align, they create high-probability trade setups.",
      points: [
        "Trend Analysis",
        "Market Structure",
        "Momentum Confirmation",
        "Risk Management",
      ],
    },
    {
      icon: "⚡",
      title: "VTKS Crossover",
      subtitle: "Momentum Trade Identifier",
      text: "VTKS Crossover is designed to identify momentum shifts in the market and help traders enter when strength is building.",
      points: [
        "Momentum Shifts",
        "Breakout Confirmation",
        "Trend Continuation",
        "Weak Setup Filter",
      ],
    },
    {
      icon: "🔥",
      title: "VTKS STF",
      subtitle: "Decision Zones & Market Structure",
      text: "VTKS STF helps traders prepare in advance using predefined decision zones, support-resistance behaviour and market structure.",
      points: [
        "Decision Zones",
        "Support & Resistance",
        "Market Structure",
        "Preparation Over Prediction",
      ],
    },
    {
      icon: "🧭",
      title: "VTKS Support & Resistance",
      subtitle: "Important Market Levels",
      text: "A structured support-resistance framework designed to identify important decision areas where price may react.",
      points: [
        "Key Levels",
        "Decision Areas",
        "Trend Reversal Zones",
        "Breakout Planning",
      ],
    },
    {
      icon: "🚀",
      title: "Many More Tools",
      subtitle: "Complete VTKS Ecosystem",
      text: "VTKS continuously evolves with scanners, portfolio analytics, learning resources and new proprietary tools.",
      points: [
        "Market Scanners",
        "Portfolio Tracking",
        "Performance Analytics",
        "Learning Resources",
      ],
    },
  ];
 
  const targetModels = [
    {
      name: "VTKS-1",
      type: "Swing Trading Target",
      desc: "Short to medium-term opportunities for traders looking to capture structured swing moves.",
    },
    {
      name: "VTKS-1B",
      type: "Positional Trading",
      desc: "Designed for traders who want to ride trends for a longer holding period with greater conviction.",
    },
    {
      name: "VTKS-2",
      type: "Multibagger Framework",
      desc: "Focused on identifying long-term wealth creation opportunities using trend and structure.",
    },
    {
      name: "VTKS-3",
      type: "Hybrid Framework",
      desc: "A balanced framework combining swing and investment principles for different market conditions.",
    },
  ];

  return (
    
    <main className="indicators-page">
      <section className="indicators-hero">
        <span className="indicator-badge">VTKS Indicator Suite</span>

        <h1>
          Professional Trading
          <br />
          Ecosystem
        </h1>

        <p>
          VTKS is more than a single indicator. It is a complete rule-based
          trading ecosystem built to help traders analyse markets, manage risk
          and make disciplined decisions across multiple trading styles.
        </p>

        <div className="indicator-actions">
          <a className="primary" href="/funds">Explore VTKS Analysis</a>
          <a href="/accuracy" className="outline">View Accuracy</a>
        </div>
      </section>

      <section className="featured-indicator">
        <div>
          <span className="indicator-badge light">Flagship Indicator</span>

          <h2>VTKS-1</h2>

          <h3>Primary Swing Trading Framework</h3>

          <p>
            VTKS-1 is the flagship indicator of the VTKS ecosystem, designed
            specifically for swing traders looking to capture high-probability
            moves while maintaining disciplined risk management.
          </p>

          <p>
            It combines trend analysis, structure and confirmation logic to help
            traders identify quality opportunities instead of chasing random
            market movements.
          </p>
        </div>

        <div className="feature-box">
          <h4>Built For</h4>

          <ul>
            <li>✔ Swing Trading</li>
            <li>✔ Trend Confirmation</li>
            <li>✔ Structured Entry Zones</li>
            <li>✔ Risk Management</li>
            <li>✔ Disciplined Execution</li>
          </ul>
        </div>
      </section>

      <section className="target-section">
        <div className="section-title">
          <span>VTKS Target Framework</span>
          <h2>Four Models. One Market Framework.</h2>
          <p>
            The VTKS indicator is divided into four target models, each designed
            for a different time horizon and trading objective.
          </p>
        </div>

        <div className="target-grid">
          {targetModels.map((model) => (
            <div className="target-card" key={model.name}>
              <h3>{model.name}</h3>
              <h4>{model.type}</h4>
              <p>{model.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="tools-section">
        <div className="section-title">
          <span>Professional Toolkit</span>
          <h2>Explore the VTKS Ecosystem</h2>
          <p>
            Every tool inside VTKS serves a specific purpose and works together
            to create a structured framework for trading and investing.
          </p>
        </div>

        <div className="tools-grid">
          {tools.map((tool) => (
            <div className="tool-card" key={tool.title}>
              <div className="tool-icon">{tool.icon}</div>
              <h3>{tool.title}</h3>
              <h4>{tool.subtitle}</h4>
              <p>{tool.text}</p>

              <ul>
                {tool.points.map((point) => (
                  <li key={point}>✔ {point}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="framework-section">
        <h2>Why Traders Choose VTKS</h2>

        <div className="framework-grid">
          <div>
            <h3>Rule-Based Decisions</h3>
            <p>No emotional trading. Every setup follows structure.</p>
          </div>

          <div>
            <h3>Multi-Timeframe View</h3>
            <p>Understand market direction across multiple horizons.</p>
          </div>

          <div>
            <h3>Risk First Approach</h3>
            <p>Targets, stop loss and trade management stay predefined.</p>
          </div>

          <div>
            <h3>Continuous Evolution</h3>
            <p>VTKS tools evolve with market behaviour and trader needs.</p>
          </div>
        </div>
      </section>

      <section className="indicator-cta">
        <h2>One Platform. One Framework. Endless Possibilities.</h2>
        <p>
          Discover how the complete VTKS ecosystem can help you trade with
          structure and invest with conviction.
        </p>
        <a href="/login">Join VTKS INVEST</a>
      </section>
    </main>
  );
}