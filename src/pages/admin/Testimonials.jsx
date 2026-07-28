import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  deleteTestimonial,
  getAllTestimonials,
  toggleFeaturedTestimonial,
  updateTestimonialStatus,
} from "../../services/testimonialService";

import "./Testimonials.css";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "hidden", label: "Hidden" },
];

const normalize = (value) =>
  String(value || "").trim().toLowerCase();

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDisplayName = (item) =>
  item.show_name === false
    ? "Anonymous Member"
    : item.name || "VTKS Member";

export default function Testimonials() {
  const [rows, setRows] = useState([]);
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [ratingFilter, setRatingFilter] =
    useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllTestimonials();
      setRows(data || []);
    } catch (loadError) {
      console.error(
        "Failed to load testimonials:",
        loadError
      );

      setError(
        loadError?.message ||
          "Unable to load testimonials."
      );
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter(
      (item) => normalize(item.status) === "pending"
    ).length;
    const approved = rows.filter(
      (item) => normalize(item.status) === "approved"
    ).length;
    const rejected = rows.filter(
      (item) => normalize(item.status) === "rejected"
    ).length;
    const featured = rows.filter(
      (item) => Boolean(item.featured)
    ).length;

    const ratingSum = rows.reduce(
      (sum, item) => sum + Number(item.rating || 0),
      0
    );

    return {
      total,
      pending,
      approved,
      rejected,
      featured,
      average:
        total > 0
          ? (ratingSum / total).toFixed(1)
          : "0.0",
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = normalize(search);

    return rows.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ||
        normalize(item.status) === statusFilter;

      const matchesRating =
        ratingFilter === "all" ||
        Number(item.rating) === Number(ratingFilter);

      const searchableText = [
        item.name,
        item.email,
        item.category,
        item.message,
      ]
        .map(normalize)
        .join(" ");

      const matchesSearch =
        !query || searchableText.includes(query);

      return (
        matchesStatus &&
        matchesRating &&
        matchesSearch
      );
    });
  }, [rows, statusFilter, ratingFilter, search]);

  const replaceRow = (updatedRow) => {
    setRows((current) =>
      current.map((item) =>
        item.id === updatedRow.id ? updatedRow : item
      )
    );

    setSelected((current) =>
      current?.id === updatedRow.id
        ? updatedRow
        : current
    );
  };

  const runAction = async ({
    testimonialId,
    action,
    successMessage,
  }) => {
    try {
      setWorkingId(testimonialId);
      setError("");
      setNotice("");

      const updatedRow = await action();
      replaceRow(updatedRow);
      setNotice(successMessage);
    } catch (actionError) {
      console.error(
        "Testimonial action failed:",
        actionError
      );

      setError(
        actionError?.message ||
          "Unable to update testimonial."
      );
    } finally {
      setWorkingId(null);
    }
  };

  const handleStatusChange = async (
    testimonialId,
    status
  ) => {
    await runAction({
      testimonialId,
      action: () =>
        updateTestimonialStatus({
          testimonialId,
          status,
        }),
      successMessage: `Feedback marked as ${status}.`,
    });
  };

  const handleFeatureToggle = async (item) => {
    await runAction({
      testimonialId: item.id,
      action: () =>
        toggleFeaturedTestimonial({
          testimonialId: item.id,
          featured: !item.featured,
        }),
      successMessage: item.featured
        ? "Feedback removed from featured."
        : "Feedback marked as featured.",
    });
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete feedback from ${
        item.name || "this member"
      }?`
    );

    if (!confirmed) return;

    try {
      setWorkingId(item.id);
      setError("");
      setNotice("");

      await deleteTestimonial(item.id);

      setRows((current) =>
        current.filter((row) => row.id !== item.id)
      );

      if (selected?.id === item.id) {
        setSelected(null);
      }

      setNotice("Feedback deleted successfully.");
    } catch (deleteError) {
      console.error(
        "Failed to delete testimonial:",
        deleteError
      );

      setError(
        deleteError?.message ||
          "Unable to delete testimonial."
      );
    } finally {
      setWorkingId(null);
    }
  };

  if (loading) {
    return (
      <div className="admin-testimonials-loading">
        Loading feedback management...
      </div>
    );
  }

  return (
    <div className="admin-testimonials-page">
      <header className="admin-testimonials-header">
        <div>
          <span className="admin-testimonials-kicker">
            VTKS Feedback Management
          </span>

          <h1>Member Feedback</h1>

          <p>
            Review, approve and feature subscriber
            testimonials before they appear publicly.
          </p>
        </div>

        <button
          type="button"
          className="admin-testimonials-refresh"
          onClick={loadTestimonials}
        >
          ↻ Refresh
        </button>
      </header>

      {error && (
        <div className="admin-testimonials-alert error">
          {error}
        </div>
      )}

      {notice && (
        <div className="admin-testimonials-alert success">
          {notice}
        </div>
      )}

      <section className="admin-testimonial-stats">
        <StatCard
          label="Total"
          value={stats.total}
          icon="📝"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon="⏳"
          tone="orange"
        />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon="✅"
          tone="green"
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          icon="❌"
          tone="red"
        />
        <StatCard
          label="Featured"
          value={stats.featured}
          icon="⭐"
          tone="purple"
        />
        <StatCard
          label="Average Rating"
          value={`${stats.average}/5`}
          icon="🌟"
          tone="blue"
        />
      </section>

      <section className="admin-testimonials-panel">
        <div className="admin-testimonials-toolbar">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search name, email, category or feedback..."
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            {STATUS_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={ratingFilter}
            onChange={(event) =>
              setRatingFilter(event.target.value)
            }
          >
            <option value="all">All ratings</option>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
            <option value="2">2 stars</option>
            <option value="1">1 star</option>
          </select>
        </div>

        <div className="admin-testimonials-count">
          Showing {filteredRows.length} of {rows.length} feedback
          entries
        </div>

        {filteredRows.length === 0 ? (
          <div className="admin-testimonials-empty">
            No feedback matches the selected filters.
          </div>
        ) : (
          <div className="admin-testimonials-table-wrap">
            <table className="admin-testimonials-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Rating</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((item) => {
                  const status =
                    normalize(item.status) || "pending";
                  const busy = workingId === item.id;

                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>
                          {getDisplayName(item)}
                        </strong>
                        <small>
                          {item.email || "No email"}
                        </small>
                      </td>

                      <td>
                        <span className="admin-rating">
                          {"★".repeat(
                            Number(item.rating || 0)
                          )}
                        </span>
                      </td>

                      <td>
                        {item.category || "General"}
                      </td>

                      <td>
                        <span
                          className={`admin-feedback-status ${status}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>{formatDate(item.created_at)}</td>

                      <td>
                        <button
                          type="button"
                          className={
                            item.featured
                              ? "admin-feature-toggle active"
                              : "admin-feature-toggle"
                          }
                          disabled={busy}
                          onClick={() =>
                            handleFeatureToggle(item)
                          }
                        >
                          {item.featured
                            ? "★ Featured"
                            : "☆ Feature"}
                        </button>
                      </td>

                      <td>
                        <div className="admin-testimonial-actions">
                          <button
                            type="button"
                            className="view"
                            onClick={() =>
                              setSelected(item)
                            }
                          >
                            View
                          </button>

                          {status !== "approved" && (
                            <button
                              type="button"
                              className="approve"
                              disabled={busy}
                              onClick={() =>
                                handleStatusChange(
                                  item.id,
                                  "approved"
                                )
                              }
                            >
                              Approve
                            </button>
                          )}

                          {status !== "rejected" && (
                            <button
                              type="button"
                              className="reject"
                              disabled={busy}
                              onClick={() =>
                                handleStatusChange(
                                  item.id,
                                  "rejected"
                                )
                              }
                            >
                              Reject
                            </button>
                          )}

                          <button
                            type="button"
                            className="delete"
                            disabled={busy}
                            onClick={() =>
                              handleDelete(item)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <TestimonialModal
          item={selected}
          working={workingId === selected.id}
          onClose={() => setSelected(null)}
          onApprove={() =>
            handleStatusChange(selected.id, "approved")
          }
          onReject={() =>
            handleStatusChange(selected.id, "rejected")
          }
          onFeature={() =>
            handleFeatureToggle(selected)
          }
          onDelete={() => handleDelete(selected)}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone = "default",
}) {
  return (
    <article
      className={`admin-testimonial-stat ${tone}`}
    >
      <span>{icon}</span>

      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </article>
  );
}

