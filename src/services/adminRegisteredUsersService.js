import {
  supabase,
} from "../lib/supabase";

/* =====================================================
   GET ADMIN SESSION
===================================================== */

const getAdminToken =
  async () => {
    const {
      data,
      error,
    } =
      await supabase
        .auth
        .getSession();

    if (error) {
      throw error;
    }

    const token =
      data?.session
        ?.access_token;

    if (!token) {
      throw new Error(
        "Admin session not found. Please login again."
      );
    }

    return token;
  };

/* =====================================================
   CALL ADMIN REGISTERED USERS FUNCTION
===================================================== */

const invokeAdminUsers =
  async (
    body = {
      action: "list",
    }
  ) => {
    const token =
      await getAdminToken();

    const {
      data,
      error,
    } =
      await supabase
        .functions
        .invoke(
          "admin-registered-users",
          {
            body,

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

    if (error) {
      console.error(
        "admin-registered-users invoke error:",
        error
      );

      throw error;
    }

    if (
      data?.success !==
      true
    ) {
      throw new Error(
        data?.error ||
          "Unable to complete Admin request."
      );
    }

    return data;
  };

/* =====================================================
   GET REGISTERED USERS
===================================================== */

export const getRegisteredUsers =
  async () => {
    const data =
      await invokeAdminUsers({
        action: "list",
      });

    return Array.isArray(
      data?.users
    )
      ? data.users
      : [];
  };

/* =====================================================
   UPDATE DASHBOARD ACCESS
===================================================== */

export const updateRegisteredUserAccess =
  async (
    authUserId,
    enabled
  ) => {
    if (!authUserId) {
      throw new Error(
        "Auth user ID is required."
      );
    }

    return invokeAdminUsers({
      action:
        "set_access",

      auth_user_id:
        authUserId,

      enabled:
        Boolean(enabled),
    });
  };

/* =====================================================
   DELETE REGISTRATION
===================================================== */

export const deleteRegisteredUser =
  async (
    authUserId
  ) => {
    if (!authUserId) {
      throw new Error(
        "Auth user ID is required."
      );
    }

    return invokeAdminUsers({
      action:
        "delete_registration",

      auth_user_id:
        authUserId,
    });
  };