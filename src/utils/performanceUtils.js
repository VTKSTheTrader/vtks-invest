/* =========================================================
   VTKS PERFORMANCE UTILITIES
========================================================= */

export const normalizeTradeStatus = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export const ACTIVE_TRADE_STATUSES = [
  "active",
  "target 1 hit",
  "target 2 hit",
  "target 3 hit",
];

export const REALISED_TRADE_STATUSES = [
  "booked profit",
  "sl hit",
];

export const CLOSED_TRADE_STATUSES = [
  "booked profit",
  "sl hit",
];

export const WINNING_TRADE_STATUSES = [
  "booked profit",
];

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
   Falls back to Entry Price -> Exit Price.
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

  const exitPrice = Number(
    holding?.exitPrice ??
      holding?.exit_price ??
      0
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
   Active trades use CMP.
   Completed trades use realised return.
========================================================= */

export const getTradeROI = (
  holding
) => {
  if (isRealisedTrade(holding)) {
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
  ).filter((value) =>
    Number.isFinite(value)
  );

  if (validValues.length === 0) {
    return 0;
  }

  const total =
    validValues.reduce(
      (sum, value) =>
        sum + value,
      0
    );

  return (
    total / validValues.length
  );
};

/* =========================================================
   ACTIVE AVERAGE RETURN
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
          value !== null
      );

  return calculateAverage(
    validReturns
  );
};

/* =========================================================
   REALISED AVERAGE RETURN
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
          holding?.exitPrice ??
          holding?.exit_price;

        const hasSavedReturn =
          savedReturn !== null &&
          savedReturn !== undefined &&
          savedReturn !== "" &&
          Number.isFinite(
            Number(savedReturn)
          );

        const hasExitPrice =
          exitPrice !== null &&
          exitPrice !== undefined &&
          exitPrice !== "" &&
          Number(exitPrice) > 0;

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
          value !== null
      );

  return calculateAverage(
    validReturns
  );
};

/* =========================================================
   WIN RATE

   Booked Profit = Win
   SL Hit = Loss
========================================================= */

export const calculateWinRate = (
  holdings = []
) => {
  const realisedTrades =
    holdings.filter(
      isRealisedTrade
    );

  if (
    realisedTrades.length === 0
  ) {
    return 0;
  }

  const winningTrades =
    realisedTrades.filter(
      isWinningTrade
    ).length;

  return (
    (winningTrades /
      realisedTrades.length) *
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
        getTradeStatus(holding) ===
        "booked profit"
    );

  const slHitTrades =
    realisedTrades.filter(
      (holding) =>
        getTradeStatus(holding) ===
        "sl hit"
    );

  return {
    totalTrades: holdings.length,

    activeTrades:
      activeTrades.length,

    realisedTrades:
      realisedTrades.length,

    closedTrades:
      realisedTrades.length,

    bookedProfitTrades:
      bookedProfitTrades.length,

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