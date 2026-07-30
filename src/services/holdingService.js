import { supabase } from "../lib/supabase";

const BUCKET = "holding-files";

/* =========================================================
   FILE UPLOAD
========================================================= */

export const uploadHoldingFile = async (
  file,
  folder = "files"
) => {
  if (!file) return null;

  const fileExt =
    file.name.split(".").pop() || "file";

  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${fileExt}`;

  const filePath = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file);

  if (error) {
    console.error(
      "Holding file upload error:",
      error
    );

    throw error;
  }

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return data?.publicUrl || "";
};

/* =========================================================
   GET HOLDINGS
========================================================= */

export const getHoldings = async () => {
  const { data, error } = await supabase
    .from("holdings")
    .select("*")
    .order("id", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Get holdings error:",
      error
    );

    throw error;
  }

  return data || [];
};

/* =========================================================
   PAYLOAD BUILDER
========================================================= */

/* =========================================================
   BUILD FRONTEND FORM -> SUPABASE PAYLOAD
========================================================= */

export const buildHoldingPayload = (
  form
) => ({
  recommendation_date:
    form.recommendationDate || null,

  stock:
    form.stock?.trim() || "",

  sector:
    form.sector?.trim() ||
    "General",

  trade_type:
    form.tradeType || "Swing",

  market_category:
    form.marketCategory ||
    "Other",

  entry: Number(
    form.entry || 0
  ),

  cmp: Number(
    form.cmp || 0
  ),

  stop_loss: Number(
    form.stopLoss || 0
  ),

  target1: Number(
    form.target1 || 0
  ),

  target2: Number(
    form.target2 || 0
  ),

  target3: Number(
    form.target3 || 0
  ),

  conviction:
    form.conviction || "High",

  visibility:
    form.visibility || "Public",

  accuracy_show:
    form.accuracyShow ?? true,

  accuracy_blur:
    form.accuracyBlur ?? false,

  featured:
    form.featured ?? false,

  publish_status:
    form.publishStatus ||
    "Published",

  chart_image_url:
    form.chartImageUrl || null,

  research_pdf_url:
    form.researchPdfUrl || null,

  thesis:
    form.thesis || "",

  tradingview_symbol:
    form.tradingviewSymbol || "",

  holding_status:
    form.holdingStatus ||
    "Active",

  trade_status:
    form.tradeStatus ||
    "Active",

  /* ======================================
     REALISED RETURN
  ====================================== */

  exit_price:
    form.exitPrice === "" ||
    form.exitPrice === null ||
    form.exitPrice === undefined
      ? null
      : Number(
          form.exitPrice
        ),

  exit_date:
    form.exitDate || null,

  realised_return:
    form.realisedReturn === "" ||
    form.realisedReturn === null ||
    form.realisedReturn === undefined
      ? null
      : Number(
          form.realisedReturn
        ),

  /* ======================================
     DHAN DETAILS
  ====================================== */

  security_id:
    form.securityId === "" ||
    form.securityId === null ||
    form.securityId === undefined
      ? null
      : String(
          form.securityId
        ),

  exchange:
    form.exchange || "NSE",

  segment:
    form.segment || "NSE_EQ",

  cmp_updated_at:
    form.cmpUpdatedAt || null,
});

/* =========================================================
   ADD HOLDING
========================================================= */

export const addHolding = async (
  holding
) => {
  let chartImageUrl =
    holding.chartImageUrl || "";

  let researchPdfUrl =
    holding.researchPdfUrl || "";

  if (holding.chartImage) {
    chartImageUrl =
      await uploadHoldingFile(
        holding.chartImage,
        "charts"
      );
  }

  if (holding.researchPdf) {
    researchPdfUrl =
      await uploadHoldingFile(
        holding.researchPdf,
        "research"
      );
  }

  const payload = buildHoldingPayload({
    ...holding,
    chartImageUrl,
    researchPdfUrl,
  });

  const { data, error } = await supabase
    .from("holdings")
    .insert([payload])
    .select("*")
    .single();

  if (error) {
    console.error(
      "Add holding error:",
      error
    );

    throw error;
  }

  return data;
};

/* =========================================================
   UPDATE HOLDING
========================================================= */

export const updateHolding = async (
  id,
  holding
) => {
  let chartImageUrl =
    holding.chartImageUrl || "";

  let researchPdfUrl =
    holding.researchPdfUrl || "";

  if (holding.chartImage) {
    chartImageUrl =
      await uploadHoldingFile(
        holding.chartImage,
        "charts"
      );
  }

  if (holding.researchPdf) {
    researchPdfUrl =
      await uploadHoldingFile(
        holding.researchPdf,
        "research"
      );
  }

  const payload = {
    ...buildHoldingPayload({
      ...holding,
      chartImageUrl,
      researchPdfUrl,
    }),

    updated_at:
      new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("holdings")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error(
      "Update holding error:",
      error
    );

    throw error;
  }

  return data;
};

/* =========================================================
   DELETE HOLDING
========================================================= */

export const deleteHolding = async (
  id
) => {
  const { error } = await supabase
    .from("holdings")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "Delete holding error:",
      error
    );

    throw error;
  }

  return true;
};

export const fetchSelectedInstrumentCMP = async ({
  securityId,
  segment,
}) => {
  const numericSecurityId = Number(securityId);

  if (
    !Number.isFinite(numericSecurityId) ||
    numericSecurityId <= 0
  ) {
    throw new Error("Invalid Dhan Security ID.");
  }

  const { data, error } =
    await supabase.functions.invoke(
      "refresh-cmp",
      {
        body: {
          securityId: numericSecurityId,
          segment: segment || "NSE_EQ",
        },
      }
    );

  if (error) {
    console.error(
      "Automatic CMP invocation error:",
      error
    );

    let message =
      error.message ||
      "Unable to fetch live CMP.";

    if (
      error.context &&
      typeof error.context.json ===
        "function"
    ) {
      try {
        const response =
          await error.context.json();

        message =
          response?.message || message;
      } catch {
        // Keep original error.
      }
    }

    throw new Error(message);
  }

  const liveCMP = Number(data?.cmp);

  if (
    data?.success !== true ||
    !Number.isFinite(liveCMP) ||
    liveCMP <= 0
  ) {
    console.error(
      "Invalid automatic CMP response:",
      data
    );

    throw new Error(
      data?.message ||
        "Dhan did not return a valid live CMP."
    );
  }

  return liveCMP;
};
/* =========================================================
   REFRESH CMP THROUGH DHAN EDGE FUNCTION
========================================================= */

export const refreshCMP = async () => {
  try {
    const { data, error } =
      await supabase.functions.invoke(
        "refresh-cmp",
        {
          body: {},
        }
      );

    if (error) {
      console.error(
        "CMP Edge Function invocation error:",
        error
      );

      let detailedMessage =
        error.message ||
        "Unable to invoke CMP refresh function.";

      /*
       * Supabase Function errors can sometimes
       * include the actual response in context.
       */
      if (
        error.context &&
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

          console.error(
            "CMP function error response:",
            errorBody
          );
        } catch {
          // Keep original error message.
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

    if (data.success !== true) {
      console.error(
        "CMP refresh unsuccessful response:",
        data
      );

      const dhanMessage =
        data?.dhanResponse
          ?.errorMessage ||
        data?.dhanResponse
          ?.message ||
        "";

      throw new Error(
        dhanMessage ||
          data.message ||
          "Dhan CMP refresh failed."
      );
    }

    return {
      success: true,

      message:
        data.message ||
        `CMP refreshed for ${
          data.updatedCount || 0
        } holding(s).`,

      updatedCount: Number(
        data.updatedCount || 0
      ),

      failed: Array.isArray(
        data.failed
      )
        ? data.failed
        : [],

      requestedInstruments:
        data.requestedInstruments || {},
    };
  } catch (error) {
    console.error(
      "Refresh CMP service error:",
      error
    );

    throw new Error(
      error?.message ||
        "Failed to refresh CMP."
    );
  }
};

/* =========================================================
   MAP DATABASE RECORD TO FRONTEND OBJECT
========================================================= */

export const mapHoldingFromDB = (
  holding
) => ({
  id: holding.id,

  recommendationDate:
    holding.recommendation_date ||
    holding.recommendationDate ||
    "",

  stock:
    holding.stock || "",

  sector:
    holding.sector || "General",

  tradeType:
    holding.trade_type ||
    holding.tradeType ||
    "Swing",

  marketCategory:
    holding.market_category ||
    holding.marketCategory ||
    "Other",

  entry: Number(
    holding.entry || 0
  ),

  cmp: Number(
    holding.cmp || 0
  ),

  stopLoss: Number(
    holding.stop_loss ??
      holding.stopLoss ??
      0
  ),

  target1: Number(
    holding.target1 ??
      holding.target_1 ??
      0
  ),

  target2: Number(
    holding.target2 ??
      holding.target_2 ??
      0
  ),

  target3: Number(
    holding.target3 ??
      holding.target_3 ??
      0
  ),

  conviction:
    holding.conviction || "High",

  visibility:
    holding.visibility || "Public",

  accuracyShow:
    holding.accuracy_show ??
    holding.accuracyShow ??
    true,

  accuracyBlur:
    holding.accuracy_blur ??
    holding.accuracyBlur ??
    false,

  featured: Boolean(
    holding.featured
  ),

  publishStatus:
    holding.publish_status ||
    holding.publishStatus ||
    "Published",

  chartImageUrl:
    holding.chart_image_url ||
    holding.chartImageUrl ||
    "",

  researchPdfUrl:
    holding.research_pdf_url ||
    holding.researchPdfUrl ||
    "",

  thesis:
    holding.thesis || "",

  tradingviewSymbol:
    holding.tradingview_symbol ||
    holding.tradingviewSymbol ||
    "",

  holdingStatus:
    holding.holding_status ||
    holding.holdingStatus ||
    "Active",

  tradeStatus:
    holding.trade_status ||
    holding.tradeStatus ||
    "Active",

  /* =====================================================
     EXIT / REALISED RETURN DETAILS
  ===================================================== */

  exitPrice:
    holding.exit_price === null ||
    holding.exit_price === undefined
      ? holding.exitPrice === null ||
        holding.exitPrice === undefined
        ? null
        : Number(
            holding.exitPrice
          )
      : Number(
          holding.exit_price
        ),

  exitDate:
    holding.exit_date ||
    holding.exitDate ||
    "",

  realisedReturn:
    holding.realised_return === null ||
    holding.realised_return === undefined
      ? holding.realisedReturn === null ||
        holding.realisedReturn === undefined
        ? null
        : Number(
            holding.realisedReturn
          )
      : Number(
          holding.realised_return
        ),

  /* =====================================================
     DHAN INSTRUMENT DETAILS
  ===================================================== */

  securityId:
    holding.security_id === null ||
    holding.security_id ===
      undefined
      ? holding.securityId === null ||
        holding.securityId ===
          undefined
        ? ""
        : String(
            holding.securityId
          )
      : String(
          holding.security_id
        ),

  exchange:
    holding.exchange || "NSE",

  segment:
    holding.segment ||
    "NSE_EQ",

  cmpUpdatedAt:
    holding.cmp_updated_at ||
    holding.cmpUpdatedAt ||
    null,

  createdAt:
    holding.created_at ||
    holding.createdAt ||
    null,

  updatedAt:
    holding.updated_at ||
    holding.updatedAt ||
    null,
});