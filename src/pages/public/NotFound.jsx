import { Link } from "react-router-dom";
import "./NotFound.css";

export default function NotFound() {
  return (
    <main className="notfound-page">
      <section className="notfound-card">

        <span className="notfound-badge">
          🚫 404 Error
        </span>

        <h1>404</h1>

        <h2>Page Not Found</h2>

        <p>
          The page you're looking for doesn't exist,
          may have been moved, or the URL is incorrect.
        </p>

        <div className="notfound-buttons">

          <Link
            to="/"
            className="primary-btn"
          >
            🏠 Back to Home
          </Link>

          <Link
            to="/contact"
            className="secondary-btn"
          >
            Contact Support
          </Link>

        </div>

      </section>
    </main>
  );
}