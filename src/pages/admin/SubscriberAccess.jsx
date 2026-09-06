import {
  useEffect,
  useState,
} from "react";

import {
  loadSettings,
  saveSettings,
  defaultSettings,
} from "../../services/settingsService";

import "./SubscriberAccess.css";

const accessRows = [
  {
    key: "marketStudies",
    label: "Market Studies",
    description:
      "Access to subscriber market studies and stock analysis.",
  },
  {
    key: "marketOutlook",
    label: "Market Outlook",
    description:
      "Access to subscriber market outlook and monthly levels.",
  },
  {
    key: "scanner",
    label: "Scanner",
    description:
      "Access to subscriber scanner section.",
  },
  {
    key: "library",
    label: "Knowledge Library",
    description:
      "Access to subscriber learning resources.",
  },
  {
    key: "community",
    label: "Community",
    description:
      "Access to subscriber community links.",
  },
  {
    key: "feedback",
    label: "Feedback",
    description:
      "Access to subscriber feedback section.",
  },
];

const plans = [
  {
    key: "monthly",
    label: "Monthly",
  },
  {
    key: "quarterly",
    label: "Quarterly",
  },
  {
    key: "annual",
    label: "Annual",
  },
];

export default function SubscriberAccess() {
  const [
    settings,
    setSettings,
  ] = useState(null);

  const [
    accessSettings,
    setAccessSettings,
  ] = useState(
    defaultSettings.subscriberAccess
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  useEffect(() => {
    let active = true;

    const fetchSettings = async () => {
      try {
        setLoading(true);
        setMessage("");

        const data =
          await loadSettings();

        if (!active) return;

        setSettings(data);

        setAccessSettings(
          data?.subscriberAccess ||
            defaultSettings.subscriberAccess
        );
      } catch (error) {
        console.error(
          "Load subscriber access error:",
          error
        );

        if (active) {
          setMessage(
            "❌ Failed to load subscriber access."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchSettings();

    return () => {
      active = false;
    };
  }, []);

  const handleToggle = (
    planKey,
    featureKey
  ) => {
    setAccessSettings(
      (current) => ({
        ...current,

        [planKey]: {
          ...current[planKey],

          [featureKey]:
            !current?.[planKey]?.[
              featureKey
            ],
        },
      })
    );

    setMessage("");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");

      const updated =
        await saveSettings({
          ...settings,

          subscriberAccess:
            accessSettings,
        });

      setSettings(updated);

      setAccessSettings(
        updated?.subscriberAccess ||
          accessSettings
      );

      setMessage(
        "✅ Subscriber access saved successfully."
      );
    } catch (error) {
      console.error(
        "Save subscriber access error:",
        error
      );

      setMessage(
        `❌ Save failed${
          error?.message
            ? `: ${error.message}`
            : ""
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="subscriber-access-page">
        <div className="subscriber-access-info">
          Loading subscriber access...
        </div>
      </div>
    );
  }

  return (
    <div className="subscriber-access-page">

      <div className="subscriber-access-header">

        <div>
          <span className="subscriber-access-eyebrow">
            Subscriber Management
          </span>

          <h1>
            Subscriber Access
          </h1>

          <p>
            Control which dashboard features
            are available for each
            subscription plan.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "12px 20px",
            border: "none",
            borderRadius: "10px",
            background: saving
              ? "#94a3b8"
              : "#2563eb",
            color: "#fff",
            fontWeight: "700",
            cursor: saving
              ? "not-allowed"
              : "pointer",
          }}
        >
          {saving
            ? "Saving..."
            : "Save Access Settings"}
        </button>

      </div>

      <div className="subscriber-access-info">

        <strong>
          Dynamic Access Control
        </strong>

        <span>
          Enable or disable features for
          each plan and click Save Access Settings.
        </span>

      </div>

      {message && (
        <div
          style={{
            marginBottom: "18px",
            padding: "13px 16px",
            borderRadius: "10px",
            border:
              "1px solid #e2e8f0",
            background: "#fff",
            fontWeight: "600",
          }}
        >
          {message}
        </div>
      )}

      <div className="subscriber-access-table-wrap">

        <table className="subscriber-access-table">

          <thead>
            <tr>

              <th>
                Dashboard Feature
              </th>

              {plans.map(
                (plan) => (
                  <th key={plan.key}>
                    {plan.label}
                  </th>
                )
              )}

            </tr>
          </thead>

          <tbody>

            {accessRows.map(
              (feature) => (
                <tr key={feature.key}>

                  <td>

                    <div className="subscriber-feature-name">
                      {feature.label}
                    </div>

                    <div className="subscriber-feature-description">
                      {
                        feature.description
                      }
                    </div>

                  </td>

                  {plans.map(
                    (plan) => {
                      const enabled =
                        accessSettings?.[
                          plan.key
                        ]?.[
                          feature.key
                        ] === true;

                      return (
                        <td
                          key={`${plan.key}-${feature.key}`}
                        >

                          <label
                            className={`subscriber-access-switch ${
                              enabled
                                ? "enabled"
                                : ""
                            }`}
                          >

                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={() =>
                                handleToggle(
                                  plan.key,
                                  feature.key
                                )
                              }
                            />

                            <span className="subscriber-switch-slider" />

                          </label>

                          <div
                            className={`subscriber-access-status ${
                              enabled
                                ? "allowed"
                                : "locked"
                            }`}
                          >
                            {enabled
                              ? "Allowed"
                              : "Locked"}
                          </div>

                        </td>
                      );
                    }
                  )}

                </tr>
              )
            )}

          </tbody>

        </table>

      </div>

      <div className="subscriber-access-note">

        <strong>
          Saved in Supabase:
        </strong>{" "}
        Make your changes and click
        <strong>
          {" "}Save Access Settings
        </strong>.
        The saved values will remain after refresh.

      </div>

    </div>
  );
}