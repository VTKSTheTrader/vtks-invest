import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE_NAME = "VTKS Hub";
const DEFAULT_DESCRIPTION =
  "VTKS Hub provides structured stock-market education, technical analysis tools, portfolio insights and disciplined trading resources.";

const seoConfig = {
  "/": {
    title: "VTKS Hub | Structured Trading & Investment Education",
    description:
      "Learn structured trading, swing trading, technical analysis and disciplined investing with VTKS Hub.",
    keywords:
      "VTKS, stock market education, swing trading India, technical analysis, investing education, trading framework",
    indexable: true,
  },

  "/funds": {
    title: "VTKS Public Fund | Portfolio & Investment Ideas",
    description:
      "Explore publicly shared VTKS investment ideas, portfolio performance and structured stock-market analysis.",
    keywords:
      "VTKS Fund, public portfolio, investment ideas, stock portfolio, swing trading India",
    indexable: true,
  },

  "/indicators": {
    title: "VTKS Indicators | Technical Analysis Tools",
    description:
      "Explore VTKS indicators designed for trend analysis, swing trading, support and resistance and structured decision-making.",
    keywords:
      "VTKS indicators, TradingView indicators, technical analysis tools, swing trading indicators",
    indexable: true,
  },

  "/accuracy": {
    title: "VTKS Performance & Accuracy | Trade Analytics",
    description:
      "Review VTKS portfolio performance, completed setups, target achievements and transparent trade analytics.",
    keywords:
      "VTKS accuracy, trading performance, portfolio returns, trade analytics, target performance",
    indexable: true,
  },
  "/resources": {
  title: "VTKS Learning Resources | Videos, PDFs & Scanners",
  description:
    "Explore free VTKS learning resources including educational videos, trading PDFs, technical studies and public market scanners.",
  keywords:
    "VTKS resources, trading videos, stock market PDFs, technical analysis education, market scanners",
  indexable: true,
},

  "/pricing": {
    title: "VTKS Membership Plans | Education & Resources",
    description:
      "Compare VTKS membership plans for access to educational resources, scanners, studies and subscriber tools.",
    keywords:
      "VTKS pricing, trading education membership, scanner subscription, stock market learning",
    indexable: true,
  },

  "/about": {
    title: "About VTKS Hub | Our Trading Education Mission",
    description:
      "Learn about VTKS Hub and its mission to build disciplined, knowledgeable and independent market participants.",
    keywords:
      "about VTKS, trading education India, disciplined trading, investment education",
    indexable: true,
  },

  "/contact": {
    title: "Contact VTKS Hub | Membership & Support",
    description:
      "Contact VTKS Hub for membership information, educational resources, platform assistance and general enquiries.",
    keywords:
      "contact VTKS, VTKS support, membership enquiry, trading education support",
    indexable: true,
  },

  "/login": {
    title: "Login | VTKS Hub",
    description: "Log in to your VTKS Hub account.",
    keywords: "",
    indexable: false,
  },

  "/register": {
    title: "Create Account | VTKS Hub",
    description: "Create your VTKS Hub account.",
    keywords: "",
    indexable: false,
  },

  "/forgot-password": {
    title: "Forgot Password | VTKS Hub",
    description: "Recover access to your VTKS Hub account.",
    keywords: "",
    indexable: false,
  },

  "/reset-password": {
    title: "Reset Password | VTKS Hub",
    description: "Create a new password for your VTKS Hub account.",
    keywords: "",
    indexable: false,
  },
};

const getPageConfig = (pathname) => {
  if (pathname.startsWith("/trade/")) {
    return {
      title: "Trade Details | VTKS Hub",
      description:
        "View VTKS trade details including entry, current price, targets, stop-loss, thesis and performance.",
      keywords:
        "VTKS trade details, stock analysis, trading setup, target and stop loss",
      indexable: true,
    };
  }

  return (
    seoConfig[pathname] || {
      title: `Page Not Found | ${SITE_NAME}`,
      description: DEFAULT_DESCRIPTION,
      keywords: "",
      indexable: false,
    }
  );
};

export default function RouteSEO() {
  const { pathname } = useLocation();
  const config = getPageConfig(pathname);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "";

  const cleanPath =
    pathname === "/"
      ? "/"
      : pathname.replace(/\/+$/, "");

  const canonicalUrl = origin
    ? `${origin}${cleanPath}`
    : "";

  const socialImageUrl = origin
    ? `${origin}/og-image.png`
    : "";

  const robotsContent = config.indexable
    ? "index, follow, max-image-preview:large"
    : "noindex, nofollow";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: origin || undefined,
    logo: origin
      ? `${origin}/favicon.svg`
      : undefined,
    description: DEFAULT_DESCRIPTION,
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: origin || undefined,
    description: DEFAULT_DESCRIPTION,
  };

  return (
    <Helmet>
      <html lang="en" />

      <title>{config.title}</title>

      <meta
        name="description"
        content={config.description}
      />

      {config.keywords && (
        <meta
          name="keywords"
          content={config.keywords}
        />
      )}

      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />

      <meta name="author" content="VTKS Hub" />
      <meta name="theme-color" content="#0f172a" />

      {canonicalUrl && (
        <link rel="canonical" href={canonicalUrl} />
      )}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={config.title} />
      <meta
        property="og:description"
        content={config.description}
      />

      {canonicalUrl && (
        <meta property="og:url" content={canonicalUrl} />
      )}

      {socialImageUrl && (
        <meta
          property="og:image"
          content={socialImageUrl}
        />
      )}

      <meta
        property="og:image:alt"
        content="VTKS Hub – Structured Trading and Investment Education"
      />

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

      {socialImageUrl && (
        <meta
          name="twitter:image"
          content={socialImageUrl}
        />
      )}

      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>

      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
    </Helmet>
  );
}