import { supabase } from "../lib/supabase";

const BUCKET = "library-files";

/* =====================================================
   GET ALL RESOURCES
===================================================== */

export const getResources = async () => {
  const { data, error } = await supabase
    .from("library")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error("GET RESOURCES ERROR:", error);
    throw error;
  }

  return data || [];
};

/* =====================================================
   UPLOAD LIBRARY FILE
===================================================== */

export const uploadLibraryFile = async (file) => {
  if (!file) return null;

  const fileExt =
    file.name.split(".").pop()?.toLowerCase() || "file";

  const fileName =
    Date.now() +
    "-" +
    Math.random().toString(36).substring(2) +
    "." +
    fileExt;

  const filePath = `resources/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("UPLOAD ERROR FULL:", error);
    throw error;
  }

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return data?.publicUrl || null;
};

/* =====================================================
   BUILD RESOURCE PAYLOAD
===================================================== */

const buildResourcePayload = (resource) => {
  const isStockAnalysis =
    resource.category === "Stock Analysis";

  return {
    title: String(resource.title || "").trim(),

    stock_name: isStockAnalysis
      ? String(resource.stockName || "").trim() || null
      : null,

    analysis_date: isStockAnalysis
      ? resource.analysisDate || null
      : null,

    category:
      resource.category || "Beginner Course",

    type:
      resource.type || "Video",

    source_type:
      resource.sourceType || "Link",

    access:
      resource.access || "Subscriber",

    url:
      String(resource.url || "").trim() || null,

    description:
      String(resource.description || "").trim() || null,

    status:
      resource.status || "Published",

    featured:
      Boolean(resource.featured),

    pinned:
      Boolean(resource.pinned),

    views:
      Number(resource.views || 0),
  };
};

/* =====================================================
   ADD RESOURCE
===================================================== */

export const addResource = async (resource) => {
  const payload =
    buildResourcePayload(resource);

  const { data, error } = await supabase
    .from("library")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("ADD RESOURCE ERROR:", error);
    throw error;
  }

  return data;
};

/* =====================================================
   UPDATE RESOURCE
===================================================== */

export const updateResource = async (
  id,
  resource
) => {
  const payload = {
    ...buildResourcePayload(resource),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("library")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "UPDATE RESOURCE ERROR:",
      error
    );

    throw error;
  }

  return data;
};

/* =====================================================
   DELETE RESOURCE
===================================================== */

export const deleteResource = async (id) => {
  const { error } = await supabase
    .from("library")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "DELETE RESOURCE ERROR:",
      error
    );

    throw error;
  }

  return true;
};

/* =====================================================
   MAP DATABASE RESOURCE
===================================================== */

export const mapResourceFromDB = (r) => ({
  id: r.id,

  title:
    r.title || "",

  stockName:
    r.stock_name || "",

  analysisDate:
    r.analysis_date || "",

  category:
    r.category || "",

  type:
    r.type || "",

  sourceType:
    r.source_type || "Link",

  access:
    r.access || "",

  url:
    r.url || "",

  description:
    r.description || "",

  status:
    r.status || "",

  featured:
    Boolean(r.featured),

  pinned:
    Boolean(r.pinned),

  views:
    Number(r.views || 0),

  createdAt:
    r.created_at || "",

  updatedAtRaw:
    r.updated_at || "",

  uploaded: r.created_at
    ? new Date(
        r.created_at
      ).toLocaleDateString("en-IN")
    : "",

  updatedAt: r.updated_at
    ? new Date(
        r.updated_at
      ).toLocaleDateString("en-IN")
    : "",
});

/* =====================================================
   GET PUBLIC STOCK ANALYSIS
===================================================== */

export const getPublicStockAnalysis =
  async () => {
    const { data, error } =
      await supabase
        .from("library")
        .select("*")
        .eq(
          "category",
          "Stock Analysis"
        )
        .eq(
          "access",
          "Public"
        )
        .eq(
          "status",
          "Published"
        )
        .order(
          "analysis_date",
          {
            ascending: false,
            nullsFirst: false,
          }
        )
        .order(
          "id",
          {
            ascending: false,
          }
        );

    if (error) {
      console.error(
        "GET PUBLIC STOCK ANALYSIS ERROR:",
        error
      );

      throw error;
    }

    return (data || []).map(
      mapResourceFromDB
    );
  };