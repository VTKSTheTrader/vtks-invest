import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

/* =========================================================
   SITE CONSTANTS
========================================================= */

const SITE_NAME = "VTKS INVEST";
const SITE_URL = "https://www.vtksinvest.com";

const DEFAULT_DESCRIPTION =
  "VTKS INVEST is a stock market education and research platform focused on technical analysis, swing trading, market studies, indicators, disciplined risk management and structured decision-making.";

/* =========================================================
   PUBLIC + PRIVATE ROUTE SEO CONFIGURATION
========================================================= */

const seoConfig = {
  "/": {
    title:
      "VTKS INVEST | Stock Market Education & Technical Analysis",
    description:
      "VTKS INVEST is a stock market education and research platform focused on technical analysis, swing trading, market studies, indicators, disciplined risk management and structured decision-making.",
    indexable: true,
  },

  "/funds": {
    title:
      "VTKS Market Studies | Stock Research & Analysis",
    description:
      "Explore VTKS educational market studies, structured stock research, technical analysis and investment case studies.",
    indexable: true,
  },

  "/monthly-levels": {
    title:
      "VTKS Market Outlook | Nifty, Bank Nifty & Market Levels",
    description:
      "Explore VTKS educational market outlook, index levels and structured technical analysis for Nifty, Bank Nifty and broader markets.",
    indexable: true,
  },

  "/indicators": {
    title:
      "VTKS Indicators | Technical Analysis Tools",
    description:
      "Explore VTKS technical indicators for trend analysis, swing trading, support and resistance and structured market decision-making.",
    indexable: true,
  },

  "/accuracy": {
    title:
      "VTKS Performance & Accuracy | Market Study Analytics",
    description:
      "Review VTKS historical market studies, completed setups, performance statistics and transparent educational analysis.",
    indexable: true,
  },

  "/etf": {
    title:
      "VTKS ETF Portfolio | Structured ETF Accumulation & Analysis",
    description:
      "Explore the VTKS ETF Portfolio with published accumulation studies, average prices, portfolio performance and structured ETF analysis.",
    indexable: true,
  },

  "/resources": {
    title:
      "VTKS Learning Resources | Videos, PDFs & Market Scanners",
    description:
      "Explore VTKS educational videos, market PDFs, technical studies, learning resources and public market scanners.",
    indexable: true,
  },

  "/testimonials": {
    title:
      "VTKS Testimonials | Community Experiences",
    description:
      "Read VTKS community experiences related to structured market learning, technical analysis, discipline and risk management.",
    indexable: true,
  },

  "/pricing": {
    title:
      "VTKS Membership Plans | Education & Learning Resources",
    description:
      "Compare VTKS membership plans for educational resources, market scanners, technical studies and subscriber learning tools.",
    indexable: true,
  },

  "/about": {
    title:
      "About VTKS INVEST | Research, Knowledge & Strategy",
    description:
      "Learn about VTKS INVEST and its approach to structured market research, knowledge, discipline and independent decision-making.",
    indexable: true,
  },

  "/contact": {
    title:
      "Contact VTKS INVEST | Membership & Platform Support",
    description:
      "Contact VTKS INVEST for membership information, educational resources, platform support and general enquiries.",
    indexable: true,
  },

  /* =====================================================
     VTKS QUESTIONS
  ===================================================== */

  "/ask-vtks": {
    title:
      "Ask VTKS | Submit Your Market Question",
    description:
      "Submit your stock market and technical analysis questions to VTKS for educational discussion and structured market learning.",
    indexable: false,
  },

  "/answered-queries": {
    title:
      "VTKS Answered Queries | Market Questions & Learning",
    description:
      "Explore educational market questions answered by VTKS covering technical analysis, market structure, trading discipline and investment learning.",
    indexable: true,
  },

  /* =====================================================
     NON-INDEXABLE PUBLIC UTILITY PAGES
  ===================================================== */

  "/payment": {
    title: "Payment | VTKS INVEST",
    description:
      "Complete your VTKS INVEST membership payment.",
    indexable: false,
  },

  "/login": {
    title: "Login | VTKS INVEST",
    description:
      "Log in securely to your VTKS INVEST account.",
    indexable: false,
  },

  "/register": {
    title: "Create Account | VTKS INVEST",
    description:
      "Create your VTKS INVEST account.",
    indexable: false,
  },

  "/forgot-password": {
    title: "Forgot Password | VTKS INVEST",
    description:
      "Recover access to your VTKS INVEST account.",
    indexable: false,
  },

  "/reset-password": {
    title: "Reset Password | VTKS INVEST",
    description:
      "Create a new password for your VTKS INVEST account.",
    indexable: false,
  },

  /* =====================================================
     SUBSCRIBER / DASHBOARD ROUTES
  ===================================================== */

  "/dashboard": {
    title:
      "Subscriber Dashboard | VTKS INVEST",
    description:
      "Access your VTKS INVEST subscriber dashboard.",
    indexable: false,
  },

  "/dashboard/monthly-levels": {
    title:
      "Subscriber Market Levels | VTKS INVEST",
    description:
      "Access VTKS INVEST subscriber market levels.",
    indexable: false,
  },

  "/dashboard/library": {
    title:
      "Subscriber Library | VTKS INVEST",
    description:
      "Access VTKS INVEST subscriber learning resources.",
    indexable: false,
  },

  "/dashboard/scanner": {
    title:
      "Subscriber Scanners | VTKS INVEST",
    description:
      "Access VTKS INVEST subscriber market scanners.",
    indexable: false,
  },

  "/subscriber/feedback": {
    title:
      "Subscriber Feedback | VTKS INVEST",
    description:
      "Submit feedback about your VTKS INVEST subscriber experience.",
    indexable: false,
  },
};

