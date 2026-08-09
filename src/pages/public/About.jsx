import "./About.css";
import SEO from "../../components/common/SEO";
<>
  <SEO
    title="VTKS INVEST | About Us."
    description="Professional stock market education platform, Built by Traders - Designed for Traders"
    keywords="VTKS, Swing Trading, Technical Analysis, Stock Market"
    canonical="https://www.vtksinvest.com/about"
  />

  {/* Existing page content */}
</>
export default function About() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <span className="about-badge">About VTKS INVEST</span>

        <h1>
          Trade with Structure.
          <br />
          Invest with Conviction.
        </h1>

        <p>
          VTKS INVEST is a structured trading and investment learning platform
  built around rule-based analysis, disciplined execution, risk
  management and transparent performance tracking.
        </p>
      </section>

      <section className="about-section">
        <h2>Our Story</h2>

        <p>
          VTKS INVEST was created with one mission: To help traders and investors
          move away from guesswork and build confidence through structured
          analysis.
        </p>

        <p>
          Instead of relying on tips or emotions, our focus is on rule-based
          decision making, risk management, portfolio tracking and continuous
          learning.
        </p>
      </section>

      <section className="founders-section">
        <span className="about-badge">Meet the Founders</span>

        <h2>Built by Traders. Designed for Traders.</h2>

        <p className="founder-intro">
          VTKS INVEST is built around one philosophy — Helping traders become
          independent through structured analysis, disciplined execution and
          continuous learning.
        </p>

        <div className="founder-grid">
          <div className="founder-card">
            <div className="avatar">VT</div>

            <h3>Varun Tyagi</h3>
            <span>Founder</span>

            <ul>
              <li>7+ Years Market Experience</li>
<li>Market Structure Specialist</li>
<li>Rule-Based Trading Framework</li>
<li>Price Action & Risk Management</li>
<li>Research & Development</li>
<li>F&O</li>
<li>Commodities</li>
<li>Trading Mentor</li>
            </ul>
          </div>

          <div className="founder-card">
            <div className="avatar">KS</div>

            <h3>Krishna Shah</h3>
            <span>Co-Founder</span>

            <strong>NISM Certified Equity-Derivative Analyst</strong>
            <strong>NISM Certified Research Analyst</strong>

            <ul>
              <li>3+ Years Market Experience</li>
<li>Portfolio Management</li>
<li>Swing Trading</li>
<li>Positional Trading</li>
<li>Investment Research</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>What We Build</h2>

        <div className="build-grid">
          <div className="build-card">
            <div className="build-icon">📊</div>
            <h3>Portfolio Management</h3>
            <p>Professional portfolio tracking with complete transparency.</p>
          </div>

          <div className="build-card">
            <div className="build-icon">📈</div>
            <h3>Trading Indicators</h3>
            <p>Rule-based indicators for consistent market decisions.</p>
          </div>

          <div className="build-card">
            <div className="build-icon">🎯</div>
            <h3>Performance Tracking</h3>
            <p>Track every trade with ROI, win rate and analytics.</p>
          </div>

          <div className="build-card">
            <div className="build-icon">⚡</div>
            <h3>Market Scanners</h3>
            <p>Find high probability opportunities before everyone else.</p>
          </div>

          <div className="build-card">
            <div className="build-icon">📚</div>
            <h3>Learning Resources</h3>
            <p>Structured education through videos, PDFs and live sessions.</p>
          </div>

          <div className="build-card">
            <div className="build-icon">👥</div>
            <h3>Community</h3>
            <p>A collaborative environment focused on disciplined trading.</p>
          </div>
        </div>
      </section>

      <section className="about-section philosophy">
        <h2>Our Philosophy</h2>

        <h1>
          We Don't Sell Tips.
          <br />
          We Build Traders.
        </h1>

        <p>
          Knowledge creates conviction. Conviction creates discipline. Discipline
          creates consistency.
        </p>
      </section>

      <section className="about-section">
        <h2>Our Vision</h2>

        <p>
          To become India's most trusted rule-based trading and investment
          platform by combining technology, education, transparency and
          disciplined execution.
        </p>
      </section>
    </main>
  );
}