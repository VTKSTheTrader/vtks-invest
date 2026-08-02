import { useEffect, useMemo, useState } from "react";

import {
  defaultMonthlyLevel,
  uploadMonthlyLevelChart,
} from "../../../services/monthlyLevelsService";

import "./MonthlyLevelModal.css";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const INDEX_INSTRUMENTS = [
  "NIFTY 50",
  "BANK NIFTY",
  "SENSEX",
  "FINNIFTY",
  "MIDCPNIFTY",
];

const COMMODITY_INSTRUMENTS = [
  "GOLD",
  "SILVER",
  "CRUDE OIL",
  "NATURAL GAS",
  "COPPER",
];

const getCurrentMonth = () =>
  new Date().toLocaleString("en-US", {
    month: "long",
  });

const createInitialForm = (editingLevel) => {
  if (editingLevel) {
    return {
      ...defaultMonthlyLevel,
      ...editingLevel,
    };
  }

  return {
    ...defaultMonthlyLevel,
    month: getCurrentMonth(),
  };
};

export default function MonthlyLevelModal({
  editingLevel,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(() =>
    createInitialForm(editingLevel)
  );

  const [beforeChartFile, setBeforeChartFile] =
    useState(null);

  const [afterChartFile, setAfterChartFile] =
    useState(null);

  const [beforePreview, setBeforePreview] =
    useState(
      editingLevel?.beforeChartUrl || ""
    );

  const [afterPreview, setAfterPreview] =
    useState(
      editingLevel?.afterChartUrl || ""
    );

  const [saving, setSaving] = useState(false);
  const [uploadingBefore, setUploadingBefore] =
    useState(false);

  const [uploadingAfter, setUploadingAfter] =
    useState(false);

  const [formError, setFormError] = useState("");

  useEffect(() => {
    setForm(createInitialForm(editingLevel));

    setBeforePreview(
      editingLevel?.beforeChartUrl || ""
    );

    setAfterPreview(
      editingLevel?.afterChartUrl || ""
    );

    setBeforeChartFile(null);
    setAfterChartFile(null);
    setFormError("");
  }, [editingLevel]);

  useEffect(() => {
    if (!beforeChartFile) return undefined;

    const objectUrl =
      URL.createObjectURL(beforeChartFile);

    setBeforePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [beforeChartFile]);

  useEffect(() => {
    if (!afterChartFile) return undefined;

    const objectUrl =
      URL.createObjectURL(afterChartFile);

    setAfterPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [afterChartFile]);

  const instrumentOptions = useMemo(() => {
    return form.category === "commodity"
      ? COMMODITY_INSTRUMENTS
      : INDEX_INSTRUMENTS;
  }, [form.category]);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleCategoryChange = (value) => {
    setForm((previous) => ({
      ...previous,
      category: value,
      instrument: "",
    }));
  };

  const validateForm = () => {
    if (!form.instrument.trim()) {
      return "Please select or enter an instrument.";
    }

    if (!form.month) {
      return "Please select the month.";
    }

    if (form.pivot === "") {
      return "Pivot level is required.";
    }

    const levelFields = [
      "resistance3",
      "resistance2",
      "resistance1",
      "pivot",
      "support1",
      "support2",
      "support3",
    ];

    const hasInvalidNumber = levelFields.some(
      (field) =>
        form[field] !== "" &&
        !Number.isFinite(Number(form[field]))
    );

    if (hasInvalidNumber) {
      return "Please enter valid numeric values for all levels.";
    }

    return "";
  };

  const uploadChart = async (
    file,
    chartType
  ) => {
    if (!file) return "";

    const instrumentFolder = String(
      form.instrument || "general"
    )
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

    const monthFolder = String(
      form.month || "current"
    )
      .trim()
      .toLowerCase();

    const folder = `${instrumentFolder}/${monthFolder}/${chartType}`;

    const uploaded =
      await uploadMonthlyLevelChart(
        file,
        folder
      );

    return uploaded.publicUrl;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      let beforeChartUrl =
        form.beforeChartUrl || "";

      let afterChartUrl =
        form.afterChartUrl || "";

      if (beforeChartFile) {
        setUploadingBefore(true);

        beforeChartUrl = await uploadChart(
          beforeChartFile,
          "before"
        );

        setUploadingBefore(false);
      }

      if (afterChartFile) {
        setUploadingAfter(true);

        afterChartUrl = await uploadChart(
          afterChartFile,
          "after"
        );

        setUploadingAfter(false);
      }

      await onSave({
        ...form,
        instrument: form.instrument.trim(),
        beforeChartUrl,
        afterChartUrl,
      });

      onClose();
    } catch (error) {
      console.error(
        "Monthly level modal save error:",
        error
      );

      setFormError(
        error?.message ||
          "Unable to save monthly levels."
      );
    } finally {
      setSaving(false);
      setUploadingBefore(false);
      setUploadingAfter(false);
    }
  };

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="monthly-level-modal-overlay"
      onMouseDown={handleOverlayClick}
      role="presentation"
    >
      <section
        className="monthly-level-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="monthly-level-modal-title"
      >
        <header className="monthly-level-modal-header">
          <div>
            <span className="monthly-level-modal-badge">
              📊 Monthly Market Intelligence
            </span>

            <h2 id="monthly-level-modal-title">
              {editingLevel
                ? "Edit Monthly Levels"
                : "Publish Monthly Levels"}
            </h2>

            <p>
              Manage monthly market levels, trading plans, charts, access permissions and publication status.
            </p>
          </div>

          <button
            type="button"
            className="monthly-level-modal-close"
            onClick={onClose}
            aria-label="Close modal"
            disabled={saving}
          >
            ✕
          </button>
        </header>

        {formError && (
          <div
            className="monthly-level-form-error"
            role="alert"
          >
            {formError}
          </div>
        )}

        <form
          className="monthly-level-form"
          onSubmit={handleSubmit}
        >
          <section className="monthly-level-form-section">
            <div className="monthly-level-section-heading">
              <h3>Basic Information</h3>

              <p>
                Select the instrument and current
                monthly market view.
              </p>
            </div>

            <div className="monthly-level-form-grid">
              <div className="monthly-level-field">
                <label htmlFor="monthly-category">
                  Category
                </label>

                <select
                  id="monthly-category"
                  value={form.category}
                  onChange={(event) =>
                    handleCategoryChange(
                      event.target.value
                    )
                  }
                  disabled={saving}
                >
                  <option value="index">
                    Index
                  </option>

                  <option value="commodity">
                    Commodity
                  </option>
                </select>
              </div>

              <div className="monthly-level-field">
                <label htmlFor="monthly-instrument">
                  Instrument
                </label>

                <input
                  id="monthly-instrument"
                  type="text"
                  list="monthly-instrument-options"
                  placeholder="Select or enter instrument"
                  value={form.instrument}
                  onChange={(event) =>
                    updateField(
                      "instrument",
                      event.target.value
                    )
                  }
                  disabled={saving}
                />

                <datalist id="monthly-instrument-options">
                  {instrumentOptions.map(
                    (instrument) => (
                      <option
                        key={instrument}
                        value={instrument}
                      />
                    )
                  )}
                </datalist>
              </div>

              <div className="monthly-level-field">
                <label htmlFor="monthly-month">
                  Month
                </label>

                <select
                  id="monthly-month"
                  value={form.month}
                  onChange={(event) =>
                    updateField(
                      "month",
                      event.target.value
                    )
                  }
                  disabled={saving}
                >
                  {MONTHS.map((month) => (
                    <option
                      key={month}
                      value={month}
                    >
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div className="monthly-level-field">
                <label htmlFor="monthly-bias">
                  Market Bias
                </label>

                <select
                  id="monthly-bias"
                  value={form.bias}
                  onChange={(event) =>
                    updateField(
                      "bias",
                      event.target.value
                    )
                  }
                  disabled={saving}
                >
                  <option value="bullish">
                    Bullish
                  </option>

                  <option value="neutral">
                    Neutral
                  </option>

                  <option value="bearish">
                    Bearish
                  </option>
                </select>
              </div>

              <div className="monthly-level-field">
                <label htmlFor="monthly-trend">
                  Trend
                </label>

                <input
                  id="monthly-trend"
                  type="text"
                  placeholder="Example: Bullish above pivot"
                  value={form.trend}
                  onChange={(event) =>
                    updateField(
                      "trend",
                      event.target.value
                    )
                  }
                  disabled={saving}
                />
              </div>

              <div className="monthly-level-field">
                <label htmlFor="monthly-momentum">
                  Momentum
                </label>

                <input
                  id="monthly-momentum"
                  type="text"
                  placeholder="Example: Positive / Strong"
                  value={form.momentum}
                  onChange={(event) =>
                    updateField(
                      "momentum",
                      event.target.value
                    )
                  }
                  disabled={saving}
                />
              </div>
            </div>
          </section>

          <section className="monthly-level-form-section">
            <div className="monthly-level-section-heading">
              <h3>Monthly Levels</h3>

              <p>
                Enter resistance, pivot and support
                reference levels.
              </p>
            </div>

            <div className="monthly-level-levels-grid">
              <LevelInput
                label="Resistance 3"
                value={form.resistance3}
                onChange={(value) =>
                  updateField(
                    "resistance3",
                    value
                  )
                }
                className="resistance"
                disabled={saving}
              />

              <LevelInput
                label="Resistance 2"
                value={form.resistance2}
                onChange={(value) =>
                  updateField(
                    "resistance2",
                    value
                  )
                }
                className="resistance"
                disabled={saving}
              />

              <LevelInput
                label="Resistance 1"
                value={form.resistance1}
                onChange={(value) =>
                  updateField(
                    "resistance1",
                    value
                  )
                }
                className="resistance"
                disabled={saving}
              />

              <LevelInput
                label="Pivot"
                value={form.pivot}
                onChange={(value) =>
                  updateField("pivot", value)
                }
                className="pivot"
                required
                disabled={saving}
              />

              <LevelInput
                label="Support 1"
                value={form.support1}
                onChange={(value) =>
                  updateField(
                    "support1",
                    value
                  )
                }
                className="support"
                disabled={saving}
              />

              <LevelInput
                label="Support 2"
                value={form.support2}
                onChange={(value) =>
                  updateField(
                    "support2",
                    value
                  )
                }
                className="support"
                disabled={saving}
              />

              <LevelInput
                label="Support 3"
                value={form.support3}
                onChange={(value) =>
                  updateField(
                    "support3",
                    value
                  )
                }
                className="support"
                disabled={saving}
              />
            </div>
          </section>

          <section className="monthly-level-form-section">
            <div className="monthly-level-section-heading">
              <h3>Trading Plan</h3>

              <p>
                Add educational observations for
                above and below pivot scenarios.
              </p>
            </div>

            <div className="monthly-level-form-grid">
              <div className="monthly-level-field monthly-level-field-full">
                <label htmlFor="above-pivot-plan">
                  Above Pivot Plan
                </label>

                <textarea
                  id="above-pivot-plan"
                  rows="4"
                  placeholder="Describe the positive scenario above the pivot..."
                  value={form.abovePivotPlan}
                  onChange={(event) =>
                    updateField(
                      "abovePivotPlan",
                      event.target.value
                    )
                  }
                  disabled={saving}
                />
              </div>

              <div className="monthly-level-field monthly-level-field-full">
                <label htmlFor="below-pivot-plan">
                  Below Pivot Plan
                </label>

                <textarea
                  id="below-pivot-plan"
                  rows="4"
                  placeholder="Describe the cautious or negative scenario below the pivot..."
                  value={form.belowPivotPlan}
                  onChange={(event) =>
                    updateField(
                      "belowPivotPlan",
                      event.target.value
                    )
                  }
                  disabled={saving}
                />
              </div>

              <div className="monthly-level-field monthly-level-field-full">
                <label htmlFor="monthly-observation">
                  Key Observation
                </label>

                <textarea
                  id="monthly-observation"
                  rows="4"
                  placeholder="Add any important monthly observation..."
                  value={form.observation}
                  onChange={(event) =>
                    updateField(
                      "observation",
                      event.target.value
                    )
                  }
                  disabled={saving}
                />
              </div>
            </div>
          </section>

          <section className="monthly-level-form-section">
            <div className="monthly-level-section-heading">
              <h3>Charts</h3>

              <p>
                Upload the initial chart and the
                monthly outcome chart later.
              </p>
            </div>

            <div className="monthly-level-chart-grid">
              <ChartUpload
                title="Before Chart"
                description="Initial monthly levels chart."
                preview={beforePreview}
                uploading={uploadingBefore}
                onChange={(file) =>
                  setBeforeChartFile(file)
                }
                onRemove={() => {
                  setBeforeChartFile(null);
                  setBeforePreview("");
                  updateField(
                    "beforeChartUrl",
                    ""
                  );
                }}
                disabled={saving}
              />

              <ChartUpload
                title="After Chart"
                description="Optional outcome or progress chart."
                preview={afterPreview}
                uploading={uploadingAfter}
                onChange={(file) =>
                  setAfterChartFile(file)
                }
                onRemove={() => {
                  setAfterChartFile(null);
                  setAfterPreview("");
                  updateField(
                    "afterChartUrl",
                    ""
                  );
                }}
                disabled={saving}
              />
            </div>
          </section>

          <section className="monthly-level-form-section">
            <div className="monthly-level-section-heading">
              <h3>Access & Publishing</h3>

              <p>
                Control who can see the monthly
                levels and whether they are live.
              </p>
            </div>

            <div className="monthly-level-form-grid">
              <div className="monthly-level-field">
                <label htmlFor="monthly-visibility">
                  Visibility
                </label>

                <select
                  id="monthly-visibility"
                  value={form.visibility}
                  onChange={(event) =>
                    updateField(
                      "visibility",
                      event.target.value
                    )
                  }
                  disabled={saving}
                >
                  <option value="public">
                    Public
                  </option>

                  <option value="subscriber">
                    Subscriber
                  </option>

                  <option value="private">
                    Private
                  </option>
                </select>

                <small>
                  Public: everyone, Subscriber:
                  logged-in members, Private:
                  admin only.
                </small>
              </div>

              <div className="monthly-level-field">
                <label htmlFor="monthly-status">
                  Status
                </label>

                <select
                  id="monthly-status"
                  value={form.status}
                  onChange={(event) =>
                    updateField(
                      "status",
                      event.target.value
                    )
                  }
                  disabled={saving}
                >
                  <option value="draft">
                    Draft
                  </option>

                  <option value="published">
                    Published
                  </option>

                  <option value="archived">
                    Archived
                  </option>
                </select>

                <small>
                  Only published records become
                  available to their selected audience.
                </small>
              </div>
            </div>
          </section>

          <footer className="monthly-level-modal-footer">
            <button
              type="button"
              className="monthly-level-cancel-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="monthly-level-save-button"
              disabled={saving}
            >
              {saving
                ? uploadingBefore ||
                  uploadingAfter
                  ? "Uploading Chart..."
                  : "Saving..."
                : editingLevel
                  ? "Update Monthly Levels"
                  : "Save Monthly Levels"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function LevelInput({
  label,
  value,
  onChange,
  className,
  required = false,
  disabled = false,
}) {
  return (
    <div
      className={`monthly-level-field monthly-level-number-field monthly-level-${className}`}
    >
      <label>
        {label}
        {required && (
          <span aria-hidden="true"> *</span>
        )}
      </label>

      <input
        type="number"
        step="any"
        placeholder="Enter level"
        value={value}
        required={required}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />
    </div>
  );
}

function ChartUpload({
  title,
  description,
  preview,
  uploading,
  onChange,
  onRemove,
  disabled,
}) {
  return (
    <div className="monthly-level-chart-upload">
      <div className="monthly-level-chart-heading">
        <div>
          <strong>{title}</strong>
          <p>{description}</p>
        </div>

        {preview && (
          <button
            type="button"
            className="monthly-level-remove-chart"
            onClick={onRemove}
            disabled={disabled}
          >
            Remove
          </button>
        )}
      </div>

      {preview ? (
        <div className="monthly-level-chart-preview">
          <img
            src={preview}
            alt={`${title} preview`}
          />

          <label className="monthly-level-replace-chart">
            {uploading
              ? "Uploading..."
              : "Replace Chart"}

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={disabled}
              onChange={(event) =>
                onChange(
                  event.target.files?.[0] ||
                    null
                )
              }
            />
          </label>
        </div>
      ) : (
        <label className="monthly-level-upload-box">
          <span>🖼️</span>

          <strong>
            {uploading
              ? "Uploading chart..."
              : `Upload ${title}`}
          </strong>

          <small>
            PNG, JPG or WEBP — maximum 10 MB
          </small>

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={disabled}
            onChange={(event) =>
              onChange(
                event.target.files?.[0] ||
                  null
              )
            }
          />
        </label>
      )}
    </div>
  );
}