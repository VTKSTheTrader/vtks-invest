import { supabase } from "../lib/supabase";

const TABLE_NAME = "monthly_levels";
const STORAGE_BUCKET = "monthly-level-charts";

const normalizeText = (value) =>
  String(value ?? "").trim();

const normalizeLower = (value) =>
  normalizeText(value).toLowerCase();

const toNullableNumber = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return parsedValue;
};

const createSafeFileName = (fileName) => {
  const extension =
    fileName.split(".").pop()?.toLowerCase() ||
    "png";

  const baseName = fileName
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${baseName || "chart"}-${Date.now()}.${extension}`;
};

export const defaultMonthlyLevel = {
  instrument: "",
  category: "index",
  month: "",

  resistance3: "",
  resistance2: "",
  resistance1: "",

  pivot: "",

  support1: "",
  support2: "",
  support3: "",

  bias: "neutral",
  trend: "",
  momentum: "",

  abovePivotPlan: "",
  belowPivotPlan: "",
  observation: "",

  beforeChartUrl: "",
  afterChartUrl: "",

  visibility: "public",
  status: "draft",
};

export function mapMonthlyLevelFromDB(row = {}) {
  return {
    id: row.id,

    instrument: row.instrument || "",
    category: row.category || "index",
    month: row.month || "",

    resistance3: row.resistance_3 ?? "",
    resistance2: row.resistance_2 ?? "",
    resistance1: row.resistance_1 ?? "",

    pivot: row.pivot ?? "",

    support1: row.support_1 ?? "",
    support2: row.support_2 ?? "",
    support3: row.support_3 ?? "",

    bias: row.bias || "neutral",
    trend: row.trend || "",
    momentum: row.momentum || "",

    abovePivotPlan:
      row.above_pivot_plan || "",

    belowPivotPlan:
      row.below_pivot_plan || "",

    observation:
      row.observation || "",

    beforeChartUrl:
      row.before_chart_url || "",

    afterChartUrl:
      row.after_chart_url || "",

    visibility:
      row.visibility || "public",

    status:
      row.status || "draft",

    createdAt:
      row.created_at || null,

    updatedAt:
      row.updated_at || null,
  };
}

export function buildMonthlyLevelPayload(
  form = {}
) {
  return {
    instrument:
      normalizeText(form.instrument),

    category:
      normalizeLower(form.category) ||
      "index",

    month:
      normalizeText(form.month),

    resistance_3:
      toNullableNumber(
        form.resistance3
      ),

    resistance_2:
      toNullableNumber(
        form.resistance2
      ),

    resistance_1:
      toNullableNumber(
        form.resistance1
      ),

    pivot:
      toNullableNumber(form.pivot),

    support_1:
      toNullableNumber(form.support1),

    support_2:
      toNullableNumber(form.support2),

    support_3:
      toNullableNumber(form.support3),

    bias:
      normalizeLower(form.bias) ||
      "neutral",

    trend:
      normalizeText(form.trend),

    momentum:
      normalizeText(form.momentum),

    above_pivot_plan:
      normalizeText(
        form.abovePivotPlan
      ),

    below_pivot_plan:
      normalizeText(
        form.belowPivotPlan
      ),

    observation:
      normalizeText(
        form.observation
      ),

    before_chart_url:
      normalizeText(
        form.beforeChartUrl
      ),

    after_chart_url:
      normalizeText(
        form.afterChartUrl
      ),

    visibility:
      normalizeLower(
        form.visibility
      ) || "public",

    status:
      normalizeLower(form.status) ||
      "draft",

    updated_at:
      new Date().toISOString(),
  };
}

/* =========================================================
   ADMIN READ
========================================================= */

export async function getMonthlyLevels() {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data || []).map(
    mapMonthlyLevelFromDB
  );
}

/* =========================================================
   PUBLIC READ
========================================================= */

export async function getPublishedMonthlyLevels() {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("status", "published")
    .eq("visibility", "public")
    .order("instrument", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data || []).map(
    mapMonthlyLevelFromDB
  );
}

/* =========================================================
   SUBSCRIBER READ
========================================================= */

export async function getSubscriberMonthlyLevels() {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("status", "published")
    .in("visibility", [
      "public",
      "subscriber",
    ])
    .order("instrument", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data || []).map(
    mapMonthlyLevelFromDB
  );
}

/* =========================================================
   SINGLE RECORD
========================================================= */

export async function getMonthlyLevelById(id) {
  if (!id) {
    throw new Error(
      "Monthly level ID is required."
    );
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data
    ? mapMonthlyLevelFromDB(data)
    : null;
}

/* =========================================================
   CREATE
========================================================= */

export async function addMonthlyLevel(form) {
  const payload =
    buildMonthlyLevelPayload(form);

  if (!payload.instrument) {
    throw new Error(
      "Instrument is required."
    );
  }

  if (!payload.month) {
    throw new Error(
      "Month is required."
    );
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapMonthlyLevelFromDB(data);
}

/* =========================================================
   UPDATE
========================================================= */

export async function updateMonthlyLevel(
  id,
  form
) {
  if (!id) {
    throw new Error(
      "Monthly level ID is required."
    );
  }

  const payload =
    buildMonthlyLevelPayload(form);

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapMonthlyLevelFromDB(data);
}

/* =========================================================
   DELETE
========================================================= */

export async function deleteMonthlyLevel(id) {
  if (!id) {
    throw new Error(
      "Monthly level ID is required."
    );
  }

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}

/* =========================================================
   CHART UPLOAD
========================================================= */

export async function uploadMonthlyLevelChart(
  file,
  folder = "general"
) {
  if (!file) {
    throw new Error(
      "Please select a chart image."
    );
  }

  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Only PNG, JPG, JPEG and WEBP images are allowed."
    );
  }

  const maxFileSize =
    10 * 1024 * 1024;

  if (file.size > maxFileSize) {
    throw new Error(
      "Chart image must be smaller than 10 MB."
    );
  }

  const safeFolder =
    normalizeLower(folder)
      .replace(/[^a-z0-9/-]+/g, "-")
      .replace(/\/+/g, "/")
      .replace(/^\/|\/$/g, "") ||
    "general";

  const fileName =
    createSafeFileName(file.name);

  const filePath =
    `${safeFolder}/${fileName}`;

  const { error: uploadError } =
    await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  if (!data?.publicUrl) {
    throw new Error(
      "Unable to generate public chart URL."
    );
  }

  return {
    path: filePath,
    publicUrl: data.publicUrl,
  };
}