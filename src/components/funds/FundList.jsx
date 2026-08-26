import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  getHoldings,
  mapHoldingFromDB,
} from "../../services/holdingService";

import Pagination from "../common/Pagination";

const ITEMS_PER_PAGE = 6;
const AUTO_REFRESH_INTERVAL = 60 * 1000;


/* =========================================================
   HELPERS
========================================================= */

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();


const getNumber = (...values) => {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      const number = Number(value);

      if (Number.isFinite(number)) {
        return number;
      }
    }
  }

  return 0;
};


const formatPrice = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "₹—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "₹—";
  }

  return `₹${number.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function FundList() {
  const navigate = useNavigate();

  const [holdings, setHoldings] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const requestInProgressRef =
    useRef(false);

  const mountedRef =
    useRef(true);

  const [search, setSearch] =
    useState("");

  const [sector, setSector] =
    useState("All");

  const [
    visibilityFilter,
    setVisibilityFilter,
  ] = useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [movementSort, setMovementSort] =
    useState("newest");

  const [currentPage, setCurrentPage] =
    useState(1);


  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadFund = useCallback(
    async ({
      showInitialLoader = false,
    } = {}) => {
      if (
        requestInProgressRef.current
      ) {
        return;
      }

      requestInProgressRef.current =
        true;

      try {
        if (showInitialLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setLoadError("");

        const rows =
          await getHoldings();

        if (!mountedRef.current) {
          return;
        }

        setHoldings(
          (rows || []).map(
            mapHoldingFromDB
          )
        );

        setLastUpdated(
          new Date()
        );
      } catch (error) {
        console.error(
          "Public market studies load error:",
          error
        );

        if (
          !mountedRef.current
        ) {
          return;
        }

        setLoadError(
          error?.message ||
            "Failed to load market studies."
        );
      } finally {
        requestInProgressRef.current =
          false;

        if (
          mountedRef.current
        ) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    []
  );


  /* =========================================================
     AUTO REFRESH
  ========================================================= */

  useEffect(() => {
    mountedRef.current = true;

    loadFund({
      showInitialLoader: true,
    });

    const intervalId =
      window.setInterval(
        () => {
          if (
            document.visibilityState ===
            "visible"
          ) {
            loadFund();
          }
        },
        AUTO_REFRESH_INTERVAL
      );

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          loadFund();
        }
      };

    const handleWindowFocus = () => {
      loadFund();
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener(
      "focus",
      handleWindowFocus
    );

    return () => {
      mountedRef.current = false;

      window.clearInterval(
        intervalId
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "focus",
        handleWindowFocus
      );
    };
  }, [loadFund]);


  /* =========================================================
     INTERNAL STATUS
     DB / ADMIN LOGIC REMAINS UNCHANGED
  ========================================================= */

  const getInternalStatus = useCallback(
    (holding) => {
      const manualStatus = String(
        holding.tradeStatus ||
          holding.trade_status ||
          ""
      ).trim();

      if (
        [
          "Booked Profit",
          "Booked Loss",
          "Breakeven",
          "Cancelled",
        ].includes(manualStatus)
      ) {
        return manualStatus;
      }

      const highestPrice = getNumber(
        holding.highestPrice,
        holding.highest_price,
        holding.cmp
      );

      const lowestPrice = getNumber(
        holding.lowestPrice,
        holding.lowest_price,
        holding.cmp
      );

      const stopLoss = getNumber(
        holding.stopLoss,
        holding.stop_loss
      );

      const target1 =
        getNumber(
          holding.target1
        );

      const target2 =
        getNumber(
          holding.target2
        );

      const target3 =
        getNumber(
          holding.target3
        );

      if (
        stopLoss > 0 &&
        lowestPrice <= stopLoss
      ) {
        return "SL Hit";
      }

      if (
        target3 > 0 &&
        highestPrice >= target3
      ) {
        return "Target 3 Hit";
      }

      if (
        target2 > 0 &&
        highestPrice >= target2
      ) {
        return "Target 2 Hit";
      }

      if (
        target1 > 0 &&
        highestPrice >= target1
      ) {
        return "Target 1 Hit";
      }

      return "Active";
    },
    []
  );


  /* =========================================================
     PUBLIC STATUS
  ========================================================= */

  const isCompletedStudy =
    useCallback(
      (holding) => {
        const status =
          getInternalStatus(
            holding
          );

        return [
          "Booked Profit",
          "Booked Loss",
          "Breakeven",
          "SL Hit",
        ].includes(status);
      },
      [getInternalStatus]
    );


  const getPublicStatus =
    useCallback(
      (holding) =>
        isCompletedStudy(holding)
          ? "Completed"
          : "Ongoing",
      [isCompletedStudy]
    );


  /* =========================================================
     PRICE MOVEMENT
  ========================================================= */

  const getMovement = useCallback(
    (holding) => {
      const referencePrice =
        getNumber(
          holding.entry
        );

      if (
        referencePrice <= 0
      ) {
        return 0;
      }

      const internalStatus =
        getInternalStatus(
          holding
        );

      const completed = [
        "Booked Profit",
        "Booked Loss",
        "Breakeven",
        "SL Hit",
      ].includes(
        internalStatus
      );

      if (completed) {
        const savedMovement =
          holding.realisedReturn ??
          holding.realised_return;

        if (
          savedMovement !== null &&
          savedMovement !== undefined &&
          savedMovement !== ""
        ) {
          const movement =
            Number(
              savedMovement
            );

          if (
            Number.isFinite(
              movement
            )
          ) {
            return movement;
          }
        }

        const exitPrice =
          getNumber(
            holding.exitPrice,
            holding.exit_price
          );

        if (
          exitPrice > 0
        ) {
          return (
            (
              exitPrice -
              referencePrice
            ) /
            referencePrice
          ) * 100;
        }
      }

      const currentReference =
        getNumber(
          holding.cmp,
          referencePrice
        );

      return (
        (
          currentReference -
          referencePrice
        ) /
        referencePrice
      ) * 100;
    },
    [getInternalStatus]
  );


  /* =========================================================
     PUBLIC VISIBILITY
  ========================================================= */

  const visibleHoldings =
    useMemo(() => {
      return holdings.filter(
        (holding) => {
          const visibility =
            normalize(
              holding.visibility
            );

          const publishStatus =
            normalize(
              holding.publishStatus ||
                holding.publish_status
            );

          const allowedVisibility =
            [
              "public",
              "subscriber",
              "community",
            ].includes(
              visibility
            );

          return (
            allowedVisibility &&
            visibility !==
              "private" &&
            publishStatus !==
              "draft" &&
            holding.accuracyShow !==
              false &&
            holding.accuracy_show !==
              false &&
            getInternalStatus(
              holding
            ) !== "Cancelled"
          );
        }
      );
    }, [
      holdings,
      getInternalStatus,
    ]);


  /* =========================================================
     PROTECTED STUDY
  ========================================================= */

  const isProtectedStudy =
    useCallback(
      (holding) => {
        const visibility =
          normalize(
            holding.visibility
          );

        const subscriberStudy =
          visibility ===
            "subscriber" ||
          visibility ===
            "community";

        return (
          subscriberStudy &&
          Boolean(
            holding.accuracyBlur ??
              holding.accuracy_blur
          )
        );
      },
      []
    );


  /* =========================================================
     SECTORS
  ========================================================= */

  const sectors =
    useMemo(() => {
      return [
        "All",

        ...Array.from(
          new Set(
            visibleHoldings
              .map(
                (holding) =>
                  holding.sector ||
                  "General"
              )
              .filter(Boolean)
          )
        ).sort(),
      ];
    }, [
      visibleHoldings,
    ]);


  /* =========================================================
     FILTERS
  ========================================================= */

  const filteredHoldings =
    useMemo(() => {
      const query =
        normalize(
          search
        );

      return visibleHoldings.filter(
        (holding) => {
          const visibility =
            normalize(
              holding.visibility
            );

          const protectedStudy =
            isProtectedStudy(
              holding
            );

          const searchableValues =
            protectedStudy
              ? [
                  holding.sector,
                  holding.tradeType,
                  holding.trade_type,
                  getPublicStatus(
                    holding
                  ),
                ]
              : [
                  holding.stock,
                  holding.symbol,
                  holding.sector,
                  holding.tradeType,
                  holding.trade_type,
                  getPublicStatus(
                    holding
                  ),
                ];

          const matchesSearch =
            !query ||
            searchableValues.some(
              (value) =>
                normalize(
                  value
                ).includes(
                  query
                )
            );

          const matchesSector =
            sector === "All" ||
            (
              holding.sector ||
              "General"
            ) === sector;

          const matchesVisibility =
            visibilityFilter ===
              "all" ||
            (
              visibilityFilter ===
                "public" &&
              visibility ===
                "public"
            ) ||
            (
              visibilityFilter ===
                "protected" &&
              [
                "subscriber",
                "community",
              ].includes(
                visibility
              )
            );

          const publicStatus =
            getPublicStatus(
              holding
            );

          const matchesStatus =
            statusFilter ===
              "all" ||
            (
              statusFilter ===
                "ongoing" &&
              publicStatus ===
                "Ongoing"
            ) ||
            (
              statusFilter ===
                "completed" &&
              publicStatus ===
                "Completed"
            );

          return (
            matchesSearch &&
            matchesSector &&
            matchesVisibility &&
            matchesStatus
          );
        }
      );
    }, [
      visibleHoldings,
      search,
      sector,
      visibilityFilter,
      statusFilter,
      getPublicStatus,
      isProtectedStudy,
    ]);


  /* =========================================================
     SORT
  ========================================================= */

  const sortedHoldings =
    useMemo(() => {
      const rows = [
        ...filteredHoldings,
      ];

      const getTimestamp = (
        holding
      ) => {
        const dateValue =
          holding.recommendationDate ||
          holding.recommendation_date ||
          holding.createdAt ||
          holding.created_at;

        if (!dateValue) {
          return 0;
        }

        const timestamp =
          new Date(
            dateValue
          ).getTime();

        return Number.isNaN(
          timestamp
        )
          ? 0
          : timestamp;
      };

      if (
        movementSort ===
        "movement-high"
      ) {
        rows.sort(
          (a, b) =>
            getMovement(b) -
            getMovement(a)
        );
      } else if (
        movementSort ===
        "movement-low"
      ) {
        rows.sort(
          (a, b) =>
            getMovement(a) -
            getMovement(b)
        );
      } else if (
        movementSort ===
        "oldest"
      ) {
        rows.sort(
          (a, b) =>
            getTimestamp(a) -
            getTimestamp(b)
        );
      } else {
        rows.sort(
          (a, b) =>
            getTimestamp(b) -
            getTimestamp(a)
        );
      }

      return rows;
    }, [
      filteredHoldings,
      movementSort,
      getMovement,
    ]);


  /* =========================================================
     RESET PAGE
  ========================================================= */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    sector,
    visibilityFilter,
    statusFilter,
    movementSort,
  ]);


  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        sortedHoldings.length /
          ITEMS_PER_PAGE
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


  const paginatedHoldings =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      return sortedHoldings.slice(
        startIndex,
        startIndex +
          ITEMS_PER_PAGE
      );
    }, [
      sortedHoldings,
      currentPage,
    ]);


  /* =========================================================
     COUNTS
  ========================================================= */

  const ongoingCount =
    visibleHoldings.filter(
      (holding) =>
        !isCompletedStudy(
          holding
        )
    ).length;


  const completedCount =
    visibleHoldings.filter(
      isCompletedStudy
    ).length;


  /* =========================================================
     UPDATED TIME
  ========================================================= */

  const formatUpdatedTime =
    (value) => {
      if (!value) {
        return "";
      }

      return value.toLocaleTimeString(
        "en-IN",
        {
          hour:
            "2-digit",

          minute:
            "2-digit",

          second:
            "2-digit",
        }
      );
    };


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <p style={loadingStyle}>
        Loading market studies...
      </p>
    );
  }


  /* =========================================================
     ERROR
  ========================================================= */

  if (
    loadError &&
    holdings.length === 0
  ) {
    return (
      <section style={errorStyle}>

        <h3>
          Unable to load market studies
        </h3>

        <p>
          {loadError}
        </p>

        <button
          type="button"
          onClick={() =>
            loadFund({
              showInitialLoader:
                true,
            })
          }
          style={
            retryButtonStyle
          }
        >
          Try Again
        </button>

      </section>
    );
  }


  /* =========================================================
     UI
  ========================================================= */

  return (
    <section style={wrapperStyle}>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div style={headerStyle}>

        <div>

          <h2 style={titleStyle}>
            Market Study Archive
          </h2>

          <p style={subtitleStyle}>
            Documented market observations are
            presented with their original
            reference structure and subsequent
            price behaviour for research,
            review and learning.
          </p>

        </div>

        <div style={headerActionsStyle}>

          <span style={countBadgeStyle}>
            {visibleHoldings.length}{" "}
            Documented Studies
          </span>

          <button
            type="button"
            onClick={() =>
              loadFund()
            }
            disabled={
              refreshing
            }
            style={{
              ...refreshButtonStyle,

              cursor:
                refreshing
                  ? "not-allowed"
                  : "pointer",

              opacity:
                refreshing
                  ? 0.7
                  : 1,
            }}
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh Data"}
          </button>

          <small style={updatedTextStyle}>
            {lastUpdated
              ? `Last updated: ${formatUpdatedTime(
                  lastUpdated
                )}`
              : "Waiting for latest data"}
          </small>

        </div>

      </div>


      {/* =====================================================
          INLINE ERROR
      ===================================================== */}

      {loadError && (
        <div style={inlineErrorStyle}>
          {loadError}
        </div>
      )}


      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div style={summaryGridStyle}>

        <SummaryCard
          value={
            visibleHoldings.length
          }
          label="Documented Studies"
        />

        <SummaryCard
          value={
            ongoingCount
          }
          label="Ongoing Studies"
          valueColor="#16a34a"
        />

        <SummaryCard
          value={
            completedCount
          }
          label="Completed Studies"
          valueColor="#7c3aed"
        />

      </div>


      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div style={filtersStyle}>

        <input
          type="search"
          placeholder="Search studies, sectors..."
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          style={inputStyle}
        />


        <select
          value={sector}
          onChange={(event) =>
            setSector(
              event.target.value
            )
          }
          style={selectStyle}
        >

          {sectors.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item === "All"
                  ? "All Sectors"
                  : item}
              </option>
            )
          )}

        </select>


        <select
          value={
            visibilityFilter
          }
          onChange={(event) =>
            setVisibilityFilter(
              event.target.value
            )
          }
          style={selectStyle}
        >

          <option value="all">
            All Access
          </option>

          <option value="public">
            Published Studies
          </option>

          <option value="protected">
            Members-Only Studies
          </option>

        </select>


        <select
          value={
            statusFilter
          }
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
          style={selectStyle}
        >

          <option value="all">
            All Status
          </option>

          <option value="ongoing">
            Ongoing
          </option>

          <option value="completed">
            Completed
          </option>

        </select>


        <select
          value={
            movementSort
          }
          onChange={(event) =>
            setMovementSort(
              event.target.value
            )
          }
          style={selectStyle}
        >

          <option value="newest">
            Newest First
          </option>

          <option value="oldest">
            Oldest First
          </option>

          <option value="movement-high">
            Movement High → Low
          </option>

          <option value="movement-low">
            Movement Low → High
          </option>

        </select>

      </div>


      {/* =====================================================
          STUDIES
      ===================================================== */}

      {sortedHoldings.length ===
      0 ? (
        <div style={emptyStateStyle}>

          <h3>
            No studies found
          </h3>

          <p>
            No market study matches the
            selected filters.
          </p>

        </div>
      ) : (
        <>

          <div style={cardsGridStyle}>

            {paginatedHoldings.map(
              (holding) => (
                <MarketStudyCard
                  key={
                    holding.id
                  }
                  holding={
                    holding
                  }
                  protectedStudy={isProtectedStudy(
                    holding
                  )}
                  publicStatus={getPublicStatus(
                    holding
                  )}
                  movement={getMovement(
                    holding
                  )}
                  onViewStudy={() =>
  navigate(
    `/market-study/${holding.id}`
  )
}
                />
              )
            )}

          </div>


          <div style={paginationWrapStyle}>

            <Pagination
              currentPage={
                currentPage
              }
              totalPages={
                totalPages
              }
              onPageChange={
                setCurrentPage
              }
            />

          </div>


          {/* =================================================
              EDUCATIONAL / DISCLOSURE
          ================================================= */}

          <section style={learningDisclosureStyle}>

            <div style={learningDisclosureIconStyle}>
              🎓
            </div>

            <div style={learningDisclosureContentStyle}>

              <h2 style={learningDisclosureTitleStyle}>
                Learn Before You Invest
              </h2>

              <p style={learningDisclosureTextStyle}>
                Market studies published on VTKS
                are intended to help users
                understand market structure,
                documented reference levels,
                disciplined decision-making and
                risk management through
                historical examples.
              </p>

              <p style={learningDisclosureTextStyle}>
                Information displayed on this
                platform is provided solely for
                educational and research purposes.
                It should not be construed as
                investment advice, a buy or sell
                recommendation, personalised
                advice, solicitation or an
                assurance of future performance.
              </p>

              <p style={learningDisclosureTextStyle}>
                Investments in securities markets
                are subject to market risks.
                Historical price movement and past
                study outcomes do not guarantee
                future results. Users should
                conduct their own research and
                independently evaluate risk before
                making investment decisions.
              </p>

            </div>

          </section>

        </>
      )}

    </section>
  );
}


/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  value,
  label,
  valueColor = "#2563eb",
}) {
  return (
    <div style={summaryCardStyle}>

      <h3
        style={{
          ...summaryValueStyle,
          color:
            valueColor,
        }}
      >
        {value}
      </h3>

      <p style={summaryLabelStyle}>
        {label}
      </p>

    </div>
  );
}


/* =========================================================
   MARKET STUDY CARD
========================================================= */

function MarketStudyCard({
  holding,
  protectedStudy,
  publicStatus,
  movement,
  onViewStudy,
}) {
  const visibility =
    normalize(
      holding.visibility
    );

  const memberStudy =
    [
      "subscriber",
      "community",
    ].includes(
      visibility
    );

  const completed =
    publicStatus ===
    "Completed";

  const savedExitPrice =
    getNumber(
      holding.exitPrice,
      holding.exit_price
    );

  const referencePrice =
    getNumber(
      holding.entry
    );

  const currentReference =
    completed &&
    savedExitPrice > 0
      ? savedExitPrice
      : getNumber(
          holding.cmp
        );

  const invalidation =
    getNumber(
      holding.stopLoss,
      holding.stop_loss
    );

  const zone1 =
    getNumber(
      holding.target1
    );

  const zone2 =
    getNumber(
      holding.target2
    );

  const sector =
    holding.sector ||
    "General";

  const studyType =
    holding.tradeType ||
    holding.trade_type ||
    "Swing";


  const protectedValue = (
    <span style={protectedDotsStyle}>
      🔒 •••••
    </span>
  );


  return (
    <article style={studyCardStyle}>

      {/* =====================================================
          CARD HEADER
      ===================================================== */}

      <div style={studyCardTopStyle}>

        <div>

          <span
            style={
              protectedStudy
                ? memberBadgeStyle
                : publishedBadgeStyle
            }
          >
            {protectedStudy
              ? "🔒 Members-Only Study"
              : memberStudy
                ? "🌐 Published Study"
                : "🌐 Published Study"}
          </span>

        </div>

        <PublicStatusBadge
          status={
            publicStatus
          }
        />

      </div>


      {/* =====================================================
          IDENTITY
      ===================================================== */}

      <div style={studyIdentityStyle}>

        <div
          style={
            protectedStudy
              ? protectedStudyIconStyle
              : publicStudyIconStyle
          }
        >
          {protectedStudy
            ? "🔒"
            : "◎"}
        </div>

        <div style={{ minWidth: 0 }}>

          <h2 style={studyNameStyle}>
            {protectedStudy
              ? "Protected Market Study"
              : holding.stock ||
                holding.symbol ||
                "Market Study"}
          </h2>

          <div style={studyMetaStyle}>

            <span>
              {sector}
            </span>

            <span style={metaDotStyle}>
              •
            </span>

            <span>
              {studyType}
            </span>

          </div>

        </div>

      </div>


      {/* =====================================================
          SUMMARY VALUES
      ===================================================== */}

      <div style={studyValuesGridStyle}>

        <StudyValue
          label="Reference Price"
          value={
            protectedStudy
              ? protectedValue
              : formatPrice(
                  referencePrice
                )
          }
        />

        <StudyValue
          label={
            completed
              ? "Closing Reference"
              : "Current Reference"
          }
          value={
            protectedStudy
              ? protectedValue
              : formatPrice(
                  currentReference
                )
          }
        />

        <StudyValue
          label="Price Movement"
          value={
            protectedStudy ? (
              protectedValue
            ) : (
              <span
                style={{
                  color:
                    movement > 0
                      ? "#16a34a"
                      : movement < 0
                        ? "#dc2626"
                        : "#64748b",

                  fontWeight:
                    900,
                }}
              >
                {movement > 0
                  ? "+"
                  : ""}

                {Number(
                  movement || 0
                ).toFixed(
                  2
                )}
                %
              </span>
            )
          }
        />

      </div>


      {/* =====================================================
          DOCUMENTED REFERENCE STRUCTURE
      ===================================================== */}

      <div style={referencePanelStyle}>

        <p style={referencePanelTitleStyle}>
          DOCUMENTED REFERENCE STRUCTURE
        </p>

        {protectedStudy ? (
          <ProtectedReferenceStructure />
        ) : (
          <ReferenceStructure
            invalidation={
              invalidation
            }
            reference={
              referencePrice
            }
            zone1={
              zone1
            }
            zone2={
              zone2
            }
          />
        )}

      </div>


      {/* =====================================================
          CARD FOOTER
      ===================================================== */}

      <div style={studyCardFooterStyle}>

        <span style={studyTypeBadgeStyle}>
          {studyType}
        </span>

        {protectedStudy ? (
          <span style={protectedNoticeStyle}>
            🔒 Study details protected
          </span>
        ) : (
          <button
            type="button"
            onClick={
              onViewStudy
            }
            style={viewStudyButtonStyle}
          >
            View Study →
          </button>
        )}

      </div>

    </article>
  );
}


/* =========================================================
   STUDY VALUE
========================================================= */

function StudyValue({
  label,
  value,
}) {
  return (
    <div style={studyValueStyle}>

      <span style={studyValueLabelStyle}>
        {label}
      </span>

      <div style={studyValueNumberStyle}>
        {value}
      </div>

    </div>
  );
}


/* =========================================================
   PUBLIC STATUS
========================================================= */

function PublicStatusBadge({
  status,
}) {
  const completed =
    status ===
    "Completed";

  return (
    <span
      style={{
        ...publicStatusBaseStyle,

        background:
          completed
            ? "#dbeafe"
            : "#dcfce7",

        color:
          completed
            ? "#1d4ed8"
            : "#166534",
      }}
    >
      <span
        style={{
          width:
            "7px",

          height:
            "7px",

          borderRadius:
            "50%",

          background:
            completed
              ? "#2563eb"
              : "#16a34a",

          display:
            "inline-block",

          marginRight:
            "6px",
        }}
      />

      {status}
    </span>
  );
}


/* =========================================================
   REFERENCE STRUCTURE
========================================================= */

function ReferenceStructure({
  invalidation,
  reference,
  zone1,
  zone2,
}) {
  const points = [
    {
      label:
        "Invalidation",

      value:
        invalidation,

      color:
        "#ef4444",
    },

    {
      label:
        "Reference",

      value:
        reference,

      color:
        "#2563eb",
    },

    {
      label:
        "Zone 1",

      value:
        zone1,

      color:
        "#16a34a",
    },

    {
      label:
        "Zone 2",

      value:
        zone2,

      color:
        "#059669",
    },
  ];

  return (
    <div style={referenceStructureStyle}>

      <div style={referenceLineStyle} />

      {points.map(
        (point) => (
          <div
            key={
              point.label
            }
            style={referencePointStyle}
          >

            <span
              style={{
                ...referencePointDotStyle,

                background:
                  point.color,
              }}
            />

            <strong style={referencePriceStyle}>
              {formatPrice(
                point.value
              )}
            </strong>

            <small style={referenceLabelStyle}>
              {point.label}
            </small>

          </div>
        )
      )}

    </div>
  );
}


/* =========================================================
   PROTECTED REFERENCE STRUCTURE
========================================================= */

function ProtectedReferenceStructure() {
  const points = [
    "Invalidation",
    "Reference",
    "Zone 1",
    "Zone 2",
  ];

  return (
    <div style={protectedStructureStyle}>

      {points.map(
        (label) => (
          <div
            key={
              label
            }
            style={protectedReferencePointStyle}
          >

            <span style={protectedReferenceLockStyle}>
              🔒
            </span>

            <strong style={protectedReferenceDotsStyle}>
              •••••
            </strong>

            <small style={referenceLabelStyle}>
              {label}
            </small>

          </div>
        )
      )}

    </div>
  );
}


/* =========================================================
   STYLES
========================================================= */

const loadingStyle = {
  textAlign:
    "center",

  padding:
    "50px",

  color:
    "#64748b",
};


const errorStyle = {
  maxWidth:
    "700px",

  margin:
    "40px auto",

  padding:
    "35px",

  borderRadius:
    "20px",

  background:
    "#ffffff",

  textAlign:
    "center",

  color:
    "#64748b",
};


const retryButtonStyle = {
  marginTop:
    "12px",

  border:
    "none",

  borderRadius:
    "10px",

  padding:
    "11px 18px",

  background:
    "#2563eb",

  color:
    "#ffffff",

  fontWeight:
    800,

  cursor:
    "pointer",
};


const wrapperStyle = {
  width:
    "100%",

  maxWidth:
    "1500px",

  margin:
    "0 auto",

  padding:
    "clamp(18px, 2.5vw, 30px)",

  borderRadius:
    "24px",

  background:
    "#ffffff",

  boxShadow:
    "0 15px 40px rgba(15,23,42,.055)",

  boxSizing:
    "border-box",
};


const headerStyle = {
  display:
    "flex",

  alignItems:
    "flex-start",

  justifyContent:
    "space-between",

  gap:
    "24px",

  marginBottom:
    "22px",

  flexWrap:
    "wrap",
};


const headerActionsStyle = {
  display:
    "flex",

  flexDirection:
    "column",

  alignItems:
    "flex-end",

  gap:
    "8px",

  minWidth:
    0,
};


const titleStyle = {
  margin:
    "0 0 7px",

  color:
    "#071a3d",

  fontSize:
    "clamp(25px, 2vw, 32px)",

  lineHeight:
    1.15,

  fontWeight:
    800,
};


const subtitleStyle = {
  maxWidth:
    "820px",

  margin:
    0,

  color:
    "#64748b",

  fontSize:
    "14px",

  lineHeight:
    1.65,

  fontWeight:
    500,
};


const countBadgeStyle = {
  flexShrink:
    0,

  padding:
    "8px 14px",

  borderRadius:
    "999px",

  background:
    "#eaf2ff",

  color:
    "#1e40af",

  fontSize:
    "12px",

  fontWeight:
    800,
};


const refreshButtonStyle = {
  border:
    "1px solid #2563eb",

  borderRadius:
    "9px",

  padding:
    "10px 15px",

  background:
    "#ffffff",

  color:
    "#2563eb",

  fontSize:
    "12px",

  fontWeight:
    800,
};


const updatedTextStyle = {
  color:
    "#64748b",

  fontSize:
    "10px",
};


const inlineErrorStyle = {
  marginBottom:
    "18px",

  padding:
    "12px 14px",

  borderRadius:
    "10px",

  background:
    "#fee2e2",

  color:
    "#991b1b",

  fontSize:
    "12px",

  fontWeight:
    700,
};


/* =========================================================
   SUMMARY
========================================================= */

const summaryGridStyle = {
  display:
    "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",

  gap:
    "14px",

  marginBottom:
    "22px",
};


const summaryCardStyle = {
  padding:
    "18px 20px",

  border:
    "1px solid #dbe5f0",

  borderRadius:
    "14px",

  background:
    "#f8fafc",
};


const summaryValueStyle = {
  margin:
    "0 0 5px",

  fontSize:
    "26px",

  fontWeight:
    800,
};


const summaryLabelStyle = {
  margin:
    0,

  color:
    "#64748b",

  fontSize:
    "13px",

  fontWeight:
    600,
};


/* =========================================================
   FILTERS
========================================================= */

const filtersStyle = {
  display:
    "grid",

  gridTemplateColumns:
    "minmax(220px, 1.4fr) repeat(4, minmax(150px, 1fr))",

  gap:
    "10px",

  marginBottom:
    "24px",
};


const inputStyle = {
  width:
    "100%",

  minWidth:
    0,

  height:
    "44px",

  padding:
    "0 14px",

  border:
    "1px solid #cbd5e1",

  borderRadius:
    "10px",

  background:
    "#ffffff",

  color:
    "#0f172a",

  boxSizing:
    "border-box",

  fontSize:
    "12px",
};


const selectStyle = {
  width:
    "100%",

  minWidth:
    0,

  height:
    "44px",

  padding:
    "0 12px",

  border:
    "1px solid #cbd5e1",

  borderRadius:
    "10px",

  background:
    "#ffffff",

  color:
    "#0f172a",

  boxSizing:
    "border-box",

  fontSize:
    "12px",

  fontWeight:
    600,
};


/* =========================================================
   CARDS GRID
========================================================= */

const cardsGridStyle = {
  display:
    "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 440px), 1fr))",

  gap:
    "18px",
};


const studyCardStyle = {
  width:
    "100%",

  minWidth:
    0,

  padding:
    "20px",

  display:
    "flex",

  flexDirection:
    "column",

  border:
    "1px solid #dbe5f0",

  borderRadius:
    "18px",

  background:
    "#ffffff",

  boxShadow:
    "0 9px 24px rgba(15,23,42,.045)",

  boxSizing:
    "border-box",
};


const studyCardTopStyle = {
  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "space-between",

  gap:
    "12px",

  marginBottom:
    "17px",

  flexWrap:
    "wrap",
};


const publishedBadgeStyle = {
  display:
    "inline-flex",

  alignItems:
    "center",

  padding:
    "6px 10px",

  borderRadius:
    "999px",

  background:
    "#dcfce7",

  color:
    "#15803d",

  fontSize:
    "10px",

  fontWeight:
    800,
};


const memberBadgeStyle = {
  display:
    "inline-flex",

  alignItems:
    "center",

  padding:
    "6px 10px",

  borderRadius:
    "999px",

  background:
    "#fef3c7",

  color:
    "#92400e",

  fontSize:
    "10px",

  fontWeight:
    800,
};


const publicStatusBaseStyle = {
  display:
    "inline-flex",

  alignItems:
    "center",

  padding:
    "6px 10px",

  borderRadius:
    "999px",

  fontSize:
    "10px",

  fontWeight:
    800,

  whiteSpace:
    "nowrap",
};


/* =========================================================
   IDENTITY
========================================================= */

const studyIdentityStyle = {
  display:
    "flex",

  alignItems:
    "center",

  gap:
    "12px",

  marginBottom:
    "17px",
};


const publicStudyIconStyle = {
  width:
    "44px",

  height:
    "44px",

  flex:
    "0 0 44px",

  display:
    "grid",

  placeItems:
    "center",

  borderRadius:
    "50%",

  background:
    "#eaf2ff",

  color:
    "#2563eb",

  fontSize:
    "19px",

  fontWeight:
    800,
};


const protectedStudyIconStyle = {
  ...publicStudyIconStyle,

  background:
    "#fff3e3",

  color:
    "#ea580c",
};


const studyNameStyle = {
  margin:
    0,

  color:
    "#071a3d",

  fontSize:
    "20px",

  lineHeight:
    1.2,

  fontWeight:
    800,

  wordBreak:
    "break-word",
};


const studyMetaStyle = {
  display:
    "flex",

  alignItems:
    "center",

  gap:
    "7px",

  marginTop:
    "5px",

  color:
    "#64748b",

  fontSize:
    "10px",

  fontWeight:
    600,

  flexWrap:
    "wrap",
};


const metaDotStyle = {
  color:
    "#94a3b8",
};


/* =========================================================
   STUDY VALUES
========================================================= */

const studyValuesGridStyle = {
  display:
    "grid",

  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",

  border:
    "1px solid #e2e8f0",

  borderRadius:
    "10px",

  overflow:
    "hidden",

  marginBottom:
    "16px",
};


const studyValueStyle = {
  minWidth:
    0,

  minHeight:
    "78px",

  padding:
    "12px 10px",

  display:
    "flex",

  flexDirection:
    "column",

  justifyContent:
    "center",

  alignItems:
    "center",

  textAlign:
    "center",

  borderRight:
    "1px solid #e2e8f0",
};


const studyValueLabelStyle = {
  display:
    "block",

  marginBottom:
    "7px",

  color:
    "#64748b",

  fontSize:
    "9px",

  lineHeight:
    1.3,

  fontWeight:
    700,
};


const studyValueNumberStyle = {
  color:
    "#071a3d",

  fontSize:
    "16px",

  lineHeight:
    1.2,

  fontWeight:
    800,

  wordBreak:
    "break-word",
};


const protectedDotsStyle = {
  color:
    "#64748b",

  fontSize:
    "11px",

  fontWeight:
    700,

  letterSpacing:
    "1px",
};


/* =========================================================
   REFERENCE PANEL
========================================================= */

const referencePanelStyle = {
  padding:
    "14px 14px 10px",

  borderRadius:
    "10px",

  background:
    "#f8fafc",

  border:
    "1px solid #eef2f7",
};


const referencePanelTitleStyle = {
  margin:
    "0 0 13px",

  color:
    "#475569",

  fontSize:
    "8.5px",

  fontWeight:
    800,

  letterSpacing:
    ".025em",

  textAlign:
    "center",
};


const referenceStructureStyle = {
  position:
    "relative",

  display:
    "grid",

  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",

  gap:
    "6px",
};


const referenceLineStyle = {
  position:
    "absolute",

  top:
    "6px",

  left:
    "10%",

  right:
    "10%",

  height:
    "2px",

  background:
    "linear-gradient(90deg,#ef4444 0 33%,#2563eb 33% 58%,#22c55e 58% 100%)",
};


const referencePointStyle = {
  position:
    "relative",

  zIndex:
    2,

  display:
    "flex",

  flexDirection:
    "column",

  alignItems:
    "center",

  minWidth:
    0,

  textAlign:
    "center",
};


const referencePointDotStyle = {
  width:
    "10px",

  height:
    "10px",

  margin:
    "1px 0 5px",

  borderRadius:
    "50%",
};


const referencePriceStyle = {
  color:
    "#071a3d",

  fontSize:
    "10px",

  fontWeight:
    800,

  whiteSpace:
    "nowrap",
};


const referenceLabelStyle = {
  marginTop:
    "3px",

  color:
    "#64748b",

  fontSize:
    "8px",

  lineHeight:
    1.2,

  fontWeight:
    500,
};


/* =========================================================
   PROTECTED REFERENCE STRUCTURE
========================================================= */

const protectedStructureStyle = {
  display:
    "grid",

  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",

  gap:
    "8px",
};


const protectedReferencePointStyle = {
  display:
    "flex",

  flexDirection:
    "column",

  alignItems:
    "center",

  minWidth:
    0,

  textAlign:
    "center",
};


const protectedReferenceLockStyle = {
  fontSize:
    "10px",
};


const protectedReferenceDotsStyle = {
  marginTop:
    "3px",

  color:
    "#64748b",

  fontSize:
    "10px",

  fontWeight:
    700,

  letterSpacing:
    "1px",
};


/* =========================================================
   CARD FOOTER
========================================================= */

const studyCardFooterStyle = {
  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "space-between",

  gap:
    "10px",

  marginTop:
    "16px",

  flexWrap:
    "wrap",
};


const studyTypeBadgeStyle = {
  padding:
    "6px 10px",

  borderRadius:
    "999px",

  background:
    "#f1f5f9",

  color:
    "#334155",

  fontSize:
    "10px",

  fontWeight:
    800,
};


const protectedNoticeStyle = {
  color:
    "#92400e",

  fontSize:
    "10px",

  fontWeight:
    800,
};


const viewStudyButtonStyle = {
  border:
    "1px solid #2563eb",

  borderRadius:
    "9px",

  padding:
    "8px 13px",

  background:
    "#ffffff",

  color:
    "#2563eb",

  fontSize:
    "10px",

  fontWeight:
    800,

  cursor:
    "pointer",
};


/* =========================================================
   PAGINATION / EMPTY
========================================================= */

const paginationWrapStyle = {
  marginTop:
    "22px",
};


const emptyStateStyle = {
  padding:
    "35px",

  borderRadius:
    "16px",

  background:
    "#f8fafc",

  color:
    "#64748b",

  textAlign:
    "center",
};


/* =========================================================
   DISCLOSURE
========================================================= */

const learningDisclosureStyle = {
  display:
    "flex",

  alignItems:
    "flex-start",

  gap:
    "18px",

  marginTop:
    "34px",

  padding:
    "26px",

  borderRadius:
    "18px",

  background:
    "#f8fbff",

  border:
    "1px solid #dbeafe",

  boxShadow:
    "0 10px 28px rgba(15,23,42,.04)",
};


const learningDisclosureIconStyle = {
  width:
    "50px",

  height:
    "50px",

  borderRadius:
    "14px",

  background:
    "#dbeafe",

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  fontSize:
    "25px",

  flexShrink:
    0,
};


const learningDisclosureContentStyle = {
  flex:
    1,
};


const learningDisclosureTitleStyle = {
  margin:
    "0 0 10px",

  color:
    "#1e3a8a",

  fontSize:
    "19px",

  fontWeight:
    800,
};


const learningDisclosureTextStyle = {
  margin:
    "0 0 9px",

  color:
    "#475569",

  fontSize:
    "12px",

  lineHeight:
    1.7,

  fontWeight:
    500,
};