import { supabase } from "../lib/supabase";
import { getResources } from "./libraryService";
import { getScanners } from "./scannerService";

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const firstAvailable = (...values) =>
  values.find(
    (value) =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
  );

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

  if (
    item.is_active === false ||
    item.active === false
  ) {
    return false;
  }

  return ![
    "inactive",
    "disabled",
    "draft",
    "unpublished",
  ].includes(status);
};

/* =========================================================
   SUBSCRIBER PROFILE
========================================================= */

export const getSubscriberProfile = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User is not logged in.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  /*
   * Use Supabase Auth email as fallback when the profiles
   * table does not contain an email value.
   */
  return {
    ...(profile || {}),

    id:
      profile?.id ||
      user.id,

    email:
      firstAvailable(
        profile?.email,
        user.email
      ) || "",

    full_name:
      firstAvailable(
        profile?.full_name,
        profile?.fullName,
        user.user_metadata?.full_name,
        user.user_metadata?.name,
        user.email?.split("@")[0]
      ) || "Subscriber",
  };
};

/* =========================================================
   SUBSCRIBER MEMBERSHIP
========================================================= */

export const getSubscriberMembership = async (
  email
) => {
  let membershipEmail = normalize(email);

  /*
   * If the dashboard did not provide an email,
   * recover it directly from Supabase Auth.
   */
  if (!membershipEmail) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    membershipEmail = normalize(user?.email);
  }

  if (!membershipEmail) {
    return null;
  }

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .ilike("email", membershipEmail)
    .order("id", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Membership fetch error:",
      error
    );

    throw error;
  }

  if (!data) {
    console.warn(
      `No membership found for ${membershipEmail}`
    );

    return null;
  }

  /*
   * Normalize different possible database column names
   * into the fields expected by Dashboard.jsx.
   */
  return {
    ...data,

    email:
      firstAvailable(
        data.email,
        membershipEmail
      ) || "",

    plan:
      firstAvailable(
        data.plan,
        data.plan_name,
        data.planName,
        data.subscription_plan,
        data.subscriptionPlan
      ) || "Subscriber",

    start_date:
      firstAvailable(
        data.start_date,
        data.startDate,
        data.subscription_start,
        data.subscriptionStart,
        data.joined_on,
        data.joinedOn
      ) || null,

    expiry_date:
      firstAvailable(
        data.expiry_date,
        data.expiryDate,
        data.end_date,
        data.endDate,
        data.subscription_expiry,
        data.subscriptionExpiry,
        data.expires_at,
        data.expiresAt
      ) || null,

    status:
      firstAvailable(
        data.status,
        data.subscription_status,
        data.subscriptionStatus,
        data.member_status,
        data.memberStatus
      ) || "active",
  };
};

/* =========================================================
   SUBSCRIBER LIBRARY
========================================================= */

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
        Boolean(item.featured),

      pinned:
        Boolean(item.pinned),

      views:
        Number(item.views || 0),

      video_url:
        normalize(item.type).includes("video")
          ? item.url || ""
          : "",

      file_url:
        normalize(item.type).includes("pdf") ||
        normalize(item.type).includes(
          "document"
        ) ||
        normalize(item.source_type).includes(
          "upload"
        )
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

/* =========================================================
   SUBSCRIBER SCANNERS
========================================================= */

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
        Boolean(item.featured),

      updated_at:
        item.updated_at ||
        item.updatedAt ||
        null,
    }));
};