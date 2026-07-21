import { useEffect, useState } from "react";
import {
  defaultSettings,
  loadSettings,
} from "../../../services/settingsService";
import "./MemberModal.css";

const getToday = () => new Date().toISOString().split("T")[0];

const getPlanConfig = (plan, settings) => {
  const plans = settings?.plans || defaultSettings.plans;

  const planMap = {
    Monthly: {
      price: Number(
        plans.monthlyPrice ?? defaultSettings.plans.monthlyPrice
      ),
      days: Number(
        plans.monthlyDays ?? defaultSettings.plans.monthlyDays
      ),
      enabled:
        plans.monthlyEnabled ??
        defaultSettings.plans.monthlyEnabled,
    },

    Quarterly: {
      price: Number(
        plans.quarterlyPrice ?? defaultSettings.plans.quarterlyPrice
      ),
      days: Number(
        plans.quarterlyDays ?? defaultSettings.plans.quarterlyDays
      ),
      enabled:
        plans.quarterlyEnabled ??
        defaultSettings.plans.quarterlyEnabled,
    },

    Annual: {
      price: Number(
        plans.annualPrice ?? defaultSettings.plans.annualPrice
      ),
      days: Number(
        plans.annualDays ?? defaultSettings.plans.annualDays
      ),
      enabled:
        plans.annualEnabled ??
        defaultSettings.plans.annualEnabled,
    },
  };

  return planMap[plan] || planMap.Quarterly;
};

const getEnabledPlans = (settings) => {
  const plans = ["Monthly", "Quarterly", "Annual"];

  const enabledPlans = plans.filter(
    (plan) => getPlanConfig(plan, settings).enabled
  );

  return enabledPlans.length > 0 ? enabledPlans : plans;
};

const getDefaultPlan = (settings) => {
  const enabledPlans = getEnabledPlans(settings);

  const featuredPlan =
    settings?.plans?.featuredPlan || "Quarterly";

  if (enabledPlans.includes(featuredPlan)) {
    return featuredPlan;
  }

  if (enabledPlans.includes("Quarterly")) {
    return "Quarterly";
  }

  return enabledPlans[0];
};

