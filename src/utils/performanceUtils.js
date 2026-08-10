/* =========================================================
   VTKS PERFORMANCE UTILITIES
========================================================= */

export const normalizeTradeStatus = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

/* =========================================================
   STATUS GROUPS
========================================================= */

export const ACTIVE_TRADE_STATUSES = [
  "active",
  "target 1 hit",
  "target 2 hit",
  "target 3 hit",
];

export const REALISED_TRADE_STATUSES = [
  "booked profit",
  "booked loss",
  "breakeven",
  "sl hit",
];

export const CLOSED_TRADE_STATUSES = [
  "booked profit",
  "booked loss",
  "breakeven",
  "sl hit",
];

export const WINNING_TRADE_STATUSES = [
  "booked profit",
];

export const LOSING_TRADE_STATUSES = [
  "booked loss",
  "sl hit",
];

export const NEUTRAL_TRADE_STATUSES = [
  "breakeven",
];

/* =========================================================
   STATUS HELPERS
========================================================= */

export const getTradeStatus = (holding) =>
  normalizeTradeStatus(
    holding?.tradeStatus ||
      holding?.trade_status ||
      holding?.status
  );

export const isActiveTrade = (holding) =>
  ACTIVE_TRADE_STATUSES.includes(
    getTradeStatus(holding)
  );

export const isRealisedTrade = (holding) =>
  REALISED_TRADE_STATUSES.includes(
    getTradeStatus(holding)
  );

export const isClosedTrade = (holding) =>
  CLOSED_TRADE_STATUSES.includes(
    getTradeStatus(holding)
  );

export const isWinningTrade = (holding) =>
  WINNING_TRADE_STATUSES.includes(
    getTradeStatus(holding)
  );

export const isProfitTrade = (holding) =>
  getTradeStatus(holding) ===
  "booked profit";

export const isLosingTrade = (holding) =>
  LOSING_TRADE_STATUSES.includes(
    getTradeStatus(holding)
  );

export const isLossTrade = (holding) =>
  [
    "booked loss",
    "sl hit",
  ].includes(
    getTradeStatus(holding)
  );

export const isBreakevenTrade = (holding) =>
  getTradeStatus(holding) ===
  "breakeven";

/* =========================================================
   EXIT PRICE
========================================================= */

export const getTradeExitPrice = (holding) => {
  const exitPrice = Number(
    holding?.exitPrice ??
      holding?.exit_price ??
      0
  );

  if (
    Number.isFinite(exitPrice) &&
    exitPrice > 0
  ) {
    return exitPrice;
  }

  /*
    Fallback for older SL Hit records.
  */
  if (
    getTradeStatus(holding) ===
    "sl hit"
  ) {
    const stopLoss = Number(
      holding?.stopLoss ??
        holding?.stop_loss ??
        0
    );

    if (
      Number.isFinite(stopLoss) &&
      stopLoss > 0
    ) {
      return stopLoss;
    }
  }

  return 0;
};

/* =========================================================
   DISPLAY PRICE
========================================================= */

export const getTradeDisplayPrice = (holding) => {
  if (
    isRealisedTrade(holding)
  ) {
    const exitPrice =
      getTradeExitPrice(holding);

    if (exitPrice > 0) {
      return exitPrice;
    }
  }

  const cmp = Number(
    holding?.cmp || 0
  );

  return Number.isFinite(cmp)
    ? cmp
    : 0;
};

/* =========================================================
   DISPLAY LABELS
========================================================= */

export const getTradeReturnLabel = (holding) => {
  const status =
    getTradeStatus(holding);

  if (
    status === "booked loss" ||
    status === "sl hit"
  ) {
    return "Realised Loss";
  }

  if (
    REALISED_TRADE_STATUSES.includes(
      status
    )
  ) {
    return "Realised ROI";
  }

  return "Live ROI";
};

export const getTradePriceLabel = (holding) =>
  isRealisedTrade(holding)
    ? "Exit Price"
    : "Live CMP";

/* =========================================================
   STATUS DISPLAY LABEL
========================================================= */

export const getTradeStatusLabel = (holding) => {
  const status =
    getTradeStatus(holding);

  switch (status) {
    case "active":
      return "Active";

    case "target 1 hit":
      return "Target 1 Hit";

    case "target 2 hit":
      return "Target 2 Hit";

    case "target 3 hit":
      return "Target 3 Hit";

    case "booked profit":
      return "Booked Profit";

    case "booked loss":
      return "Booked Loss";

    case "breakeven":
      return "Breakeven";

    case "sl hit":
      return "SL Hit";

    case "cancelled":
      return "Cancelled";

    default:
      return status || "Active";
  }
};

/* =========================================================
   ACTIVE ROI

   Entry Price -> Current Market Price
========================================================= */

export const calculateActiveROI = (
  holding
) => {
  const entry = Number(
    holding?.entry || 0
  );

  const cmp = Number(
    holding?.cmp || 0
  );

  if (
    !Number.isFinite(entry) ||
    !Number.isFinite(cmp) ||
    entry <= 0 ||
    cmp <= 0
  ) {
    return 0;
  }

  return (
    ((cmp - entry) / entry) *
    100
  );
};

/* =========================================================
   REALISED ROI

   Uses saved realised return first.

   Falls back to:
   Entry Price -> Exit Price
========================================================= */

