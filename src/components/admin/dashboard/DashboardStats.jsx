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
      "sl hit",
      "cancelled",
    ];

    if (
      savedStatus &&
      savedStatus !== "active" &&
      recognisedStatuses.includes(savedStatus)
    ) {
      return savedStatus;
    }

    const cmp = Number(holding.cmp || 0);

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

    if (target3 > 0 && cmp >= target3) {
      return "target 3 hit";
    }

    if (target2 > 0 && cmp >= target2) {
      return "target 2 hit";
    }

    if (target1 > 0 && cmp >= target1) {
      return "target 1 hit";
    }

    if (stopLoss > 0 && cmp <= stopLoss) {
      return "sl hit";
    }

    return "active";
  };

  const calculateReturn = (holding) => {
    const entry = Number(holding.entry || 0);
    const cmp = Number(holding.cmp || 0);

    if (entry <= 0) {
      return 0;
    }

    return ((cmp - entry) / entry) * 100;
  };

  const totalMembers = members.length;

  const activeMembers = members.filter(
    (member) =>
      getMemberStatus(member) === "active"
  ).length;

  const activeStatuses = [
  "active",
  "target 1 hit",
  "target 2 hit",
  "target 3 hit",
];

const realisedStatuses = [
  "booked profit",
  "sl hit",
];

const activeTradeList = holdings.filter(
  (holding) =>
    activeStatuses.includes(
      getHoldingStatus(holding)
    )
);

const realisedTradeList = holdings.filter(
  (holding) =>
    realisedStatuses.includes(
      getHoldingStatus(holding)
    )
);

const activeHoldings =
  activeTradeList.length;

const realisedTrades =
  realisedTradeList.length;

/* Active return uses Entry → CMP */

const activeReturns = activeTradeList
  .map((holding) => {
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
  })
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

/* Realised return uses saved return or Entry → Exit Price */

const realisedReturns =
  realisedTradeList
    .map((holding) => {
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

        return Number.isFinite(
          numericReturn
        )
          ? numericReturn
          : null;
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
        ((exitPrice - entry) /
          entry) *
        100
      );
    })
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

  const target1HitCount = holdings.filter(
    (holding) => {
      const status = getHoldingStatus(holding);

      return [
        "target 1 hit",
        "target 2 hit",
        "target 3 hit",
        "booked profit",
      ].includes(status);
    }
  ).length;

  const target2HitCount = holdings.filter(
    (holding) => {
      const status = getHoldingStatus(holding);

      return [
        "target 2 hit",
        "target 3 hit",
        "booked profit",
      ].includes(status);
    }
  ).length;

  const target3HitCount = holdings.filter(
    (holding) =>
      getHoldingStatus(holding) ===
      "target 3 hit"
  ).length;

  const bookedProfitCount = holdings.filter(
    (holding) =>
      getHoldingStatus(holding) ===
      "booked profit"
  ).length;

  const slHitCount = holdings.filter(
    (holding) =>
      getHoldingStatus(holding) === "sl hit"
  ).length;

  /*
   * Target 1 or any higher successful outcome is
   * counted as a winning trade.
   *
   * target1HitCount already contains Target 1,
   * Target 2, Target 3 and Booked Profit, so it
   * must be used directly to avoid double-counting.
   */
  const winningTrades = target1HitCount;

  const completedTrades =
    winningTrades + slHitCount;

  const winRate =
    completedTrades > 0
      ? (
          (winningTrades / completedTrades) *
          100
        ).toFixed(1)
      : "0.0";
      

  


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
      title: "Active Holdings",
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
    Number(activeAverageReturn) >= 0
      ? "+"
      : ""
  }${activeAverageReturn}%`,
  tone:
    Number(activeAverageReturn) >= 0
      ? "green"
      : "red",
  icon: "📈",
},
{
  title: "Realised Avg Return",
  value: `${
    Number(realisedAverageReturn) >= 0
      ? "+"
      : ""
  }${realisedAverageReturn}%`,
  tone:
    Number(realisedAverageReturn) >= 0
      ? "green"
      : "red",
  icon: "💰",
},
{
  title: "Realised Trades",
  value: realisedTrades,
  tone: "blue",
  icon: "✅",
},
  ];

  const performanceCards = [
    {
      title: "Target 1 Hit",
      value: target1HitCount,
      className: "performance-t1",
      icon: "🎯",
    },
    {
      title: "Target 2 Hit",
      value: target2HitCount,
      className: "performance-t2",
      icon: "🚀",
    },
    {
      title: "Target 3 Hit",
      value: target3HitCount,
      className: "performance-t3",
      icon: "🏆",
    },
    {
      title: "Booked Profit",
      value: bookedProfitCount,
      className: "performance-booked",
      icon: "💰",
    },
    {
      title: "SL Hit",
      value: slHitCount,
      className: "performance-sl",
      icon: "🛑",
    },
  ];

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
            <h2>Trade Performance</h2>

            <p>
              Target achievements, booked profits and
              stop-loss outcomes.
            </p>
          </div>

          <span>{holdings.length} Trades</span>
        </div>

        <div className="dashboard-performance-grid">
          {performanceCards.map((card) => (
            <article
              key={card.title}
              className={`dashboard-performance-card ${card.className}`}
            >
              <div className="dashboard-performance-icon">
                {card.icon}
              </div>

              <div>
                <h3>{card.value}</h3>
                <p>{card.title}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-resource-grid">
        <article className="dashboard-resource-card">
          <div className="dashboard-resource-icon">
            ⚡
          </div>

          <div>
            <h2>{scanners.length}</h2>
            <p>Scanners</p>
          </div>
        </article>

        <article className="dashboard-resource-card">
          <div className="dashboard-resource-icon">
            📚
          </div>

          <div>
            <h2>{resources.length}</h2>
            <p>Library Resources</p>
          </div>
        </article>
      </section>
    </div>
  );
}