import { supabase } from "../lib/supabase";

/* =====================================================
   EDGE FUNCTIONS
===================================================== */

const LIVE_CMP_FUNCTION =
  "refresh-dhan-cmp-auto-v1";

const CLOSING_CMP_FUNCTION =
  "refresh-dhan-close-v1";

/* =====================================================
   INDIA TIME HELPERS
===================================================== */

const getIndiaTimeParts = () => {
  const parts =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }
    ).formatToParts(
      new Date()
    );

  const getPart = (
    type
  ) =>
    parts.find(
      (part) =>
        part.type === type
    )?.value;

  return {
    weekday:
      getPart(
        "weekday"
      ),

    hour:
      Number(
        getPart(
          "hour"
        ) || 0
      ),

    minute:
      Number(
        getPart(
          "minute"
        ) || 0
      ),
  };
};

/* =====================================================
   NSE MARKET OPEN CHECK

   Monday-Friday
   09:15 AM - 03:30 PM IST
===================================================== */

export const isNSEMarketOpen =
  () => {
    const {
      weekday,
      hour,
      minute,
    } =
      getIndiaTimeParts();

    if (
      weekday === "Sat" ||
      weekday === "Sun"
    ) {
      return false;
    }

    const currentMinutes =
      hour * 60 + minute;

    const marketOpen =
      9 * 60 + 15;

    const marketClose =
      15 * 60 + 30;

    return (
      currentMinutes >=
        marketOpen &&
      currentMinutes <
        marketClose
    );
  };

/* =====================================================
   FETCH SINGLE LIVE CMP

   Single-instrument requests stay on the live
   Dhan function.

   refresh-dhan-cmp-auto-v1 already allows
   single-instrument requests outside market hours.
===================================================== */

export const fetchLiveCMP =
  async (
    securityId,
    segment = "NSE_EQ"
  ) => {
    try {
      if (!securityId) {
        console.warn(
          "Security ID missing."
        );

        return null;
      }

      const numericSecurityId =
        Number(
          securityId
        );

      if (
        !Number.isFinite(
          numericSecurityId
        ) ||
        numericSecurityId <= 0
      ) {
        console.warn(
          "Invalid Security ID:",
          securityId
        );

        return null;
      }

      const {
        data,
        error,
      } =
        await supabase
          .functions
          .invoke(
            LIVE_CMP_FUNCTION,
            {
              body: {
                securityId:
                  numericSecurityId,

                segment:
                  segment ||
                  "NSE_EQ",
              },
            }
          );

      if (error) {
        console.error(
          "Dhan CMP function error:",
          error
        );

        return null;
      }

      const cmp =
        Number(
          data?.cmp
        );

      if (
        data?.success !==
          true ||
        !Number.isFinite(
          cmp
        ) ||
        cmp <= 0
      ) {
        console.error(
          "Invalid Dhan CMP response:",
          data
        );

        return null;
      }

      return cmp;
    } catch (error) {
      console.error(
        "fetchLiveCMP error:",
        error
      );

      return null;
    }
  };

/* =====================================================
   COMMON EDGE FUNCTION CALLER
===================================================== */

const invokeCMPFunction =
  async (
    functionName
  ) => {
    const {
      data,
      error,
    } =
      await supabase
        .functions
        .invoke(
          functionName,
          {
            body: {},
          }
        );

    if (error) {
      console.error(
        `${functionName} error:`,
        error
      );

      let detailedMessage =
        error?.message ||
        "Unable to refresh CMP.";

      if (
        error?.context &&
        typeof
          error.context.json ===
          "function"
      ) {
        try {
          const errorBody =
            await error
              .context
              .json();

          detailedMessage =
            errorBody?.message ||
            errorBody?.error ||
            detailedMessage;
        } catch {
          // Keep original message
        }
      }

      throw new Error(
        detailedMessage
      );
    }

    if (!data) {
      throw new Error(
        "CMP refresh returned no response."
      );
    }

    if (
      data?.success !==
      true
    ) {
      throw new Error(
        data?.message ||
          "CMP refresh failed."
      );
    }

    return data;
  };

/* =====================================================
   REFRESH LIVE CMP ONLY
===================================================== */

export const refreshLiveHoldingsCMP =
  async () => {
    try {
      const data =
        await invokeCMPFunction(
          LIVE_CMP_FUNCTION
        );

      return {
        ...data,

        refreshMode:
          "live",

        message:
          data?.message ||
          `Live CMP updated for ${
            data?.updatedCount ||
            0
          } holding(s).`,
      };
    } catch (error) {
      console.error(
        "refreshLiveHoldingsCMP error:",
        error
      );

      throw new Error(
        error?.message ||
          "Failed to refresh live CMP."
      );
    }
  };

/* =====================================================
   REFRESH CLOSING CMP ONLY
===================================================== */

export const refreshClosingHoldingsCMP =
  async () => {
    try {
      const data =
        await invokeCMPFunction(
          CLOSING_CMP_FUNCTION
        );

      return {
        ...data,

        refreshMode:
          "closing",

        message:
          data?.message ||
          `Closing CMP updated for ${
            data?.updatedCount ||
            0
          } holding(s).`,
      };
    } catch (error) {
      console.error(
        "refreshClosingHoldingsCMP error:",
        error
      );

      throw new Error(
        error?.message ||
          "Failed to refresh closing CMP."
      );
    }
  };

/* =====================================================
   SMART CMP REFRESH

   MARKET OPEN
   -----------------------------------------------
   Calls:
   refresh-dhan-cmp-auto-v1

   MARKET CLOSED
   -----------------------------------------------
   Calls:
   refresh-dhan-close-v1
===================================================== */

export const refreshAllHoldingsCMP =
  async () => {
    try {
      const marketOpen =
        isNSEMarketOpen();

      let result;

      if (marketOpen) {
        console.log(
          "NSE market is open. Refreshing live CMP..."
        );

        result =
          await refreshLiveHoldingsCMP();
      } else {
        console.log(
          "NSE market is closed. Refreshing closing CMP..."
        );

        result =
          await refreshClosingHoldingsCMP();
      }

      return result;
    } catch (error) {
      console.error(
        "refreshAllHoldingsCMP error:",
        error
      );

      throw new Error(
        error?.message ||
          "Failed to refresh CMP."
      );
    }
  };