import "./EducationDisclosure.css";

export default function EducationDisclosure() {
  return (
    <section className="education-disclosure-section">
      <div className="education-disclosure-container">
        <div className="education-disclosure-header">
          <span className="education-disclosure-badge">
            🎓 VTKS Educational Approach
          </span>

          <h2>Learn the Process. Manage the Risk. Trade Independently.</h2>

          <p>
            VTKS is an educational and learning platform focused on helping
            traders understand structured setups, risk management, trading
            psychology and disciplined execution.
          </p>
        </div>

        <div className="education-disclosure-grid">
          <article className="education-disclosure-card positive-card">
            <div className="education-disclosure-icon">✓</div>

            <h3>What We Do</h3>

            <ul>
              <li>Teach structured VTKS trading setups</li>
              <li>Explain market structure and technical analysis</li>
              <li>Focus on risk and capital management</li>
              <li>Develop trading psychology and emotional control</li>
              <li>Promote disciplined, rule-based trade execution</li>
              <li>Help traders make independent decisions</li>
            </ul>
          </article>

          <article className="education-disclosure-card warning-card">
            <div className="education-disclosure-icon">×</div>

            <h3>What We Do Not Do</h3>

            <ul>
              <li>We do not provide trading calls or tips</li>
              <li>We do not run an investment advisory service</li>
              <li>We do not provide personalised buy or sell recommendations</li>
              <li>We do not promise or guarantee profits</li>
              <li>We do not promote blind trade following</li>
              <li>We do not take responsibility for individual trade decisions</li>
            </ul>
          </article>
        </div>

        <div className="education-disclosure-footer">
          <h3>Our Core Philosophy</h3>

          <p>
            Trading should be based on preparation, discipline and predefined
            rules—not emotions, predictions or dependency on tips. The purpose
            of VTKS is to help traders build a repeatable process, manage risk
            responsibly and develop confidence in their own analysis.
          </p>

          <strong>
            Learn the setup. Understand the risk. Follow the rules. Make your
            own decisions.
          </strong>
        </div>

        <p className="education-disclosure-note">
          All VTKS content is provided strictly for educational and learning
          purposes. It should not be considered investment advice, a trading
          recommendation or an assurance of returns. Please conduct your own
          research before making financial decisions.
        </p>
      </div>
    </section>
  );
}