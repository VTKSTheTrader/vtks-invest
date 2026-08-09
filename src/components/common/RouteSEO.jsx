import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE_NAME = "VTKS INVEST";

const DEFAULT_DESCRIPTION =
  "VTKS INVEST provides structured stock market education, technical analysis tools, portfolio insights and disciplined trading resources.";

const seoConfig = {
  "/": {
    title:
      "VTKS INVEST | Stock Market Education, Swing Trading & Technical Analysis",
    description:
      "VTKS INVEST provides structured stock market education, swing trading frameworks, technical analysis tools, portfolio insights and disciplined investing resources.",
    indexable: true,
  },

  "/funds": {
    title: "VTKS Public Fund | Portfolio & Investment Ideas",
    description:
      "Explore publicly shared VTKS investment ideas, portfolio performance and structured stock market analysis.",
    indexable: true,
  },

  "/indicators": {
    title: "VTKS Indicators | Technical Analysis Tools",
    description:
      "Explore VTKS indicators designed for trend analysis, swing trading, support and resistance and structured decision-making.",
    indexable: true,
  },

  "/accuracy": {
    title: "VTKS Performance & Accuracy | Trade Analytics",
    description:
      "Review VTKS portfolio performance, completed setups, target achievements and transparent trade analytics.",
    indexable: true,
  },

  "/resources": {
    title: "VTKS Learning Resources | Videos, PDFs & Scanners",
    description:
      "Explore free VTKS learning resources including educational videos, trading PDFs, technical studies and public market scanners.",
    indexable: true,
  },

  "/testimonials": {
    title: "VTKS Member Testimonials | Trading Experiences",
    description:
      "Read genuine VTKS member experiences related to structured trading, technical analysis, risk management and disciplined investing.",
    indexable: true,
  },

  "/pricing": {
    title: "VTKS Membership Plans | Education & Resources",
    description:
      "Compare VTKS membership plans for access to educational resources, market scanners, technical studies and subscriber tools.",
    indexable: true,
  },

  "/about": {
    title: "About VTKS INVEST | Our Trading Education Mission",
    description:
      "Learn about VTKS INVEST and its mission to build disciplined, knowledgeable and independent stock market participants.",
    indexable: true,
  },

  "/contact": {
    title: "Contact VTKS INVEST | Membership & Support",
    description:
      "Contact VTKS INVEST for membership information, educational resources, platform assistance and general enquiries.",
    indexable: true,
  },

  "/payment": {
    title: "Payment | VTKS INVEST",
    description:
      "Complete your VTKS INVEST membership payment using the available payment options.",
    indexable: false,
  },

  "/login": {
    title: "Login | VTKS INVEST",
    description: "Log in securely to your VTKS INVEST account.",
    indexable: false,
  },

  "/register": {
    title: "Create Account | VTKS INVEST",
    description: "Create your VTKS INVEST account.",
    indexable: false,
  },

  "/forgot-password": {
    title: "Forgot Password | VTKS INVEST",
    description: "Recover access to your VTKS INVEST account.",
    indexable: false,
  },

  "/reset-password": {
    title: "Reset Password | VTKS INVEST",
    description: "Create a new password for your VTKS INVEST account.",
    indexable: false,
  },

  "/dashboard": {
    title: "Subscriber Dashboard | VTKS INVEST",
    description: "Access your VTKS INVEST subscriber dashboard.",
    indexable: false,
  },

  "/subscriber/scanner": {
    title: "Subscriber Scanners | VTKS INVEST",
    description: "Access VTKS INVEST subscriber market scanners.",
    indexable: false,
  },

  "/subscriber/library": {
    title: "Subscriber Library | VTKS INVEST",
    description: "Access VTKS INVEST subscriber learning resources.",
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

  /*
    Trade-detail pages are intentionally noindex.

    This prevents generic "Trade Details" pages from competing
    with the VTKS homepage in Google search results.
  */
  if (cleanPath.startsWith("/trade/")) {
    return {
      title: "Trade Details | VTKS INVEST",
      description:
        "View VTKS trade details including entry, current price, targets, stop-loss, thesis and performance.",
      indexable: false,
    };
  }

  /*
    All admin routes must remain private in search engines.
  */
  if (cleanPath.startsWith("/admin")) {
    return {
      title: "Admin Panel | VTKS INVEST",
      description: "VTKS INVEST administration panel.",
      indexable: false,
    };
  }

  /*
    All subscriber routes must remain private in search engines.
  */
  if (cleanPath.startsWith("/subscriber")) {
    return {
      title: "Subscriber Area | VTKS INVEST",
      description: "VTKS INVEST subscriber area.",
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

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://vtks-hub.vercel.app";

  const canonicalUrl =
    cleanPath === "/"
      ? `${origin}/`
      : `${origin}${cleanPath}`;

  const socialImageUrl = `${origin}/og-image.png`;

  /*
    Public pages:
    index, follow

    Private and trade-detail pages:
    noindex, follow

    "follow" allows Google to continue discovering links
    without showing the page in search results.
  */
  const robotsContent = config.indexable
    ? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    : "noindex, follow";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: "VTKS",
    url: `${origin}/`,
    logo: `${origin}/favicon.png`,
    description: DEFAULT_DESCRIPTION,
    sameAs: [],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: ["VTKS", "VTKS INVEST"],
    url: `${origin}/`,
    description: DEFAULT_DESCRIPTION,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
  };

  return (
    <Helmet>
      <html lang="en-IN" />

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

      {/* Open Graph */}
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
        content="VTKS INVEST – Stock Market Education, Swing Trading and Technical Analysis"
      />

      {/* Twitter/X Card */}
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
        content="VTKS INVEST – Stock Market Education, Swing Trading and Technical Analysis"
      />

      {/* Add brand schemas only on the homepage */}
      {isHomePage && (
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
      )}

      {isHomePage && (
        <script type="application/ld+json">
          {JSON.stringify(websiteSchema)}
        </script>
      )}
    </Helmet>
  );
}