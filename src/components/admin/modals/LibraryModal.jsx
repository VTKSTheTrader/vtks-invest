import { useEffect, useMemo, useState } from "react";
import "./LibraryModal.css";

const defaultForm = {
  title: "",
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
      sourceType:
        editingResource?.sourceType ||
        editingResource?.source_type ||
        "Link",
      featured: Boolean(editingResource?.featured),
      pinned: Boolean(editingResource?.pinned),
      file: null,
    }),
    [editingResource]
  );

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const handleChange = (event) => {
    const { name, value, type, checked, files } = event.target;

    if (type === "file") {
      setForm((previous) => ({
        ...previous,
        [name]: files?.[0] || null,
      }));
      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    const title = String(form.title || "").trim();
    const description = String(form.description || "").trim();

    if (!title) {
      alert("Please enter the resource title.");
      return;
    }

    if (form.sourceType === "Link" && !String(form.url || "").trim()) {
      alert("Please enter the resource URL.");
      return;
    }

    if (form.sourceType === "Upload" && !form.file && !form.url) {
      alert("Please choose a file to upload.");
      return;
    }

    try {
      setSaving(true);

      await onSave({
        ...form,
        title,
        description,
        category: form.category || "Beginner Course",
        type: form.type || "Video",
        sourceType: form.sourceType || "Link",
        access: form.access || "Subscriber",
        status: form.status || "Published",
        url: String(form.url || "").trim(),
        featured: Boolean(form.featured),
        pinned: Boolean(form.pinned),
        views: Number(form.views || 0),
      });

      onClose();
    } catch (error) {
      console.error("Library save error:", error);
      alert(error.message || "Failed to save resource.");
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
        <div className="library-modal-header">
          <div>
            <h2>
              {editingResource
                ? "✏️ Edit Resource"
                : "➕ Add Resource"}
            </h2>

            <p>
              Add videos, PDFs, links and subscriber learning resources.
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
          <div className="library-field library-field-full">
            <label>Resource Title</label>

            <input
              name="title"
              value={form.title || ""}
              onChange={handleChange}
              placeholder="Example: VTKS Swing Trading Basics"
              autoFocus
            />
          </div>

          <div className="library-field">
            <label>Category</label>

            <select
              name="category"
              value={form.category || "Beginner Course"}
              onChange={handleChange}
            >
              <option value="Beginner Course">Beginner Course</option>
              <option value="Live Sessions">Live Sessions</option>
              <option value="Swing Trading">Swing Trading</option>
              <option value="Investment">Investment</option>
              <option value="STF 2.0">STF </option>
              <option value="Psychology">Psychology</option>
              <option value="PDF Notes">PDF Notes</option>
              <option value="Case Studies">Case Studies</option>
              <option value="Recordings">Recordings</option>
              <option value="Bonus">Bonus</option>
            </select>
          </div>

          <div className="library-field">
            <label>Resource Type</label>

            <select
              name="type"
              value={form.type || "Video"}
              onChange={handleChange}
            >
              <option value="Video">Video</option>
              <option value="PDF">PDF</option>
              <option value="Link">Link</option>
            </select>
          </div>

          <div className="library-field">
            <label>Source Type</label>

            <select
              name="sourceType"
              value={form.sourceType || "Link"}
              onChange={handleChange}
            >
              <option value="Link">Link</option>
              <option value="Upload">Upload</option>
            </select>
          </div>

          <div className="library-field">
            <label>Access</label>

            <select
              name="access"
              value={form.access || "Subscriber"}
              onChange={handleChange}
            >
              <option value="Subscriber">Subscriber</option>
              <option value="Public">Public</option>
              <option value="Private">Private</option>
            </select>
          </div>

          <div className="library-field">
            <label>Status</label>

            <select
              name="status"
              value={form.status || "Published"}
              onChange={handleChange}
            >
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Hidden">Hidden</option>
            </select>
          </div>

          <div className="library-field">
            <label>Views</label>

            <input
              type="number"
              min="0"
              name="views"
              value={form.views ?? 0}
              onChange={handleChange}
              placeholder="0"
            />
          </div>

          {form.sourceType === "Link" ? (
            <div className="library-field library-field-full">
              <label>Resource URL</label>

              <input
                type="url"
                name="url"
                value={form.url || ""}
                onChange={handleChange}
                placeholder="YouTube / Google Drive / Vimeo / Website URL"
              />
            </div>
          ) : (
            <div className="library-field library-field-full">
              <label>Upload File</label>

              <input
                type="file"
                name="file"
                onChange={handleChange}
                accept={
                  form.type === "Video"
                    ? "video/*"
                    : form.type === "PDF"
                      ? "application/pdf"
                      : "*/*"
                }
              />

              {form.url && !form.file && (
                <a
                  href={form.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  View current uploaded file
                </a>
              )}
            </div>
          )}

          <div className="library-field library-field-full">
            <label>Description / Notes</label>

            <textarea
              name="description"
              value={form.description || ""}
              onChange={handleChange}
              placeholder="Explain what this resource contains and who should use it."
              rows={5}
            />
          </div>

          <div className="library-options">
            <label className="library-checkbox">
              <input
                type="checkbox"
                name="featured"
                checked={Boolean(form.featured)}
                onChange={handleChange}
              />

              <span>⭐ Featured resource</span>
            </label>

            <label className="library-checkbox">
              <input
                type="checkbox"
                name="pinned"
                checked={Boolean(form.pinned)}
                onChange={handleChange}
              />

              <span>📌 Pin resource</span>
            </label>
          </div>
        </div>

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