export const calculateRealisedROI = (
  holding
) => {
  const savedReturn =
    holding?.realisedReturn ??
    holding?.realised_return;

  if (
    savedReturn !== null &&
    savedReturn !== undefined &&
    savedReturn !== ""
  ) {
    const numericReturn =
      Number(savedReturn);

    if (
      Number.isFinite(
        numericReturn
      )
    ) {
      return numericReturn;
    }
  }

  const entry = Number(
    holding?.entry || 0
  );

  const exitPrice =
    getTradeExitPrice(
      holding
    );

  if (
    !Number.isFinite(entry) ||
    !Number.isFinite(exitPrice) ||
    entry <= 0 ||
    exitPrice <= 0
  ) {
    return 0;
  }

  return (
    ((exitPrice - entry) /
      entry) *
    100
  );
};

/* =========================================================
   DISPLAY ROI

   Active / Target Hit:
   Entry -> CMP

   Realised:
   Saved ROI / Entry -> Exit
========================================================= */

export const getTradeROI = (
  holding
) => {
  if (
    isRealisedTrade(holding)
  ) {
    return calculateRealisedROI(
      holding
    );
  }

  return calculateActiveROI(
    holding
  );
};

/* =========================================================
   AVERAGE CALCULATOR
========================================================= */

const calculateAverage = (
  values
) => {
  const validValues = (
    values || []
  ).filter(
    (value) =>
      Number.isFinite(value)
  );

  if (
    validValues.length === 0
  ) {
    return 0;
  }

  const total =
    validValues.reduce(
      (sum, value) =>
        sum + value,
      0
    );

  return (
    total /
    validValues.length
  );
};

/* =========================================================
   ACTIVE AVERAGE RETURN

   Includes:
   Active
   Target 1 Hit
   Target 2 Hit
   Target 3 Hit

   Uses live CMP.
========================================================= */

export const calculateActiveAverageReturn = (
  holdings = []
) => {
  const activeTrades =
    holdings.filter(
      isActiveTrade
    );

  const validReturns =
    activeTrades
      .map((holding) => {
        const entry = Number(
          holding?.entry || 0
        );

        const cmp = Number(
          holding?.cmp || 0
        );

        if (
          !Number.isFinite(entry) ||
          !Number.isFinite(cmp) ||
          entry <= 0 ||
          cmp <= 0
        ) {
          return null;
        }

        return calculateActiveROI(
          holding
        );
      })
      .filter(
        (value) =>
          value !== null &&
          Number.isFinite(value)
      );

  return calculateAverage(
    validReturns
  );
};

/* =========================================================
   REALISED AVERAGE RETURN

   Includes:
   Booked Profit
   Booked Loss
   Breakeven
   SL Hit
========================================================= */

export const calculateRealisedAverageReturn = (
  holdings = []
) => {
  const realisedTrades =
    holdings.filter(
      isRealisedTrade
    );

  const validReturns =
    realisedTrades
      .map((holding) => {
        const savedReturn =
          holding?.realisedReturn ??
          holding?.realised_return;

        const exitPrice =
          getTradeExitPrice(
            holding
          );

        const hasSavedReturn =
          savedReturn !== null &&
          savedReturn !== undefined &&
          savedReturn !== "" &&
          Number.isFinite(
            Number(savedReturn)
          );

        const hasExitPrice =
          Number.isFinite(
            exitPrice
          ) &&
          exitPrice > 0;

        /*
          Do not include invalid
          closed records in the average.
        */
        if (
          !hasSavedReturn &&
          !hasExitPrice
        ) {
          return null;
        }

        return calculateRealisedROI(
          holding
        );
      })
      .filter(
        (value) =>
          value !== null &&
          Number.isFinite(value)
      );

  return calculateAverage(
    validReturns
  );
};

/* =========================================================
   WIN RATE

   WIN:
   Booked Profit

   LOSS:
   Booked Loss
   SL Hit

   EXCLUDED:
   Breakeven
   Active
   Target 1 / 2 / 3 Hit
   Cancelled
========================================================= */

export const calculateWinRate = (
  holdings = []
) => {
  const wins =
    holdings.filter(
      isWinningTrade
    ).length;

  const losses =
    holdings.filter(
      isLosingTrade
    ).length;

  const eligibleTrades =
    wins + losses;

  if (
    eligibleTrades === 0
  ) {
    return 0;
  }

  return (
    (wins /
      eligibleTrades) *
    100
  );
};

/* =========================================================
   COMPLETE PERFORMANCE SUMMARY
========================================================= */

export const calculatePerformanceSummary = (
  holdings = []
) => {
  const activeTrades =
    holdings.filter(
      isActiveTrade
    );

  const realisedTrades =
    holdings.filter(
      isRealisedTrade
    );

  const bookedProfitTrades =
    realisedTrades.filter(
      (holding) =>
        getTradeStatus(
          holding
        ) ===
        "booked profit"
    );

  const bookedLossTrades =
    realisedTrades.filter(
      (holding) =>
        getTradeStatus(
          holding
        ) ===
        "booked loss"
    );

  const breakevenTrades =
    realisedTrades.filter(
      (holding) =>
        getTradeStatus(
          holding
        ) ===
        "breakeven"
    );

  const slHitTrades =
    realisedTrades.filter(
      (holding) =>
        getTradeStatus(
          holding
        ) ===
        "sl hit"
    );

  return {
    totalTrades:
      holdings.length,

    activeTrades:
      activeTrades.length,

    realisedTrades:
      realisedTrades.length,

    closedTrades:
      realisedTrades.length,

    bookedProfitTrades:
      bookedProfitTrades.length,

    bookedLossTrades:
      bookedLossTrades.length,

    breakevenTrades:
      breakevenTrades.length,

    slHitTrades:
      slHitTrades.length,

    winRate:
      calculateWinRate(
        holdings
      ),

    activeAverageReturn:
      calculateActiveAverageReturn(
        holdings
      ),

    realisedAverageReturn:
      calculateRealisedAverageReturn(
        holdings
      ),
  };
};