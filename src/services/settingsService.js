import { supabase } from "../lib/supabase";

const TABLE_NAME = "platform_settings";

/* =========================================================
   DEFAULT SETTINGS
========================================================= */

export const defaultSettings = {
  id: null,

  platform: {
    // FINAL BRAND - DO NOT LOAD FROM DATABASE
    websiteName: "VTKS INVEST",

    supportEmail: "support@vtks.in",
    supportMobile: "",
    telegramLink: "",
    twitterLink: "",
    instagramLink: "",
    youtubeLink: "",
  },

  plans: {
    monthlyPrice: 3000,
    monthlyDays: 30,
    monthlyEnabled: true,
    monthlyDescription:
      "Flexible access for traders who want to explore VTKS indicators and learning resources.",

    quarterlyPrice: 7000,
    quarterlyDays: 90,
    quarterlyEnabled: true,
    quarterlyDescription:
      "Ideal for active traders who want structured tools, education and ongoing platform access.",

    annualPrice: 21000,
    annualDays: 365,
    annualEnabled: true,
    annualDescription:
      "Best value for serious traders and investors focused on long-term market development.",

    featuredPlan: "Quarterly",
  },

  payment: {
    upiId: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    qrUrl: "",
  },

  website: {
    showIndicators: true,
    showFunds: true,
    showAccuracy: true,
    showScanner: true,
    showETF: true,
    showMonthlyLevels: true,
    showTestimonial: true,

    // Ask VTKS controls
    showAskVTKS: true,
    acceptAskQueries: true,
    showAnsweredQueries: true,

    maintenanceMode: false,
  },

  announcement: {
    text: "🎉 Welcome to VTKS Knowledge Vault",
    enabled: true,
  },

  admin: {
    email: "",
  },
};

/* =========================================================
   HELPERS
========================================================= */

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const toBoolean = (
  value,
  fallback = false
) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === "string") {
    const normalizedValue = value
      .trim()
      .toLowerCase();

    if (
      normalizedValue === "true" ||
      normalizedValue === "1" ||
      normalizedValue === "yes" ||
      normalizedValue === "on"
    ) {
      return true;
    }

    if (
      normalizedValue === "false" ||
      normalizedValue === "0" ||
      normalizedValue === "no" ||
      normalizedValue === "off" ||
      normalizedValue === ""
    ) {
      return false;
    }
  }

  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  return fallback;
};

/* =========================================================
   MERGE SETTINGS WITH DEFAULTS
========================================================= */

const mergeWithDefaults = (
  settings = {}
) => ({
  ...defaultSettings,
  ...settings,

  platform: {
    ...defaultSettings.platform,
    ...(settings.platform || {}),

    // Brand is permanent for VTKS INVEST
    websiteName: "VTKS INVEST",
  },

  plans: {
    ...defaultSettings.plans,
    ...(settings.plans || {}),
  },

  payment: {
    ...defaultSettings.payment,
    ...(settings.payment || {}),
  },

  website: {
    ...defaultSettings.website,
    ...(settings.website || {}),
  },

  announcement: {
    ...defaultSettings.announcement,
    ...(settings.announcement || {}),
  },

  admin: {
    ...defaultSettings.admin,
    ...(settings.admin || {}),
  },
});

/* =========================================================
   MAP DATABASE → WEBSITE SETTINGS
========================================================= */

