import { supabase } from "../lib/supabase";

const RESPONSE_BUCKET = "stock-query-responses";

/* =========================================================
   HELPERS
========================================================= */

const sanitizeFileName = (fileName = "file") => {
  return String(fileName)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-");
};

const createFilePath = (folder, file) => {
  const originalName = file?.name || "file";
  const lastDotIndex = originalName.lastIndexOf(".");

  const baseName =
    lastDotIndex > 0
      ? originalName.slice(0, lastDotIndex)
      : originalName;

  const extension =
    lastDotIndex > 0
      ? originalName.slice(lastDotIndex + 1).toLowerCase()
      : "file";

  const safeName =
    sanitizeFileName(baseName) || "response-file";

  const uniquePart =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}`;

  return `${folder}/${uniquePart}-${safeName}.${extension}`;
};

const uploadResponseFile = async ({
  file,
  folder,
  allowedTypes,
  maxSizeMB,
}) => {
  if (!file) {
    throw new Error("Please select a file.");
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Unsupported file format. Please select a supported file."
    );
  }

  const maximumBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maximumBytes) {
    throw new Error(
      `File size must be less than ${maxSizeMB} MB.`
    );
  }

  const filePath = createFilePath(folder, file);

  const { error: uploadError } = await supabase.storage
    .from(RESPONSE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    console.error(
      "Stock query response upload error:",
      uploadError
    );

    throw new Error(
      uploadError.message || "Unable to upload the file."
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from(RESPONSE_BUCKET)
    .getPublicUrl(filePath);

  const publicUrl = publicUrlData?.publicUrl;

  if (!publicUrl) {
    throw new Error(
      "The file uploaded, but its public URL could not be generated."
    );
  }

  return publicUrl;
};

/* =========================================================
   FILE UPLOADS
========================================================= */

export const uploadStockQueryChart = async (file) => {
  return uploadResponseFile({
    file,
    folder: "charts",
    allowedTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
    ],
    maxSizeMB: 8,
  });
};

export const uploadStockQueryVideo = async (file) => {
  return uploadResponseFile({
    file,
    folder: "videos",
    allowedTypes: [
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ],
    maxSizeMB: 100,
  });
};

/* =========================================================
   PUBLIC: SUBMIT QUERY
========================================================= */

export const submitStockQuery = async (queryData) => {
  if (!queryData) {
    throw new Error("Query data is required.");
  }

  const name = queryData.name?.trim();
  const stockName = queryData.stockName?.trim();
  const question = queryData.question?.trim();

  if (!name) {
    throw new Error("Please enter your name.");
  }

  if (!stockName) {
    throw new Error("Please enter the stock name.");
  }

  if (!question) {
    throw new Error("Please enter your query.");
  }

  const payload = {
    name,
    contact: queryData.contact?.trim() || null,
    stock_name: stockName,
    symbol: null,
    timeframe: queryData.timeframe || "Swing",
    question,
    chart_url: queryData.chartUrl?.trim() || null,
    status: "New",
    response_type: null,
    response_text: null,
    response_chart_url: null,
    response_video_url: null,
    is_public: false,
    updated_at: new Date().toISOString(),
  };

  /*
    Do not add .select() here.

    Public visitors can insert private queries, but they
    should not be allowed to read the private row back.
  */
  const { error } = await supabase
    .from("stock_queries")
    .insert([payload]);

  if (error) {
    console.error(
      "Submit stock query error:",
      error
    );

    throw new Error(
      error.message ||
        "Unable to submit your query. Please try again."
    );
  }

  return true;
};

/* =========================================================
   PUBLIC: PUBLISHED QUERIES
========================================================= */

export const getPublishedStockQueries = async () => {
  const { data, error } = await supabase
    .from("stock_queries")
    .select("*")
    .eq("is_public", true)
    .order("updated_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Fetch published stock queries error:",
      error
    );

    throw new Error(
      error.message ||
        "Unable to load published stock queries."
    );
  }

  return data || [];
};

/* =========================================================
   ADMIN: ALL QUERIES
========================================================= */

export const getAllStockQueries = async () => {
  const { data, error } = await supabase
    .from("stock_queries")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Fetch all stock queries error:",
      error
    );

    throw new Error(
      error.message ||
        "Unable to load stock queries."
    );
  }

  return data || [];
};

/* =========================================================
   ADMIN: UPDATE QUERY
========================================================= */

export const updateStockQuery = async (
  id,
  updates = {}
) => {
  if (!id) {
    throw new Error("Query ID is required.");
  }

  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("stock_queries")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Update stock query error:",
      error
    );

    throw new Error(
      error.message ||
        "Unable to update the stock query."
    );
  }

  return data;
};

/* =========================================================
   ADMIN: PUBLISH RESPONSE
========================================================= */

export const publishStockQuery = async (
  id,
  {
    responseType,
    responseText,
    responseChartUrl,
    responseVideoUrl,
  } = {}
) => {
  if (!id) {
    throw new Error("Query ID is required.");
  }

  const payload = {
    status: "Published",
    response_type: responseType || "text",
    response_text:
      responseText?.trim() || null,
    response_chart_url:
      responseChartUrl?.trim() || null,
    response_video_url:
      responseVideoUrl?.trim() || null,
    is_public: true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("stock_queries")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Publish stock query error:",
      error
    );

    throw new Error(
      error.message ||
        "Unable to publish the stock query."
    );
  }

  return data;
};

/* =========================================================
   ADMIN: UNPUBLISH RESPONSE
========================================================= */

export const unpublishStockQuery = async (id) => {
  if (!id) {
    throw new Error("Query ID is required.");
  }

  const { data, error } = await supabase
    .from("stock_queries")
    .update({
      is_public: false,
      status: "Answered",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Unpublish stock query error:",
      error
    );

    throw new Error(
      error.message ||
        "Unable to unpublish the stock query."
    );
  }

  return data;
};

/* =========================================================
   ADMIN: DELETE QUERY
========================================================= */

export const deleteStockQuery = async (id) => {
  if (!id) {
    throw new Error("Query ID is required.");
  }

  const { error } = await supabase
    .from("stock_queries")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "Delete stock query error:",
      error
    );

    throw new Error(
      error.message ||
        "Unable to delete the stock query."
    );
  }

  return true;
};