import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCurrentUserForFeedback,
  getUserTestimonials,
  submitFeedback,
  uploadTestimonialFile,
} from "../../services/testimonialService";
import { logoutUser } from "../../services/authService";
import "./Feedback.css";

const feedbackCategories = [
  "Education",
  "Swing Trading",
  "Investment",
  "Indicators",
  "Scanners",
  "Community",
  "Risk Management",
  "Overall Experience",
];

const initialForm = {
  name: "",
  email: "",
  rating: 0,
  category: "",
  message: "",
  memberSince: "",
  showName: true,
  showPhoto: false,
};

export default function Feedback() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [user, setUser] = useState(null);
  const [screenshotFile, setScreenshotFile] =
    useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });
  const [previousFeedback, setPreviousFeedback] =
    useState([]);

  useEffect(() => {
    loadPage();
  }, []);

  const loadPage = async () => {
    try {
      setLoading(true);

      const currentUser =
        await getCurrentUserForFeedback();

      setUser(currentUser);

      if (currentUser) {
        setForm((previous) => ({
          ...previous,
          name:
            currentUser.user_metadata?.full_name ||
            currentUser.user_metadata?.name ||
            "",
          email: currentUser.email || "",
        }));

        const rows = await getUserTestimonials(
          currentUser.id
        );

        setPreviousFeedback(rows);
      }
    } catch (error) {
      console.error(
        "Failed to load feedback page:",
        error
      );

      setMessage({
        type: "error",
        text:
          error.message ||
          "Unable to load the feedback page.",
      });
    } finally {
      setLoading(false);
    }
  };

  const characterCount = useMemo(
    () => form.message.length,
    [form.message]
  );

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (message.text) {
      setMessage({
        type: "",
        text: "",
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setMessage({
        type: "",
        text: "",
      });

      let photoUrl = "";
      let screenshotUrl = "";

      if (photoFile) {
        photoUrl = await uploadTestimonialFile({
          file: photoFile,
          userId: user?.id,
        });
      }

      if (screenshotFile) {
        screenshotUrl =
          await uploadTestimonialFile({
            file: screenshotFile,
            userId: user?.id,
          });
      }

      const submittedFeedback =
        await submitFeedback({
          userId: user?.id,
          name: form.name,
          email: form.email,
          rating: form.rating,
          category: form.category,
          message: form.message,
          memberSince: form.memberSince,
          showName: form.showName,
          showPhoto: form.showPhoto,
          photoUrl,
          screenshotUrl,
        });

      setPreviousFeedback((previous) => [
        submittedFeedback,
        ...previous,
      ]);

      setForm((previous) => ({
        ...initialForm,
        name: previous.name,
        email: previous.email,
      }));

      setPhotoFile(null);
      setScreenshotFile(null);

      setMessage({
        type: "success",
        text:
          "Thank you for your feedback. It has been submitted for admin review.",
      });
    } catch (error) {
      console.error(
        "Failed to submit feedback:",
        error
      );

      setMessage({
        type: "error",
        text:
          error.message ||
          "Feedback could not be submitted.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "approved":
        return "feedback-status approved";

      case "rejected":
        return "feedback-status rejected";

      case "hidden":
        return "feedback-status hidden";

      default:
        return "feedback-status pending";
    }
  };

  if (loading) {
    return (
      <main className="subscriber-feedback-page">
        <div className="feedback-loading">
          Loading feedback page...
        </div>
      </main>
    );
  }

  return (
    <main className="subscriber-feedback-page">
      <section className="feedback-topbar">
        <div>
          <span className="feedback-topbar-badge">
            VTKS Member Feedback
          </span>

          <h1>Share Your Experience</h1>

          <p>
            Tell us how VTKS has helped improve your
            learning, discipline, analysis or market
            understanding.
          </p>
        </div>

        <div className="feedback-topbar-actions">
          <button
            type="button"
            className="feedback-dashboard-button"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>

          <button
            type="button"
            className="feedback-logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </section>

      <div className="feedback-page-grid">
        <section className="feedback-form-card">
          <div className="feedback-card-heading">
            <h2>Submit Feedback</h2>

            <p>
              Your feedback will be reviewed before it
              appears publicly.
            </p>
          </div>

          {message.text && (
            <div
              className={`feedback-alert ${message.type}`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="feedback-form-row">
              <label>
                Name
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateForm(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="Enter your name"
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateForm(
                      "email",
                      event.target.value
                    )
                  }
                  placeholder="Enter your email"
                  readOnly={Boolean(user?.email)}
                />
              </label>
            </div>

            <div className="feedback-field">
              <span className="feedback-label">
                Rating
              </span>

              <div className="feedback-stars">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    className={
                      rating <= form.rating
                        ? "feedback-star active"
                        : "feedback-star"
                    }
                    onClick={() =>
                      updateForm("rating", rating)
                    }
                    aria-label={`${rating} star rating`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="feedback-form-row">
              <label>
                Category
                <select
                  value={form.category}
                  onChange={(event) =>
                    updateForm(
                      "category",
                      event.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Select category
                  </option>

                  {feedbackCategories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                Member Since
                <input
                  type="text"
                  value={form.memberSince}
                  onChange={(event) =>
                    updateForm(
                      "memberSince",
                      event.target.value
                    )
                  }
                  placeholder="Example: January 2026"
                />
              </label>
            </div>

            <label className="feedback-message-field">
              Feedback
              <textarea
                value={form.message}
                onChange={(event) =>
                  updateForm(
                    "message",
                    event.target.value
                  )
                }
                placeholder="Share your genuine VTKS learning experience..."
                maxLength={1500}
                required
              />

              <span className="feedback-character-count">
                {characterCount}/1500
              </span>
            </label>

            <div className="feedback-form-row">
              <label>
                Profile Photo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    setPhotoFile(
                      event.target.files?.[0] ||
                        null
                    )
                  }
                />
              </label>

              <label>
                Optional Screenshot
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    setScreenshotFile(
                      event.target.files?.[0] ||
                        null
                    )
                  }
                />
              </label>
            </div>

            <div className="feedback-checkboxes">
              <label>
                <input
                  type="checkbox"
                  checked={form.showName}
                  onChange={(event) =>
                    updateForm(
                      "showName",
                      event.target.checked
                    )
                  }
                />

                Allow VTKS to display my name
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={form.showPhoto}
                  onChange={(event) =>
                    updateForm(
                      "showPhoto",
                      event.target.checked
                    )
                  }
                />

                Allow VTKS to display my profile
                photo
              </label>
            </div>

            <div className="feedback-consent">
              By submitting this feedback, I confirm
              that it reflects my genuine experience
              and may be reviewed before publication.
            </div>

            <button
              type="submit"
              className="feedback-submit-button"
              disabled={submitting}
            >
              {submitting
                ? "Submitting..."
                : "Submit Feedback"}
            </button>
          </form>
        </section>

        <aside className="feedback-history-card">
          <div className="feedback-card-heading">
            <h2>Your Previous Feedback</h2>

            <p>
              Track the review status of your
              submissions.
            </p>
          </div>

          {previousFeedback.length === 0 ? (
            <div className="feedback-empty-history">
              You have not submitted feedback yet.
            </div>
          ) : (
            <div className="feedback-history-list">
              {previousFeedback.map((item) => (
                <article
                  key={item.id}
                  className="feedback-history-item"
                >
                  <div className="feedback-history-top">
                    <strong>
                      {item.category ||
                        "VTKS Experience"}
                    </strong>

                    <span
                      className={getStatusClass(
                        item.status
                      )}
                    >
                      {item.status || "pending"}
                    </span>
                  </div>

                  <div className="feedback-history-rating">
                    {"★".repeat(
                      Number(item.rating || 0)
                    )}
                  </div>

                  <p>{item.message}</p>

                  <small>
                    {item.created_at
                      ? new Date(
                          item.created_at
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )
                      : ""}
                  </small>
                </article>
              ))}
            </div>
          )}
        </aside>
      </div>

      <section className="feedback-disclosure">
        <strong>Important disclosure</strong>

        <p>
          Testimonials represent individual
          experiences and do not guarantee similar
          results. Trading and investing involve market
          risk. Do not upload screenshots containing
          account numbers, PAN, broker IDs, mobile
          numbers or other private information.
        </p>
      </section>
    </main>
  );
}