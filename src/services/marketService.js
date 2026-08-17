import { supabase } from "../lib/supabase";

/* =====================================================
   FETCH SINGLE LIVE CMP
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

    const {
      data,
      error,
    } =
      await supabase.functions.invoke(
        "refresh-dhan-cmp-v2",
        {
          body: {
            securityId:
              Number(securityId),

            segment,
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

    if (
      !data?.success ||
      !data?.cmp
    ) {
      console.error(
        "Invalid Dhan CMP response:",
        data
      );

      return null;
    }

    return Number(data.cmp);
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
===================================================== */

export const refreshAllHoldingsCMP =
  async () => {
    try {
      const {
        data,
        error,
      } =
        await supabase.functions.invoke(
          "refresh-dhan-cmp-v2",
          {
            body: {},
          }
        );

      if (error) {
        console.error(
          "Bulk CMP refresh error:",
          error
        );

        throw error;
      }

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "CMP refresh failed."
        );
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

      throw error;
    }
  };