import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./LibraryModal.css";

const defaultForm = {
  title: "",
  stockName: "",
  analysisDate: "",

  category: "Beginner Course",

  type: "Video",
  sourceType: "Link",

  access: "Subscriber",

  url: "",

  description: "",

  status: "Published",

  featured: false,
  pinned: false,

  views: 0,

  file: null,
};

export default function LibraryModal({
  onClose,
  onSave,
  editingResource,
}) {
  const initialForm = useMemo(
    () => ({
      ...defaultForm,
      ...(editingResource || {}),

      stockName:
        editingResource?.stockName ||
        editingResource?.stock_name ||
        "",

      analysisDate:
        editingResource?.analysisDate ||
        editingResource?.analysis_date ||
        "",

      sourceType:
        editingResource?.sourceType ||
        editingResource?.source_type ||
        "Link",

      featured:
        Boolean(
          editingResource?.featured
        ),

      pinned:
        Boolean(
          editingResource?.pinned
        ),

      file: null,
    }),
    [editingResource]
  );

  const [form, setForm] =
    useState(initialForm);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const isStockAnalysis =
    form.category === "Stock Analysis";

  /* ===================================================
     CHANGE
  =================================================== */

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
      files,
    } = event.target;

    if (type === "file") {
      setForm((previous) => ({
        ...previous,

        [name]:
          files?.[0] || null,
      }));

      return;
    }

    /*
      Clear Stock Analysis-specific
      fields when category changes.
    */

    if (
      name === "category" &&
      value !== "Stock Analysis"
    ) {
      setForm((previous) => ({
        ...previous,

        category: value,

        stockName: "",

        analysisDate: "",
      }));

      return;
    }

    setForm((previous) => ({
      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  /* ===================================================
     SUBMIT
  =================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    const title =
      String(
        form.title || ""
      ).trim();

    const stockName =
      String(
        form.stockName || ""
      ).trim();

    const description =
      String(
        form.description || ""
      ).trim();

    /* TITLE */

    if (!title) {
      alert(
        "Please enter the resource title."
      );

      return;
    }

    /* STOCK NAME */

    if (
      isStockAnalysis &&
      !stockName
    ) {
      alert(
        "Please enter the stock name."
      );

      return;
    }

    /* ANALYSIS DATE */

    if (
      isStockAnalysis &&
      !form.analysisDate
    ) {
      alert(
        "Please select the analysis date."
      );

      return;
    }

    /* URL */

    if (
      form.sourceType === "Link" &&
      !String(
        form.url || ""
      ).trim()
    ) {
      alert(
        "Please enter the resource URL."
      );

      return;
    }

    /* UPLOAD */

    if (
      form.sourceType === "Upload" &&
      !form.file &&
      !form.url
    ) {
      alert(
        "Please choose a file to upload."
      );

      return;
    }

    try {
      setSaving(true);

      await onSave({
        ...form,

        title,

        stockName:
          isStockAnalysis
            ? stockName
            : "",

        analysisDate:
          isStockAnalysis
            ? form.analysisDate
            : "",

        description,

        category:
          form.category ||
          "Beginner Course",

        type:
          form.type ||
          "Video",

        sourceType:
          form.sourceType ||
          "Link",

        access:
          form.access ||
          "Subscriber",

        status:
          form.status ||
          "Published",

        url:
          String(
            form.url || ""
          ).trim(),

        featured:
          Boolean(
            form.featured
          ),

        pinned:
          Boolean(
            form.pinned
          ),

        views:
          Number(
            form.views || 0
          ),
      });

      onClose();
    } catch (error) {
      console.error(
        "Library save error:",
        error
      );

      alert(
        error?.message ||
          "Failed to save resource."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="library-modal-overlay">
      <form
        className="library-modal-container"
        onSubmit={handleSubmit}
      >
        {/* HEADER */}

        <div className="library-modal-header">
          <div>
            <h2>
              {editingResource
                ? "✏️ Edit Resource"
                : "➕ Add Resource"}
            </h2>

            <p>
              Add videos, charts,
              PDFs, links and
              learning resources.
            </p>
          </div>

          <button
            type="button"
            className="library-close-button"
            onClick={onClose}
            aria-label="Close resource modal"
          >
            ✕
          </button>
        </div>

        <div className="library-form-grid">
          {/* TITLE */}

          <div className="library-field library-field-full">
            <label>
              Resource Title *
            </label>

            <input
              name="title"
              value={
                form.title || ""
              }
              onChange={
                handleChange
              }
              placeholder={
                isStockAnalysis
                  ? "Example: Important Support Zone"
                  : "Example: VTKS Swing Trading Basics"
              }
              autoFocus
            />
          </div>

          {/* CATEGORY */}

          <div className="library-field">
            <label>
              Category *
            </label>

            <select
              name="category"
              value={
                form.category ||
                "Beginner Course"
              }
              onChange={
                handleChange
              }
            >
              <option value="Beginner Course">
                Beginner Course
              </option>

              <option value="Live Sessions">
                Live Sessions
              </option>

              <option value="Swing Trading">
                Swing Trading
              </option>

              <option value="Investment">
                Investment
              </option>

              <option value="STF 2.0">
                STF
              </option>

              <option value="Psychology">
                Psychology
              </option>

              <option value="PDF Notes">
                PDF Notes
              </option>

              <option value="Case Studies">
                Case Studies
              </option>

              <option value="Recordings">
                Recordings
              </option>

              <option value="Bonus">
                Bonus
              </option>

              <option value="Stock Analysis">
                📈 Stock Analysis
              </option>
            </select>
          </div>

          {/* RESOURCE TYPE */}

          <div className="library-field">
            <label>
              Resource Type *
            </label>

            <select
              name="type"
              value={
                form.type ||
                "Video"
              }
              onChange={
                handleChange
              }
            >
              <option value="Video">
                Video
              </option>

              <option value="Image">
                Chart / Image
              </option>

              <option value="PDF">
                PDF
              </option>

              <option value="Link">
                Link
              </option>
            </select>
          </div>

          {/* STOCK NAME */}

          {isStockAnalysis && (
            <div className="library-field">
              <label>
                Stock Name *
              </label>

              <input
                type="text"
                name="stockName"
                value={
                  form.stockName ||
                  ""
                }
                onChange={
                  handleChange
                }
                placeholder="Example: HDFC Bank"
                required
              />
            </div>
          )}

          {/* ANALYSIS DATE */}

          {isStockAnalysis && (
            <div className="library-field">
              <label>
                Analysis Date *
              </label>

              <input
                type="date"
                name="analysisDate"
                value={
                  form.analysisDate ||
                  ""
                }
                onChange={
                  handleChange
                }
                required
              />
            </div>
          )}

          {/* SOURCE */}

          <div className="library-field">
            <label>
              Source Type
            </label>

            <select
              name="sourceType"
              value={
                form.sourceType ||
                "Link"
              }
              onChange={
                handleChange
              }
            >
              <option value="Link">
                Link
              </option>

              <option value="Upload">
                Upload
              </option>
            </select>
          </div>

          {/* ACCESS */}

          <div className="library-field">
            <label>
              Access
            </label>

            <select
              name="access"
              value={
                form.access ||
                "Subscriber"
              }
              onChange={
                handleChange
              }
            >
              <option value="Subscriber">
                Subscriber
              </option>

              <option value="Public">
                Public
              </option>

              <option value="Private">
                Private
              </option>
            </select>
          </div>

          {/* STATUS */}

          <div className="library-field">
            <label>
              Status
            </label>

            <select
              name="status"
              value={
                form.status ||
                "Published"
              }
              onChange={
                handleChange
              }
            >
              <option value="Published">
                Published
              </option>

              <option value="Draft">
                Draft
              </option>

              <option value="Hidden">
                Hidden
              </option>
            </select>
          </div>

          {/* VIEWS */}

          <div className="library-field">
            <label>
              Views
            </label>

            <input
              type="number"
              min="0"
              name="views"
              value={
                form.views ?? 0
              }
              onChange={
                handleChange
              }
            />
          </div>

          {/* LINK / UPLOAD */}

          {form.sourceType ===
          "Link" ? (
            <div className="library-field library-field-full">
              <label>
                Resource URL *
              </label>

              <input
                type="url"
                name="url"
                value={
                  form.url || ""
                }
                onChange={
                  handleChange
                }
                placeholder={
                  form.type ===
                  "Video"
                    ? "YouTube / Vimeo / Video URL"
                    : form.type ===
                        "Image"
                      ? "Chart / Image URL"
                      : "Resource URL"
                }
              />
            </div>
          ) : (
            <div className="library-field library-field-full">
              <label>
                {form.type ===
                "Image"
                  ? "Upload Chart / Image"
                  : form.type ===
                      "Video"
                    ? "Upload Video"
                    : form.type ===
                        "PDF"
                      ? "Upload PDF"
                      : "Upload File"}
              </label>

              <input
                type="file"
                name="file"
                onChange={
                  handleChange
                }
                accept={
                  form.type ===
                  "Video"
                    ? "video/*"
                    : form.type ===
                        "PDF"
                      ? "application/pdf"
                      : form.type ===
                          "Image"
                        ? "image/*"
                        : "*/*"
                }
              />

              {form.url &&
                !form.file && (
                  <a
                    href={
                      form.url
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    View current
                    uploaded file
                  </a>
                )}
            </div>
          )}

          {/* DESCRIPTION */}

          <div className="library-field library-field-full">
            <label>
              {isStockAnalysis
                ? "Stock Analysis / Notes"
                : "Description / Notes"}
            </label>

            <textarea
              name="description"
              value={
                form.description ||
                ""
              }
              onChange={
                handleChange
              }
              placeholder={
                isStockAnalysis
                  ? "Write complete analysis here. Levels, structure, timeframe and observations can all be mentioned in this text."
                  : "Explain what this resource contains."
              }
              rows={
                isStockAnalysis
                  ? 9
                  : 5
              }
            />
          </div>

          {/* OPTIONS */}

          <div className="library-options">
            <label className="library-checkbox">
              <input
                type="checkbox"
                name="featured"
                checked={Boolean(
                  form.featured
                )}
                onChange={
                  handleChange
                }
              />

              <span>
                ⭐ Featured resource
              </span>
            </label>

            <label className="library-checkbox">
              <input
                type="checkbox"
                name="pinned"
                checked={Boolean(
                  form.pinned
                )}
                onChange={
                  handleChange
                }
              />

              <span>
                📌 Pin resource
              </span>
            </label>
          </div>
        </div>

        {/* ACTIONS */}

        <div className="library-modal-actions">
          <button
            type="button"
            className="library-cancel-button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="library-save-button"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingResource
                ? "Update Resource"
                : "Save Resource"}
          </button>
        </div>
      </form>
    </div>
  );
}