import { supabase } from "../lib/supabase";

/* =====================================================
   EDGE FUNCTION
===================================================== */

const CMP_EDGE_FUNCTION =
  "refresh-dhan-cmp-auto-v1";

/* =====================================================
   FETCH SINGLE LIVE CMP

   Single instrument requests are allowed anytime
   by refresh-dhan-cmp-auto-v1.
===================================================== */

export const fetchLiveCMP = async (
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
      Number(securityId);

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
      await supabase.functions.invoke(
        CMP_EDGE_FUNCTION,
        {
          body: {
            securityId:
              numericSecurityId,

            segment:
              segment || "NSE_EQ",
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
      Number(data?.cmp);

    if (
      data?.success !== true ||
      !Number.isFinite(cmp) ||
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
   REFRESH ALL ACTIVE HOLDINGS

   Bulk refresh works during NSE market hours.
   Outside market hours the Edge Function safely
   returns skipped: true instead of throwing.
===================================================== */

export const refreshAllHoldingsCMP =
  async () => {
    try {
      const {
        data,
        error,
      } =
        await supabase.functions.invoke(
          CMP_EDGE_FUNCTION,
          {
            body: {},
          }
        );

      if (error) {
        console.error(
          "Bulk CMP refresh error:",
          error
        );

        let detailedMessage =
          error?.message ||
          "Unable to refresh CMP.";

        if (
          error?.context &&
          typeof error.context.json ===
            "function"
        ) {
          try {
            const errorBody =
              await error.context.json();

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

      if (data?.success !== true) {
        throw new Error(
          data?.message ||
            "CMP refresh failed."
        );
      }

      /*
        Market closed:
        this is a valid successful response,
        not an error.
      */
      if (data?.skipped === true) {
        console.log(
          "CMP refresh skipped:",
          data?.message
        );

        return data;
      }

      console.log(
        "CMP refresh successful:",
        data
      );

      return data;
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