import { supabase } from "../lib/supabase";

const TESTIMONIALS_TABLE = "testimonials";
const STORAGE_BUCKET = "testimonial-files";

const cleanText = (value) => String(value || "").trim();

const normalizeBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
};

const buildFileName = (file, userId = "member") => {
  const extension = file?.name?.split(".").pop() || "jpg";

  const safeUserId = String(userId || "member").replace(
    /[^a-zA-Z0-9-_]/g,
    ""
  );

  return `${safeUserId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}.${extension}`;
};

export const uploadTestimonialFile = async ({
  file,
  userId,
}) => {
  if (!file) {
    return "";
  }

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Only JPG, PNG and WEBP image files are allowed."
    );
  }

  const maxFileSize = 5 * 1024 * 1024;

  if (file.size > maxFileSize) {
    throw new Error(
      "The image size must be less than 5 MB."
    );
  }

  const filePath = buildFileName(file, userId);

  const { error: uploadError } = await supabase.storage
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

  return data?.publicUrl || "";
};

export const submitFeedback = async ({
  userId,
  name,
  email,
  rating,
  category,
  message,
  memberSince,
  showName = true,
  showPhoto = false,
  photoUrl = "",
  screenshotUrl = "",
}) => {
  const safeRating = Number(rating);

  if (!cleanText(name)) {
    throw new Error("Please enter your name.");
  }

  if (!safeRating || safeRating < 1 || safeRating > 5) {
    throw new Error("Please select a rating from 1 to 5.");
  }

  if (!cleanText(category)) {
    throw new Error("Please select a feedback category.");
  }

  if (cleanText(message).length < 20) {
    throw new Error(
      "Feedback must contain at least 20 characters."
    );
  }

  const payload = {
    user_id: userId || null,
    name: cleanText(name),
    email: cleanText(email) || null,
    rating: safeRating,
    category: cleanText(category),
    message: cleanText(message),
    member_since: cleanText(memberSince) || null,
    show_name: normalizeBoolean(showName, true),
    show_photo: normalizeBoolean(showPhoto, false),
    photo_url: cleanText(photoUrl) || null,
    screenshot_url: cleanText(screenshotUrl) || null,
    verified_member: Boolean(userId),
    featured: false,
    status: "pending",
    admin_note: null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TESTIMONIALS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const getApprovedTestimonials = async () => {
  const { data, error } = await supabase
    .from(TESTIMONIALS_TABLE)
    .select("*")
    .eq("status", "approved")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

export const getUserTestimonials = async (userId) => {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from(TESTIMONIALS_TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

export const getAllTestimonials = async ({
  status = "all",
} = {}) => {
  let query = supabase
    .from(TESTIMONIALS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
};

export const updateTestimonialStatus = async ({
  testimonialId,
  status,
  adminNote = "",
}) => {
  const allowedStatuses = [
    "pending",
    "approved",
    "rejected",
    "hidden",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid testimonial status.");
  }

  const { data, error } = await supabase
    .from(TESTIMONIALS_TABLE)
    .update({
      status,
      admin_note: cleanText(adminNote) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", testimonialId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const toggleFeaturedTestimonial = async ({
  testimonialId,
  featured,
}) => {
  const { data, error } = await supabase
    .from(TESTIMONIALS_TABLE)
    .update({
      featured: Boolean(featured),
      updated_at: new Date().toISOString(),
    })
    .eq("id", testimonialId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const updateTestimonial = async ({
  testimonialId,
  updates,
}) => {
  const safeUpdates = {
    ...(updates?.name !== undefined && {
      name: cleanText(updates.name),
    }),

    ...(updates?.rating !== undefined && {
      rating: Number(updates.rating),
    }),

    ...(updates?.category !== undefined && {
      category: cleanText(updates.category),
    }),

    ...(updates?.message !== undefined && {
      message: cleanText(updates.message),
    }),

    ...(updates?.memberSince !== undefined && {
      member_since:
        cleanText(updates.memberSince) || null,
    }),

    ...(updates?.showName !== undefined && {
      show_name: Boolean(updates.showName),
    }),

    ...(updates?.showPhoto !== undefined && {
      show_photo: Boolean(updates.showPhoto),
    }),

    ...(updates?.verifiedMember !== undefined && {
      verified_member: Boolean(
        updates.verifiedMember
      ),
    }),

    ...(updates?.featured !== undefined && {
      featured: Boolean(updates.featured),
    }),

    ...(updates?.status !== undefined && {
      status: cleanText(updates.status),
    }),

    ...(updates?.adminNote !== undefined && {
      admin_note:
        cleanText(updates.adminNote) || null,
    }),

    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TESTIMONIALS_TABLE)
    .update(safeUpdates)
    .eq("id", testimonialId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const deleteTestimonial = async (
  testimonialId
) => {
  const { error } = await supabase
    .from(TESTIMONIALS_TABLE)
    .delete()
    .eq("id", testimonialId);

  if (error) {
    throw error;
  }

  return true;
};

export const getCurrentUserForFeedback = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user || null;
};