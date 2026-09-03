import { supabase } from "../lib/supabase";

/* =========================================================
   REGISTER
========================================================= */

export async function registerUser({
  fullName,
  email,
  mobile,
  password,
}) {
  const normalizedEmail = String(
    email || ""
  )
    .trim()
    .toLowerCase();

  const normalizedFullName = String(
    fullName || ""
  ).trim();

  const normalizedMobile = String(
    mobile || ""
  ).trim();

  const { data, error } =
    await supabase.auth.signUp({
      email: normalizedEmail,
      password,

      options: {
        data: {
          full_name:
            normalizedFullName,
          mobile:
            normalizedMobile,
        },

        emailRedirectTo:
          `${window.location.origin}/login`,
      },
    });

  if (error) {
    const errorCode = String(
      error.code || ""
    ).toLowerCase();

    const errorMessage = String(
      error.message || ""
    ).toLowerCase();

    if (
      errorCode ===
        "user_already_exists" ||
      errorMessage.includes(
        "already registered"
      ) ||
      errorMessage.includes(
        "already exists"
      ) ||
      errorMessage.includes(
        "user already"
      )
    ) {
      throw new Error(
        "This email address is already registered. Please log in or use Forgot Password."
      );
    }

    throw error;
  }

  /*
   * When email confirmation is enabled,
   * Supabase may return an obfuscated user
   * object for an email that already exists.
   */
  const identities =
    data?.user?.identities;

  if (
    Array.isArray(identities) &&
    identities.length === 0
  ) {
    throw new Error(
      "This email address is already registered. Please log in or use Forgot Password."
    );
  }

  if (!data?.user) {
    throw new Error(
      "Registration could not be completed. Please try again."
    );
  }

  return data;
}

/* =========================================================
   LOGIN
========================================================= */

export async function loginUser(
  email,
  password
) {
  const normalizedEmail = String(
    email || ""
  )
    .trim()
    .toLowerCase();

  const { data, error } =
    await supabase.auth
      .signInWithPassword({
        email: normalizedEmail,
        password,
      });

  if (error) {
    throw error;
  }

  if (!data?.user) {
    throw new Error(
      "Unable to retrieve your account details."
    );
  }

  /* =====================================================
     LOAD PROFILE

     profiles.role remains the authority for ADMIN.

     Public/registered users do NOT automatically become
     subscribers.
  ===================================================== */

  const {
    data: profile,
    error: profileError,
  } =
    await supabase
      .from("profiles")
      .select("*")
      .eq(
        "id",
        data.user.id
      )
      .limit(1)
      .maybeSingle();

  if (profileError) {
    console.error(
      "Profile loading error:",
      profileError
    );

    throw new Error(
      "Login succeeded, but your profile could not be loaded."
    );
  }

  /* =====================================================
     RESOLVE ACCOUNT ROLE

     IMPORTANT:

     OLD:
       missing profile => subscriber

     NEW:
       missing profile => user

     Subscriber dashboard permission is now controlled by
     members_v2.dashboard_access.
  ===================================================== */

  const resolvedRole = String(
    profile?.role ||
      data.user.user_metadata?.role ||
      "user"
  )
    .trim()
    .toLowerCase();

  const resolvedProfile = {
    ...(profile || {}),

    id:
      profile?.id ||
      data.user.id,

    email:
      profile?.email ||
      data.user.email ||
      normalizedEmail,

    full_name:
      profile?.full_name ||
      data.user.user_metadata
        ?.full_name ||
      "",

    mobile:
      profile?.mobile ||
      data.user.user_metadata
        ?.mobile ||
      "",

    role:
      resolvedRole,

    status:
      profile?.status ||
      "active",
  };

  return {
    user:
      data.user,

    session:
      data.session ||
      null,

    profile:
      resolvedProfile,

    isAdmin:
      resolvedRole === "admin",
  };
}

/* =========================================================
   LOGOUT
========================================================= */

export async function logoutUser() {
  const { error } =
    await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  /*
   * Clear old VTKS browser state.
   * Supabase session itself is handled by signOut().
   */
  localStorage.removeItem(
    "vtks_user_role"
  );

  localStorage.removeItem(
    "vtks_user_email"
  );

  localStorage.removeItem(
    "vtks_user_name"
  );
}

/* =========================================================
   RESET PASSWORD EMAIL
========================================================= */

export async function sendResetEmail(
  email
) {
  const normalizedEmail = String(
    email || ""
  )
    .trim()
    .toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      "Email address is required."
    );
  }

  const { error } =
    await supabase.auth
      .resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo:
            `${window.location.origin}/reset-password`,
        }
      );

  if (error) {
    throw error;
  }
}

/* =========================================================
   CHANGE PASSWORD
========================================================= */

export async function updatePassword(
  password
) {
  if (
    !password ||
    String(password).length < 6
  ) {
    throw new Error(
      "Password must be at least 6 characters."
    );
  }

  const { error } =
    await supabase.auth.updateUser({
      password,
    });

  if (error) {
    throw error;
  }
}

/* =========================================================
   CURRENT USER
========================================================= */

export async function getCurrentUser() {
  const { data, error } =
    await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return data?.user || null;
}

/* =========================================================
   CURRENT SESSION
========================================================= */

export async function getCurrentSession() {
  const { data, error } =
    await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data?.session || null;
}