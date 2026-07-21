import { useEffect, useMemo, useState } from "react";
import { getScanners } from "../../services/scannerService";
import { loadSettings } from "../../services/settingsService";
import "./Scanner.css";

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export default function Scanner() {
  const [scanners, setScanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageEnabled, setPageEnabled] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    loadPublicScanners();
  }, []);

  const loadPublicScanners = async () => {
    try {
      setLoading(true);

      const [settings, scannerRows] = await Promise.all([
        loadSettings(),
        getScanners(),
      ]);

      setPageEnabled(
        Boolean(settings?.website?.showScanner)
      );

      const publicRows = (scannerRows || []).filter(
        (scanner) => {
          const access = normalize(scanner.access);
          const status = normalize(scanner.status);

          return (
            access === "public" &&
            status === "active"
          );
        }
      );

      setScanners(publicRows);
    } catch (error) {
      console.error(
        "Public scanner load error:",
        error
      );

      setScanners([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const values = scanners
      .map((scanner) => scanner.category)
      .filter(Boolean);

    return ["All", ...new Set(values)];
  }, [scanners]);

  const filteredScanners = useMemo(() => {
    const search = normalize(searchText);

    return scanners.filter((scanner) => {
      const matchesSearch =
        !search ||
        normalize(scanner.name).includes(search) ||
        normalize(scanner.category).includes(search) ||
        normalize(scanner.timeframe).includes(search);

      const matchesCategory =
        categoryFilter === "All" ||
        scanner.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [scanners, searchText, categoryFilter]);

  if (loading) {
    return (
      <div className="public-scanner-loading">
        Loading public scanners...
      </div>
    );
  }

  if (!pageEnabled) {
    return (
      <main className="public-scanner-page">
        <section className="public-scanner-empty">
          <div className="public-scanner-empty-icon">
            🔒
          </div>

          <h1>Scanner page is currently unavailable</h1>

          <p>
            Public scanner access has been disabled by the
            administrator.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="public-scanner-page">
      <section className="public-scanner-hero">
        <span className="public-scanner-badge">
          ⚡ VTKS Market Scanners
        </span>

        <h1>Find opportunities with structured scanners</h1>

        <p>
          Explore active VTKS scanners made available for
          public access.
        </p>
      </section>

      <section className="public-scanner-toolbar">
        <input
          type="search"
          placeholder="Search scanners..."
          value={searchText}
          onChange={(event) =>
            setSearchText(event.target.value)
          }
        />

        <select
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(event.target.value)
          }
        >
          {categories.map((category) => (
            <option
              key={category}
              value={category}
            >
              {category === "All"
                ? "All Categories"
                : category}
            </option>
          ))}
        </select>
      </section>

      {filteredScanners.length === 0 ? (
        <section className="public-scanner-empty">
          <div className="public-scanner-empty-icon">
            📊
          </div>

          <h2>No public scanners available</h2>

          <p>
            New public scanners will appear here once
            activated by the VTKS team.
          </p>
        </section>
      ) : (
        <section className="public-scanner-grid">
          {filteredScanners.map((scanner) => (
            <article
              className="public-scanner-card"
              key={scanner.id}
            >
              <div className="public-scanner-card-top">
                <div className="public-scanner-icon">
                  ⚡
                </div>

                {scanner.featured && (
                  <span className="public-scanner-featured">
                    Featured
                  </span>
                )}
              </div>

              <h2>{scanner.name}</h2>

              <div className="public-scanner-meta">
                <span>
                  {scanner.category || "General"}
                </span>

                <span>
                  {scanner.timeframe || "Multi-Timeframe"}
                </span>
              </div>

              <p className="public-scanner-description">
                Use this VTKS scanner to identify structured
                market opportunities based on predefined
                screening conditions.
              </p>

              {scanner.link ? (
                <a
                  href={scanner.link}
                  target="_blank"
                  rel="noreferrer"
                  className="public-scanner-open-button"
                >
                  Open Scanner
                  <span>↗</span>
                </a>
              ) : (
                <button
                  type="button"
                  className="public-scanner-open-button public-scanner-button-disabled"
                  disabled
                >
                  Scanner unavailable
                </button>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}