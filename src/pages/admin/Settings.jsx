import { useEffect, useState } from "react";

import PageHeader from "../../components/admin/PageHeader";
import ChangePassword from "../../components/auth/ChangePassword";

import {
  defaultSettings,
  loadSettings,
  saveSettings,
} from "../../services/settingsService";

import "./Settings.css";

export default function Settings() {
  const [settings, setSettings] =
    useState(defaultSettings);

  const [loading, setLoading] =
    useState(true);

  const [savingSection, setSavingSection] =
    useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const data = await loadSettings();

      setSettings(data || defaultSettings);
    } catch (error) {
      console.error(
        "Failed to load settings:",
        error
      );

      alert("Failed to load settings.");

      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const update = (
    section,
    key,
    value
  ) => {
    setSettings((previous) => ({
      ...previous,

      [section]: {
        ...previous[section],
        [key]: value,
      },
    }));
  };

  const prepareSettingsForSave = () => ({
    ...settings,

    plans: {
      ...settings.plans,

      monthlyPrice: Number(
        settings.plans.monthlyPrice || 0
      ),

      monthlyDays: Number(
        settings.plans.monthlyDays || 30
      ),

      monthlyEnabled: Boolean(
        settings.plans.monthlyEnabled
      ),

      quarterlyPrice: Number(
        settings.plans.quarterlyPrice || 0
      ),

      quarterlyDays: Number(
        settings.plans.quarterlyDays || 90
      ),

      quarterlyEnabled: Boolean(
        settings.plans.quarterlyEnabled
      ),

      annualPrice: Number(
        settings.plans.annualPrice || 0
      ),

      annualDays: Number(
        settings.plans.annualDays || 365
      ),

      annualEnabled: Boolean(
        settings.plans.annualEnabled
      ),
    },

    website: {
      ...settings.website,

      showIndicators: Boolean(
        settings.website.showIndicators
      ),

      showFunds: Boolean(
        settings.website.showFunds
      ),

      showAccuracy: Boolean(
        settings.website.showAccuracy
      ),

      showScanner: Boolean(
        settings.website.showScanner
      ),

      showETF: Boolean(
        settings.website.showETF
      ),

      showMonthlyLevels: Boolean(
        settings.website.showMonthlyLevels
      ),

      showTestimonial: Boolean(
        settings.website.showTestimonial
      ),

      showAskVTKS: Boolean(
        settings.website.showAskVTKS
      ),

      acceptAskQueries: Boolean(
        settings.website.acceptAskQueries
      ),

      showAnsweredQueries: Boolean(
        settings.website.showAnsweredQueries
      ),

      maintenanceMode: Boolean(
        settings.website.maintenanceMode
      ),
    },

    announcement: {
      ...settings.announcement,

      enabled: Boolean(
        settings.announcement.enabled
      ),
    },
  });

  const handleSave = async (
    sectionName
  ) => {
    try {
      setSavingSection(sectionName);

      const preparedSettings =
        prepareSettingsForSave();

      const savedSettings =
        await saveSettings(
          preparedSettings
        );

      setSettings(
        savedSettings ||
          preparedSettings
      );

      alert(
        "✅ Settings saved successfully"
      );
    } catch (error) {
      console.error(
        "Failed to save settings:",
        error
      );

      alert(
        error?.message ||
          "Failed to save settings."
      );
    } finally {
      setSavingSection("");
    }
  };

  const isSaving = (
    sectionName
  ) =>
    savingSection === sectionName;

  if (loading) {
    return (
      <div className="settings-loading">
        Loading settings...
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="VTKS Settings"
        subtitle="Configure platform, subscription fees, payments, branding and security."
      />

      <div className="settings-grid">
        {/* PLATFORM */}
        <div className="settings-card">
          <h2>🏢 Platform</h2>

          <input
            placeholder="Website Name"
            value={
              settings.platform
                .websiteName || ""
            }
            onChange={(event) =>
              update(
                "platform",
                "websiteName",
                event.target.value
              )
            }
          />

          <input
            type="email"
            placeholder="Support Email"
            value={
              settings.platform
                .supportEmail || ""
            }
            onChange={(event) =>
              update(
                "platform",
                "supportEmail",
                event.target.value
              )
            }
          />

          <input
            placeholder="Support Mobile"
            value={
              settings.platform
                .supportMobile || ""
            }
            onChange={(event) =>
              update(
                "platform",
                "supportMobile",
                event.target.value
              )
            }
          />

          <input
            placeholder="Telegram Link"
            value={
              settings.platform
                .telegramLink || ""
            }
            onChange={(event) =>
              update(
                "platform",
                "telegramLink",
                event.target.value
              )
            }
          />

          <input
            placeholder="X / Twitter Link"
            value={
              settings.platform
                .twitterLink || ""
            }
            onChange={(event) =>
              update(
                "platform",
                "twitterLink",
                event.target.value
              )
            }
          />

          <input
            placeholder="Instagram Link"
            value={
              settings.platform
                .instagramLink || ""
            }
            onChange={(event) =>
              update(
                "platform",
                "instagramLink",
                event.target.value
              )
            }
          />

          <input
            placeholder="YouTube Link"
            value={
              settings.platform
                .youtubeLink || ""
            }
            onChange={(event) =>
              update(
                "platform",
                "youtubeLink",
                event.target.value
              )
            }
          />

          <button
            type="button"
            onClick={() =>
              handleSave("platform")
            }
            disabled={Boolean(
              savingSection
            )}
          >
            {isSaving("platform")
              ? "Saving..."
              : "💾 Save Platform"}
          </button>
        </div>

        {/* SUBSCRIPTION PLANS */}
        <div className="settings-card">
          <h2>
            💳 Subscription Plans
          </h2>

          <PlanRow
            label="Monthly"
            enabled={
              settings.plans
                .monthlyEnabled
            }
            price={
              settings.plans
                .monthlyPrice
            }
            days={
              settings.plans
                .monthlyDays
            }
            onEnabledChange={(
              checked
            ) =>
              update(
                "plans",
                "monthlyEnabled",
                checked
              )
            }
            onPriceChange={(value) =>
              update(
                "plans",
                "monthlyPrice",
                value
              )
            }
            onDaysChange={(value) =>
              update(
                "plans",
                "monthlyDays",
                value
              )
            }
          />

          <PlanRow
            label="Quarterly"
            enabled={
              settings.plans
                .quarterlyEnabled
            }
            price={
              settings.plans
                .quarterlyPrice
            }
            days={
              settings.plans
                .quarterlyDays
            }
            onEnabledChange={(
              checked
            ) =>
              update(
                "plans",
                "quarterlyEnabled",
                checked
              )
            }
            onPriceChange={(value) =>
              update(
                "plans",
                "quarterlyPrice",
                value
              )
            }
            onDaysChange={(value) =>
              update(
                "plans",
                "quarterlyDays",
                value
              )
            }
          />

          <PlanRow
            label="Annual"
            enabled={
              settings.plans
                .annualEnabled
            }
            price={
              settings.plans
                .annualPrice
            }
            days={
              settings.plans
                .annualDays
            }
            onEnabledChange={(
              checked
            ) =>
              update(
                "plans",
                "annualEnabled",
                checked
              )
            }
            onPriceChange={(value) =>
              update(
                "plans",
                "annualPrice",
                value
              )
            }
            onDaysChange={(value) =>
              update(
                "plans",
                "annualDays",
                value
              )
            }
          />

          <p
            style={{
              color: "#64748b",
              fontSize: "14px",
              marginTop: "14px",
            }}
          >
            Disabled plans will be
            hidden from the public
            pricing page and member plan
            selection.
          </p>

          <button
            type="button"
            onClick={() =>
              handleSave(
                "subscription"
              )
            }
            disabled={Boolean(
              savingSection
            )}
          >
            {isSaving(
              "subscription"
            )
              ? "Saving..."
              : "💾 Save Subscription Plans"}
          </button>
        </div>

        {/* PAYMENT */}
        <div className="settings-card">
          <h2>💰 Payment</h2>

          <input
            placeholder="UPI ID"
            value={
              settings.payment.upiId ||
              ""
            }
            onChange={(event) =>
              update(
                "payment",
                "upiId",
                event.target.value
              )
            }
          />

          <input
            placeholder="Bank Name"
            value={
              settings.payment
                .bankName || ""
            }
            onChange={(event) =>
              update(
                "payment",
                "bankName",
                event.target.value
              )
            }
          />

          <input
            placeholder="Account Number"
            value={
              settings.payment
                .accountNumber || ""
            }
            onChange={(event) =>
              update(
                "payment",
                "accountNumber",
                event.target.value
              )
            }
          />

          <input
            placeholder="IFSC Code"
            value={
              settings.payment
                .ifscCode || ""
            }
            onChange={(event) =>
              update(
                "payment",
                "ifscCode",
                event.target.value
              )
            }
          />

          <label>
            Payment QR Image URL
          </label>

          <input
            type="url"
            placeholder="https://...payment-qr.png"
            value={
              settings.payment.qrUrl ||
              ""
            }
            onChange={(event) =>
              update(
                "payment",
                "qrUrl",
                event.target.value
              )
            }
          />

          {settings.payment.qrUrl && (
            <img
              src={
                settings.payment.qrUrl
              }
              alt="Payment QR preview"
              style={{
                width: "180px",
                height: "180px",
                objectFit: "contain",
                margin: "12px auto",
                padding: "8px",
                border:
                  "1px solid #e2e8f0",
                borderRadius: "14px",
                background: "#ffffff",
              }}
            />
          )}

          <button
            type="button"
            onClick={() =>
              handleSave("payment")
            }
            disabled={Boolean(
              savingSection
            )}
          >
            {isSaving("payment")
              ? "Saving..."
              : "💾 Save Payment Details"}
          </button>
        </div>

        {/* WEBSITE CONTROLS */}
        <div className="settings-card">
          <h2>
            🌐 Website Controls
          </h2>

          <CheckboxRow
            label="Show Indicators Page"
            checked={Boolean(
              settings.website
                .showIndicators
            )}
            onChange={(checked) =>
              update(
                "website",
                "showIndicators",
                checked
              )
            }
          />

          <CheckboxRow
            label="Show Funds Page"
            checked={Boolean(
              settings.website.showFunds
            )}
            onChange={(checked) =>
              update(
                "website",
                "showFunds",
                checked
              )
            }
          />

          <CheckboxRow
            label="Show Accuracy Page"
            checked={Boolean(
              settings.website
                .showAccuracy
            )}
            onChange={(checked) =>
              update(
                "website",
                "showAccuracy",
                checked
              )
            }
          />

          <CheckboxRow
            label="Show Scanner Page"
            checked={Boolean(
              settings.website
                .showScanner
            )}
            onChange={(checked) =>
              update(
                "website",
                "showScanner",
                checked
              )
            }
          />

          <CheckboxRow
            label="Show ETF Portfolio Page"
            checked={Boolean(
              settings.website
                .showETF
            )}
            onChange={(checked) =>
              update(
                "website",
                "showETF",
                checked
              )
            }
          />

          <CheckboxRow
            label="Show Market Outlook"
            checked={Boolean(
              settings.website
                .showMonthlyLevels
            )}
            onChange={(checked) =>
              update(
                "website",
                "showMonthlyLevels",
                checked
              )
            }
          />

          <CheckboxRow
            label="Show Testimonials Page"
            checked={Boolean(
              settings.website
                .showTestimonial
            )}
            onChange={(checked) =>
              update(
                "website",
                "showTestimonial",
                checked
              )
            }
          />

          

          <CheckboxRow
            label="Show Ask VTKS Feature"
            checked={Boolean(
              settings.website
                .showAskVTKS
            )}
            onChange={(checked) =>
              update(
                "website",
                "showAskVTKS",
                checked
              )
            }
          />

          <CheckboxRow
            label="Accept New Stock Queries"
            checked={Boolean(
              settings.website
                .acceptAskQueries
            )}
            onChange={(checked) =>
              update(
                "website",
                "acceptAskQueries",
                checked
              )
            }
          />

          <CheckboxRow
            label="Show Answered Queries Page"
            checked={Boolean(
              settings.website
                .showAnsweredQueries
            )}
            onChange={(checked) =>
              update(
                "website",
                "showAnsweredQueries",
                checked
              )
            }
          />

          

          <CheckboxRow
            label="Maintenance Mode"
            checked={Boolean(
              settings.website
                .maintenanceMode
            )}
            onChange={(checked) =>
              update(
                "website",
                "maintenanceMode",
                checked
              )
            }
          />

          <button
            type="button"
            onClick={() =>
              handleSave("website")
            }
            disabled={Boolean(
              savingSection
            )}
          >
            {isSaving("website")
              ? "Saving..."
              : "💾 Save Website Controls"}
          </button>
        </div>

        {/* ANNOUNCEMENT */}
        <div className="settings-card">
          <h2>📢 Announcement</h2>

          <textarea
            rows={5}
            placeholder="Enter announcement text"
            value={
              settings.announcement
                .text || ""
            }
            onChange={(event) =>
              update(
                "announcement",
                "text",
                event.target.value
              )
            }
          />

          <CheckboxRow
            label="Show Announcement"
            checked={Boolean(
              settings.announcement
                .enabled
            )}
            onChange={(checked) =>
              update(
                "announcement",
                "enabled",
                checked
              )
            }
          />

          <button
            type="button"
            onClick={() =>
              handleSave(
                "announcement"
              )
            }
            disabled={Boolean(
              savingSection
            )}
          >
            {isSaving(
              "announcement"
            )
              ? "Saving..."
              : "💾 Save Announcement"}
          </button>
        </div>

        {/* ADMIN SECURITY */}
        <div className="settings-card">
          <h2>🔐 Admin Security</h2>

          <input
            type="email"
            placeholder="Admin Email"
            value={
              settings.admin.email || ""
            }
            onChange={(event) =>
              update(
                "admin",
                "email",
                event.target.value
              )
            }
          />

          <button
            type="button"
            onClick={() =>
              handleSave("admin")
            }
            disabled={Boolean(
              savingSection
            )}
          >
            {isSaving("admin")
              ? "Saving..."
              : "💾 Save Admin Email"}
          </button>

          <p
            style={{
              color: "#64748b",
              marginTop: "20px",
            }}
          >
            Change your login password
            below.
          </p>

          <ChangePassword />
        </div>
      </div>
    </>
  );
}

function PlanRow({
  label,
  enabled,
  price,
  days,
  onEnabledChange,
  onPriceChange,
  onDaysChange,
}) {
  return (
    <div className="plan-row">
      <label
        className="plan-enable-control"
        title={`Enable or disable ${label} plan`}
      >
        <input
          type="checkbox"
          checked={Boolean(enabled)}
          onChange={(event) =>
            onEnabledChange(
              event.target.checked
            )
          }
        />

        <strong>{label}</strong>
      </label>

      <input
        type="number"
        min="0"
        step="1"
        aria-label={`${label} price`}
        value={price ?? ""}
        onChange={(event) =>
          onPriceChange(
            event.target.value
          )
        }
        disabled={!enabled}
        placeholder="Price"
      />

      <input
        type="number"
        min="1"
        step="1"
        aria-label={`${label} duration in days`}
        value={days ?? ""}
        onChange={(event) =>
          onDaysChange(
            event.target.value
          )
        }
        disabled={!enabled}
        placeholder="Days"
      />
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}) {
  return (
    <label className="check-row">
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
      />

      <span>{label}</span>
    </label>
  );
}