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

const buildHoldingPayload = (holding) => ({
  recommendation_date:
    holding.recommendationDate || null,

  stock: String(
    holding.stock || ""
  ).trim(),

  sector:
    String(
      holding.sector || ""
    ).trim() || "General",

  trade_type:
    holding.tradeType || "Swing",

  market_category:
    holding.marketCategory || "Other",

  entry: Number(
    holding.entry || 0
  ),

  cmp: Number(
    holding.cmp || 0
  ),

  stop_loss: Number(
    holding.stopLoss || 0
  ),

  target1: Number(
    holding.target1 || 0
  ),

  target2: Number(
    holding.target2 || 0
  ),

  target3: Number(
    holding.target3 || 0
  ),

  conviction:
    holding.conviction || "High",

  visibility:
    holding.visibility || "Public",

  accuracy_show:
    holding.accuracyShow ?? true,

  accuracy_blur:
    holding.accuracyBlur ?? false,

  featured: Boolean(
    holding.featured
  ),

  publish_status:
    holding.publishStatus ||
    "Published",

  chart_image_url:
    holding.chartImageUrl || "",

  research_pdf_url:
    holding.researchPdfUrl || "",

  thesis: String(
    holding.thesis || ""
  ).trim(),

  tradingview_symbol: String(
    holding.tradingviewSymbol || ""
  ).trim(),

  holding_status:
    holding.holdingStatus ||
    "Active",

  trade_status:
    holding.tradeStatus ||
    "Active",

  /* Dhan instrument details */

  security_id:
    holding.securityId === "" ||
    holding.securityId === null ||
    holding.securityId === undefined
      ? null
      : Number(holding.securityId),

  exchange:
    String(
      holding.exchange || "NSE"
    )
      .trim()
      .toUpperCase(),

  segment:
    String(
      holding.segment || "NSE_EQ"
    )
      .trim()
      .toUpperCase(),
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
    "",

  stock:
    holding.stock || "",

  sector:
    holding.sector || "General",

  tradeType:
    holding.trade_type ||
    "Swing",

  marketCategory:
    holding.market_category ||
    "Other",

  entry: Number(
    holding.entry || 0
  ),

  cmp: Number(
    holding.cmp || 0
  ),

  stopLoss: Number(
    holding.stop_loss || 0
  ),

  target1: Number(
    holding.target1 || 0
  ),

  target2: Number(
    holding.target2 || 0
  ),

  target3: Number(
    holding.target3 || 0
  ),

  conviction:
    holding.conviction || "High",

  visibility:
    holding.visibility ||
    "Public",

  accuracyShow:
    holding.accuracy_show ??
    true,

  accuracyBlur:
    holding.accuracy_blur ??
    false,

  featured: Boolean(
    holding.featured
  ),

  publishStatus:
    holding.publish_status ||
    "Published",

  chartImageUrl:
    holding.chart_image_url ||
    "",

  researchPdfUrl:
    holding.research_pdf_url ||
    "",

  thesis:
    holding.thesis || "",

  tradingviewSymbol:
    holding.tradingview_symbol ||
    "",

  holdingStatus:
    holding.holding_status ||
    "Active",

  tradeStatus:
    holding.trade_status ||
    "Active",

  /* Dhan instrument details */

  securityId:
    holding.security_id === null ||
    holding.security_id ===
      undefined
      ? ""
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
    null,

  createdAt:
    holding.created_at ||
    null,

  updatedAt:
    holding.updated_at ||
    null,
});