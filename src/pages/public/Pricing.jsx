import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadSettings } from "../../services/settingsService";
import "./Pricing.css";
import SEO from "../../components/common/SEO";

<SEO
  title="VTKS Pricing | Membership Plans"
  description="Choose the VTKS membership plan that fits your trading journey."
  canonical="https://vtks-hub.vercel.app/pricing"
/>
const PLAN_FEATURES = {
  Monthly: [
    "VTKS indicator access",
    "Subscriber dashboard",
    "Scanner access",
    "Knowledge library",
    "Community support",
    "Regular updates",
  ],

  Quarterly: [
    "Everything included in Monthly",
    "Three-month platform access",
    "Premium scanner access",
    "Recorded learning sessions",
    "Subscriber-only trade access",
    "Priority member support",
  ],

  Annual: [
    "Everything included in Quarterly",
    "Twelve-month platform access",
    "Complete VTKS Knowledge Vault",
    "All subscriber scanners",
    "Premium trade access",
    "Maximum long-term value",
  ],
};

const toBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") return true;
    if (normalized === "false") return false;
    if (normalized === "1") return true;
    if (normalized === "0") return false;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return fallback;
};

const createPlans = (settings) => {
  const plans = settings?.plans || {};

  const allPlans = [
    {
      name: "Monthly",
      value: "Monthly",
      price: Number(plans.monthlyPrice || 0),
      days: Number(plans.monthlyDays || 30),

      enabled: toBoolean(
        plans.monthlyEnabled,
        true
      ),

      description:
        plans.monthlyDescription || "",

      featured:
        plans.featuredPlan === "Monthly",
    },

    {
      name: "Quarterly",
      value: "Quarterly",
      price: Number(plans.quarterlyPrice || 0),
      days: Number(plans.quarterlyDays || 90),

      enabled: toBoolean(
        plans.quarterlyEnabled,
        true
      ),

      description:
        plans.quarterlyDescription || "",

      featured:
        plans.featuredPlan === "Quarterly",
    },

    {
      name: "Annual",
      value: "Annual",
      price: Number(plans.annualPrice || 0),
      days: Number(plans.annualDays || 365),

      enabled: toBoolean(
        plans.annualEnabled,
        true
      ),

      description:
        plans.annualDescription || "",

      featured:
        plans.featuredPlan === "Annual",
    },
  ];

  return allPlans.filter(
    (plan) => plan.enabled === true
  );
};

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const settings = await loadSettings();
      const enabledPlans = createPlans(settings);

      setPlans(enabledPlans);
    } catch (error) {
      console.error("Pricing load error:", error);

      setErrorMessage(
        error?.message ||
          "Failed to load subscription plans."
      );

      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  /*
   * Reload pricing when the user returns to this tab.
   * This helps when Admin Settings is updated in another tab.
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadPlans();
      }
    };

    const handleWindowFocus = () => {
      loadPlans();
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener(
      "focus",
      handleWindowFocus
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "focus",
        handleWindowFocus
      );
    };
  }, [loadPlans]);

  const formatPrice = (price) =>
    `₹${Number(price || 0).toLocaleString(
      "en-IN"
    )}`;

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "50px",
        }}
      >
        Loading subscription plans...
      </div>
    );
  }

  return (
    <main className="pricing-page">
      <section className="pricing-hero">
        <span className="pricing-badge">
          💎 VTKS Indicator Subscription
        </span>

        <h1>Choose your VTKS plan</h1>

        <p>
          Select the subscription plan that best
          matches your trading and learning journey.
        </p>
      </section>

      {errorMessage && (
        <section className="pricing-empty-state">
          <h2>Unable to load pricing</h2>

          <p>{errorMessage}</p>

          <button
            type="button"
            className="pricing-button pricing-button-primary"
            onClick={loadPlans}
          >
            Try Again
          </button>
        </section>
      )}

      {!errorMessage && plans.length === 0 && (
        <section className="pricing-empty-state">
          <h2>No active subscription plans</h2>

          <p>
            Please contact the VTKS team for
            subscription assistance.
          </p>

          <Link
            to="/contact"
            className="pricing-button pricing-button-primary"
          >
            Contact VTKS
          </Link>
        </section>
      )}

      {!errorMessage && plans.length > 0 && (
        <section
          className={`pricing-grid pricing-grid-${plans.length}`}
        >
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`pricing-card ${
                plan.featured
                  ? "pricing-card-highlighted"
                  : ""
              }`}
            >
              {plan.featured && (
                <span className="pricing-plan-badge">
                  Most Popular
                </span>
              )}

              <div className="pricing-card-header">
                <h2>{plan.name}</h2>

                <div className="pricing-price">
                  <strong>
                    {formatPrice(plan.price)}
                  </strong>

                  <span>
                    {plan.days} days access
                  </span>
                </div>

                <p>
                  {plan.description ||
                    `${plan.name} VTKS subscription plan.`}
                </p>
              </div>

              <div className="pricing-divider" />

              <ul className="pricing-feature-list">
                {(PLAN_FEATURES[plan.name] || []).map(
                  (feature) => (
                    <li key={feature}>
                      <span>✓</span>
                      {feature}
                    </li>
                  )
                )}
              </ul>

              <Link
                to={`/payment?plan=${encodeURIComponent(
                  plan.name
                )}`}
                className={
                  plan.featured
                    ? "pricing-button pricing-button-primary"
                    : "pricing-button pricing-button-secondary"
                }
              >
                Choose {plan.name}
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}