import { useEffect, useState } from "react";
import "./ScannerModal.css";

const defaultForm = {
  name: "",
  category: "Swing",
  timeframe: "Daily",
  link: "",
  access: "Subscriber",
  status: "Active",
  featured: false,
};

export default function ScannerModal({
  onClose,
  onSave,
  editingScanner,
}) {
  const [form, setForm] =
    useState(defaultForm);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (editingScanner) {
      setForm({
        ...defaultForm,
        ...editingScanner,
        featured: Boolean(
          editingScanner.featured
        ),
      });
    } else {
      setForm(defaultForm);
    }
  }, [editingScanner]);

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    const name = String(
      form.name || ""
    ).trim();

    const link = String(
      form.link || ""
    ).trim();

    if (!name) {
      alert("Please enter scanner name.");
      return;
    }

    if (!link) {
      alert("Please enter scanner link.");
      return;
    }

    if (
      !link.startsWith("http://") &&
      !link.startsWith("https://")
    ) {
      alert(
        "Scanner link must start with http:// or https://"
      );
      return;
    }

    try {
      setSaving(true);

      await onSave({
        ...form,
        name,
        link,
        category:
          form.category || "Swing",
        timeframe:
          form.timeframe || "Daily",
        access:
          form.access || "Subscriber",
        status:
          form.status || "Active",
        featured: Boolean(
          form.featured
        ),
      });

      onClose();
    } catch (error) {
      console.error(
        "Scanner save error:",
        error
      );

      alert(
        error?.message ||
          "Unable to save scanner."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="scanner-modal-overlay">
      <form
        className="scanner-modal-container"
        onSubmit={handleSubmit}
      >
        <div className="scanner-modal-header">
          <div>
            <h2>
              {editingScanner
                ? "✏️ Edit Scanner"
                : "➕ Add Scanner"}
            </h2>

            <p>
              Manage scanner details, access and
              publishing status.
            </p>
          </div>

          <button
            type="button"
            className="scanner-modal-close"
            onClick={onClose}
            disabled={saving}
          >
            ✕
          </button>
        </div>

        <div className="scanner-modal-grid">
          <ScannerField label="Scanner Name">
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Example: VTKS Momentum Scanner"
              autoFocus
            />
          </ScannerField>

          <ScannerField label="Category">
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              <option value="Swing">
                Swing
              </option>
              <option value="Momentum">
                Momentum
              </option>
              <option value="Intraday">
                Intraday
              </option>
              <option value="Investment">
                Investment
              </option>
              <option value="Breakout">
                Breakout
              </option>
              <option value="Other">
                Other
              </option>
            </select>
          </ScannerField>

          <ScannerField label="Timeframe">
            <select
              name="timeframe"
              value={form.timeframe}
              onChange={handleChange}
            >
              <option value="Intraday">
                Intraday
              </option>
              <option value="Daily">
                Daily
              </option>
              <option value="Weekly">
                Weekly
              </option>
              <option value="Monthly">
                Monthly
              </option>
              <option value="Multi-Timeframe">
                Multi-Timeframe
              </option>
            </select>
          </ScannerField>

          <ScannerField label="Access">
            <select
              name="access"
              value={form.access}
              onChange={handleChange}
            >
              <option value="Public">
                Public
              </option>
              <option value="Subscriber">
                Subscriber
              </option>
              <option value="Premium">
                Premium
              </option>
              <option value="Community">
                Community
              </option>
              <option value="Private">
                Private
              </option>
            </select>
          </ScannerField>

          <ScannerField label="Status">
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="Active">
                Active
              </option>
              <option value="Inactive">
                Inactive
              </option>
              <option value="Draft">
                Draft
              </option>
            </select>
          </ScannerField>

          <div className="scanner-modal-field scanner-modal-full">
            <label>Scanner Link</label>

            <input
              type="url"
              name="link"
              value={form.link}
              onChange={handleChange}
              placeholder="https://chartink.com/screener/..."
            />
          </div>

          <label className="scanner-featured-row">
            <input
              type="checkbox"
              name="featured"
              checked={form.featured}
              onChange={handleChange}
            />

            Mark as featured scanner
          </label>
        </div>

        <div className="scanner-modal-actions">
          <button
            type="button"
            className="scanner-cancel-button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="scanner-save-button"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingScanner
                ? "Update Scanner"
                : "Save Scanner"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ScannerField({
  label,
  children,
}) {
  return (
    <div className="scanner-modal-field">
      <label>{label}</label>
      {children}
    </div>
  );
}