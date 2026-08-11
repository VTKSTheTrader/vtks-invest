import SEO from "../../components/common/SEO";
import "./About.css";

export default function About() {
  return (
    <>
      <SEO
        title="VTKS INVEST | About Us"
        description="Professional stock market education platform. Built by Traders - Designed for Traders."
        keywords="VTKS, Swing Trading, Technical Analysis, Stock Market"
        canonical="https://www.vtksinvest.com/about"
      />

      <main className="about-page">

        {/* =================================================
            HERO
        ================================================= */}

        <section className="about-hero">
          <span className="about-badge">
            About VTKS INVEST
          </span>

          <h1>
            Trade with Structure.
            <br />
            Invest with Conviction.
          </h1>

          <p>
            VTKS INVEST is a structured trading and
            investment learning platform built around
            rule-based analysis, disciplined execution,
            risk management and transparent performance
            tracking.
          </p>
        </section>

        {/* =================================================
            OUR STORY
        ================================================= */}

        <section className="about-section">
          <h2>Our Story</h2>

          <p>
            VTKS INVEST was created with one mission:
            To help traders and investors move away from
            guesswork and build confidence through
            structured analysis.
          </p>

          <p>
            Instead of relying on tips or emotions, our
            focus is on rule-based decision making,
            risk management, portfolio tracking and
            continuous learning.
          </p>
        </section>

        {/* =================================================
            FOUNDERS
        ================================================= */}

        <section className="founders-section">
          <span className="about-badge">
            Meet the Founders
          </span>

          <h2>
            Built by Traders. Designed for Traders.
          </h2>

          <p className="founder-intro">
            VTKS INVEST is built around one philosophy —
            helping traders become independent through
            structured analysis, disciplined execution
            and continuous learning.
          </p>

          <div className="founder-grid">

            {/* VARUN */}

            <article className="founder-card">
              <div className="avatar">
                VT
              </div>

              <h3>
                Varun Tyagi
              </h3>

              <span>
                Founder
              </span>

              <ul>
                <li>
                  7+ Years Market Experience
                </li>

                <li>
                  Market Structure Specialist
                </li>

                <li>
                  Rule-Based Trading Framework
                </li>

                <li>
                  Price Action & Risk Management
                </li>

                <li>
                  Research & Development
                </li>

                <li>
                  F&amp;O
                </li>

                <li>
                  Commodities
                </li>

                <li>
                  Trading Mentor
                </li>
              </ul>
            </article>

            {/* KRISHNA */}

            <article className="founder-card">
              <div className="avatar">
                KS
              </div>

              <h3>
                Krishna Shah
              </h3>

              <span>
                Co-Founder
              </span>

              <div className="founder-certifications">
                <strong>
                  NISM Certified Equity-Derivative Analyst
                </strong>

                <strong>
                  NISM Certified Research Analyst
                </strong>
              </div>

              <ul>
                <li>
                  3+ Years Market Experience
                </li>

                <li>
                  Portfolio Management
                </li>

                <li>
                  Swing Trading
                </li>

                <li>
                  Positional Trading
                </li>

                <li>
                  Investment Research
                </li>
              </ul>
            </article>

          </div>
        </section>

        {/* =================================================
            WHAT WE BUILD
        ================================================= */}

        <section className="about-section">
          <h2>
            What We Build
          </h2>

          <div className="build-grid">

            <article className="build-card">
              <div className="build-icon">
                📊
              </div>

              <h3>
                Portfolio Management
              </h3>

              <p>
                Professional portfolio tracking with
                complete transparency.
              </p>
            </article>

            <article className="build-card">
              <div className="build-icon">
                📈
              </div>

              <h3>
                Trading Indicators
              </h3>

              <p>
                Rule-based indicators for consistent
                market decisions.
              </p>
            </article>

            <article className="build-card">
              <div className="build-icon">
                🎯
              </div>

              <h3>
                Performance Tracking
              </h3>

              <p>
                Track market studies with ROI, win rate
                and performance analytics.
              </p>
            </article>

            <article className="build-card">
              <div className="build-icon">
                ⚡
              </div>

              <h3>
                Market Scanners
              </h3>

              <p>
                Identify structured market opportunities
                through predefined conditions.
              </p>
            </article>

            <article className="build-card">
              <div className="build-icon">
                📚
              </div>

              <h3>
                Learning Resources
              </h3>

              <p>
                Structured education through videos,
                PDFs and recorded sessions.
              </p>
            </article>

            <article className="build-card">
              <div className="build-icon">
                👥
              </div>

              <h3>
                Community
              </h3>

              <p>
                A collaborative environment focused on
                structured learning and disciplined
                market participation.
              </p>
            </article>

          </div>
        </section>

        {/* =================================================
            PHILOSOPHY
        ================================================= */}

        <section className="about-section philosophy">
          <h2>
            Our Philosophy
          </h2>

          <h1>
            We Don't Sell Tips.
            <br />
            We Build Traders.
          </h1>

          <p>
            Knowledge creates conviction. Conviction
            creates discipline. Discipline creates
            consistency.
          </p>
        </section>

        {/* =================================================
            VISION
        ================================================= */}

        <section className="about-section">
          <h2>
            Our Vision
          </h2>

          <p>
            To build a trusted rule-based trading and
            investment learning platform by combining
            technology, education, transparency and
            disciplined execution.
          </p>
        </section>

      </main>
    </>
  );
}