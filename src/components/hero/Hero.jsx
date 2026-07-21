import { Link } from "react-router-dom";
import "./Hero.css";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <span className="hero-badge">
          🚀 Professional Trading &amp; Investment Platform
        </span>

        <h1>
          Trade with Structure.
          <br />
          Invest with Conviction.
        </h1>

        <p>
          VTKS Hub combines portfolio management, rule-based investing,
          professional trading indicators and performance analytics
          into one powerful platform.
        </p>

        <div className="hero-buttons">
          <Link to="/funds" className="hero-primary-btn">
            Explore VTKS Fund
          </Link>

          <Link to="/indicators" className="hero-secondary-btn">
            View Indicators
          </Link>

          <Link to="/register" className="hero-register-btn">
            Join VTKS
          </Link>

          <Link to="/login" className="hero-login-btn">
            Member Login
          </Link>
        </div>
      </div>
    </section>
  );
}