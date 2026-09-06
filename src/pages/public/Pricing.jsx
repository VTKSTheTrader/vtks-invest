import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  loadSettings,
  defaultSettings,
} from "../../services/settingsService";

import "./Pricing.css";

import SEO from "../../components/common/SEO";

/* =========================================================
   DEFAULT PLAN DESCRIPTIONS
========================================================= */

const DEFAULT_PLAN_DESCRIPTIONS = {
  Monthly:
    "Essential access for members focused on VTKS Market Studies and Market Outlook.",

  Quarterly:
    "Expanded access with scanners, learning resources and premium subscriber features.",

  Annual:
    "Complete long-term access to the full VTKS subscriber ecosystem.",
};

/* =========================================================
   BOOLEAN HELPER
========================================================= */

const toBoolean = (
  value,
  fallback = false
) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized =
      value
        .trim()
        .toLowerCase();

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

/* =========================================================
   FEATURE LABELS
========================================================= */

const buildMonthlyFeatures = (
  access = {}
) => [
  {
    label: "VTKS Market Studies",
    included:
      access.marketStudies === true,
  },
  {
    label: "Market Outlook access",
    included:
      access.marketOutlook === true,
  },
  {
    label: "Subscriber dashboard",
    included: true,
  },
  {
    label: "Individual stock analysis",
    included:
      access.marketStudies === true,
  },
  {
    label: "Regular market updates",
    included:
      access.marketOutlook === true,
  },
  {
    label: "Scanner access",
    included:
      access.scanner === true,
  },
  {
    label: "Knowledge library",
    included:
      access.library === true,
  },
  {
    label: "Community access",
    included:
      access.community === true,
  },
];

const buildQuarterlyFeatures = (
  access = {}
) => [
  {
    label: "VTKS Market Studies",
    included:
      access.marketStudies === true,
  },
  {
    label: "Market Outlook access",
    included:
      access.marketOutlook === true,
  },
  {
    label: "Three-month platform access",
    included: true,
  },
  {
    label: "Premium scanner access",
    included:
      access.scanner === true,
  },
  {
    label: "Knowledge library",
    included:
      access.library === true,
  },
  {
    label: "Recorded learning sessions",
    included:
      access.library === true,
  },
  {
    label: "Community access",
    included:
      access.community === true,
  },
  {
    label: "Priority member support",
    included: true,
  },
];

const buildAnnualFeatures = (
  access = {}
) => [
  {
    label: "VTKS Market Studies",
    included:
      access.marketStudies === true,
  },
  {
    label: "Market Outlook access",
    included:
      access.marketOutlook === true,
  },
  {
    label: "Twelve-month platform access",
    included: true,
  },
  {
    label: "Complete VTKS Knowledge Vault",
    included:
      access.library === true,
  },
  {
    label: "All subscriber scanners",
    included:
      access.scanner === true,
  },
  {
    label: "Community access",
    included:
      access.community === true,
  },
  {
    label: "Priority member support",
    included: true,
  },
  {
    label: "Maximum long-term value",
    included: true,
  },
];

/* =========================================================
   CREATE PLANS
========================================================= */

const createPlans = (
  settings
) => {
  const plans =
    settings?.plans || {};

  const subscriberAccess =
    settings?.subscriberAccess ||
    defaultSettings.subscriberAccess;

  const monthlyAccess = {
    ...defaultSettings
      .subscriberAccess
      .monthly,

    ...(subscriberAccess
      ?.monthly || {}),
  };

  const quarterlyAccess = {
    ...defaultSettings
      .subscriberAccess
      .quarterly,

    ...(subscriberAccess
      ?.quarterly || {}),
  };

  const annualAccess = {
    ...defaultSettings
      .subscriberAccess
      .annual,

    ...(subscriberAccess
      ?.annual || {}),
  };

  const allPlans = [
    {
      name: "Monthly",

      value: "Monthly",

      price: Number(
        plans.monthlyPrice || 0
      ),

      days: Number(
        plans.monthlyDays || 30
      ),

      enabled: toBoolean(
        plans.monthlyEnabled,
        true
      ),

      description:
        plans.monthlyDescription ||
        DEFAULT_PLAN_DESCRIPTIONS
          .Monthly,

      featured:
        plans.featuredPlan ===
        "Monthly",

      features:
        buildMonthlyFeatures(
          monthlyAccess
        ),
    },

    {
      name: "Quarterly",

      value: "Quarterly",

      price: Number(
        plans.quarterlyPrice || 0
      ),

      days: Number(
        plans.quarterlyDays || 90
      ),

      enabled: toBoolean(
        plans.quarterlyEnabled,
        true
      ),

      description:
        plans.quarterlyDescription ||
        DEFAULT_PLAN_DESCRIPTIONS
          .Quarterly,

      featured:
        plans.featuredPlan ===
        "Quarterly",

      features:
        buildQuarterlyFeatures(
          quarterlyAccess
        ),
    },

    {
      name: "Annual",

      value: "Annual",

      price: Number(
        plans.annualPrice || 0
      ),

      days: Number(
        plans.annualDays || 365
      ),

      enabled: toBoolean(
        plans.annualEnabled,
        true
      ),

      description:
        plans.annualDescription ||
        DEFAULT_PLAN_DESCRIPTIONS
          .Annual,

      featured:
        plans.featuredPlan ===
        "Annual",

      features:
        buildAnnualFeatures(
          annualAccess
        ),
    },
  ];

  return allPlans.filter(
    (plan) =>
      plan.enabled === true
  );
};