/* =========================================================
   PATH NORMALIZATION
========================================================= */

const normalizePathname = (pathname) => {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.replace(/\/+$/, "");
};

/* =========================================================
   GET SEO CONFIG FOR CURRENT ROUTE
========================================================= */

const getPageConfig = (pathname) => {
  const cleanPath = normalizePathname(pathname);

  /* =====================================================
     PUBLIC ETF ANALYSIS
  ===================================================== */

  if (cleanPath.startsWith("/etf/")) {
    return {
      title: "ETF Analysis | VTKS INVEST",
      description:
        "Explore published VTKS ETF accumulation history, average accumulation price, portfolio performance and structured ETF analysis.",
      indexable: true,
    };
  }

  /* =====================================================
     PUBLIC MARKET STUDY DETAILS
  ===================================================== */

  if (cleanPath.startsWith("/market-study/")) {
    return {
      title:
        "Market Study Details | VTKS INVEST",
      description:
        "Explore a documented VTKS educational market study with historical chart observations, reference prices and market structure analysis.",
      indexable: true,
    };
  }

  /* =====================================================
     LEGACY PUBLIC TRADE DETAILS
  ===================================================== */

  if (cleanPath.startsWith("/trade/")) {
    return {
      title:
        "Market Study Details | VTKS INVEST",
      description:
        "View detailed VTKS educational market study information.",
      indexable: true,
    };
  }

  /* Subscriber trade details */

  if (
    cleanPath.startsWith(
      "/dashboard/trade/"
    )
  ) {
    return {
      title:
        "Subscriber Market Study | VTKS INVEST",
      description:
        "Access detailed VTKS subscriber market study information.",
      indexable: false,
    };
  }

  /* Admin */

  if (cleanPath.startsWith("/admin")) {
    return {
      title:
        "Admin Panel | VTKS INVEST",
      description:
        "VTKS INVEST administration panel.",
      indexable: false,
    };
  }

  /* Any other subscriber route */

  if (
    cleanPath.startsWith(
      "/subscriber"
    )
  ) {
    return {
      title:
        "Subscriber Area | VTKS INVEST",
      description:
        "VTKS INVEST subscriber area.",
      indexable: false,
    };
  }

  /* Any unmatched dashboard route */

  if (
    cleanPath.startsWith(
      "/dashboard"
    )
  ) {
    return {
      title:
        "Subscriber Dashboard | VTKS INVEST",
      description:
        "VTKS INVEST subscriber dashboard.",
      indexable: false,
    };
  }

  return (
    seoConfig[cleanPath] || {
      title:
        `Page Not Found | ${SITE_NAME}`,
      description:
        DEFAULT_DESCRIPTION,
      indexable: false,
    }
  );
};

