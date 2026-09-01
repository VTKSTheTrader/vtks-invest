import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getHoldings,
  mapHoldingFromDB,
} from "../../services/holdingService";

import "./Accuracy.css";

const PAGE_SIZE = 5;

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const COMPLETED_STATUSES = [
  "booked profit",
  "booked loss",
  "breakeven",
  "sl hit",
  "target 1 hit",
  "target 2 hit",
  "target 3 hit",
];

export default function Accuracy() {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [access, setAccess] = useState("all");
  const [sector, setSector] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadStudies();
  }, []);

  const loadStudies = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const rows = await getHoldings();

      const mapped = (rows || [])
        .map(mapHoldingFromDB)
        .filter((holding) => {
          const publishStatus = normalize(
            holding.publishStatus ||
              holding.publish_status
          );

          const tradeStatus = normalize(
            holding.tradeStatus ||
              holding.trade_status ||
              holding.status
          );

          return (
            publishStatus !== "draft" &&
            tradeStatus !== "cancelled" &&
            holding.accuracyShow !== false
          );
        });

      setHoldings(mapped);
    } catch (error) {
      console.error(
        "Accuracy page load error:",
        error
      );

      setLoadError(
        error?.message ||
          "Failed to load market studies."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (holding) =>
    normalize(
      holding.tradeStatus ||
        holding.trade_status ||
        holding.status ||
        "active"
    );

  const isCompleted = (holding) =>
    COMPLETED_STATUSES.includes(
      getStatus(holding)
    );

  const isProtected = (holding) => {
    const visibility = normalize(
      holding.visibility
    );

    const isMember =
      visibility === "subscriber" ||
      visibility === "community";

    return (
      visibility === "private" ||
      (isMember &&
        holding.accuracyBlur !== false)
    );
  };

  const getDisplayPrice = (holding) => {
    const exitPrice = Number(
      holding.exitPrice ??
        holding.exit_price ??
        0
    );

    if (
      isCompleted(holding) &&
      Number.isFinite(exitPrice) &&
      exitPrice > 0
    ) {
      return exitPrice;
    }

    return Number(
      holding.cmp ||
        holding.entry ||
        0
    );
  };

  const getMovement = (holding) => {
    const entry = Number(
      holding.entry || 0
    );

    if (
      !Number.isFinite(entry) ||
      entry <= 0
    ) {
      return 0;
    }

    const savedReturn =
      holding.realisedReturn ??
      holding.realised_return;

    if (
      isCompleted(holding) &&
      savedReturn !== null &&
      savedReturn !== undefined &&
      savedReturn !== ""
    ) {
      const parsed = Number(savedReturn);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    const displayPrice =
      getDisplayPrice(holding);

    if (
      !Number.isFinite(displayPrice) ||
      displayPrice <= 0
    ) {
      return 0;
    }

    return (
      ((displayPrice - entry) / entry) *
      100
    );
  };

  const getPublishedDate = (holding) =>
    holding.recommendationDate ||
    holding.recommendation_date ||
    holding.createdAt ||
    holding.created_at ||
    "";

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(
      String(value).includes("T")
        ? value
        : `${value}T00:00:00`
    );

    if (
      Number.isNaN(date.getTime())
    ) {
      return String(value);
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatPrice = (value) => {
    const number = Number(value || 0);

    if (
      !Number.isFinite(number) ||
      number <= 0
    ) {
      return "₹—";
    }

    return `₹${number.toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      }
    )}`;
  };


  const getReferenceStructure = (holding) => ({
    risk: Number(
      holding.stopLoss ??
        holding.stop_loss ??
        0
    ),
    reference: Number(
      holding.entry || 0
    ),
    zone1: Number(
      holding.target1 ??
        holding.target_1 ??
        0
    ),
    zone2: Number(
      holding.target2 ??
        holding.target_2 ??
        0
    ),
  });

  const publicStudies = useMemo(
    () =>
      holdings.filter(
        (holding) => !isProtected(holding)
      ),
    [holdings]
  );

 const completedStudies = useMemo(
  () =>
    holdings.filter(
      (holding) =>
        isCompleted(holding) &&
        normalize(holding.visibility) !== "private"
    ),
  [holdings]
);

  const ongoingStudies = useMemo(
    () =>
      holdings.filter(
        (holding) =>
          !isCompleted(holding)
      ),
    [holdings]
  );

  const completedAboveReference =
    useMemo(
      () =>
        completedStudies.filter(
          (holding) =>
            getMovement(holding) > 0
        ).length,
      [completedStudies]
    );

  const completedBelowReference =
    useMemo(
      () =>
        completedStudies.filter(
          (holding) =>
            getMovement(holding) < 0
        ).length,
      [completedStudies]
    );

  const completedUnchanged =
    Math.max(
      0,
      completedStudies.length -
        completedAboveReference -
        completedBelowReference
    );

  const averageOngoingMovement =
    ongoingStudies.length > 0
      ? ongoingStudies.reduce(
          (sum, holding) =>
            sum + getMovement(holding),
          0
        ) / ongoingStudies.length
      : 0;

  const averageCompletedMovement =
    completedStudies.length > 0
      ? completedStudies.reduce(
          (sum, holding) =>
            sum + getMovement(holding),
          0
        ) / completedStudies.length
      : 0;

  const sectors = useMemo(
    () =>
      [
        ...new Set(
          holdings
            .map(
              (holding) =>
                String(
                  holding.sector ||
                    "General"
                ).trim()
            )
            .filter(Boolean)
        ),
      ].sort((a, b) =>
        a.localeCompare(b)
      ),
    [holdings]
  );

  const filteredStudies =
    useMemo(() => {
      const query = normalize(search);

      let rows = holdings.filter(
        (holding) => {
          const stock = normalize(
            holding.stock
          );

          const holdingSector =
            normalize(
              holding.sector ||
                "General"
            );

          const visibility =
            normalize(
              holding.visibility
            );

          const protectedStudy =
            isProtected(holding);

          const matchesTab =
            tab === "all" ||
            (tab === "ongoing" &&
              !isCompleted(holding)) ||
            (tab === "completed" &&
              isCompleted(holding));

          const matchesSearch =
            !query ||
            stock.includes(query) ||
            holdingSector.includes(query);

          const matchesAccess =
            access === "all" ||
            (access === "public" &&
              !protectedStudy) ||
            (access === "subscriber" &&
              protectedStudy);

          const matchesSector =
            sector === "all" ||
            holdingSector ===
              normalize(sector);

          return (
            matchesTab &&
            matchesSearch &&
            matchesAccess &&
            matchesSector &&
            visibility !== "private"
          );
        }
      );

      rows = [...rows].sort(
        (first, second) => {
          if (sort === "movementHigh") {
            return (
              getMovement(second) -
              getMovement(first)
            );
          }

          if (sort === "movementLow") {
            return (
              getMovement(first) -
              getMovement(second)
            );
          }

          const firstDate =
            new Date(
              getPublishedDate(first) || 0
            ).getTime();

          const secondDate =
            new Date(
              getPublishedDate(second) || 0
            ).getTime();

          if (sort === "oldest") {
            return firstDate - secondDate;
          }

          return secondDate - firstDate;
        }
      );

      return rows;
    }, [
      holdings,
      tab,
      search,
      access,
      sector,
      sort,
    ]);

  useEffect(() => {
    setPage(1);
  }, [
    tab,
    search,
    access,
    sector,
    sort,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredStudies.length /
        PAGE_SIZE
    )
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedStudies =
    useMemo(() => {
      const start =
        (page - 1) * PAGE_SIZE;

      return filteredStudies.slice(
        start,
        start + PAGE_SIZE
      );
    }, [
      filteredStudies,
      page,
    ]);

  const distribution = useMemo(() => {
    const buckets = [
      {
        label: "Below 0%",
        count: 0,
      },
      {
        label: "0% to 10%",
        count: 0,
      },
      {
        label: "10% to 25%",
        count: 0,
      },
      {
        label: "25% to 50%",
        count: 0,
      },
      {
        label: "50% and above",
        count: 0,
      },
    ];

    completedStudies.forEach(
      (holding) => {
        const move = getMovement(
          holding
        );

        if (move < 0) {
          buckets[0].count += 1;
        } else if (move < 10) {
          buckets[1].count += 1;
        } else if (move < 25) {
          buckets[2].count += 1;
        } else if (move < 50) {
          buckets[3].count += 1;
        } else {
          buckets[4].count += 1;
        }
      }
    );

    return buckets;
  }, [completedStudies]);

  const publicCount =
    holdings.filter(
      (holding) =>
        !isProtected(holding)
    ).length;

  const membersCount =
    Math.max(
      0,
      holdings.length - publicCount
    );

  if (loading) {
    return (
      <main className="accuracy-page">
        <div className="accuracy-state-card">
          Loading market studies...
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="accuracy-page">
        <div className="accuracy-state-card">
          <h2>
            Unable to load studies
          </h2>
          <p>{loadError}</p>
          <button
            type="button"
            onClick={loadStudies}
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="accuracy-page">
      <div className="accuracy-shell">

        <section className="accuracy-header">
          <div className="accuracy-heading-icon">
            📊
          </div>

          <div>
            <h1>
              VTKS Market Studies
            </h1>

            <p>
              Documenting market structure,
              reference levels and subsequent
              price behaviour for research and
              learning.
            </p>
          </div>
        </section>

        <div className="accuracy-layout">

          <section className="accuracy-main">

            <div className="accuracy-stats">
              <StatCard
                value={holdings.length}
                label="Total Studies"
                helper="Across all studies"
                tone="blue"
              />

              <StatCard
                value={
                  ongoingStudies.length
                }
                label="Ongoing Studies"
                helper="Active monitoring"
                tone="green"
              />

              <StatCard
                value={
                  completedStudies.length
                }
                label="Completed Studies"
                helper="Successfully completed"
                tone="purple"
              />

              <StatCard
                value={`${completedAboveReference} / ${completedStudies.length}`}
                label="Above Reference"
                helper="Completed studies"
                tone="orange"
              />
            </div>

            <div className="accuracy-toolbar">

              <div className="accuracy-tabs">
                {[
                  ["all", "All Studies"],
                  ["ongoing", "Ongoing"],
                  ["completed", "Completed"],
                ].map(
                  ([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setTab(value)
                      }
                      className={
                        tab === value
                          ? "active"
                          : ""
                      }
                    >
                      {label}
                    </button>
                  )
                )}
              </div>

              <div className="accuracy-filters">

                <div className="accuracy-search">
                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search studies, sectors..."
                  />
                  <span>⌕</span>
                </div>

                <select
                  value={access}
                  onChange={(event) =>
                    setAccess(
                      event.target.value
                    )
                  }
                >
                  <option value="all">
                    All Studies Access
                  </option>

                  <option value="public">
                    Public
                  </option>

                  <option value="subscriber">
                    Subscriber
                  </option>
                </select>

                <select
                  value={sector}
                  onChange={(event) =>
                    setSector(
                      event.target.value
                    )
                  }
                >
                  <option value="all">
                    All Sectors
                  </option>

                  {sectors.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={sort}
                  onChange={(event) =>
                    setSort(
                      event.target.value
                    )
                  }
                >
                  <option value="newest">
                    Newest First
                  </option>
                  <option value="oldest">
                    Oldest First
                  </option>
                  <option value="movementHigh">
                    Movement High → Low
                  </option>
                  <option value="movementLow">
                    Movement Low → High
                  </option>
                </select>
              </div>
            </div>

            <section className="accuracy-table-card">

              <div className="accuracy-table-heading">
                <div className="accuracy-table-heading-icon">
                  ↗
                </div>

                <div>
                  <h2>
                    Studies Performance
                  </h2>

                  <p>
                    Review ongoing and completed market studies
                    with documented reference prices and observed movement.
                  </p>
                </div>
              </div>

              <div className="accuracy-table-wrap">

                <table className="accuracy-table">
                  <thead>
                    <tr>
                      <th>Study</th>
                      <th>Horizon</th>
                      <th>Published</th>
                      <th>
                        Documented Reference Structure
                      </th>
                      <th>Movement</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedStudies.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="accuracy-empty-row"
                        >
                          No market studies match
                          the selected filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedStudies.map(
                        (holding) => {
                          const protectedStudy =
                            isProtected(holding);

                          const completed =
                            isCompleted(holding);

                          const movement =
                            getMovement(holding);

                          const horizon =
                            holding.tradeType ||
                            holding.trade_type ||
                            "Swing";

                          const structure =
                            getReferenceStructure(
                              holding
                            );

                          return (
                            <tr key={holding.id}>
                              <td>
                                <div className="accuracy-study-cell">
                                  <div
                                    className={`accuracy-study-avatar ${
                                      protectedStudy
                                        ? "locked"
                                        : ""
                                    }`}
                                  >
                                    {protectedStudy
                                      ? "🔒"
                                      : String(
                                          holding.stock ||
                                            "VT"
                                        )
                                          .slice(
                                            0,
                                            2
                                          )
                                          .toUpperCase()}
                                  </div>

                                  <div>
                                    <strong>
                                      {protectedStudy
                                        ? "Protected Market Study"
                                        : holding.stock ||
                                          "Market Study"}
                                    </strong>

                                    <span>
                                      {holding.sector ||
                                        "General"}
                                    </span>

                                    {protectedStudy && (
                                      <small>
                                        Members Only
                                      </small>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td>{horizon}</td>

                              <td>
                                {formatDate(
                                  getPublishedDate(
                                    holding
                                  )
                                )}
                              </td>

                              <td className="accuracy-structure-cell">
                                <div
                                  className={`accuracy-reference-structure ${
                                    protectedStudy
                                      ? "protected"
                                      : ""
                                  }`}
                                >
                                  <ReferencePoint
                                    tone="risk"
                                    value={
                                      protectedStudy
                                        ? null
                                        : structure.risk
                                    }
                                    label="Invalidation"
                                    locked={
                                      protectedStudy
                                    }
                                  />

                                  <ReferenceConnector tone="risk" />

                                  <ReferencePoint
                                    tone="reference"
                                    value={
                                      protectedStudy
                                        ? null
                                        : structure.reference
                                    }
                                    label="Reference"
                                    locked={
                                      protectedStudy
                                    }
                                  />

                                  <ReferenceConnector tone="reference" />

                                  <ReferencePoint
                                    tone="zone"
                                    value={
                                      protectedStudy
                                        ? null
                                        : structure.zone1
                                    }
                                    label="Zone 1"
                                    locked={
                                      protectedStudy
                                    }
                                  />

                                  <ReferenceConnector tone="zone" />

                                  <ReferencePoint
                                    tone="zone"
                                    value={
                                      protectedStudy
                                        ? null
                                        : structure.zone2
                                    }
                                    label="Zone 2"
                                    locked={
                                      protectedStudy
                                    }
                                  />
                                </div>
                              </td>

                              <td>
                                {protectedStudy ? (
                                  <span className="accuracy-locked-movement">
                                    🔒 Locked
                                  </span>
                                ) : (
                                  <div className="accuracy-movement-cell">
                                    <strong
                                      className={
                                        movement >= 0
                                          ? "accuracy-positive"
                                          : "accuracy-negative"
                                      }
                                    >
                                      {movement >= 0
                                        ? "+"
                                        : ""}
                                      {movement.toFixed(
                                        2
                                      )}
                                      %
                                    </strong>

                                    <small>
                                      {completed
                                        ? "Recorded"
                                        : "Ongoing"}
                                    </small>
                                  </div>
                                )}
                              </td>

                              <td>
                                <span
                                  className={`accuracy-status ${
                                    completed
                                      ? "completed"
                                      : "ongoing"
                                  }`}
                                >
                                  <i />
                                  {completed
                                    ? "Completed"
                                    : "Ongoing"}
                                </span>
                              </td>
                            </tr>
                          );
                        }
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="accuracy-table-footer">
                <span>
                  Showing{" "}
                  {filteredStudies.length === 0
                    ? 0
                    : (page - 1) *
                        PAGE_SIZE +
                      1}
                  {" "}to{" "}
                  {Math.min(
                    page * PAGE_SIZE,
                    filteredStudies.length
                  )}
                  {" "}of{" "}
                  {filteredStudies.length}
                  {" "}studies
                </span>

                <div className="accuracy-pagination">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage((value) =>
                        Math.max(
                          1,
                          value - 1
                        )
                      )
                    }
                  >
                    ‹
                  </button>

                  {Array.from(
                    {
                      length:
                        totalPages,
                    },
                    (_, index) =>
                      index + 1
                  ).map(
                    (number) => (
                      <button
                        key={number}
                        type="button"
                        onClick={() =>
                          setPage(number)
                        }
                        className={
                          page === number
                            ? "active"
                            : ""
                        }
                      >
                        {number}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    disabled={
                      page >= totalPages
                    }
                    onClick={() =>
                      setPage((value) =>
                        Math.min(
                          totalPages,
                          value + 1
                        )
                      )
                    }
                  >
                    ›
                  </button>
                </div>
              </div>
            </section>

            {/* =====================================================
                IMPORTANT EDUCATIONAL / RESEARCH DISCLOSURE
            ===================================================== */}



          </section>

          <aside className="accuracy-sidebar">

            <article className="accuracy-side-card accuracy-live-card">
              <div className="accuracy-side-icon blue">
                ↗
              </div>

              <div>
                <span>
                  Average Ongoing Movement
                </span>

                <strong
                  className={
                    averageOngoingMovement >= 0
                      ? "accuracy-positive"
                      : "accuracy-negative"
                  }
                >
                  {averageOngoingMovement >= 0
                    ? "+"
                    : ""}
                  {averageOngoingMovement.toFixed(
                    2
                  )}
                  %
                </strong>

                <small>
                  Across{" "}
                  {
                    ongoingStudies.length
                  }{" "}
                  ongoing studies
                </small>
              </div>
            </article>

            <article className="accuracy-side-card accuracy-average-card">
              <div className="accuracy-side-icon green">
                ↗
              </div>

              <div>
                <span>
                  Average Recorded Movement
                </span>

                <strong>
                  {averageCompletedMovement >= 0
                    ? "+"
                    : ""}
                  {averageCompletedMovement.toFixed(
                    2
                  )}
                  %
                </strong>

                <small>
                  Across{" "}
                  {
                    completedStudies.length
                  }{" "}
                  completed studies
                </small>
              </div>
            </article>

            <article className="accuracy-side-card">
              <div className="accuracy-side-title">
                <div className="accuracy-side-icon blue">
                  ◎
                </div>

                <div>
                  <h2>
                    Completed Study Summary
                  </h2>
                  <p>
                    Completed studies only
                  </p>
                </div>
              </div>

              <div className="accuracy-outcome-wrap">

                <div
                  className="accuracy-donut"
                  style={{
                    "--donut-percent":
                      `${
                        completedStudies.length
                          ? (
                              (completedAboveReference /
                                completedStudies.length) *
                              100
                            ).toFixed(
                              2
                            )
                          : 0
                      }%`,
                  }}
                >
                  <div>
                    <strong>
                      {
                        completedStudies.length
                      }
                    </strong>
                    <span>Total</span>
                  </div>
                </div>

                <div className="accuracy-outcome-list">
                  <OutcomeRow
                    label="Above Reference"
                    count={
                      completedAboveReference
                    }
                    total={
                      completedStudies.length
                    }
                    tone="green"
                  />

                  <OutcomeRow
                    label="Below Reference"
                    count={
                      completedBelowReference
                    }
                    total={
                      completedStudies.length
                    }
                    tone="red"
                  />

                  <OutcomeRow
                    label="Unchanged"
                    count={
                      completedUnchanged
                    }
                    total={
                      completedStudies.length
                    }
                    tone="grey"
                  />
                </div>
              </div>

              <p className="accuracy-side-footnote">
                Based on{" "}
                {completedStudies.length}{" "}
                completed studies
              </p>
            </article>

            <article className="accuracy-side-card">
              <div className="accuracy-side-title">
                <div className="accuracy-side-icon purple">
                  ▥
                </div>

                <div>
                  <h2>
                    Movement Distribution
                  </h2>
                  <p>
                    Completed studies only
                  </p>
                </div>
              </div>

              <div className="accuracy-distribution">
                {distribution.map(
                  (item, index) => {
                    const percent =
                      completedStudies.length
                        ? (item.count /
                            completedStudies.length) *
                          100
                        : 0;

                    return (
                      <div
                        key={item.label}
                        className="accuracy-distribution-row"
                      >
                        <span>
                          {item.label}
                        </span>

                        <div>
                          <i
                            style={{
                              width: `${percent}%`,
                            }}
                            className={`bucket-${index}`}
                          />
                        </div>

                        <strong>
                          {item.count}
                        </strong>

                        <small>
                          (
                          {percent.toFixed(
                            2
                          )}
                          %)
                        </small>
                      </div>
                    );
                  }
                )}
              </div>
            </article>

            

          </aside>
        </div>

        {/* =====================================================
            FULL-WIDTH IMPORTANT DISCLOSURE
        ===================================================== */}

        <section className="accuracy-research-disclosure">
              <div className="accuracy-disclosure-head">
                <div className="accuracy-research-disclosure-icon">
                  🛡️
                </div>

                <div>
                  <h2>
                    Important Disclosure
                  </h2>

                  <p>
                    VTKS Market Studies are shared solely for
                    educational and research purposes. They document
                    market observations, reference levels and subsequent
                    price behaviour.
                  </p>
                </div>
              </div>

              <div className="accuracy-disclosure-grid">
                <article>
                  <div>⚖️</div>
                  <section>
                    <strong>
                      Not a Recommendation
                    </strong>
                    <span>
                      Not a buy/sell or investment recommendation.
                    </span>
                  </section>
                </article>

                <article>
                  <div>🛡️</div>
                  <section>
                    <strong>
                      No Assured Returns
                    </strong>
                    <span>
                      Markets are subject to risk. No assured or guaranteed returns.
                    </span>
                  </section>
                </article>

                <article>
                  <div>📊</div>
                  <section>
                    <strong>
                      Past Performance
                    </strong>
                    <span>
                      Past observations are not indicative of future results.
                    </span>
                  </section>
                </article>

                <article>
                  <div>🔎</div>
                  <section>
                    <strong>
                      Do Your Own Research
                    </strong>
                    <span>
                      Users should conduct independent analysis before investing.
                    </span>
                  </section>
                </article>
              </div>

              <div className="accuracy-member-note">
                🔒 Member-only study information remains protected
                and is intended exclusively for registered members.
              </div>
            </section>

      </div>
    </main>
  );
}

function ReferencePoint({
  tone,
  value,
  label,
  locked,
}) {
  return (
    <div
      className={`accuracy-reference-point ${tone}`}
    >
      <strong>
        {locked
          ? "🔒 •••••"
          : value > 0
            ? `₹${Number(
                value
              ).toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits:
                    2,
                }
              )}`
            : "₹—"}
      </strong>

      <i />

      <span>{label}</span>
    </div>
  );
}

function ReferenceConnector({
  tone,
}) {
  return (
    <span
      className={`accuracy-reference-connector ${tone}`}
      aria-hidden="true"
    />
  );
}

function StatCard({
  value,
  label,
  helper,
  tone,
}) {
  return (
    <article
      className={`accuracy-stat-card ${tone}`}
    >
      <strong>{value}</strong>

      <div>
        <span>{label}</span>
        <small>{helper}</small>
      </div>
    </article>
  );
}

function OutcomeRow({
  label,
  count,
  total,
  tone,
}) {
  const percent =
    total > 0
      ? (count / total) * 100
      : 0;

  return (
    <div className="accuracy-outcome-row">
      <span
        className={`accuracy-outcome-dot ${tone}`}
      />

      <span>{label}</span>

      <strong>{count}</strong>

      <small>
        ({percent.toFixed(2)}%)
      </small>
    </div>
  );
}
