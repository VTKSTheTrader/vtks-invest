import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE_NAME = "VTKS INVEST";
const SITE_URL = "https://www.vtksinvest.com";

const DEFAULT_DESCRIPTION =
  "VTKS INVEST is a stock market education and research platform focused on technical analysis, swing trading, market studies, indicators, disciplined risk management and structured decision-making.";

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
      "VTKS Market Analysis | Stock Research & Investment Studies",
    description:
      "Explore VTKS market studies, publicly shared stock research, investment analysis and structured educational case studies.",
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

  "/resources": {
    title:
      "VTKS Learning Resources | Videos, PDFs & Market Scanners",
    description:
      "Explore VTKS educational videos, trading PDFs, technical studies, learning resources and public market scanners.",
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
      "Learn about VTKS INVEST and its educational approach to structured market research, knowledge, discipline and independent decision-making.",
    indexable: true,
  },

  "/contact": {
    title:
      "Contact VTKS INVEST | Membership & Platform Support",
    description:
      "Contact VTKS INVEST for membership information, educational resources, platform support and general enquiries.",
    indexable: true,
  },

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

  "/dashboard": {
    title: "Subscriber Dashboard | VTKS INVEST",
    description:
      "Access your VTKS INVEST subscriber dashboard.",
    indexable: false,
  },

  "/subscriber/scanner": {
    title: "Subscriber Scanners | VTKS INVEST",
    description:
      "Access VTKS INVEST subscriber market scanners.",
    indexable: false,
  },

  "/subscriber/library": {
    title: "Subscriber Library | VTKS INVEST",
    description:
      "Access VTKS INVEST subscriber learning resources.",
    indexable: false,
  },
};

const normalizePathname = (pathname) => {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.replace(/\/+$/, "");
};

const getPageConfig = (pathname) => {
  const cleanPath = normalizePathname(pathname);

  if (cleanPath.startsWith("/trade/")) {
    return {
      title: "Market Study Details | VTKS INVEST",
      description:
        "View detailed VTKS educational market study information.",
      indexable: false,
    };
  }

  if (cleanPath.startsWith("/admin")) {
    return {
      title: "Admin Panel | VTKS INVEST",
      description:
        "VTKS INVEST administration panel.",
      indexable: false,
    };
  }

  if (cleanPath.startsWith("/subscriber")) {
    return {
      title: "Subscriber Area | VTKS INVEST",
      description:
        "VTKS INVEST subscriber area.",
      indexable: false,
    };
  }

  return (
    seoConfig[cleanPath] || {
      title: `Page Not Found | ${SITE_NAME}`,
      description: DEFAULT_DESCRIPTION,
      indexable: false,
    }
  );
};

export default function RouteSEO() {
  const { pathname } = useLocation();

  const cleanPath = normalizePathname(pathname);
  const config = getPageConfig(cleanPath);

  const isHomePage = cleanPath === "/";

  const canonicalUrl =
    cleanPath === "/"
      ? `${SITE_URL}/`
      : `${SITE_URL}${cleanPath}`;

  const socialImageUrl =
    `${SITE_URL}/og-image.png`;

  const logoUrl =
    `${SITE_URL}/favicon.png`;

  const robotsContent = config.indexable
    ? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    : "noindex, follow";

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: "VTKS",
    url: `${SITE_URL}/`,
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: "VTKS",
    url: `${SITE_URL}/`,
    logo: logoUrl,
    description: DEFAULT_DESCRIPTION,
  };

  return (
    <Helmet>
      <title>{config.title}</title>

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

      <link
        rel="canonical"
        href={canonicalUrl}
      />

      {/* OPEN GRAPH */}

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
        property="og:image:alt"
        content="VTKS INVEST stock market education and technical analysis platform"
      />

      {/* X / TWITTER */}

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

      {/* SITE NAME / ORGANIZATION SCHEMA */}

      {isHomePage && (
        <script type="application/ld+json">
          {JSON.stringify(websiteSchema)}
        </script>
      )}

      {isHomePage && (
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
      )}
    </Helmet>
  );
}