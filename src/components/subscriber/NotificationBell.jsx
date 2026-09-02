import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  dismissAllNotifications,
  dismissNotification,
  getSubscriberNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/notificationService";

import "./NotificationBell.css";

const formatTimeAgo = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  const now = new Date();

  const diffMs = now - date;

  if (!Number.isFinite(diffMs)) {
    return "";
  }

  const diffMinutes = Math.floor(
    diffMs / 60000
  );

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(
    diffMinutes / 60
  );

  if (diffHours < 24) {
    return `${diffHours} hr${
      diffHours === 1 ? "" : "s"
    } ago`;
  }

  const diffDays = Math.floor(
    diffHours / 24
  );

  if (diffDays < 7) {
    return `${diffDays} day${
      diffDays === 1 ? "" : "s"
    } ago`;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const getNotificationIcon = (type) => {
  const normalized = String(type || "")
    .trim()
    .toLowerCase();

  // =========================
  // MARKET STUDY OUTCOMES
  // =========================

  if (normalized === "target_1_hit") {
    return "🎯";
  }

  if (normalized === "target_2_hit") {
    return "🚀";
  }

  if (normalized === "target_3_hit") {
    return "🏆";
  }

  if (normalized === "sl_hit") {
    return "🛑";
  }

  if (normalized === "booked_profit") {
    return "💰";
  }

  if (normalized === "booked_loss") {
    return "📉";
  }

  if (normalized === "breakeven") {
    return "⚖️";
  }

  // =========================
  // EXISTING NOTIFICATIONS
  // =========================

  if (
    normalized.includes("study") ||
    normalized.includes("stock")
  ) {
    return "📈";
  }

  if (normalized.includes("scanner")) {
    return "🎯";
  }

  if (
    normalized.includes("level") ||
    normalized.includes("outlook")
  ) {
    return "📊";
  }

  if (
    normalized.includes("video") ||
    normalized.includes("resource") ||
    normalized.includes("library")
  ) {
    return "🎬";
  }

  if (normalized.includes("community")) {
    return "📢";
  }

  if (normalized.includes("etf")) {
    return "💼";
  }

  return "🔔";
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    dismissingId,
    setDismissingId,
  ] = useState(null);

  const [
    clearingAll,
    setClearingAll,
  ] = useState(false);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          !notification.isRead
      ).length,
    [notifications]
  );

  const loadNotifications =
    async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const rows =
          await getSubscriberNotifications();

        setNotifications(
          rows || []
        );
      } catch (error) {
        console.error(
          "Notification load error:",
          error
        );

        setErrorMessage(
          error?.message ||
            "Unable to load notifications."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (
      event
    ) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target
        )
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const handleNotificationClick =
    async (notification) => {
      try {
        if (!notification.isRead) {
          await markNotificationAsRead(
            notification.id
          );

          setNotifications(
            (previous) =>
              previous.map((item) =>
                item.id ===
                notification.id
                  ? {
                      ...item,
                      isRead: true,
                    }
                  : item
              )
          );
        }
      } catch (error) {
        console.error(
          "Mark notification read error:",
          error
        );
      }

      setIsOpen(false);

      if (notification.link) {
        navigate(notification.link);
      }
    };

  const handleMarkAllRead =
    async () => {
      try {
        await markAllNotificationsAsRead(
          notifications
        );

        setNotifications(
          (previous) =>
            previous.map((item) => ({
              ...item,
              isRead: true,
            }))
        );
      } catch (error) {
        console.error(
          "Mark all notifications read error:",
          error
        );
      }
    };

  const handleDismiss = async (
    event,
    notificationId
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!notificationId) {
      return;
    }

    try {
      setDismissingId(
        notificationId
      );

      await dismissNotification(
        notificationId
      );

      setNotifications(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              notificationId
          )
      );
    } catch (error) {
      console.error(
        "Dismiss notification error:",
        error
      );
    } finally {
      setDismissingId(null);
    }
  };

  const handleClearAll =
    async () => {
      if (
        notifications.length === 0 ||
        clearingAll
      ) {
        return;
      }

      try {
        setClearingAll(true);

        await dismissAllNotifications(
          notifications
        );

        setNotifications([]);
      } catch (error) {
        console.error(
          "Clear all notifications error:",
          error
        );
      } finally {
        setClearingAll(false);
      }
    };

  return (
    <div
      className="subscriber-notification-wrapper"
      ref={wrapperRef}
    >
      <button
        type="button"
        className="subscriber-notification-bell"
        onClick={() =>
          setIsOpen(
            (previous) => !previous
          )
        }
        aria-label="Notifications"
      >
        <span
          className="subscriber-notification-bell-icon"
          aria-hidden="true"
        >
          🔔
        </span>

        {unreadCount > 0 && (
          <span className="subscriber-notification-count">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="subscriber-notification-panel">
          <div className="subscriber-notification-header">
            <div className="subscriber-notification-header-copy">
              <h3>Notifications</h3>

              <p>
                {unreadCount > 0
                  ? `${unreadCount} unread update${
                      unreadCount === 1
                        ? ""
                        : "s"
                    }`
                  : "You're all caught up"}
              </p>
            </div>

            {notifications.length > 0 && (
              <div className="subscriber-notification-header-actions">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="subscriber-notification-mark-read-button"
                    onClick={
                      handleMarkAllRead
                    }
                  >
                    Mark all read
                  </button>
                )}

                <button
                  type="button"
                  className="subscriber-notification-clear-button"
                  onClick={
                    handleClearAll
                  }
                  disabled={
                    clearingAll
                  }
                >
                  {clearingAll
                    ? "Clearing..."
                    : "Clear All"}
                </button>
              </div>
            )}
          </div>

          <div className="subscriber-notification-list">
            {loading ? (
              <div className="subscriber-notification-state">
                Loading notifications...
              </div>
            ) : errorMessage ? (
              <div className="subscriber-notification-state error">
                {errorMessage}

                <button
                  type="button"
                  onClick={
                    loadNotifications
                  }
                >
                  Try Again
                </button>
              </div>
            ) : notifications.length ===
              0 ? (
              <div className="subscriber-notification-empty">
                <span>🔔</span>

                <h4>
                  No notifications
                </h4>

                <p>
                  New subscriber updates
                  will appear here.
                </p>
              </div>
            ) : (
              notifications
                .slice(0, 20)
                .map(
                  (notification) => (
                    <div
                      key={
                        notification.id
                      }
                      className={`subscriber-notification-item ${
                        notification.isRead
                          ? "read"
                          : "unread"
                      }`}
                    >
                      <button
                        type="button"
                        className="subscriber-notification-main"
                        onClick={() =>
                          handleNotificationClick(
                            notification
                          )
                        }
                      >
                        <span className="subscriber-notification-item-icon">
                          {getNotificationIcon(
                            notification.notification_type
                          )}
                        </span>

                        <span className="subscriber-notification-item-content">
                          <strong>
                            {
                              notification.title
                            }
                          </strong>

                          {notification.message && (
                            <span>
                              {
                                notification.message
                              }
                            </span>
                          )}

                          <small>
                            {formatTimeAgo(
                              notification.created_at
                            )}
                          </small>
                        </span>
                      </button>

                      <div className="subscriber-notification-item-actions">
                        {!notification.isRead && (
                          <span
                            className="subscriber-notification-unread-dot"
                            aria-label="Unread"
                          />
                        )}

                        <button
                          type="button"
                          className="subscriber-notification-dismiss-button"
                          onClick={(
                            event
                          ) =>
                            handleDismiss(
                              event,
                              notification.id
                            )
                          }
                          disabled={
                            dismissingId ===
                            notification.id
                          }
                          aria-label={`Dismiss ${notification.title}`}
                          title="Dismiss notification"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )
                )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