/* =========================================================
   PRICING COMPONENT
========================================================= */

export default function Pricing() {
  const [
    plans,
    setPlans,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  /* =====================================================
     LOAD PLANS
  ===================================================== */

  const loadPlans =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setErrorMessage("");

          const settings =
            await loadSettings();

          const enabledPlans =
            createPlans(
              settings
            );

          setPlans(
            enabledPlans
          );
        } catch (error) {
          console.error(
            "Pricing load error:",
            error
          );

          setErrorMessage(
            error?.message ||
              "Failed to load subscription plans."
          );

          setPlans([]);
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  /* =====================================================
     REFRESH WHEN TAB GETS FOCUS
  ===================================================== */

  useEffect(() => {
    const handleVisibilityChange =
      () => {
        if (
          !document.hidden
        ) {
          loadPlans();
        }
      };

    const handleWindowFocus =
      () => {
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

  /* =====================================================
     PRICE FORMAT
  ===================================================== */

  const formatPrice = (
    price
  ) =>
    `₹${Number(
      price || 0
    ).toLocaleString(
      "en-IN"
    )}`;

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "center",
          textAlign: "center",
          padding: "50px",
        }}
      >
        Loading subscription
        plans...
      </div>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main className="pricing-page">

      <SEO
        title="VTKS Pricing | Membership Plans"
        description="Choose the VTKS membership plan that fits your market study and learning journey."
        canonical="https://www.vtksinvest.com/pricing"
      />

      {/* =================================================
          HERO
      ================================================= */}

      <section className="pricing-hero">

        <span className="pricing-badge">
          💎 VTKS Subscription
          Plans
        </span>

        <h1>
          Choose your VTKS plan
        </h1>

        <p>
          Select the subscription
          plan that best matches
          your market study and
          learning needs.
        </p>

      </section>

      {/* =================================================
          ERROR
      ================================================= */}

      {errorMessage && (
        <section className="pricing-empty-state">

          <h2>
            Unable to load pricing
          </h2>

          <p>
            {errorMessage}
          </p>

          <button
            type="button"
            className="pricing-button pricing-button-primary"
            onClick={
              loadPlans
            }
          >
            Try Again
          </button>

        </section>
      )}

      {/* =================================================
          NO ACTIVE PLANS
      ================================================= */}

      {!errorMessage &&
        plans.length === 0 && (

          <section className="pricing-empty-state">

            <h2>
              No active
              subscription plans
            </h2>

            <p>
              Please contact the
              VTKS team for
              subscription
              assistance.
            </p>

            <Link
              to="/contact"
              className="pricing-button pricing-button-primary"
            >
              Contact VTKS
            </Link>

          </section>

        )}

      {/* =================================================
          PLAN CARDS
      ================================================= */}

      {!errorMessage &&
        plans.length > 0 && (

          <section
            className={`pricing-grid pricing-grid-${plans.length}`}
          >

            {plans.map(
              (plan) => (

                <article
                  key={
                    plan.name
                  }
                  className={`pricing-card ${
                    plan.featured
                      ? "pricing-card-highlighted"
                      : ""
                  }`}
                >

                  {/* MOST POPULAR */}

                  {plan.featured && (
                    <span className="pricing-plan-badge">
                      Most Popular
                    </span>
                  )}

                  {/* HEADER */}

                  <div className="pricing-card-header">

                    <h2>
                      {plan.name}
                    </h2>

                    <div className="pricing-price">

                      <strong>
                        {formatPrice(
                          plan.price
                        )}
                      </strong>

                      <span>
                        {plan.days} days
                        access
                      </span>

                    </div>

                    <p>
                      {
                        plan.description
                      }
                    </p>

                  </div>

                  <div className="pricing-divider" />

                  {/* FEATURES */}

                  <ul className="pricing-feature-list">

                    {(
                      plan.features ||
                      []
                    ).map(
                      (
                        feature
                      ) => (

                        <li
                          key={
                            feature.label
                          }
                          className={
                            feature.included
                              ? ""
                              : "pricing-feature-disabled"
                          }
                        >

                          <span>
                            {feature.included
                              ? "✓"
                              : "✕"}
                          </span>

                          {
                            feature.label
                          }

                        </li>

                      )
                    )}

                  </ul>

                  {/* BUTTON */}

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
                    Choose{" "}
                    {plan.name}
                  </Link>

                </article>

              )
            )}

          </section>

        )}

    </main>
  );
}