const calculateExpiry = (startDate, plan, settings) => {
  if (!startDate) return "";

  const config = getPlanConfig(plan, settings);
  const date = new Date(`${startDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setDate(date.getDate() + config.days);

  return date.toISOString().split("T")[0];
};

const formatDate = (value) => {
  if (!value) return "";

  return String(value).split("T")[0];
};

const createDefaultForm = (settings) => {
  const today = getToday();
  const defaultPlan = getDefaultPlan(settings);
  const planConfig = getPlanConfig(defaultPlan, settings);

  return {
    name: "",
    email: "",
    mobile: "",
    tvId: "",
    plan: defaultPlan,
    startDate: today,
    expiryDate: calculateExpiry(
      today,
      defaultPlan,
      settings
    ),
    amount: planConfig.price,
    paymentMode: "UPI",
    telegram: "",
    settlementStatus: "Pending",
  };
};

const createForm = (editingMember, settings) => {
  const defaultForm = createDefaultForm(settings);

  if (!editingMember) {
    return defaultForm;
  }

  const selectedPlan =
    editingMember.plan || defaultForm.plan;

  const savedAmount =
    editingMember.amount !== undefined &&
    editingMember.amount !== null &&
    editingMember.amount !== ""
      ? Number(editingMember.amount)
      : getPlanConfig(selectedPlan, settings).price;

  return {
    ...defaultForm,
    ...editingMember,

    name: String(editingMember.name || ""),
    email: String(editingMember.email || ""),
    mobile: String(editingMember.mobile || ""),

    tvId: String(
      editingMember.tvId ||
        editingMember.tv_id ||
        ""
    ),

    telegram: String(editingMember.telegram || ""),

    plan: selectedPlan,

    startDate: formatDate(
      editingMember.startDate ||
        editingMember.start_date ||
        defaultForm.startDate
    ),

    expiryDate: formatDate(
      editingMember.expiryDate ||
        editingMember.expiry_date ||
        defaultForm.expiryDate
    ),

    amount: Number.isFinite(savedAmount)
      ? savedAmount
      : 0,

    paymentMode:
      editingMember.paymentMode ||
      editingMember.payment_mode ||
      "UPI",

    settlementStatus:
      editingMember.settlementStatus ||
      editingMember.settlement_status ||
      "Pending",
  };
};

export default function MemberModal({
  onClose,
  onSave,
  editingMember,
}) {
  const [appSettings, setAppSettings] = useState(null);
  const [form, setForm] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchLatestSettings = async () => {
      try {
        setSettingsLoading(true);
        setSettingsError("");

        const latestSettings = await loadSettings();

        if (!isMounted) return;

        const resolvedSettings =
          latestSettings || defaultSettings;

        setAppSettings(resolvedSettings);

        setForm(
          createForm(
            editingMember,
            resolvedSettings
          )
        );
      } catch (error) {
        console.error("Settings load error:", error);

        if (!isMounted) return;

        setSettingsError(
          "Unable to load latest pricing. Default pricing has been loaded."
        );

        setAppSettings(defaultSettings);

        setForm(
          createForm(
            editingMember,
            defaultSettings
          )
        );
      } finally {
        if (isMounted) {
          setSettingsLoading(false);
        }
      }
    };

    fetchLatestSettings();

    return () => {
      isMounted = false;
    };
  }, [editingMember]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => {
      if (!previous) return previous;

      const updated = {
        ...previous,
        [name]: value,
      };

      if (name === "plan") {
        const config = getPlanConfig(
          value,
          appSettings
        );

        updated.amount = config.price;

        updated.expiryDate = calculateExpiry(
          previous.startDate,
          value,
          appSettings
        );
      }

      if (name === "startDate") {
        updated.expiryDate = calculateExpiry(
          value,
          previous.plan,
          appSettings
        );
      }

      return updated;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving || settingsLoading || !form) {
      return;
    }

    const name = String(form.name || "").trim();

    const email = String(form.email || "")
      .trim()
      .toLowerCase();

    const mobile = String(form.mobile || "").trim();

    const amount = Number(form.amount);

    if (!name || !email || !mobile) {
      alert(
        "Please fill Name, Email and Mobile Number."
      );
      return;
    }

    if (!email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    if (!form.startDate || !form.expiryDate) {
      alert("Please select subscription dates.");
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    try {
      setSaving(true);

      await onSave({
        ...form,

        name,
        email,
        mobile,

        tvId: String(form.tvId || "").trim(),

        telegram: String(
          form.telegram || ""
        ).trim(),

        amount,

        startDate: formatDate(form.startDate),

        expiryDate: formatDate(
          form.expiryDate
        ),

        paymentMode:
          form.paymentMode || "UPI",

        settlementStatus:
          form.settlementStatus ||
          "Pending",
      });

      onClose();
    } catch (error) {
      console.error("Member save error:", error);

      alert(
        error?.message ||
          "Unable to save member. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (settingsLoading || !form || !appSettings) {
    return (
      <div className="member-modal-overlay">
        <div className="member-modal-container">
          <div className="member-modal-header">
            <div>
              <h2>
                {editingMember
                  ? "✏️ Edit Member"
                  : "➕ Add New Member"}
              </h2>

              <p>
                Loading latest subscription pricing...
              </p>
            </div>

            <button
              type="button"
              className="member-close-button"
              onClick={onClose}
              aria-label="Close member modal"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  const availablePlans =
    getEnabledPlans(appSettings);

  return (
    <div className="member-modal-overlay">
      <form
        className="member-modal-container"
        onSubmit={handleSubmit}
      >
        <div className="member-modal-header">
          <div>
            <h2>
              {editingMember
                ? "✏️ Edit Member"
                : "➕ Add New Member"}
            </h2>

            <p>
              Manage subscriber profile, subscription
              dates and payment details.
            </p>
          </div>

          <button
            type="button"
            className="member-close-button"
            onClick={onClose}
            aria-label="Close member modal"
            disabled={saving}
          >
            ✕
          </button>
        </div>

        {settingsError && (
          <p className="member-settings-error">
            {settingsError}
          </p>
        )}

        <div className="member-form-grid">
          <MemberField label="Full Name">
            <input
              type="text"
              name="name"
              value={form.name || ""}
              onChange={handleChange}
              placeholder="Example: Varun Tyagi"
              autoFocus
              disabled={saving}
            />
          </MemberField>

          <MemberField label="Email Address">
            <input
              type="email"
              name="email"
              value={form.email || ""}
              onChange={handleChange}
              placeholder="member@example.com"
              disabled={saving}
            />
          </MemberField>

          <MemberField label="Mobile Number">
            <input
              type="tel"
              name="mobile"
              value={form.mobile || ""}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              disabled={saving}
            />
          </MemberField>

          <MemberField label="TradingView ID">
            <input
              type="text"
              name="tvId"
              value={form.tvId || ""}
              onChange={handleChange}
              placeholder="TradingView username"
              disabled={saving}
            />
          </MemberField>

          <MemberField label="Subscription Plan">
            <select
              name="plan"
              value={form.plan}
              onChange={handleChange}
              disabled={saving}
            >
              {availablePlans.map((plan) => {
                const config = getPlanConfig(
                  plan,
                  appSettings
                );

                return (
                  <option
                    key={plan}
                    value={plan}
                  >
                    {plan}
                  </option>
                );
              })}
            </select>
          </MemberField>

          <MemberField label="Payment Amount">
            <input
              type="number"
              min="0"
              name="amount"
              value={form.amount ?? ""}
              onChange={handleChange}
              placeholder="Amount"
              disabled={saving}
            />
          </MemberField>

          <MemberField label="Subscription Start">
            <input
              type="date"
              name="startDate"
              value={
                form.startDate || getToday()
              }
              onChange={handleChange}
              disabled={saving}
            />
          </MemberField>

          <MemberField label="Subscription Expiry">
            <input
              type="date"
              name="expiryDate"
              value={form.expiryDate || ""}
              onChange={handleChange}
              disabled={saving}
            />
          </MemberField>

          <MemberField label="Payment Mode">
            <select
              name="paymentMode"
              value={
                form.paymentMode || "UPI"
              }
              onChange={handleChange}
              disabled={saving}
            >
              <option value="UPI">UPI</option>

              <option value="Bank Transfer">
                Bank Transfer
              </option>

              <option value="Cash">Cash</option>

              <option value="Other">Other</option>
            </select>
          </MemberField>

          <MemberField label="Settlement Status">
            <select
              name="settlementStatus"
              value={
                form.settlementStatus ||
                "Pending"
              }
              onChange={handleChange}
              disabled={saving}
            >
              <option value="Pending">
                Pending
              </option>

              <option value="Settled">
                Settled
              </option>
            </select>
          </MemberField>

          <div className="member-field member-field-full">
            <label>Telegram Username</label>

            <input
              type="text"
              name="telegram"
              value={form.telegram || ""}
              onChange={handleChange}
              placeholder="@username"
              disabled={saving}
            />
          </div>
        </div>

        <div className="member-modal-actions">
          <button
            type="button"
            className="member-cancel-button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="member-save-button"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingMember
                ? "Update Member"
                : "Save Member"}
          </button>
        </div>
      </form>
    </div>
  );
}

function MemberField({ label, children }) {
  return (
    <div className="member-field">
      <label>{label}</label>
      {children}
    </div>
  );
}