const mapFromDatabase = (row) => {
  if (!row) {
    return mergeWithDefaults();
  }

  return mergeWithDefaults({
    id: row.id,

    platform: {
      // IMPORTANT:
      // Ignore Supabase website_name because the same
      // database is currently shared with the old HUB site.
      websiteName: "VTKS INVEST",

      supportEmail:
        row.support_email ||
        defaultSettings.platform.supportEmail,

      supportMobile:
        row.support_phone || "",

      telegramLink:
        row.telegram_link || "",

      twitterLink:
        row.twitter_link || "",

      instagramLink:
        row.instagram_link || "",

      youtubeLink:
        row.youtube_link || "",
    },

    plans: {
      monthlyPrice: toNumber(
        row.monthly_price,
        defaultSettings.plans.monthlyPrice
      ),

      monthlyDays: toNumber(
        row.monthly_days,
        defaultSettings.plans.monthlyDays
      ),

      monthlyEnabled: toBoolean(
        row.monthly_enabled,
        defaultSettings.plans.monthlyEnabled
      ),

      monthlyDescription:
        row.monthly_description ||
        defaultSettings.plans.monthlyDescription,

      quarterlyPrice: toNumber(
        row.quarterly_price,
        defaultSettings.plans.quarterlyPrice
      ),

      quarterlyDays: toNumber(
        row.quarterly_days,
        defaultSettings.plans.quarterlyDays
      ),

      quarterlyEnabled: toBoolean(
        row.quarterly_enabled,
        defaultSettings.plans.quarterlyEnabled
      ),

      quarterlyDescription:
        row.quarterly_description ||
        defaultSettings.plans.quarterlyDescription,

      annualPrice: toNumber(
        row.annual_price,
        defaultSettings.plans.annualPrice
      ),

      annualDays: toNumber(
        row.annual_days,
        defaultSettings.plans.annualDays
      ),

      annualEnabled: toBoolean(
        row.annual_enabled,
        defaultSettings.plans.annualEnabled
      ),

      annualDescription:
        row.annual_description ||
        defaultSettings.plans.annualDescription,

      featuredPlan:
        row.featured_plan ||
        defaultSettings.plans.featuredPlan,
    },

    payment: {
      upiId:
        row.upi_id || "",

      bankName:
        row.bank_name || "",

      accountNumber:
        row.account_number || "",

      ifscCode:
        row.ifsc_code || "",

      qrUrl:
        row.payment_qr || "",
    },

    website: {
      showIndicators: toBoolean(
        row.show_indicators,
        defaultSettings.website.showIndicators
      ),

      showFunds: toBoolean(
        row.show_funds,
        defaultSettings.website.showFunds
      ),

      showAccuracy: toBoolean(
        row.show_accuracy,
        defaultSettings.website.showAccuracy
      ),

      showScanner: toBoolean(
        row.show_scanner,
        defaultSettings.website.showScanner
      ),
      showETF: toBoolean(
  row.show_etf,
  defaultSettings.website.showETF
),

      showTestimonial: toBoolean(
        row.show_testimonial,
        defaultSettings.website.showTestimonial
      ),

      showMonthlyLevels: toBoolean(
        row.show_monthly_levels,
        defaultSettings.website.showMonthlyLevels
      ),

      showAskVTKS: toBoolean(
        row.show_ask_vtks,
        defaultSettings.website.showAskVTKS
      ),

      acceptAskQueries: toBoolean(
        row.accept_ask_queries,
        defaultSettings.website.acceptAskQueries
      ),

      showAnsweredQueries: toBoolean(
        row.show_answered_queries,
        defaultSettings.website.showAnsweredQueries
      ),

      maintenanceMode: toBoolean(
        row.maintenance_mode,
        defaultSettings.website.maintenanceMode
      ),
    },

    announcement: {
      text:
        row.announcement ??
        defaultSettings.announcement.text,

      enabled: toBoolean(
        row.announcement_enabled,
        defaultSettings.announcement.enabled
      ),
    },

    admin: {
      email:
        row.admin_email || "",
    },
  });
};

/* =========================================================
   MAP WEBSITE SETTINGS → DATABASE
========================================================= */

