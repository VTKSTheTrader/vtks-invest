export const ACTIVE_STATUSES = [
  "active",
  "target 1 hit",
  "target 2 hit",
  "target 3 hit",
];

export const REALISED_STATUSES = [
  "booked profit",
  "sl hit",
];

const normalize = (status) =>
  String(status || "")
    .trim()
    .toLowerCase();

export const isActiveTrade = (holding) =>
  ACTIVE_STATUSES.includes(
    normalize(holding.tradeStatus)
  );

export const isRealisedTrade = (holding) =>
  REALISED_STATUSES.includes(
    normalize(holding.tradeStatus)
  );

export const calculateCurrentReturn = (
  holding
) => {
  const entry = Number(holding.entry);
  const cmp = Number(holding.cmp);

  if (!entry || !cmp) return 0;

  return ((cmp - entry) / entry) * 100;
};

export const calculateRealisedReturn = (
  holding
) => {
  if (
    holding.realisedReturn !== null &&
    holding.realisedReturn !== undefined &&
    holding.realisedReturn !== ""
  ) {
    return Number(
      holding.realisedReturn
    );
  }

  const entry = Number(holding.entry);
  const exit = Number(
    holding.exitPrice
  );

  if (!entry || !exit) return 0;

  return ((exit - entry) / entry) * 100;
};

export const calculateActiveAverageReturn = (
  holdings
) => {
  const active = holdings.filter(
    isActiveTrade
  );

  if (!active.length) return 0;

  const total = active.reduce(
    (sum, trade) =>
      sum +
      calculateCurrentReturn(trade),
    0
  );

  return total / active.length;
};

export const calculateRealisedAverageReturn =
  (holdings) => {
    const realised =
      holdings.filter(
        isRealisedTrade
      );

    if (!realised.length) return 0;

    const total =
      realised.reduce(
        (sum, trade) =>
          sum +
          calculateRealisedReturn(
            trade
          ),
        0
      );

    return (
      total / realised.length
    );
  };