function TestimonialModal({
  item,
  working,
  onClose,
  onApprove,
  onReject,
  onFeature,
  onDelete,
}) {
  return (
    <div
      className="admin-testimonial-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="admin-testimonial-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="testimonial-modal-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="admin-testimonial-modal-header">
          <div>
            <span>Feedback details</span>
            <h2 id="testimonial-modal-title">
              {getDisplayName(item)}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="admin-testimonial-modal-rating">
          {"★".repeat(Number(item.rating || 0))}
        </div>

        <div className="admin-testimonial-modal-grid">
          <Detail
            label="Email"
            value={item.email || "-"}
          />
          <Detail
            label="Category"
            value={item.category || "-"}
          />
          <Detail
            label="Member Since"
            value={item.member_since || "-"}
          />
          <Detail
            label="Submitted"
            value={formatDate(item.created_at)}
          />
          <Detail
            label="Status"
            value={item.status || "pending"}
          />
          <Detail
            label="Featured"
            value={item.featured ? "Yes" : "No"}
          />
        </div>

        <div className="admin-testimonial-message">
          <strong>Feedback</strong>
          <p>{item.message || "-"}</p>
        </div>

        {item.admin_note && (
          <div className="admin-testimonial-message">
            <strong>Admin Note</strong>
            <p>{item.admin_note}</p>
          </div>
        )}

        <div className="admin-testimonial-media">
          {item.photo_url && (
            <a
              href={item.photo_url}
              target="_blank"
              rel="noreferrer"
            >
              View profile photo
            </a>
          )}

          {item.screenshot_url && (
            <a
              href={item.screenshot_url}
              target="_blank"
              rel="noreferrer"
            >
              View screenshot
            </a>
          )}
        </div>

        <div className="admin-testimonial-modal-actions">
          <button
            type="button"
            className="approve"
            disabled={working}
            onClick={onApprove}
          >
            Approve
          </button>

          <button
            type="button"
            className="reject"
            disabled={working}
            onClick={onReject}
          >
            Reject
          </button>

          <button
            type="button"
            className="feature"
            disabled={working}
            onClick={onFeature}
          >
            {item.featured
              ? "Remove Featured"
              : "Mark Featured"}
          </button>

          <button
            type="button"
            className="delete"
            disabled={working}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="admin-testimonial-detail">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
