import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  deleteRegisteredUser,
  getRegisteredUsers,
  updateRegisteredUserAccess,
} from "../../services/adminRegisteredUsersService";

import "./RegisteredUsers.css";

const USERS_PER_PAGE = 5;

const ALPHABETS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(
    ""
  );

/* =====================================================
   DATE
===================================================== */

const formatDateTime = (
  value
) => {
  if (!value) {
    return "-";
  }

  try {
    return new Date(
      value
    ).toLocaleString(
      "en-IN",
      {
        timeZone:
          "Asia/Kolkata",

        day: "2-digit",
        month: "2-digit",
        year: "numeric",

        hour: "2-digit",
        minute: "2-digit",
      }
    );
  } catch {
    return "-";
  }
};

/* =====================================================
   MAIN
===================================================== */

export default function RegisteredUsers() {
  const [
    users,
    setUsers,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState("All");

  const [
    alphabetFilter,
    setAlphabetFilter,
  ] = useState("All");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  /* =====================================================
     LOAD USERS
  ===================================================== */

  const loadUsers =
    async () => {
      try {
        setLoading(true);
        setError("");

        const rows =
          await getRegisteredUsers();

        setUsers(
          Array.isArray(rows)
            ? rows
            : []
        );
      } catch (err) {
        console.error(
          "Registered users load error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load registered users."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadUsers();
  }, []);

  /* =====================================================
     DASHBOARD ACCESS
  ===================================================== */

  const handleAccess =
    async (user) => {
      if (
        !user?.auth_user_id
      ) {
        return;
      }

      const nextValue =
        !Boolean(
          user.dashboard_access
        );

      const userLabel =
        user.name ||
        user.email ||
        "this user";

      const confirmed =
        window.confirm(
          nextValue
            ? `Enable dashboard access for ${userLabel}?`
            : `Disable dashboard access for ${userLabel}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");
        setMessage("");

        setActionLoading(
          user.auth_user_id
        );

        await updateRegisteredUserAccess(
          user.auth_user_id,
          nextValue
        );

        await loadUsers();

        setMessage(
          nextValue
            ? `${userLabel} dashboard access enabled successfully.`
            : `${userLabel} dashboard access disabled successfully.`
        );
      } catch (err) {
        console.error(
          "Dashboard access update error:",
          err
        );

        setError(
          err?.message ||
            "Unable to update dashboard access."
        );
      } finally {
        setActionLoading("");
      }
    };

  /* =====================================================
     DELETE REGISTRATION
  ===================================================== */

  const handleDelete =
    async (user) => {
      if (
        !user?.auth_user_id
      ) {
        return;
      }

      if (
        user.has_subscription
      ) {
        setError(
          "This user has subscription history and cannot be deleted from Registered Users. Manage this account from Members."
        );

        return;
      }

      if (
        user.dashboard_access
      ) {
        setError(
          "Please disable dashboard access before deleting this registration."
        );

        return;
      }

      const userLabel =
        user.name ||
        user.email ||
        "this user";

      const confirmed =
        window.confirm(
          `Permanently delete ${userLabel}?\n\nThis will remove the Supabase login registration and cannot be undone.`
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");
        setMessage("");

        setActionLoading(
          user.auth_user_id
        );

        await deleteRegisteredUser(
          user.auth_user_id
        );

        await loadUsers();

        setMessage(
          `${userLabel} registration deleted successfully.`
        );
      } catch (err) {
        console.error(
          "Delete registration error:",
          err
        );

        setError(
          err?.message ||
            "Unable to delete registration."
        );
      } finally {
        setActionLoading("");
      }
    };

  /* =====================================================
     STATS
  ===================================================== */

  const stats =
    useMemo(() => {
      const registered =
        users.length;

      const linked =
        users.filter(
          (user) =>
            user.linked_member
        ).length;

      const subscribers =
        users.filter(
          (user) =>
            user.has_subscription
        ).length;

      const registeredOnly =
        users.filter(
          (user) =>
            !user.has_subscription
        ).length;

      const accessEnabled =
        users.filter(
          (user) =>
            user.dashboard_access
        ).length;

      return {
        registered,
        linked,
        subscribers,
        registeredOnly,
        accessEnabled,
      };
    }, [users]);

  /* =====================================================
     FILTER + ALPHABETICAL SORT
  ===================================================== */

  const filteredUsers =
    useMemo(() => {
      const cleanSearch =
        search
          .trim()
          .toLowerCase();

      const filtered =
        users.filter(
          (user) => {
            const name =
              String(
                user.name || ""
              ).trim();

            const email =
              String(
                user.email || ""
              );

            const mobile =
              String(
                user.mobile || ""
              );

            const matchesSearch =
              !cleanSearch ||
              name
                .toLowerCase()
                .includes(
                  cleanSearch
                ) ||
              email
                .toLowerCase()
                .includes(
                  cleanSearch
                ) ||
              mobile
                .toLowerCase()
                .includes(
                  cleanSearch
                );

            const matchesAlphabet =
              alphabetFilter ===
                "All" ||
              name
                .toUpperCase()
                .startsWith(
                  alphabetFilter
                );

            let matchesFilter =
              true;

            if (
              filter ===
              "Subscriber"
            ) {
              matchesFilter =
                Boolean(
                  user.has_subscription
                );
            }

            if (
              filter ===
              "Registered Only"
            ) {
              matchesFilter =
                !user.has_subscription;
            }

            if (
              filter ===
              "Access ON"
            ) {
              matchesFilter =
                user.dashboard_access ===
                true;
            }

            if (
              filter ===
              "Access OFF"
            ) {
              matchesFilter =
                user.dashboard_access !==
                true;
            }

            if (
              filter ===
              "Linked"
            ) {
              matchesFilter =
                Boolean(
                  user.linked_member
                );
            }

            if (
              filter ===
              "Not Linked"
            ) {
              matchesFilter =
                !user.linked_member;
            }

            return (
              matchesSearch &&
              matchesAlphabet &&
              matchesFilter
            );
          }
        );

      return filtered.sort(
        (a, b) =>
          String(
            a.name || ""
          ).localeCompare(
            String(
              b.name || ""
            ),
            "en",
            {
              sensitivity:
                "base",
            }
          )
      );
    }, [
      users,
      search,
      filter,
      alphabetFilter,
    ]);

  /* =====================================================
     PAGINATION
  ===================================================== */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredUsers.length /
          USERS_PER_PAGE
      )
    );

  const paginatedUsers =
    useMemo(() => {
      const start =
        (
          currentPage - 1
        ) *
        USERS_PER_PAGE;

      return filteredUsers.slice(
        start,
        start +
          USERS_PER_PAGE
      );
    }, [
      filteredUsers,
      currentPage,
    ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    filter,
    alphabetFilter,
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

  /* =====================================================
     CLEAR FILTERS
  ===================================================== */

  const clearFilters =
    () => {
      setSearch("");
      setFilter("All");
      setAlphabetFilter(
        "All"
      );
      setCurrentPage(1);
    };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <section className="registered-users-page">

        <div className="registered-users-loading">
          Loading registered users...
        </div>

      </section>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <section className="registered-users-page">

      {/* HEADER */}

      <div className="registered-users-header">

        <div>

          <h1>
            Registered Users
          </h1>

          <p>
            Manage VTKS registrations,
            contact information and
            dashboard access.
          </p>

        </div>

        <button
          type="button"
          className="registered-users-refresh"
          onClick={
            loadUsers
          }
        >
          ↻ Refresh
        </button>

      </div>

      {/* MESSAGE */}

      {message && (
        <div className="registered-users-message success">
          {message}
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="registered-users-message error">
          {error}
        </div>
      )}

      {/* STATS */}

      <div className="registered-users-stats">

        <StatCard
          value={
            stats.registered
          }
          label="Total Registered"
        />

        <StatCard
          value={
            stats.subscribers
          }
          label="Subscribers"
        />

        <StatCard
          value={
            stats.registeredOnly
          }
          label="Registered Only"
        />

        <StatCard
          value={
            stats.linked
          }
          label="Linked Members"
        />

        <StatCard
          value={
            stats.accessEnabled
          }
          label="Access Enabled"
        />

      </div>

      {/* PANEL */}

      <div className="registered-users-panel">

        <div className="registered-users-panel-head">

          <div>

            <h2>
              User Registrations
            </h2>

            <p>
              Dashboard access remains
              under manual Admin control.
            </p>

          </div>

        </div>

        {/* ALPHABET FILTER */}

        <div className="registered-users-alphabet-filter">

          <button
            type="button"
            className={
              alphabetFilter ===
              "All"
                ? "active"
                : ""
            }
            onClick={() =>
              setAlphabetFilter(
                "All"
              )
            }
          >
            All
          </button>

          {ALPHABETS.map(
            (letter) => (
              <button
                key={letter}
                type="button"
                className={
                  alphabetFilter ===
                  letter
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setAlphabetFilter(
                    letter
                  )
                }
              >
                {letter}
              </button>
            )
          )}

        </div>

        {/* FILTERS */}

        <div className="registered-users-filters">

          <input
            type="text"
            placeholder="Search name, email or mobile..."
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
          />

          <select
            value={filter}
            onChange={(
              event
            ) =>
              setFilter(
                event.target.value
              )
            }
          >

            <option value="All">
              All Users
            </option>

            <option value="Subscriber">
              Subscribers
            </option>

            <option value="Registered Only">
              Registered Only
            </option>

            <option value="Access ON">
              Access ON
            </option>

            <option value="Access OFF">
              Access OFF
            </option>

            <option value="Linked">
              Linked
            </option>

            <option value="Not Linked">
              Not Linked
            </option>

          </select>

          <button
            type="button"
            onClick={
              clearFilters
            }
            disabled={
              !search &&
              filter === "All" &&
              alphabetFilter ===
                "All"
            }
          >
            Clear
          </button>

        </div>

        {/* SUMMARY */}

        <div className="registered-users-summary">

          Showing{" "}

          <strong>
            {
              filteredUsers.length
            }
          </strong>

          {" of "}

          <strong>
            {users.length}
          </strong>

          {" users"}

          {alphabetFilter !==
            "All" && (
            <>
              {" • "}
              Names starting with{" "}
              <strong>
                {
                  alphabetFilter
                }
              </strong>
            </>
          )}

        </div>

        {/* TABLE */}

        <div className="registered-users-table-wrap">

          <table className="registered-users-table">

            <thead>
              <tr>

                <th>
                  Name
                </th>

                <th>
                  Email
                </th>

                <th>
                  Mobile
                </th>

                <th>
                  Registered
                </th>

                <th>
                  Member
                </th>

                <th>
                  Subscription
                </th>

                <th>
                  Access
                </th>

                <th>
                  Action
                </th>

              </tr>
            </thead>

            <tbody>

              {paginatedUsers.map(
                (user) => {
                  const busy =
                    actionLoading ===
                    user.auth_user_id;

                  return (
                    <tr
                      key={
                        user.auth_user_id
                      }
                    >

                      <td>
                        <strong>
                          {user.name ||
                            "Unnamed User"}
                        </strong>
                      </td>

                      <td>
                        {user.email ||
                          "-"}
                      </td>

                      <td>
                        {user.mobile ||
                          "-"}
                      </td>

                      <td>
                        {formatDateTime(
                          user.registered_at
                        )}
                      </td>

                      {/* MEMBER */}

                      <td>

                        {user.linked_member ? (
                          <span className="registered-badge linked">
                            Linked
                          </span>
                        ) : (
                          <span className="registered-badge unlinked">
                            Not Linked
                          </span>
                        )}

                      </td>

                      {/* SUBSCRIPTION */}

                      <td>

                        {user.has_subscription ? (
                          <span className="registered-badge subscription">
                            {user.current_plan ||
                              "Subscriber"}
                          </span>
                        ) : (
                          <span className="registered-only-text">
                            Registered Only
                          </span>
                        )}

                      </td>

                      {/* ACCESS */}

                      <td>

                        <button
                          type="button"
                          className={
                            user.dashboard_access
                              ? "registered-access-btn on"
                              : "registered-access-btn off"
                          }
                          disabled={
                            busy
                          }
                          onClick={() =>
                            handleAccess(
                              user
                            )
                          }
                        >
                          {busy
                            ? "..."
                            : user.dashboard_access
                            ? "ON"
                            : "OFF"}
                        </button>

                      </td>

                      {/* ACTION */}

                      <td>

                        {!user.has_subscription ? (
                          <button
                            type="button"
                            className="registered-delete-btn"
                            disabled={
                              busy ||
                              user.dashboard_access
                            }
                            onClick={() =>
                              handleDelete(
                                user
                              )
                            }
                            title={
                              user.dashboard_access
                                ? "Disable dashboard access before deleting"
                                : "Delete registration"
                            }
                          >
                            {busy
                              ? "Working..."
                              : "🗑 Delete"}
                          </button>
                        ) : (
                          <span className="registered-protected">
                            Protected
                          </span>
                        )}

                      </td>

                    </tr>
                  );
                }
              )}

              {paginatedUsers.length ===
                0 && (
                <tr>

                  <td
                    colSpan="8"
                    className="registered-users-empty"
                  >
                    No registered users
                    match the selected
                    filters.
                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

        {/* PAGINATION */}

        <div className="registered-users-pagination">

          <div className="registered-users-pagination-info">

            Showing{" "}

            {filteredUsers.length ===
            0
              ? 0
              : (
                  currentPage -
                  1
                ) *
                  USERS_PER_PAGE +
                1}

            {" – "}

            {Math.min(
              currentPage *
                USERS_PER_PAGE,
              filteredUsers.length
            )}

            {" of "}

            {
              filteredUsers.length
            }

            {" users"}

          </div>

          <div className="registered-users-pagination-controls">

            <button
              type="button"
              disabled={
                currentPage ===
                  1 ||
                filteredUsers.length ===
                  0
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
            >
              Previous
            </button>

            <span>
              Page{" "}
              {currentPage}{" "}
              of{" "}
              {totalPages}
            </span>

            <button
              type="button"
              disabled={
                currentPage ===
                  totalPages ||
                filteredUsers.length ===
                  0
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
            >
              Next
            </button>

          </div>

        </div>

      </div>

    </section>
  );
}

/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  value,
  label,
}) {
  return (
    <article className="registered-users-stat-card">

      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>

    </article>
  );
}