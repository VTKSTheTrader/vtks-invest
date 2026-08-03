import { supabase } from "../lib/supabase";

const BUCKET = "holding-files";

/* =========================================================
   HELPERS
========================================================= */

const cleanText = (value) =>
  String(value ?? "").trim();

const nullableText = (value) => {
  const cleaned = cleanText(value);

  return cleaned || null;
};

const nullableNumber = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

const normalizeFileName = (
  fileName = "file"
) =>
  String(fileName)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-");

const createUniqueFilePath = (
  folder,
  file
) => {
  const originalName =
    file?.name || "file";

  const dotIndex =
    originalName.lastIndexOf(".");

  const baseName =
    dotIndex > 0
      ? originalName.slice(
          0,
          dotIndex
        )
      : originalName;

  const extension =
    dotIndex > 0
      ? originalName
          .slice(dotIndex + 1)
          .toLowerCase()
      : "file";

  const safeName =
    normalizeFileName(baseName) ||
    "holding-file";

  const uniqueId =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}`;

  return `${folder}/${uniqueId}-${safeName}.${extension}`;
};

/* =========================================================
   FILE UPLOAD
========================================================= */

export const uploadHoldingFile = async (
  file,
  folder = "files"
) => {
  if (!file) return null;

  const filePath =
    createUniqueFilePath(
      folder,
      file
    );

  const { error } =
    await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType:
          file.type || undefined,
      });

  if (error) {
    console.error(
      "Holding file upload error:",
      error
    );

    throw new Error(
      error.message ||
        "Unable to upload the holding file."
    );
  }

  const { data } =
    supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

  const publicUrl =
    data?.publicUrl || "";

  if (!publicUrl) {
    throw new Error(
      "File uploaded, but its public URL could not be generated."
    );
  }

  return publicUrl;
};

/* =========================================================
   GET HOLDINGS
========================================================= */

export const getHoldings = async () => {
  const { data, error } =
    await supabase
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
   BUILD FRONTEND FORM → SUPABASE PAYLOAD
========================================================= */

export const buildHoldingPayload = (
  form
) => ({
  recommendation_date:
    form.recommendationDate || null,

  stock:
    cleanText(form.stock),

  sector:
    cleanText(form.sector) ||
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

  /*
    Legacy single-chart field.

    Keep this populated for older pages and
    existing holdings. The Before chart URL
    is used as its preferred fallback.
  */
  chart_image_url:
    form.chartImageUrl ||
    form.beforeChartUrl ||
    null,

  /*
    New Before / After chart fields.
  */
  before_chart_url:
    form.beforeChartUrl || null,

  after_chart_url:
    form.afterChartUrl || null,

  before_chart_caption:
    nullableText(
      form.beforeChartCaption
    ),

  after_chart_caption:
    nullableText(
      form.afterChartCaption
    ),

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

  /* =====================================================
     EXIT / REALISED RETURN
  ===================================================== */

  exit_price:
    nullableNumber(
      form.exitPrice
    ),

  exit_date:
    form.exitDate || null,

  realised_return:
    nullableNumber(
      form.realisedReturn
    ),

  /* =====================================================
     DHAN DETAILS
  ===================================================== */

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
   PREPARE HOLDING FILES
========================================================= */

const prepareHoldingFiles = async (
  holding
) => {
  /*
    Existing URL values are preserved while editing.
  */
  let beforeChartUrl =
    holding.beforeChartUrl ||
    holding.chartImageUrl ||
    "";

  let afterChartUrl =
    holding.afterChartUrl || "";

  let researchPdfUrl =
    holding.researchPdfUrl || "";

  /*
    Support the old chartImage input as a Before chart.
    This prevents older HoldingModal code from breaking
    while you update the modal.
  */
  const beforeChartFile =
    holding.beforeChart ||
    holding.chartImage ||
    null;

  const afterChartFile =
    holding.afterChart || null;

  if (beforeChartFile) {
    beforeChartUrl =
      await uploadHoldingFile(
        beforeChartFile,
        "charts/before"
      );
  }

  if (afterChartFile) {
    afterChartUrl =
      await uploadHoldingFile(
        afterChartFile,
        "charts/after"
      );
  }

  if (holding.researchPdf) {
    researchPdfUrl =
      await uploadHoldingFile(
        holding.researchPdf,
        "research"
      );
  }

  return {
    beforeChartUrl,
    afterChartUrl,
    researchPdfUrl,

    /*
      Keep legacy chartImageUrl synced to
      the Before chart.
    */
    chartImageUrl:
      beforeChartUrl ||
      holding.chartImageUrl ||
      "",
  };
};

/* =========================================================
   ADD HOLDING
========================================================= */

export const addHolding = async (
  holding
) => {
  const preparedFiles =
    await prepareHoldingFiles(
      holding
    );

  const payload =
    buildHoldingPayload({
      ...holding,
      ...preparedFiles,
    });

  const { data, error } =
    await supabase
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
  if (!id) {
    throw new Error(
      "Holding ID is required."
    );
  }

  const preparedFiles =
    await prepareHoldingFiles(
      holding
    );

  const payload = {
    ...buildHoldingPayload({
      ...holding,
      ...preparedFiles,
    }),

    updated_at:
      new Date().toISOString(),
  };

  const { data, error } =
    await supabase
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
  if (!id) {
    throw new Error(
      "Holding ID is required."
    );
  }

  const { error } =
    await supabase
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
/* =========================================================
   REMOVE HOLDING CHART
========================================================= */

const getStoragePathFromPublicUrl = (publicUrl) => {
  if (!publicUrl) return "";

  try {
    const url = new URL(publicUrl);

    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return "";
    }

    return decodeURIComponent(
      url.pathname.slice(
        markerIndex + marker.length
      )
    );
  } catch {
    return "";
  }
};

export const removeHoldingChart = async ({
  holdingId,
  chartType,
  chartUrl,
}) => {
  if (!holdingId) {
    throw new Error(
      "Holding ID is required to remove the chart."
    );
  }

  if (
    chartType !== "before" &&
    chartType !== "after"
  ) {
    throw new Error(
      "Invalid chart type."
    );
  }

  const payload =
    chartType === "before"
      ? {
          before_chart_url: null,
          before_chart_caption: null,

          // Important: remove legacy fallback too.
          chart_image_url: null,

          updated_at:
            new Date().toISOString(),
        }
      : {
          after_chart_url: null,
          after_chart_caption: null,

          updated_at:
            new Date().toISOString(),
        };

  /*
    First clear the database so the wrong image
    immediately disappears from the live website.
  */
  const { data, error } = await supabase
    .from("holdings")
    .update(payload)
    .eq("id", holdingId)
    .select("*")
    .single();

  if (error) {
    console.error(
      "Remove holding chart database error:",
      error
    );

    throw new Error(
      error.message ||
        "Unable to remove the chart."
    );
  }

  /*
    Then remove the actual file from Storage.
    If the URL is external or the storage removal fails,
    the database is still cleared and the image remains
    hidden from the website.
  */
  const storagePath =
    getStoragePathFromPublicUrl(chartUrl);

  if (storagePath) {
    const { error: storageError } =
      await supabase.storage
        .from(BUCKET)
        .remove([storagePath]);

    if (storageError) {
      console.warn(
        "Chart removed from holding, but Storage cleanup failed:",
        storageError
      );
    }
  }

  return data;
};
/* =========================================================
   FETCH CMP FOR SELECTED INSTRUMENT
========================================================= */

export const fetchSelectedInstrumentCMP =
  async ({
    securityId,
    segment,
  }) => {
    const numericSecurityId =
      Number(securityId);

    if (
      !Number.isFinite(
        numericSecurityId
      ) ||
      numericSecurityId <= 0
    ) {
      throw new Error(
        "Invalid Dhan Security ID."
      );
    }

    const { data, error } =
      await supabase.functions.invoke(
        "refresh-cmp",
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
            response?.message ||
            response?.error ||
            message;
        } catch {
          // Keep original error.
        }
      }

      throw new Error(message);
    }

    const liveCMP =
      Number(data?.cmp);

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
   REFRESH ALL CMP VALUES
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
        data.requestedInstruments ||
        {},
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
   MAP DATABASE RECORD → FRONTEND OBJECT
========================================================= */

export const mapHoldingFromDB = (
  holding
) => {
  /*
    Existing holdings may only have chart_image_url.

    Use that as the Before chart fallback.
  */
  const legacyChartUrl =
    holding.chart_image_url ||
    holding.chartImageUrl ||
    "";

  const beforeChartUrl =
    holding.before_chart_url ||
    holding.beforeChartUrl ||
    legacyChartUrl ||
    "";

  const afterChartUrl =
    holding.after_chart_url ||
    holding.afterChartUrl ||
    "";

  return {
    id: holding.id,

    recommendationDate:
      holding.recommendation_date ||
      holding.recommendationDate ||
      "",

    stock:
      holding.stock || "",

    sector:
      holding.sector ||
      "General",

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
      holding.conviction ||
      "High",

    visibility:
      holding.visibility ||
      "Public",

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

    /*
      Legacy single chart URL.
    */
    chartImageUrl:
      legacyChartUrl ||
      beforeChartUrl,

    /*
      New Before / After charts.
    */
    beforeChartUrl,

    afterChartUrl,

    beforeChartCaption:
      holding.before_chart_caption ||
      holding.beforeChartCaption ||
      "",

    afterChartCaption:
      holding.after_chart_caption ||
      holding.afterChartCaption ||
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
       EXIT / REALISED RETURN
    ===================================================== */

    exitPrice:
      holding.exit_price === null ||
      holding.exit_price ===
        undefined
        ? holding.exitPrice ===
            null ||
          holding.exitPrice ===
            undefined
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
      holding.realised_return ===
        null ||
      holding.realised_return ===
        undefined
        ? holding.realisedReturn ===
            null ||
          holding.realisedReturn ===
            undefined
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
      holding.security_id ===
        null ||
      holding.security_id ===
        undefined
        ? holding.securityId ===
            null ||
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
  };
};