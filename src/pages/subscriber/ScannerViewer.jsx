import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  getScanners,
} from "../../services/scannerService";

import "./ScannerViewer.css";

export default function ScannerViewer() {
  const { id } = useParams();

  const [scanner, setScanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadScanner = async () => {
      try {
        setLoading(true);
        setError("");

        const rows = await getScanners();

        const found = (rows || []).find(
          (item) => String(item.id) === String(id)
        );

        if (!found) {
          setError("Scanner not found.");
          return;
        }

        setScanner(found);
      } catch (err) {
        console.error("Scanner viewer error:", err);

        setError(
          err?.message || "Unable to load scanner."
        );
      } finally {
        setLoading(false);
      }
    };

    loadScanner();
  }, [id]);

  if (loading) {
    return (
      <div className="scanner-viewer-loading">
        Loading scanner...
      </div>
    );
  }

  if (error || !scanner) {
    return (
      <main className="scanner-viewer-page">
        <div className="scanner-viewer-topbar">
          <Link
            to="/dashboard/scanner"
            className="scanner-viewer-back"
          >
            ← Back to Scanners
          </Link>
        </div>

        <section className="scanner-viewer-error">
          <h1>Scanner unavailable</h1>

          <p>
            {error || "This scanner could not be loaded."}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="scanner-viewer-page">
      <div className="scanner-viewer-topbar">
        <Link
          to="/dashboard/scanner"
          className="scanner-viewer-back"
        >
          ← Back to Scanners
        </Link>

        <div className="scanner-viewer-title">
          <h1>
            {scanner.name || "VTKS Scanner"}
          </h1>

          <p>
            {scanner.category || "General"}
            {" • "}
            {scanner.timeframe || "Multi-Timeframe"}
          </p>
        </div>
      </div>

      <section className="scanner-viewer-frame-wrap">
        <iframe
          src={scanner.link}
          title={scanner.name || "VTKS Scanner"}
          className="scanner-viewer-frame"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>
    </main>
  );
}