const mapToDatabase = (settings) => {
  const mergedSettings =
    mergeWithDefaults(settings);

  return {
    /*
     IMPORTANT:
     website_name is intentionally NOT written here.

     Reason:
     VTKS INVEST and the old VTKS HUB currently share
     the same Supabase project.

     This protects the old live HUB site from branding
     changes made through the VTKS INVEST admin panel.
    */

    support_email:
      mergedSettings.platform.supportEmail ||
      "",

    support_phone:
      mergedSettings.platform.supportMobile ||
      "",

    telegram_link:
      mergedSettings.platform.telegramLink ||
      "",

    twitter_link:
      mergedSettings.platform.twitterLink ||
      "",

    instagram_link:
      mergedSettings.platform.instagramLink ||
      "",

    youtube_link:
      mergedSettings.platform.youtubeLink ||
      "",

    /* =========================
       MONTHLY PLAN
    ========================= */

    monthly_price: toNumber(
      mergedSettings.plans.monthlyPrice,
      defaultSettings.plans.monthlyPrice
    ),

    monthly_days: toNumber(
      mergedSettings.plans.monthlyDays,
      defaultSettings.plans.monthlyDays
    ),

    monthly_enabled: toBoolean(
      mergedSettings.plans.monthlyEnabled,
      defaultSettings.plans.monthlyEnabled
    ),

    monthly_description:
      mergedSettings.plans.monthlyDescription ||
      "",

    /* =========================
       QUARTERLY PLAN
    ========================= */

    quarterly_price: toNumber(
      mergedSettings.plans.quarterlyPrice,
      defaultSettings.plans.quarterlyPrice
    ),

    quarterly_days: toNumber(
      mergedSettings.plans.quarterlyDays,
      defaultSettings.plans.quarterlyDays
    ),

    quarterly_enabled: toBoolean(
      mergedSettings.plans.quarterlyEnabled,
      defaultSettings.plans.quarterlyEnabled
    ),

    quarterly_description:
      mergedSettings.plans.quarterlyDescription ||
      "",

    /* =========================
       ANNUAL PLAN
    ========================= */

    annual_price: toNumber(
      mergedSettings.plans.annualPrice,
      defaultSettings.plans.annualPrice
    ),

    annual_days: toNumber(
      mergedSettings.plans.annualDays,
      defaultSettings.plans.annualDays
    ),

    annual_enabled: toBoolean(
      mergedSettings.plans.annualEnabled,
      defaultSettings.plans.annualEnabled
    ),

    annual_description:
      mergedSettings.plans.annualDescription ||
      "",

    featured_plan:
      mergedSettings.plans.featuredPlan ||
      "Quarterly",

    /* =========================
       PAYMENT
    ========================= */

    upi_id:
      mergedSettings.payment.upiId ||
      "",

    bank_name:
      mergedSettings.payment.bankName ||
      "",

    account_number:
      mergedSettings.payment.accountNumber ||
      "",

    ifsc_code:
      mergedSettings.payment.ifscCode ||
      "",

    payment_qr:
      mergedSettings.payment.qrUrl ||
      "",

    /* =========================
       WEBSITE CONTROLS
    ========================= */

    show_indicators: toBoolean(
      mergedSettings.website.showIndicators,
      true
    ),

    show_funds: toBoolean(
      mergedSettings.website.showFunds,
      true
    ),

    show_accuracy: toBoolean(
      mergedSettings.website.showAccuracy,
      true
    ),

    show_scanner: toBoolean(
      mergedSettings.website.showScanner,
      true
    ),
    show_etf: toBoolean(
  mergedSettings.website.showETF,
  true
),

    show_testimonial: toBoolean(
      mergedSettings.website.showTestimonial,
      true
    ),

    show_monthly_levels: toBoolean(
      mergedSettings.website.showMonthlyLevels,
      true
    ),

    show_ask_vtks: toBoolean(
      mergedSettings.website.showAskVTKS,
      true
    ),

    accept_ask_queries: toBoolean(
      mergedSettings.website.acceptAskQueries,
      true
    ),

    show_answered_queries: toBoolean(
      mergedSettings.website.showAnsweredQueries,
      true
    ),

    maintenance_mode: toBoolean(
      mergedSettings.website.maintenanceMode,
      false
    ),

    /* =========================
       ANNOUNCEMENT
    ========================= */

    announcement:
      mergedSettings.announcement.text ||
      "",

    announcement_enabled: toBoolean(
      mergedSettings.announcement.enabled,
      true
    ),

    /* =========================
       ADMIN
    ========================= */

    admin_email:
      mergedSettings.admin.email ||
      "",

    updated_at:
      new Date().toISOString(),
  };
};

