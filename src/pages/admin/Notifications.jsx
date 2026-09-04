import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createNotification,
  updateNotification,
  removeNotification,
} from "../../services/notificationService";

import {
  getRegisteredUsers,
} from "../../services/adminRegisteredUsersService";

import { supabase } from "../../lib/supabase";

import "./Notifications.css";

const EMPTY_FORM = {
  title: "",
  message: "",
  link: "",
};
const ITEMS_PER_PAGE = 3;
const formatDateTime = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleString(
    "en-IN",
    {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

export default function Notifications() {
  const [form, setForm] =
    useState(EMPTY_FORM);

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    registeredUsers,
    setRegisteredUsers,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    usersLoading,
    setUsersLoading,
  ] = useState(true);

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    sendMode,
    setSendMode,
  ] = useState("all");

  const [
    selectedUserId,
    setSelectedUserId,
  ] = useState("");

  const [
    subscriberSearch,
    setSubscriberSearch,
  ] = useState("");
const [
  currentPage,
  setCurrentPage,
] = useState(1);
  /* =====================================================
     LOAD NOTIFICATION HISTORY
  ===================================================== */

  const loadNotifications =
    async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "notifications"
            )
            .select(`
              id,
              title,
              message,
              notification_type,
              link,
              audience,
              target_user_id,
              is_active,
              created_at,
              updated_at
            `)
            .eq(
              "audience",
              "subscriber"
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            );

        if (error) {
          throw error;
        }

        setNotifications(
          data || []
        );
      } catch (error) {
        console.error(
          "Admin notification load error:",
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

  /* =====================================================
     LOAD REGISTERED USERS
  ===================================================== */

  const loadRegisteredUsers =
    async () => {
      try {
        setUsersLoading(true);

        const rows =
          await getRegisteredUsers();

        const safeRows =
          Array.isArray(rows)
            ? rows
            : [];

        const eligibleUsers =
          safeRows
            .filter(
              (user) =>
                Boolean(
                  user.auth_user_id
                ) &&
                (
                  user.dashboard_access ===
                    true ||
                  user.has_subscription ===
                    true
                )
            )
            .sort(
              (a, b) =>
                String(
                  a.name ||
                    a.email ||
                    ""
                ).localeCompare(
                  String(
                    b.name ||
                      b.email ||
                      ""
                  )
                )
            );

        setRegisteredUsers(
          eligibleUsers
        );
      } catch (error) {
        console.error(
          "Notification registered users load error:",
          error
        );

        setErrorMessage(
          error?.message ||
            "Unable to load subscribers."
        );
      } finally {
        setUsersLoading(false);
      }
    };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadNotifications();
    loadRegisteredUsers();
  }, []);

  /* =====================================================
     INPUT CHANGE
  ===================================================== */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  /* =====================================================
     SEND MODE
  ===================================================== */

  const handleSendModeChange =
    (event) => {
      if (editingId) {
        return;
      }

      const value =
        event.target.value;

      setSendMode(value);

      setSelectedUserId("");
      setSubscriberSearch("");

      setMessage("");
      setErrorMessage("");
    };

  /* =====================================================
     FILTER SUBSCRIBERS
  ===================================================== */

  const filteredUsers =
    useMemo(() => {
      const search =
        subscriberSearch
          .trim()
          .toLowerCase();

      if (!search) {
        return registeredUsers;
      }

      return registeredUsers.filter(
        (user) => {
          const name =
            String(
              user.name || ""
            ).toLowerCase();

          const email =
            String(
              user.email || ""
            ).toLowerCase();

          const mobile =
            String(
              user.mobile || ""
            ).toLowerCase();

          return (
            name.includes(
              search
            ) ||
            email.includes(
              search
            ) ||
            mobile.includes(
              search
            )
          );
        }
      );
    }, [
      registeredUsers,
      subscriberSearch,
    ]);

  /* =====================================================
     SELECTED USER
  ===================================================== */

  const selectedUser =
    useMemo(
      () =>
        registeredUsers.find(
          (user) =>
            String(
              user.auth_user_id
            ) ===
            String(
              selectedUserId
            )
        ) || null,
      [
        registeredUsers,
        selectedUserId,
      ]
    );

  /* =====================================================
     GET RECIPIENT FOR HISTORY
  ===================================================== */

  const getRecipient =
    (targetUserId) => {
      if (!targetUserId) {
        return {
          name:
            "All Subscribers",
          email: "",
        };
      }

      const user =
        registeredUsers.find(
          (item) =>
            String(
              item.auth_user_id
            ) ===
            String(
              targetUserId
            )
        );

      if (!user) {
        return {
          name:
            "Individual Subscriber",
          email: "",
        };
      }

      return {
        name:
          user.name ||
          "Subscriber",

        email:
          user.email ||
          "",
      };
    };

  /* =====================================================
     START EDIT
  ===================================================== */

  const handleEdit =
    (notification) => {
      if (
        !notification?.id ||
        !notification.is_active
      ) {
        return;
      }

      setEditingId(
        notification.id
      );

      setForm({
        title:
          notification.title ||
          "",

        message:
          notification.message ||
          "",

        link:
          notification.link ||
          "",
      });

      if (
        notification.target_user_id
      ) {
        setSendMode(
          "individual"
        );

        setSelectedUserId(
          notification.target_user_id
        );
      } else {
        setSendMode(
          "all"
        );

        setSelectedUserId(
          ""
        );
      }

      setSubscriberSearch("");

      setMessage("");
      setErrorMessage("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  /* =====================================================
     CANCEL EDIT
  ===================================================== */

  const cancelEdit = () => {
    setEditingId(null);

    setForm(
      EMPTY_FORM
    );

    setSendMode(
      "all"
    );

    setSelectedUserId("");
    setSubscriberSearch("");

    setMessage("");
    setErrorMessage("");
  };

  /* =====================================================
     SEND / UPDATE NOTIFICATION
  ===================================================== */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      const title =
        form.title.trim();

      const notificationMessage =
        form.message.trim();

      const link =
        form.link.trim();

      if (!title) {
        setErrorMessage(
          "Please enter a notification title."
        );

        return;
      }

      if (
        !notificationMessage
      ) {
        setErrorMessage(
          "Please enter a message."
        );

        return;
      }

      if (
        !editingId &&
        sendMode ===
          "individual" &&
        !selectedUserId
      ) {
        setErrorMessage(
          "Please select a subscriber."
        );

        return;
      }

      try {
        setSending(true);
        setMessage("");
        setErrorMessage("");

        /* ===============================================
           EDIT EXISTING NOTIFICATION
        =============================================== */

        if (editingId) {
          await updateNotification({
            notificationId:
              editingId,

            title,

            message:
              notificationMessage,

            link,
          });

          setMessage(
            "Notification updated successfully."
          );

          setEditingId(
            null
          );

          setForm(
            EMPTY_FORM
          );

          setSendMode(
            "all"
          );

          setSelectedUserId(
            ""
          );

          setSubscriberSearch(
            ""
          );

          await loadNotifications();

          return;
        }

        /* ===============================================
           CREATE NEW NOTIFICATION
        =============================================== */

        await createNotification({
          title,

          message:
            notificationMessage,

          notificationType:
            "admin_message",

          link,

          audience:
            "subscriber",

          targetUserId:
            sendMode ===
            "individual"
              ? selectedUserId
              : null,
        });

        setForm(
          EMPTY_FORM
        );

        if (
          sendMode ===
          "individual"
        ) {
          setMessage(
            `Notification sent successfully to ${
              selectedUser?.name ||
              selectedUser?.email ||
              "selected subscriber"
            }.`
          );

          setSelectedUserId(
            ""
          );

          setSubscriberSearch(
            ""
          );
        } else {
          setMessage(
            "Notification sent successfully to all subscribers."
          );
        }

        await loadNotifications();
      } catch (error) {
        console.error(
          editingId
            ? "Update notification error:"
            : "Send notification error:",
          error
        );

        setErrorMessage(
          error?.message ||
            (
              editingId
                ? "Unable to update notification."
                : "Unable to send notification."
            )
        );
      } finally {
        setSending(false);
      }
    };

  /* =====================================================
     REMOVE NOTIFICATION
  ===================================================== */

  const handleDelete =
    async (
      notification
    ) => {
      if (
        !notification?.id ||
        !notification.is_active
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Remove "${notification.title}"?\n\nThis notification will immediately disappear from subscriber notification bells.`
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(
          notification.id
        );

        setMessage("");
        setErrorMessage("");

        await removeNotification(
          notification.id
        );

        setNotifications(
          (previous) =>
            previous.map(
              (item) =>
                item.id ===
                notification.id
                  ? {
                      ...item,
                      is_active:
                        false,
                    }
                  : item
            )
        );

        if (
          editingId ===
          notification.id
        ) {
          cancelEdit();
        }

        setMessage(
          "Notification removed from subscriber view."
        );
      } catch (error) {
        console.error(
          "Remove notification error:",
          error
        );

        setErrorMessage(
          error?.message ||
            "Unable to remove notification."
        );
      } finally {
        setDeletingId(
          null
        );
      }
    };

  /* =====================================================
     CLEAR
  ===================================================== */

  const clearForm = () => {
    if (editingId) {
      cancelEdit();
      return;
    }

    setForm(
      EMPTY_FORM
    );

    setSelectedUserId("");
    setSubscriberSearch("");

    setMessage("");
    setErrorMessage("");
  };

  /* =====================================================
     CURRENT EDIT RECIPIENT
  ===================================================== */

  const editingNotification =
    useMemo(
      () =>
        notifications.find(
          (item) =>
            item.id ===
            editingId
        ) || null,
      [
        notifications,
        editingId,
      ]
    );

    const editingRecipient =
    editingNotification
      ? getRecipient(
          editingNotification
            .target_user_id
        )
      : null;

  /* =====================================================
     NOTIFICATION HISTORY PAGINATION
  ===================================================== */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        notifications.length /
          ITEMS_PER_PAGE
      )
    );

  const paginatedNotifications =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      return notifications.slice(
        startIndex,
        startIndex +
          ITEMS_PER_PAGE
      );
    }, [
      notifications,
      currentPage,
    ]);

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  return (
    <div className="admin-notifications-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="admin-notifications-header">

        <div>

          <span className="admin-notifications-eyebrow">
            VTKS COMMUNICATION
          </span>

          <h1>
            Subscriber Notifications
          </h1>

          <p>
            Send important updates and
            messages directly to subscriber
            notification bells.
          </p>

        </div>

      </div>

      {/* =================================================
          MESSAGES
      ================================================= */}

      {message && (
        <div className="notification-success-message">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="notification-error-message">
          {errorMessage}
        </div>
      )}

      {/* =================================================
          SEND / EDIT FORM
      ================================================= */}

      <section className="notification-admin-card">

        <div className="notification-card-heading">

          <div>

            <h2>
              {editingId
                ? "✏️ Edit Notification"
                : "🔔 Send Notification"}
            </h2>

            <p>
              {editingId
                ? "Update the title, message or link. The original recipient cannot be changed."
                : sendMode ===
                  "individual"
                ? "Send a private notification to one selected subscriber."
                : "Send a notification to all subscribers."}
            </p>

          </div>

          <span className="notification-audience-badge">
            {editingId
              ? "Editing"
              : sendMode ===
                "individual"
              ? "Individual Subscriber"
              : "All Subscribers"}
          </span>

        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="notification-admin-form"
        >

          {/* =============================
              SEND TO
          ============================= */}

          {!editingId && (
            <div className="notification-form-group">

              <label htmlFor="sendMode">
                Send To
              </label>

              <select
                id="sendMode"
                value={
                  sendMode
                }
                onChange={
                  handleSendModeChange
                }
                disabled={
                  sending
                }
              >

                <option value="all">
                  All Subscribers
                </option>

                <option value="individual">
                  Individual Subscriber
                </option>

              </select>

            </div>
          )}

          {/* =============================
              EDIT RECIPIENT LOCKED
          ============================= */}

          {editingId &&
            editingRecipient && (
              <div className="notification-send-preview">

                <strong>
                  Recipient:
                </strong>

                <div className="notification-preview-box">

                  <div className="notification-preview-icon">
                    🔒
                  </div>

                  <div>

                    <strong>
                      {
                        editingRecipient.name
                      }
                    </strong>

                    {editingRecipient.email && (
                      <p>
                        {
                          editingRecipient.email
                        }
                      </p>
                    )}

                    <small>
                      Recipient cannot be changed while editing.
                    </small>

                  </div>

                </div>

              </div>
            )}

          {/* =============================
              INDIVIDUAL SUBSCRIBER
          ============================= */}

          {!editingId &&
            sendMode ===
              "individual" && (
              <>

                <div className="notification-form-group">

                  <label htmlFor="subscriberSearch">
                    Search Subscriber
                  </label>

                  <input
                    id="subscriberSearch"
                    type="text"
                    value={
                      subscriberSearch
                    }
                    onChange={(
                      event
                    ) =>
                      setSubscriberSearch(
                        event.target
                          .value
                      )
                    }
                    placeholder="Search by name, email or mobile..."
                    disabled={
                      sending ||
                      usersLoading
                    }
                  />

                  {!usersLoading && (
                    <small>
                      {
                        filteredUsers.length
                      }{" "}
                      subscriber
                      {filteredUsers.length ===
                      1
                        ? ""
                        : "s"}{" "}
                      found
                    </small>
                  )}

                </div>

                <div className="notification-form-group">

                  <label htmlFor="selectedUserId">
                    Select Subscriber
                  </label>

                  <select
                    id="selectedUserId"
                    value={
                      selectedUserId
                    }
                    onChange={(
                      event
                    ) =>
                      setSelectedUserId(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      sending ||
                      usersLoading
                    }
                  >

                    <option value="">
                      {usersLoading
                        ? "Loading subscribers..."
                        : filteredUsers.length ===
                          0
                        ? "No matching subscriber"
                        : "Select subscriber..."}
                    </option>

                    {filteredUsers.map(
                      (user) => (
                        <option
                          key={
                            user.auth_user_id
                          }
                          value={
                            user.auth_user_id
                          }
                        >
                          {user.name ||
                            "Subscriber"}{" "}
                          —{" "}
                          {user.email ||
                            "No email"}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {selectedUser && (
                  <div className="notification-send-preview">

                    <strong>
                      Selected Subscriber:
                    </strong>

                    <div className="notification-preview-box">

                      <div className="notification-preview-icon">
                        👤
                      </div>

                      <div>

                        <strong>
                          {selectedUser.name ||
                            "Subscriber"}
                        </strong>

                        <p>
                          {selectedUser.email ||
                            "-"}
                        </p>

                      </div>

                    </div>

                  </div>
                )}

              </>
            )}

          {/* =============================
              TITLE
          ============================= */}

          <div className="notification-form-group">

            <label htmlFor="title">
              Notification Title
            </label>

            <input
              id="title"
              name="title"
              type="text"
              value={
                form.title
              }
              onChange={
                handleChange
              }
              placeholder="Example: Important VTKS Update"
              maxLength={100}
              disabled={
                sending
              }
            />

          </div>

          {/* =============================
              MESSAGE
          ============================= */}

          <div className="notification-form-group">

            <label htmlFor="message">
              Message
            </label>

            <textarea
              id="message"
              name="message"
              value={
                form.message
              }
              onChange={
                handleChange
              }
              placeholder="Type the message you want to send..."
              rows={5}
              maxLength={1000}
              disabled={
                sending
              }
            />

            <div className="notification-character-count">
              {
                form.message.length
              }
              /1000
            </div>

          </div>

          {/* =============================
              LINK
          ============================= */}

          <div className="notification-form-group">

            <label htmlFor="link">
              Link
              <span>
                {" "}
                (optional)
              </span>
            </label>

            <input
              id="link"
              name="link"
              type="text"
              value={
                form.link
              }
              onChange={
                handleChange
              }
              placeholder="/dashboard/library or /etf"
              disabled={
                sending
              }
            />

          </div>

          {/* =============================
              PREVIEW
          ============================= */}

          <div className="notification-send-preview">

            <strong>
              {editingId
                ? "Updated notification preview:"
                : sendMode ===
                  "individual"
                ? "Selected subscriber will receive:"
                : "Subscribers will receive:"}
            </strong>

            <div className="notification-preview-box">

              <div className="notification-preview-icon">
                🔔
              </div>

              <div>

                <strong>
                  {form.title ||
                    "Notification Title"}
                </strong>

                <p>
                  {form.message ||
                    "Your message will appear here."}
                </p>

              </div>

            </div>

          </div>

          {/* =============================
              ACTIONS
          ============================= */}

          <div className="notification-form-actions">

            <button
              type="submit"
              className="notification-send-btn"
              disabled={
                sending ||
                (
                  !editingId &&
                  sendMode ===
                    "individual" &&
                  !selectedUserId
                )
              }
            >

              {sending
                ? editingId
                  ? "Saving..."
                  : "Sending..."
                : editingId
                ? "💾 Save Changes"
                : sendMode ===
                  "individual"
                ? "🔔 Send to Subscriber"
                : "🔔 Send to All Subscribers"}

            </button>

            <button
              type="button"
              className="notification-clear-btn"
              disabled={
                sending
              }
              onClick={
                clearForm
              }
            >
              {editingId
                ? "Cancel Edit"
                : "Clear"}
            </button>

          </div>

        </form>

      </section>

      {/* =================================================
          HISTORY
      ================================================= */}

      <section className="notification-admin-card">

        <div className="notification-card-heading">

          <div>

            <h2>
              Notification History
            </h2>

            <p>
              Previously sent subscriber
              communications.
            </p>

          </div>

          <button
            type="button"
            className="notification-refresh-btn"
            onClick={
              loadNotifications
            }
            disabled={
              loading
            }
          >
            ↻ Refresh
          </button>

        </div>

        {loading ? (
          <div className="notification-empty-state">
            Loading notifications...
          </div>
        ) : notifications.length ===
          0 ? (
          <div className="notification-empty-state">
            No subscriber notifications
            have been sent yet.
          </div>
        ) : (
          <div className="notification-table-wrap">

            <table className="notification-admin-table">

              <thead>
                <tr>
                  <th>Title</th>
                  <th>Message</th>
                  <th>Recipient</th>
                  <th>Link</th>
                  <th>Sent On</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {paginatedNotifications.map(
                  (
                    notification
                  ) => {
                    const recipient =
                      getRecipient(
                        notification.target_user_id
                      );

                    return (
                      <tr
                        key={
                          notification.id
                        }
                      >

                        <td>
                          <strong>
                            {
                              notification.title
                            }
                          </strong>
                        </td>

                        <td>

                          <div className="notification-history-message">
                            {notification.message ||
                              "-"}
                          </div>

                        </td>

                        <td>

                          <div
                            style={{
                              display:
                                "flex",
                              flexDirection:
                                "column",
                              gap: "3px",
                            }}
                          >

                            <strong>
                              {
                                recipient.name
                              }
                            </strong>

                            {recipient.email && (
                              <small
                                style={{
                                  color:
                                    "#64748b",
                                }}
                              >
                                {
                                  recipient.email
                                }
                              </small>
                            )}

                          </div>

                        </td>

                        <td>

                          {notification.link ? (
                            <span className="notification-link-text">
                              {
                                notification.link
                              }
                            </span>
                          ) : (
                            "-"
                          )}

                        </td>

                        <td>
                          {formatDateTime(
                            notification.created_at
                          )}
                        </td>

                        <td>

                          <span
                            className={`notification-status ${
                              notification.is_active
                                ? "active"
                                : "inactive"
                            }`}
                          >
                            {notification.is_active
                              ? "Active"
                              : "Removed"}
                          </span>

                        </td>

                        <td>

                          <div
                            style={{
                              display:
                                "flex",
                              gap: "8px",
                              alignItems:
                                "center",
                              flexWrap:
                                "wrap",
                            }}
                          >

                            {notification.is_active && (
                              <button
                                type="button"
                                className="notification-refresh-btn"
                                disabled={
                                  sending ||
                                  deletingId ===
                                    notification.id
                                }
                                onClick={() =>
                                  handleEdit(
                                    notification
                                  )
                                }
                              >
                                Edit
                              </button>
                            )}

                            {notification.is_active && (
                              <button
                                type="button"
                                className="notification-remove-btn"
                                disabled={
                                  deletingId ===
                                    notification.id
                                }
                                onClick={() =>
                                  handleDelete(
                                    notification
                                  )
                                }
                              >
                                {deletingId ===
                                notification.id
                                  ? "Removing..."
                                  : "Delete"}
                              </button>
                            )}

                            {!notification.is_active && (
                              <span
                                style={{
                                  color:
                                    "#64748b",
                                  fontSize:
                                    "13px",
                                  fontWeight:
                                    "600",
                                }}
                              >
                                Removed
                              </span>
                            )}

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

                         </table>

              {/* =========================================
                  PAGINATION
              ========================================= */}

              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    gap: "16px",
                    padding:
                      "20px 4px 4px",
                    flexWrap:
                      "wrap",
                  }}
                >

                  <div
                    style={{
                      color:
                        "#64748b",
                      fontSize:
                        "14px",
                      fontWeight:
                        "600",
                    }}
                  >
                    Showing{" "}
                    {(currentPage - 1) *
                      ITEMS_PER_PAGE +
                      1}
                    {" – "}
                    {Math.min(
                      currentPage *
                        ITEMS_PER_PAGE,
                      notifications.length
                    )}{" "}
                    of{" "}
                    {
                      notifications.length
                    }
                  </div>

                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: "8px",
                      flexWrap:
                        "wrap",
                    }}
                  >

                    {/* PREVIOUS */}

                    <button
                      type="button"
                      disabled={
                        currentPage ===
                        1
                      }
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            Math.max(
                              1,
                              page - 1
                            )
                        )
                      }
                      style={{
                        height:
                          "38px",
                        padding:
                          "0 14px",
                        borderRadius:
                          "8px",
                        border:
                          "1px solid #dbe3ef",
                        background:
                          currentPage ===
                          1
                            ? "#f1f5f9"
                            : "#ffffff",
                        color:
                          currentPage ===
                          1
                            ? "#94a3b8"
                            : "#334155",
                        fontWeight:
                          "600",
                        cursor:
                          currentPage ===
                          1
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      ← Previous
                    </button>

                    {/* PAGE NUMBERS */}

                    {Array.from(
                      {
                        length:
                          totalPages,
                      },
                      (
                        _,
                        index
                      ) =>
                        index + 1
                    ).map(
                      (
                        pageNumber
                      ) => (
                        <button
                          key={
                            pageNumber
                          }
                          type="button"
                          onClick={() =>
                            setCurrentPage(
                              pageNumber
                            )
                          }
                          style={{
                            minWidth:
                              "38px",
                            height:
                              "38px",
                            padding:
                              "0 10px",
                            borderRadius:
                              "8px",

                            border:
                              currentPage ===
                              pageNumber
                                ? "1px solid #1d4ed8"
                                : "1px solid #dbe3ef",

                            background:
                              currentPage ===
                              pageNumber
                                ? "#1d4ed8"
                                : "#ffffff",

                            color:
                              currentPage ===
                              pageNumber
                                ? "#ffffff"
                                : "#334155",

                            fontWeight:
                              "700",

                            cursor:
                              "pointer",
                          }}
                        >
                          {
                            pageNumber
                          }
                        </button>
                      )
                    )}

                    {/* NEXT */}

                    <button
                      type="button"
                      disabled={
                        currentPage ===
                        totalPages
                      }
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            Math.min(
                              totalPages,
                              page + 1
                            )
                        )
                      }
                      style={{
                        height:
                          "38px",
                        padding:
                          "0 14px",
                        borderRadius:
                          "8px",
                        border:
                          "1px solid #dbe3ef",

                        background:
                          currentPage ===
                          totalPages
                            ? "#f1f5f9"
                            : "#ffffff",

                        color:
                          currentPage ===
                          totalPages
                            ? "#94a3b8"
                            : "#334155",

                        fontWeight:
                          "600",

                        cursor:
                          currentPage ===
                          totalPages
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      Next →
                    </button>

                  </div>

                </div>
              )}

            </div>


        )}

      </section>

    </div>
  );
}