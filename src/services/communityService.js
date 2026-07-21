import { supabase } from "../lib/supabase";

/* =========================================================
   NORMALISATION
========================================================= */

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

/* =========================================================
   DATABASE → FRONTEND MAPPER
========================================================= */

export const mapCommunityLinkFromDB = (row) => ({
  id: row.id,

  title: row.title || "",
  description: row.description || "",

  platform: row.platform || "telegram",
  url: row.url || "",

  access: row.access || "subscriber",
  status: row.status || "active",

  sortOrder: Number(row.sort_order || 1),
  featured: Boolean(row.featured),

  createdAt: row.created_at || null,
  updatedAt: row.updated_at || null,
});

/* =========================================================
   FRONTEND → DATABASE PAYLOAD
========================================================= */

const buildCommunityLinkPayload = (link) => ({
  title: String(link.title || "").trim(),

  description: String(
    link.description || ""
  ).trim(),

  platform: normalize(
    link.platform || "telegram"
  ),

  url: String(link.url || "").trim(),

  access: normalize(
    link.access || "subscriber"
  ),

  status: normalize(
    link.status || "active"
  ),

  sort_order: Number(
    link.sortOrder || 1
  ),

  featured: Boolean(link.featured),

  updated_at: new Date().toISOString(),
});

/* =========================================================
   GET ALL LINKS
========================================================= */

export const getCommunityLinks = async () => {
  const { data, error } = await supabase
    .from("community_links")
    .select("*")
    .order("sort_order", {
      ascending: true,
    })
    .order("id", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Get community links error:",
      error
    );

    throw error;
  }

  return (data || []).map(
    mapCommunityLinkFromDB
  );
};

/* =========================================================
   GET ACTIVE SUBSCRIBER LINKS
========================================================= */

export const getSubscriberCommunityLinks =
  async () => {
    const { data, error } = await supabase
      .from("community_links")
      .select("*")
      .eq("status", "active")
      .in("access", [
        "subscriber",
        "community",
      ])
      .order("sort_order", {
        ascending: true,
      })
      .order("id", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Get subscriber community links error:",
        error
      );

      throw error;
    }

    return (data || []).map(
      mapCommunityLinkFromDB
    );
  };

/* =========================================================
   ADD LINK
========================================================= */

export const addCommunityLink = async (
  link
) => {
  const payload =
    buildCommunityLinkPayload(link);

  if (!payload.title) {
    throw new Error(
      "Channel name is required."
    );
  }

  if (!payload.url) {
    throw new Error(
      "Telegram invite link is required."
    );
  }

  const { data, error } = await supabase
    .from("community_links")
    .insert([
      {
        ...payload,
        created_at:
          new Date().toISOString(),
      },
    ])
    .select("*")
    .single();

  if (error) {
    console.error(
      "Add community link error:",
      error
    );

    throw error;
  }

  return mapCommunityLinkFromDB(data);
};

/* =========================================================
   UPDATE LINK
========================================================= */

export const updateCommunityLink = async (
  id,
  link
) => {
  if (!id) {
    throw new Error(
      "Community link ID is required."
    );
  }

  const payload =
    buildCommunityLinkPayload(link);

  if (!payload.title) {
    throw new Error(
      "Channel name is required."
    );
  }

  if (!payload.url) {
    throw new Error(
      "Telegram invite link is required."
    );
  }

  const { data, error } = await supabase
    .from("community_links")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error(
      "Update community link error:",
      error
    );

    throw error;
  }

  return mapCommunityLinkFromDB(data);
};

/* =========================================================
   DELETE LINK
========================================================= */

export const deleteCommunityLink = async (
  id
) => {
  if (!id) {
    throw new Error(
      "Community link ID is required."
    );
  }

  const { error } = await supabase
    .from("community_links")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "Delete community link error:",
      error
    );

    throw error;
  }

  return true;
};

/* =========================================================
   CHANGE STATUS
========================================================= */

export const updateCommunityLinkStatus =
  async (id, status) => {
    const normalizedStatus =
      normalize(status);

    if (
      !["active", "inactive"].includes(
        normalizedStatus
      )
    ) {
      throw new Error(
        "Invalid community link status."
      );
    }

    const { data, error } = await supabase
      .from("community_links")
      .update({
        status: normalizedStatus,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error(
        "Update community status error:",
        error
      );

      throw error;
    }

    return mapCommunityLinkFromDB(data);
  };