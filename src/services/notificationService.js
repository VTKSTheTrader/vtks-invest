import { supabase } from "../lib/supabase";

/* =========================================================
   GET SUBSCRIBER NOTIFICATIONS
========================================================= */

export const getSubscriberNotifications = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return [];
  }

  const {
    data: notifications,
    error,
  } = await supabase
    .from("notifications")
    .select(`
      id,
      title,
      message,
      notification_type,
      link,
      reference_id,
      audience,
      target_user_id,
      is_active,
      created_at,
      updated_at
    `)
    .eq("is_active", true)
    .in("audience", [
      "subscriber",
      "public",
    ])
    .or(
      `target_user_id.is.null,target_user_id.eq.${user.id}`
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  const {
    data: readRows,
    error: readError,
  } = await supabase
    .from("notification_reads")
    .select(`
      notification_id,
      read_at,
      dismissed_at
    `)
    .eq("user_id", user.id);

  if (readError) {
    throw readError;
  }

  const statusMap = new Map(
    (readRows || []).map((row) => [
      row.notification_id,
      {
        isRead: Boolean(row.read_at),
        isDismissed: Boolean(
          row.dismissed_at
        ),
      },
    ])
  );

  return (notifications || [])
    .map((notification) => {
      const status =
        statusMap.get(
          notification.id
        ) || {};

      return {
        ...notification,
        isRead: Boolean(
          status.isRead
        ),
        isDismissed: Boolean(
          status.isDismissed
        ),
      };
    })
    .filter(
      (notification) =>
        !notification.isDismissed
    );
};

/* =========================================================
   GET UNREAD COUNT
========================================================= */

export const getUnreadNotificationCount =
  async () => {
    const notifications =
      await getSubscriberNotifications();

    return notifications.filter(
      (notification) =>
        !notification.isRead
    ).length;
  };

/* =========================================================
   MARK ONE NOTIFICATION AS READ
========================================================= */

export const markNotificationAsRead =
  async (notificationId) => {
    if (!notificationId) {
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return;
    }

    const { error } =
      await supabase
        .from("notification_reads")
        .upsert(
          {
            notification_id:
              notificationId,

            user_id:
              user.id,

            read_at:
              new Date()
                .toISOString(),
          },
          {
            onConflict:
              "notification_id,user_id",
          }
        );

    if (error) {
      throw error;
    }
  };

/* =========================================================
   MARK ALL NOTIFICATIONS AS READ
========================================================= */

export const markAllNotificationsAsRead =
  async (notifications = []) => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return;
    }

    const unreadNotifications =
      notifications.filter(
        (notification) =>
          !notification.isRead
      );

    if (
      unreadNotifications.length === 0
    ) {
      return;
    }

    const now =
      new Date().toISOString();

    const rows =
      unreadNotifications.map(
        (notification) => ({
          notification_id:
            notification.id,

          user_id:
            user.id,

          read_at:
            now,
        })
      );

    const { error } =
      await supabase
        .from("notification_reads")
        .upsert(rows, {
          onConflict:
            "notification_id,user_id",
        });

    if (error) {
      throw error;
    }
  };

/* =========================================================
   DISMISS ONE NOTIFICATION
========================================================= */

export const dismissNotification =
  async (notificationId) => {
    if (!notificationId) {
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return;
    }

    const now =
      new Date().toISOString();

    const {
      data: existingRow,
      error: checkError,
    } = await supabase
      .from("notification_reads")
      .select("notification_id")
      .eq(
        "notification_id",
        notificationId
      )
      .eq(
        "user_id",
        user.id
      )
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existingRow) {
      const {
        error: updateError,
      } = await supabase
        .from("notification_reads")
        .update({
          dismissed_at:
            now,
        })
        .eq(
          "notification_id",
          notificationId
        )
        .eq(
          "user_id",
          user.id
        );

      if (updateError) {
        throw updateError;
      }
    } else {
      const {
        error: insertError,
      } = await supabase
        .from("notification_reads")
        .insert({
          notification_id:
            notificationId,

          user_id:
            user.id,

          read_at:
            now,

          dismissed_at:
            now,
        });

      if (insertError) {
        throw insertError;
      }
    }

    return true;
  };

/* =========================================================
   DISMISS ALL VISIBLE NOTIFICATIONS
========================================================= */