/* =========================================================
   ROUTE SEO COMPONENT
========================================================= */

export default function RouteSEO() {
  const { pathname } = useLocation();

  const cleanPath =
    normalizePathname(pathname);

  const config =
    getPageConfig(cleanPath);

  const isHomePage =
    cleanPath === "/";

  const canonicalUrl =
    isHomePage
      ? `${SITE_URL}/`
      : `${SITE_URL}${cleanPath}`;

  const socialImageUrl =
    `${SITE_URL}/og-image.png`;

  const logoUrl =
    `${SITE_URL}/favicon.png`;

  /* =====================================================
     ROBOTS
  ===================================================== */

  const robotsContent =
    config.indexable
      ? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      : "noindex, follow";

  /* =====================================================
     STRUCTURED DATA
  ===================================================== */

  const websiteSchema = {
    "@context":
      "https://schema.org",
    "@type":
      "WebSite",
    name:
      SITE_NAME,
    alternateName:
      "VTKS",
    url:
      `${SITE_URL}/`,
  };

  const organizationSchema = {
    "@context":
      "https://schema.org",
    "@type":
      "Organization",
    name:
      SITE_NAME,
    alternateName:
      "VTKS",
    url:
      `${SITE_URL}/`,
    logo:
      logoUrl,
    description:
      DEFAULT_DESCRIPTION,
  };

  return (
    <Helmet>
      {/* =================================================
          PRIMARY SEO
      ================================================= */}

      <title>
        {config.title}
      </title>

      <meta
        name="description"
        content={config.description}
      />

      <meta
        name="robots"
        content={robotsContent}
      />

      <meta
        name="googlebot"
        content={robotsContent}
      />

      <meta
        name="author"
        content={SITE_NAME}
      />

      <meta
        name="application-name"
        content={SITE_NAME}
      />

      <meta
        name="theme-color"
        content="#0f172a"
      />

      {/* =================================================
          CANONICAL
      ================================================= */}

      <link
        rel="canonical"
        href={canonicalUrl}
      />

      {/* =================================================
          OPEN GRAPH
      ================================================= */}

      <meta
        property="og:type"
        content="website"
      />

      <meta
        property="og:site_name"
        content={SITE_NAME}
      />

      <meta
        property="og:locale"
        content="en_IN"
      />

      <meta
        property="og:title"
        content={config.title}
      />

      <meta
        property="og:description"
        content={config.description}
      />

      <meta
        property="og:url"
        content={canonicalUrl}
      />

      <meta
        property="og:image"
        content={socialImageUrl}
      />

      <meta
        property="og:image:secure_url"
        content={socialImageUrl}
      />

      <meta
        property="og:image:type"
        content="image/png"
      />

      <meta
        property="og:image:alt"
        content="VTKS INVEST stock market education and technical analysis platform"
      />

      {/* =================================================
          X / TWITTER
      ================================================= */}

      <meta
        name="twitter:card"
        content="summary_large_image"
      />

      <meta
        name="twitter:title"
        content={config.title}
      />

      <meta
        name="twitter:description"
        content={config.description}
      />

      <meta
        name="twitter:image"
        content={socialImageUrl}
      />

      <meta
        name="twitter:image:alt"
        content="VTKS INVEST stock market education and technical analysis platform"
      />

      {/* =================================================
          HOMEPAGE STRUCTURED DATA
      ================================================= */}

      {isHomePage && (
        <script type="application/ld+json">
          {JSON.stringify(
            websiteSchema
          )}
        </script>
      )}

      {isHomePage && (
        <script type="application/ld+json">
          {JSON.stringify(
            organizationSchema
          )}
        </script>
      )}
    </Helmet>
  );
}
