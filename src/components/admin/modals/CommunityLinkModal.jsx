import { useEffect, useState } from "react";
import "./CommunityLinkModal.css";

const INITIAL_FORM = {
  title: "",
  description: "",
  platform: "telegram",
  url: "",
  access: "subscriber",
  status: "active",
  sortOrder: 1,
  featured: false,
};

const normalizeValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const isValidUrl = (value) => {
  try {
    const parsedUrl = new URL(value);

    return (
      parsedUrl.protocol === "http:" ||
      parsedUrl.protocol === "https:"
    );
  } catch {
    return false;
  }
};

export default function CommunityLinkModal({
  onClose,
  onSave,
  editingLink = null,
}) {
  const [form, setForm] = useState(
    INITIAL_FORM
  );

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const isEditing = Boolean(
    editingLink?.id
  );

  useEffect(() => {
    if (!editingLink) {
      setForm(INITIAL_FORM);
      return;
    }

    setForm({
      title: editingLink.title || "",
      description:
        editingLink.description || "",
      platform: normalizeValue(
        editingLink.platform || "telegram"
      ),
      url: editingLink.url || "",
      access: normalizeValue(
        editingLink.access || "subscriber"
      ),
      status: normalizeValue(
        editingLink.status || "active"
      ),
      sortOrder: Number(
        editingLink.sortOrder || 1
      ),
      featured: Boolean(
        editingLink.featured
      ),
    });
  }, [editingLink]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (
        event.key === "Escape" &&
        !saving
      ) {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [onClose, saving]);

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

    if (formError) {
      setFormError("");
    }
  };

  const validateForm = () => {
    const title = form.title.trim();
    const url = form.url.trim();

    if (!title) {
      return "Channel name is required.";
    }

    if (!url) {
      return "Channel link is required.";
    }

    if (!isValidUrl(url)) {
      return "Enter a valid link starting with http:// or https://.";
    }

    if (
      form.platform === "telegram" &&
      !(
        url.includes("t.me/") ||
        url.includes("telegram.me/")
      )
    ) {
      return "Enter a valid Telegram channel or invite link.";
    }

    const sortOrder = Number(
      form.sortOrder
    );

    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 1
    ) {
      return "Display order must be a whole number greater than 0.";
    }

    return "";
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const validationMessage =
      validateForm();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      await onSave({
        title: form.title.trim(),

        description:
          form.description.trim(),

        platform: normalizeValue(
          form.platform
        ),

        url: form.url.trim(),

        access: normalizeValue(
          form.access
        ),

        status: normalizeValue(
          form.status
        ),

        sortOrder: Number(
          form.sortOrder
        ),

        featured: Boolean(
          form.featured
        ),
      });

      onClose();
    } catch (error) {
      console.error(
        "Community link modal save error:",
        error
      );

      setFormError(
        error?.message ||
          "Unable to save the community link."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (
    event
  ) => {
    if (
      event.target ===
        event.currentTarget &&
      !saving
    ) {
      onClose();
    }
  };

  return (
    <div
      className="community-modal-backdrop"
      onMouseDown={
        handleBackdropClick
      }
      role="presentation"
    >
      <div
        className="community-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-modal-title"
      >
        <div className="community-modal-header">
          <div>
            <span className="community-modal-eyebrow">
              Community Access
            </span>

            <h2 id="community-modal-title">
              {isEditing
                ? "Edit Community Link"
                : "Add Community Link"}
            </h2>

            <p>
              Manage subscriber-only
              Telegram channels and other
              community links.
            </p>
          </div>

          <button
            type="button"
            className="community-modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form
          className="community-modal-form"
          onSubmit={handleSubmit}
        >
          {formError && (
            <div
              className="community-modal-error"
              role="alert"
            >
              {formError}
            </div>
          )}

          <div className="community-form-grid">
            <div className="community-form-field community-form-field-full">
              <label htmlFor="community-title">
                Channel name
                <span>*</span>
              </label>

              <input
                id="community-title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="Example: VTKS Premium Community"
                maxLength={100}
                disabled={saving}
                autoFocus
              />
            </div>

            <div className="community-form-field">
              <label htmlFor="community-platform">
                Platform
              </label>

              <select
                id="community-platform"
                name="platform"
                value={form.platform}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="telegram">
                  Telegram
                </option>

                <option value="whatsapp">
                  WhatsApp
                </option>

                <option value="discord">
                  Discord
                </option>

                <option value="youtube">
                  YouTube
                </option>

                <option value="zoom">
                  Zoom
                </option>

                <option value="google-meet">
                  Google Meet
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </div>

            <div className="community-form-field">
              <label htmlFor="community-sort-order">
                Display order
              </label>

              <input
                id="community-sort-order"
                name="sortOrder"
                type="number"
                min="1"
                step="1"
                value={form.sortOrder}
                onChange={handleChange}
                disabled={saving}
              />

              <small>
                Lower numbers appear first.
              </small>
            </div>

            <div className="community-form-field community-form-field-full">
              <label htmlFor="community-url">
                Channel or invite link
                <span>*</span>
              </label>

              <input
                id="community-url"
                name="url"
                type="url"
                value={form.url}
                onChange={handleChange}
                placeholder="https://t.me/+your-private-invite-link"
                disabled={saving}
              />

              <small>
                You can replace this link
                anytime from the Admin
                module.
              </small>
            </div>

            <div className="community-form-field">
              <label htmlFor="community-access">
                Access level
              </label>

              <select
                id="community-access"
                name="access"
                value={form.access}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="subscriber">
                  Subscriber
                </option>

                <option value="community">
                  Community
                </option>

                <option value="public">
                  Public
                </option>

                <option value="private">
                  Private
                </option>
              </select>
            </div>

            <div className="community-form-field">
              <label htmlFor="community-status">
                Status
              </label>

              <select
                id="community-status"
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>
              </select>
            </div>

            <div className="community-form-field community-form-field-full">
              <label htmlFor="community-description">
                Description
              </label>

              <textarea
                id="community-description"
                name="description"
                rows="4"
                value={form.description}
                onChange={handleChange}
                placeholder="Briefly explain what subscribers will find in this channel."
                maxLength={300}
                disabled={saving}
              />

              <small>
                {form.description.length}
                /300 characters
              </small>
            </div>

            <div className="community-featured-box community-form-field-full">
              <label className="community-checkbox-label">
                <input
                  type="checkbox"
                  name="featured"
                  checked={form.featured}
                  onChange={handleChange}
                  disabled={saving}
                />

                <span className="community-checkbox-control" />

                <span>
                  <strong>
                    Featured channel
                  </strong>

                  <small>
                    Highlight this channel
                    for subscribers.
                  </small>
                </span>
              </label>
            </div>
          </div>

          <div className="community-modal-note">
            <span>🔐</span>

            <p>
              Subscriber and Community
              links will only be shown
              inside protected subscriber
              pages.
            </p>
          </div>

          <div className="community-modal-actions">
            <button
              type="button"
              className="community-modal-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="community-modal-save"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : isEditing
                ? "Update Link"
                : "Add Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}