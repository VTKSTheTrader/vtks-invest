import { supabase } from "../lib/supabase";
import { getResources } from "./libraryService";
import { getScanners } from "./scannerService";

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const isVisibleToSubscriber = (item) => {
  const access = normalize(
    item.access ||
      item.visibility ||
      item.audience ||
      item.access_type
  );

  return (
    !access ||
    access === "public" ||
    access === "subscriber" ||
    access === "subscribers" ||
    access === "premium" ||
    access === "community"
  );
};

const isActive = (item) => {
  const status = normalize(
    item.status ||
      item.publish_status ||
      item.publishStatus
  );

  if (item.is_active === false || item.active === false) {
    return false;
  }

  return ![
    "inactive",
    "disabled",
    "draft",
    "unpublished",
  ].includes(status);
};

export const getSubscriberProfile = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("User is not logged in.");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw error;

  return data;
};

export const getSubscriberMembership = async (email) => {
  if (!email) return null;

  const cleanEmail = email.trim().toLowerCase();

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .ilike("email", cleanEmail)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Membership fetch error:", error);
    throw error;
  }

  return data || null;
};

export const getSubscriberLibrary = async () => {
  const resources = await getResources();

  return (resources || [])
    .filter(
      (item) =>
        isActive(item) &&
        isVisibleToSubscriber(item)
    )
    .map((item) => ({
      id: item.id,

      title:
        item.title ||
        item.name ||
        "VTKS Resource",

      category:
        item.category ||
        "General",

      type:
        item.type ||
        "Resource",

      description:
        item.description ||
        "",

      access:
        item.access ||
        "Subscriber",

      status:
        item.status ||
        "Active",

      featured:
        item.featured || false,

      pinned:
        item.pinned || false,

      views:
        Number(item.views || 0),

      video_url:
        normalize(item.type).includes("video")
          ? item.url || ""
          : "",

      file_url:
        normalize(item.type).includes("pdf") ||
        normalize(item.type).includes("document") ||
        normalize(item.source_type).includes("upload")
          ? item.url || ""
          : "",

      url:
        item.url || "",

      created_at:
        item.created_at ||
        item.uploaded ||
        null,
    }));
};

export const getSubscriberScanners = async () => {
  const scanners = await getScanners();

  return (scanners || [])
    .filter(
      (item) =>
        isActive(item) &&
        isVisibleToSubscriber(item)
    )
    .map((item) => ({
      id: item.id,

      title:
        item.name ||
        item.title ||
        "VTKS Scanner",

      description: [
        item.category,
        item.timeframe,
      ]
        .filter(Boolean)
        .join(" • "),

      category:
        item.category ||
        "General",

      timeframe:
        item.timeframe ||
        "",

      url:
        item.link ||
        item.url ||
        "",

      access:
        item.access ||
        "Subscriber",

      status:
        item.status ||
        "Active",

      featured:
        item.featured || false,

      updated_at:
        item.updated_at ||
        item.updatedAt ||
        null,
    }));
};