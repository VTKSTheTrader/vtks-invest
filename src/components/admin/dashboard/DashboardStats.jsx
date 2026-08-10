import "./DashboardStats.css";

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const parseDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

export default function DashboardStats({
  holdings = [],
  members = [],
  resources = [],
  scanners = [],
}) {
  /* =========================================================
     MEMBER STATUS
  ========================================================= */

  const getMemberStatus = (member) => {
    const expiryValue =
      member.expiryDate ||
      member.expiry_date ||
      member.subscriptionEnd ||
      member.subscription_end;

    const expiryDate = parseDate(expiryValue);

    if (!expiryDate) {
      return "expired";
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);

    const difference =
      expiryDate.getTime() - today.getTime();

    const daysLeft = Math.floor(
      difference / (1000 * 60 * 60 * 24)
    );

    if (daysLeft < 0) {
      return "expired";
    }

    if (daysLeft <= 7) {
      return "expiring soon";
    }

    return "active";
  };

  /* =========================================================
     HOLDING STATUS
  ========================================================= */

  const getHoldingStatus = (holding) => {
    const savedStatus = normalize(
      holding.tradeStatus ||
        holding.trade_status ||
        holding.status
    );

    const recognisedStatuses = [
      "active",
      "target 1 hit",
      "target 2 hit",
      "target 3 hit",
      "booked profit",
      "booked loss",
      "breakeven",
      "sl hit",
      "cancelled",
    ];

    /*
      Respect manually saved closed statuses.

      Active is allowed to continue through automatic
      target / SL evaluation below.
    */
    if (
      savedStatus &&
      savedStatus !== "active" &&
      recognisedStatuses.includes(savedStatus)
    ) {
      return savedStatus;
    }

    const highestPrice = Number(
      holding.highestPrice ??
        holding.highest_price ??
        holding.cmp ??
        0
    );

    const lowestPrice = Number(
      holding.lowestPrice ??
        holding.lowest_price ??
        holding.cmp ??
        0
    );

    const stopLoss = Number(
      holding.stopLoss ??
        holding.stop_loss ??
        0
    );

    const target1 = Number(
      holding.target1 ??
        holding.target_1 ??
        0
    );

    const target2 = Number(
      holding.target2 ??
        holding.target_2 ??
        0
    );

    const target3 = Number(
      holding.target3 ??
        holding.target_3 ??
        0
    );

    /*
      SL is checked using lowest price.
    */
    if (
      stopLoss > 0 &&
      lowestPrice <= stopLoss
    ) {
      return "sl hit";
    }

    /*
      Highest achieved target.
    */
    if (
      target3 > 0 &&
      highestPrice >= target3
    ) {
      return "target 3 hit";
    }

    if (
      target2 > 0 &&
      highestPrice >= target2
    ) {
      return "target 2 hit";
    }

    if (
      target1 > 0 &&
      highestPrice >= target1
    ) {
      return "target 1 hit";
    }

    return "active";
  };

  /* =========================================================
     HIGHEST TARGET REACHED
  ========================================================= */

  const getHighestTargetReached = (holding) => {
    const status = getHoldingStatus(holding);

    if (
      status === "target 1 hit" ||
      status === "target 2 hit" ||
      status === "target 3 hit"
    ) {
      return status;
    }

    /*
      For booked studies, check whether the exit price
      was already beyond one or more targets.
    */
    if (
      ![
        "booked profit",
        "booked loss",
        "breakeven",
      ].includes(status)
    ) {
      return null;
    }

    const exitPrice = Number(
      holding.exitPrice ??
        holding.exit_price ??
        0
    );

    if (
      !Number.isFinite(exitPrice) ||
      exitPrice <= 0
    ) {
      return null;
    }

    const target1 = Number(
      holding.target1 ??
        holding.target_1 ??
        0
    );

    const target2 = Number(
      holding.target2 ??
        holding.target_2 ??
        0
    );

    const target3 = Number(
      holding.target3 ??
        holding.target_3 ??
        0
    );

    if (
      target3 > 0 &&
      exitPrice >= target3
    ) {
      return "target 3 hit";
    }

    if (
      target2 > 0 &&
      exitPrice >= target2
    ) {
      return "target 2 hit";
    }

    if (
      target1 > 0 &&
      exitPrice >= target1
    ) {
      return "target 1 hit";
    }

    return null;
  };

  /* =========================================================
     LIVE RETURN
  ========================================================= */

  const calculateLiveReturn = (holding) => {
    const entry = Number(
      holding.entry || 0
    );

    const cmp = Number(
      holding.cmp || 0
    );

    if (
      !Number.isFinite(entry) ||
      !Number.isFinite(cmp) ||
      entry <= 0 ||
      cmp <= 0
    ) {
      return null;
    }

    return (
      ((cmp - entry) / entry) *
      100
    );
  };

  /* =========================================================
     REALISED RETURN
  ========================================================= */

  const calculateRealisedReturn = (holding) => {
    const savedReturn =
      holding.realisedReturn ??
      holding.realised_return;

    if (
      savedReturn !== null &&
      savedReturn !== undefined &&
      savedReturn !== ""
    ) {
      const numericReturn =
        Number(savedReturn);

      if (Number.isFinite(numericReturn)) {
        return numericReturn;
      }
    }

    const entry = Number(
      holding.entry || 0
    );

    const exitPrice = Number(
      holding.exitPrice ??
        holding.exit_price ??
        0
    );

    if (
      !Number.isFinite(entry) ||
      !Number.isFinite(exitPrice) ||
      entry <= 0 ||
      exitPrice <= 0
    ) {
      return null;
    }

    return (
      ((exitPrice - entry) / entry) *
      100
    );
  };

  /* =========================================================
     MEMBER COUNTS
  ========================================================= */

  const totalMembers =
    members.length;

  const activeMembers =
    members.filter(
      (member) =>
        getMemberStatus(member) ===
        "active"
    ).length;

  /* =========================================================
     STATUS GROUPS
  ========================================================= */

  const activeStatuses = [
    "active",
    "target 1 hit",
    "target 2 hit",
    "target 3 hit",
  ];

  const realisedStatuses = [
    "booked profit",
    "booked loss",
    "breakeven",
    "sl hit",
  ];

  /* =========================================================
     ACTIVE STUDIES
  ========================================================= */

  const activeTradeList =
    holdings.filter((holding) =>
      activeStatuses.includes(
        getHoldingStatus(holding)
      )
    );

  const activeHoldings =
    activeTradeList.length;

  /* =========================================================
     REALISED STUDIES
  ========================================================= */

  const realisedTradeList =
    holdings.filter((holding) =>
      realisedStatuses.includes(
        getHoldingStatus(holding)
      )
    );

  const realisedTrades =
    realisedTradeList.length;

  /* =========================================================
     ACTIVE AVG RETURN

     ONLY:
     Active
     Target 1 Hit
     Target 2 Hit
     Target 3 Hit

     Uses Entry → Live CMP
  ========================================================= */

  const activeReturns =
    activeTradeList
      .map(calculateLiveReturn)
      .filter(
        (value) =>
          value !== null &&
          Number.isFinite(value)
      );

  const activeAverageReturn =
    activeReturns.length > 0
      ? (
          activeReturns.reduce(
            (total, value) =>
              total + value,
            0
          ) / activeReturns.length
        ).toFixed(2)
      : "0.00";

  /* =========================================================
     REALISED AVG RETURN

     ONLY:
     Booked Profit
     Booked Loss
     Breakeven
     SL Hit

     Uses saved realised return first.
     Falls back to Entry → Exit Price.
  ========================================================= */

  const realisedReturns =
    realisedTradeList
      .map(calculateRealisedReturn)
      .filter(
        (value) =>
          value !== null &&
          Number.isFinite(value)
      );

  const realisedAverageReturn =
    realisedReturns.length > 0
      ? (
          realisedReturns.reduce(
            (total, value) =>
              total + value,
            0
          ) / realisedReturns.length
        ).toFixed(2)
      : "0.00";

  /* =========================================================
     TARGET COUNTS
  ========================================================= */

  const target1HitCount =
    holdings.filter(
      (holding) =>
        getHighestTargetReached(
          holding
        ) === "target 1 hit"
    ).length;

  const target2HitCount =
    holdings.filter(
      (holding) =>
        getHighestTargetReached(
          holding
        ) === "target 2 hit"
    ).length;

  const target3HitCount =
    holdings.filter(
      (holding) =>
        getHighestTargetReached(
          holding
        ) === "target 3 hit"
    ).length;

  /* =========================================================
     CLOSED STATUS COUNTS
  ========================================================= */

  const bookedProfitCount =
    holdings.filter(
      (holding) =>
        getHoldingStatus(holding) ===
        "booked profit"
    ).length;

  const bookedLossCount =
    holdings.filter(
      (holding) =>
        getHoldingStatus(holding) ===
        "booked loss"
    ).length;

  const breakevenCount =
    holdings.filter(
      (holding) =>
        getHoldingStatus(holding) ===
        "breakeven"
    ).length;

  const slHitCount =
    holdings.filter(
      (holding) =>
        getHoldingStatus(holding) ===
        "sl hit"
    ).length;

  /* =========================================================
     WIN RATE

     WIN:
     Booked Profit
     OR Target 1 / 2 / 3 reached

     LOSS:
     Booked Loss
     SL Hit

     EXCLUDED:
     Breakeven
     Cancelled
  ========================================================= */

  const winningTrades =
    holdings.filter((holding) => {
      const status =
        getHoldingStatus(holding);

      const highestTarget =
        getHighestTargetReached(
          holding
        );

      return (
        status === "booked profit" ||
        highestTarget ===
          "target 1 hit" ||
        highestTarget ===
          "target 2 hit" ||
        highestTarget ===
          "target 3 hit"
      );
    }).length;

  const losingTrades =
    bookedLossCount +
    slHitCount;

  const completedForWinRate =
    winningTrades +
    losingTrades;

  const winRate =
    completedForWinRate > 0
      ? (
          (winningTrades /
            completedForWinRate) *
          100
        ).toFixed(1)
      : "0.0";

  /* =========================================================
     SUMMARY CARDS
  ========================================================= */

  const summaryCards = [
    {
      title: "Total Members",
      value: totalMembers,
      tone: "blue",
      icon: "👥",
    },

    {
      title: "Active Members",
      value: activeMembers,
      tone: "green",
      icon: "✅",
    },

    {
      title: "Active Studies",
      value: activeHoldings,
      tone: "blue",
      icon: "📊",
    },

    {
      title: "Win Rate",
      value: `${winRate}%`,
      tone:
        Number(winRate) > 0
          ? "green"
          : "blue",
      icon: "🎯",
    },

    {
      title: "Active Avg Return",
      value: `${
        Number(activeAverageReturn) >=
        0
          ? "+"
          : ""
      }${activeAverageReturn}%`,
      tone:
        Number(activeAverageReturn) >=
        0
          ? "green"
          : "red",
      icon: "📈",
    },

    {
      title: "Realised Avg Return",
      value: `${
        Number(
          realisedAverageReturn
        ) >= 0
          ? "+"
          : ""
      }${realisedAverageReturn}%`,
      tone:
        Number(
          realisedAverageReturn
        ) >= 0
          ? "green"
          : "red",
      icon: "💰",
    },

    {
      title: "Realised Studies",
      value: realisedTrades,
      tone: "blue",
      icon: "✅",
    },
  ];

  /* =========================================================
     PERFORMANCE CARDS
  ========================================================= */

  const performanceCards = [
    {
      title: "Target 1 Hit",
      value: target1HitCount,
      className:
        "performance-t1",
      icon: "🎯",
    },

    {
      title: "Target 2 Hit",
      value: target2HitCount,
      className:
        "performance-t2",
      icon: "🚀",
    },

    {
      title: "Target 3 Hit",
      value: target3HitCount,
      className:
        "performance-t3",
      icon: "🏆",
    },

    {
      title: "Booked Profit",
      value: bookedProfitCount,
      className:
        "performance-booked",
      icon: "💰",
    },

    {
      title: "Booked Loss",
      value: bookedLossCount,
      className:
        "performance-loss",
      icon: "📉",
    },

    {
      title: "Breakeven",
      value: breakevenCount,
      className:
        "performance-breakeven",
      icon: "⚖️",
    },

    {
      title: "SL Hit",
      value: slHitCount,
      className:
        "performance-sl",
      icon: "🛑",
    },
  ];

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="dashboard-stats-wrapper">
      <section className="dashboard-summary-grid">
        {summaryCards.map((card) => (
          <article
            key={card.title}
            className={`dashboard-summary-card dashboard-tone-${card.tone}`}
          >
            <div className="dashboard-summary-icon">
              {card.icon}
            </div>

            <div>
              <h2>{card.value}</h2>
              <p>{card.title}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-performance-panel">
        <div className="dashboard-performance-header">
          <div>
            <h2>
              Study Performance
            </h2>

            <p>
              Target achievements,
              booked outcomes and
              stop-loss results.
            </p>
          </div>

          <span>
            {holdings.length} Studies
          </span>
        </div>

        <div className="dashboard-performance-grid">
          {performanceCards.map(
            (card) => (
              <article
                key={card.title}
                className={`dashboard-performance-card ${card.className}`}
              >
                <div className="dashboard-performance-icon">
                  {card.icon}
                </div>

                <div>
                  <h3>
                    {card.value}
                  </h3>

                  <p>
                    {card.title}
                  </p>
                </div>
              </article>
            )
          )}
        </div>
      </section>

      <section className="dashboard-resource-grid">
        <article className="dashboard-resource-card">
          <div className="dashboard-resource-icon">
            ⚡
          </div>

          <div>
            <h2>
              {scanners.length}
            </h2>

            <p>
              Scanners
            </p>
          </div>
        </article>

        <article className="dashboard-resource-card">
          <div className="dashboard-resource-icon">
            📚
          </div>

          <div>
            <h2>
              {resources.length}
            </h2>

            <p>
              Library Resources
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}