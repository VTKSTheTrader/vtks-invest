import { supabase } from "../lib/supabase";

const TABLE_NAME = "scanners";

export const getScanners = async () => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error("Get scanners error:", error);
    throw error;
  }

  return data || [];
};

export const addScanner = async (scanner) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([
      {
        name: String(scanner.name || "").trim(),
        category:
          scanner.category || "Swing",
        timeframe:
          scanner.timeframe || "Daily",
        link: String(
          scanner.link || ""
        ).trim(),
        access:
          scanner.access || "Subscriber",
        status:
          scanner.status || "Active",
        featured: Boolean(
          scanner.featured
        ),
      },
    ])
    .select("*")
    .single();

  if (error) {
    console.error("Add scanner error:", error);
    throw error;
  }

  return data;
};

export const updateScanner = async (
  id,
  scanner
) => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      name: String(
        scanner.name || ""
      ).trim(),

      category:
        scanner.category || "Swing",

      timeframe:
        scanner.timeframe || "Daily",

      link: String(
        scanner.link || ""
      ).trim(),

      access:
        scanner.access || "Subscriber",

      status:
        scanner.status || "Active",

      featured: Boolean(
        scanner.featured
      ),

      updated_at:
        new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error(
      "Update scanner error:",
      error
    );

    throw error;
  }

  return data;
};

export const deleteScanner = async (id) => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "Delete scanner error:",
      error
    );

    throw error;
  }
};

export const mapScannerFromDB = (
  scanner
) => ({
  id: scanner.id,
  name: scanner.name || "",
  category:
    scanner.category || "General",
  timeframe:
    scanner.timeframe || "",
  link: scanner.link || "",
  access:
    scanner.access || "Subscriber",
  status:
    scanner.status || "Active",
  featured: Boolean(
    scanner.featured
  ),

  updatedAt: scanner.updated_at
    ? new Date(
        scanner.updated_at
      ).toLocaleDateString("en-IN")
    : "",
});