import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  calculateETFPortfolioTotals,
  getPublicETFs,
} from "../../services/etfService";
import { loadSettings } from "../../services/settingsService";
import "./ETF.css";

const ETF_TYPES = [
  "Index ETF",
  "Sectoral / Thematic ETF",
  "Commodity ETF",
  "International ETF",
  "Other ETF",
];

const getETFTypeLabel = (type) =>
  type === "Other ETF" ? "Diversified ETF" : type;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest Added" },
  { value: "name-asc", label: "Name A → Z" },
  { value: "return-desc", label: "Return %: High → Low" },
  { value: "return-asc", label: "Return %: Low → High" },
  { value: "invested-desc", label: "Invested: High → Low" },
  { value: "value-desc", label: "Current Value: High → Low" },
  { value: "cmp-desc", label: "CMP: High → Low" },
];

const PAGE_SIZE = 10;

const formatCurrency = (
  value,
  maximumFractionDigits = 2
) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(Number(value || 0));

const formatNumber = (value, digits = 2) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });

export default function ETF() {
  const navigate = useNavigate();

  const [etfs, setETFs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageEnabled, setPageEnabled] =
    useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
    useState("All");
  const [sortBy, setSortBy] =
    useState("newest");
  const [currentPage, setCurrentPage] =
    useState(1);

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);

        const [settings, data] =
          await Promise.all([
            loadSettings(),
            getPublicETFs(),
          ]);

        const enabled =
          settings?.website?.showETF === true;

        setPageEnabled(enabled);

        if (enabled) {
          setETFs(data || []);
        } else {
          setETFs([]);
        }
      } catch (error) {
        console.error(
          "Public ETF page load error:",
          error
        );

        setETFs([]);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, []);

  const filteredETFs = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    const filtered = etfs.filter(
      (etf) => {
        const matchesSearch =
          !query ||
          etf.name
            ?.toLowerCase()
            .includes(query) ||
          etf.symbol
            ?.toLowerCase()
            .includes(query) ||
          etf.fullName
            ?.toLowerCase()
            .includes(query);

        const matchesType =
          typeFilter === "All" ||
          etf.etfType === typeFilter;

        return (
          matchesSearch &&
          matchesType
        );
      }
    );

    return [...filtered].sort(
      (a, b) => {
        switch (sortBy) {
          case "name-asc":
            return String(
              a.name || ""
            ).localeCompare(
              String(b.name || "")
            );

          case "return-desc":
            return (
              Number(
                b.returnPercentage ||
                  0
              ) -
              Number(
                a.returnPercentage ||
                  0
              )
            );

          case "return-asc":
            return (
              Number(
                a.returnPercentage ||
                  0
              ) -
              Number(
                b.returnPercentage ||
                  0
              )
            );

          case "invested-desc":
            return (
              Number(
                b.totalInvested || 0
              ) -
              Number(
                a.totalInvested || 0
              )
            );

          case "value-desc":
            return (
              Number(
                b.currentValue || 0
              ) -
              Number(
                a.currentValue || 0
              )
            );

          case "cmp-desc":
            return (
              Number(b.cmp || 0) -
              Number(a.cmp || 0)
            );

          case "newest":
          default:
            return (
              new Date(
                b.createdAt || 0
              ).getTime() -
              new Date(
                a.createdAt || 0
              ).getTime()
            );
        }
      }
    );
  }, [
    etfs,
    search,
    typeFilter,
    sortBy,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, sortBy]);

  const totals = useMemo(
    () =>
      calculateETFPortfolioTotals(
        etfs
      ),
    [etfs]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredETFs.length /
        PAGE_SIZE
    )
  );

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const paginatedETFs =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        PAGE_SIZE;

      return filteredETFs.slice(
        startIndex,
        startIndex +
          PAGE_SIZE
      );
    }, [
      filteredETFs,
      currentPage,
    ]);

  if (loading) {
    return (
      <div className="public-etf-page">
        <div className="public-etf-state">
          Loading ETF Portfolio...
        </div>
      </div>
    );
  }

  if (!pageEnabled) {
    return (
      <div className="public-etf-page">
        <div className="public-etf-state">
          <h2>
            ETF Portfolio is currently
            unavailable.
          </h2>

          <p>
            Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-etf-page">
      <section className="public-etf-hero">
        <p className="public-etf-eyebrow">
          VTKS LONG-TERM ETF PORTFOLIO
        </p>

        <h1>
          Building Wealth Through SIP
        </h1>

        <p className="public-etf-intro">
          A disciplined and transparent SIP accumulation framework with a 3-year minimum commitment, built for long-term wealth creation across 10, 15, and 20-year horizons, with documented accumulation records and market-linked portfolio tracking.
        </p>
      </section>

      <section className="public-etf-summary-grid">
        <article className="public-etf-summary-card">
          <span>
            ETFs Tracked
          </span>

          <strong>
            {totals.etfCount}
          </strong>

          <small>
            Published ETF records
          </small>
        </article>

        <article className="public-etf-summary-card">
          <span>
            Total Invested
          </span>

          <strong>
            {formatCurrency(
              totals.totalInvested
            )}
          </strong>

          <small>
            Across published
            accumulations
          </small>
        </article>

        <article className="public-etf-summary-card">
          <span>
            Current Value
          </span>

          <strong>
            {formatCurrency(
              totals.currentValue
            )}
          </strong>

          <small>
            Based on current CMP
          </small>
        </article>

        <article className="public-etf-summary-card">
          <span>
            Overall Change
          </span>

          <strong
            className={
              totals.gainLoss >= 0
                ? "public-etf-positive"
                : "public-etf-negative"
            }
          >
            {totals.gainLoss >= 0
              ? "+"
              : ""}
            {formatCurrency(
              totals.gainLoss
            )}
          </strong>

          <small
            className={
              totals.returnPercentage >=
              0
                ? "public-etf-positive"
                : "public-etf-negative"
            }
          >
            {totals.returnPercentage >=
            0
              ? "+"
              : ""}
            {Number(
              totals.returnPercentage ||
                0
            ).toFixed(2)}
            %
          </small>
        </article>
      </section>

      <section className="public-etf-toolbar">
        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Search ETF name or symbol..."
        />

        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(
              event.target.value
            )
          }
        >
          <option value="All">
            All ETF Types
          </option>

          {ETF_TYPES.map(
            (type) => (
              <option
                key={type}
                value={type}
              >
                {getETFTypeLabel(type)}
              </option>
            )
          )}
        </select>

        <select
          value={sortBy}
          onChange={(event) =>
            setSortBy(
              event.target.value
            )
          }
        >
          {SORT_OPTIONS.map(
            (option) => (
              <option
                key={
                  option.value
                }
                value={
                  option.value
                }
              >
                {option.label}
              </option>
            )
          )}
        </select>

        {(search ||
          typeFilter !== "All" ||
          sortBy !== "newest") && (
          <button
            type="button"
            className="public-etf-clear"
            onClick={() => {
              setSearch("");
              setTypeFilter("All");
              setSortBy("newest");
              setCurrentPage(1);
            }}
          >
            Clear
          </button>
        )}
      </section>

      <section className="public-etf-table-card">
        {filteredETFs.length ===
        0 ? (
          <div className="public-etf-state">
            No published ETFs found.
          </div>
        ) : (
          <div className="public-etf-table-wrap">
            <table className="public-etf-table">
              <thead>
                <tr>
                  <th>ETF</th>
                  <th>Type</th>
                  <th>CMP</th>
                  <th>
                    Avg Price
                  </th>
                  <th>
                    Invested
                  </th>
                  <th>Units</th>
                  <th>
                    Current Value
                  </th>
                  <th>
                    Change
                  </th>
                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedETFs.map(
                  (etf) => {
                    const positive =
                      Number(
                        etf.returnPercentage ||
                          0
                      ) >= 0;

                    return (
                      <tr
                        key={etf.id}
                      >
                        <td>
                          <div className="public-etf-name-cell">
                            <strong>
                              {etf.name}
                            </strong>

                            <span>
                              {
                                etf.symbol
                              }
                            </span>

                            {etf.fullName && (
                              <small>
                                {
                                  etf.fullName
                                }
                              </small>
                            )}
                          </div>
                        </td>

                        <td>
                          <span className="public-etf-type">
                            {
                              etf.etfType
                            }
                          </span>
                        </td>

                        <td>
                          {formatCurrency(
                            etf.cmp
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            etf.averagePrice
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            etf.totalInvested
                          )}
                        </td>

                        <td>
                          {formatNumber(
                            etf.totalUnits,
                            4
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            etf.currentValue
                          )}
                        </td>

                        <td>
                          <div
                            className={
                              positive
                                ? "public-etf-positive"
                                : "public-etf-negative"
                            }
                          >
                            <strong>
                              {positive
                                ? "+"
                                : ""}
                              {Number(
                                etf.returnPercentage ||
                                  0
                              ).toFixed(
                                2
                              )}
                              %
                            </strong>

                            <small>
                              {Number(
                                etf.gainLoss ||
                                  0
                              ) >= 0
                                ? "+"
                                : ""}
                              {formatCurrency(
                                etf.gainLoss
                              )}
                            </small>
                          </div>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="public-etf-view-button"
                            onClick={() =>
                              navigate(
                                `/etf/${etf.id}`
                              )
                            }
                          >
                            View Analysis →
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {filteredETFs.length >
        0 && (
        <div className="public-etf-pagination">
          <span>
            Showing{" "}
            {(currentPage - 1) *
              PAGE_SIZE +
              1}
            {" - "}
            {Math.min(
              currentPage *
                PAGE_SIZE,
              filteredETFs.length
            )}{" "}
            of{" "}
            {
              filteredETFs.length
            }{" "}
            ETFs
          </span>

          <div>
            <button
              type="button"
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.max(
                      1,
                      page - 1
                    )
                )
              }
              disabled={
                currentPage === 1
              }
            >
              Previous
            </button>

            <strong>
              Page {currentPage} of{" "}
              {totalPages}
            </strong>

            <button
              type="button"
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.min(
                      totalPages,
                      page + 1
                    )
                )
              }
              disabled={
                currentPage ===
                totalPages
              }
            >
              Next
            </button>
          </div>
        </div>
      )}

      <p className="public-etf-disclaimer">
        <strong>Disclosure:</strong> The VTKS Long-Term ETF Portfolio is
        presented solely for educational and informational purposes and
        documents a structured approach to ETF accumulation with a
        long-term investment horizon of approximately 5–10 years. It is
        not an investment advisory service, portfolio management service,
        mutual fund, or an offer or solicitation to buy or sell any
        security. ETF prices and returns are market-linked and may
        fluctuate, and past performance does not guarantee future
        results. Investors should independently evaluate their financial
        objectives, risk tolerance and suitability, conduct their own
        research, and where appropriate consult a SEBI-registered
        investment adviser before making investment decisions.
      </p>
    </div>
  );
}