export const dismissAllNotifications =
  async (
    notifications = []
  ) => {
    if (
      !Array.isArray(
        notifications
      ) ||
      notifications.length ===
        0
    ) {
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return;
    }

    const now =
      new Date().toISOString();

    const rows =
      notifications.map(
        (notification) => ({
          notification_id:
            notification.id,

          user_id:
            user.id,

          read_at:
            notification.isRead
              ? notification.read_at ||
                now
              : now,

          dismissed_at:
            now,
        })
      );

    const { error } =
      await supabase
        .from("notification_reads")
        .upsert(rows, {
          onConflict:
            "notification_id,user_id",
        });

    if (error) {
      throw error;
    }

    return true;
  };

/* =========================================================
   CREATE NOTIFICATION
   ADMIN / INTERNAL USE
========================================================= */

export const createNotification =
  async ({
    title,
    message = "",
    notificationType =
      "general",
    link = "",
    referenceId = null,
    audience = "subscriber",
    targetUserId = null,
  }) => {
    const cleanTitle =
      String(
        title || ""
      ).trim();

    const cleanMessage =
      String(
        message || ""
      ).trim();

    const cleanLink =
      String(
        link || ""
      ).trim();

    if (!cleanTitle) {
      throw new Error(
        "Notification title is required."
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from("notifications")
      .insert({
        title:
          cleanTitle,

        message:
          cleanMessage,

        notification_type:
          notificationType,

        link:
          cleanLink,

        reference_id:
          referenceId
            ? String(
                referenceId
              )
            : null,

        audience,

        target_user_id:
          targetUserId ||
          null,

        is_active:
          true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  };

/* =========================================================
   UPDATE NOTIFICATION
   ADMIN USE

   Updates existing notification only.
   Recipient is intentionally NOT changed.
========================================================= */

export const updateNotification =
  async ({
    notificationId,
    title,
    message = "",
    link = "",
  }) => {
    if (!notificationId) {
      throw new Error(
        "Notification ID is required."
      );
    }

    const cleanTitle =
      String(
        title || ""
      ).trim();

    const cleanMessage =
      String(
        message || ""
      ).trim();

    const cleanLink =
      String(
        link || ""
      ).trim();

    if (!cleanTitle) {
      throw new Error(
        "Notification title is required."
      );
    }

    if (!cleanMessage) {
      throw new Error(
        "Notification message is required."
      );
    }

    const {
      error,
    } = await supabase
      .from("notifications")
      .update({
        title:
          cleanTitle,

        message:
          cleanMessage,

        link:
          cleanLink,

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        notificationId
      );

    if (error) {
      throw error;
    }

    return true;
  };

/* =========================================================
   REMOVE NOTIFICATION
   ADMIN USE

   Soft delete:
   is_active = false

   Subscriber query automatically stops showing it.
========================================================= */

export const removeNotification =
  async (notificationId) => {
    if (!notificationId) {
      throw new Error(
        "Notification ID is required."
      );
    }

    const {
      data,
      error,
    } = await supabase.rpc(
      "admin_remove_notification",
      {
        p_notification_id:
          notificationId,
      }
    );

    if (error) {
      throw error;
    }

    return data;
  };
/* =========================================================
   RESTORE NOTIFICATION
   ADMIN USE
========================================================= */

export const restoreNotification =
  async (notificationId) => {
    if (!notificationId) {
      throw new Error(
        "Notification ID is required."
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from("notifications")
      .update({
        is_active:
          true,

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "id",
        notificationId
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  };

/* =========================================================
   DELETE NOTIFICATION PERMANENTLY
   ADMIN USE

   Kept for compatibility.
========================================================= */

export const deleteNotification =
  async (notificationId) => {
    if (!notificationId) {
      return;
    }

    /* Delete read/dismiss records first */

    const {
      error:
        readsDeleteError,
    } = await supabase
      .from("notification_reads")
      .delete()
      .eq(
        "notification_id",
        notificationId
      );

    if (readsDeleteError) {
      throw readsDeleteError;
    }

    /* Permanently delete notification */

    const {
      error:
        notificationDeleteError,
    } = await supabase
      .from("notifications")
      .delete()
      .eq(
        "id",
        notificationId
      );

    if (
      notificationDeleteError
    ) {
      throw notificationDeleteError;
    }

    return true;
  };

/* =========================================================
   LEGACY DISABLE FUNCTION
   KEPT FOR EXISTING WEBSITE COMPATIBILITY
========================================================= */

export const disableNotification =
  async (notificationId) => {
    if (!notificationId) {
      return;
    }

    const { error } =
      await supabase
        .from("notifications")
        .update({
          is_active:
            false,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          notificationId
        );

    if (error) {
      throw error;
    }

    return true;
  };