/* =========================================================
   LOAD SETTINGS
========================================================= */

export const loadSettings = async () => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("id", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Load settings error:",
      error
    );

    throw error;
  }

  return mapFromDatabase(data);
};

/* =========================================================
   SAVE SETTINGS
========================================================= */

export const saveSettings = async (
  settings
) => {
  const mergedSettings =
    mergeWithDefaults(settings);

  const payload =
    mapToDatabase(mergedSettings);

  /*
   Existing settings row
  */

  if (mergedSettings.id) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(payload)
      .eq(
        "id",
        mergedSettings.id
      )
      .select("*")
      .single();

    if (error) {
      console.error(
        "Update settings error:",
        error
      );

      throw error;
    }

    return mapFromDatabase(data);
  }

  /*
   No settings row yet
  */

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([
      payload,
    ])
    .select("*")
    .single();

  if (error) {
    console.error(
      "Insert settings error:",
      error
    );

    throw error;
  }

  return mapFromDatabase(data);
};

/* =========================================================
   PLAN HELPERS
========================================================= */

export const getAllPlans = async () => {
  const settings =
    await loadSettings();

  const plans =
    settings.plans;

  return [
    {
      name: "Monthly",
      value: "Monthly",

      price: toNumber(
        plans.monthlyPrice,
        defaultSettings.plans.monthlyPrice
      ),

      days: toNumber(
        plans.monthlyDays,
        defaultSettings.plans.monthlyDays
      ),

      enabled: toBoolean(
        plans.monthlyEnabled,
        defaultSettings.plans.monthlyEnabled
      ),

      description:
        plans.monthlyDescription ||
        "",

      featured:
        plans.featuredPlan ===
        "Monthly",
    },

    {
      name: "Quarterly",
      value: "Quarterly",

      price: toNumber(
        plans.quarterlyPrice,
        defaultSettings.plans.quarterlyPrice
      ),

      days: toNumber(
        plans.quarterlyDays,
        defaultSettings.plans.quarterlyDays
      ),

      enabled: toBoolean(
        plans.quarterlyEnabled,
        defaultSettings.plans.quarterlyEnabled
      ),

      description:
        plans.quarterlyDescription ||
        "",

      featured:
        plans.featuredPlan ===
        "Quarterly",
    },

    {
      name: "Annual",
      value: "Annual",

      price: toNumber(
        plans.annualPrice,
        defaultSettings.plans.annualPrice
      ),

      days: toNumber(
        plans.annualDays,
        defaultSettings.plans.annualDays
      ),

      enabled: toBoolean(
        plans.annualEnabled,
        defaultSettings.plans.annualEnabled
      ),

      description:
        plans.annualDescription ||
        "",

      featured:
        plans.featuredPlan ===
        "Annual",
    },
  ];
};

/* =========================================================
   ENABLED PLANS
========================================================= */

export const getEnabledPlans =
  async () => {
    const plans =
      await getAllPlans();

    return plans.filter(
      (plan) =>
        plan.enabled === true
    );
  };

/* =========================================================
   GET PLAN BY NAME
========================================================= */

export const getPlanByName = async (
  planName
) => {
  const plans =
    await getAllPlans();

  const normalizedPlanName =
    String(
      planName || ""
    )
      .trim()
      .toLowerCase();

  return (
    plans.find(
      (plan) =>
        plan.name.toLowerCase() ===
        normalizedPlanName
    ) || null
  );
};