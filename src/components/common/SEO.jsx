import { Helmet } from "react-helmet-async";

function SEO({
  title,
  description,
  keywords = "",
  canonical = "",
  image = "https://vtks-hub.vercel.app/og-image.png",
}) {
  return (
    <Helmet>
      {/* Primary SEO */}
      <title>{title}</title>

      <meta
        name="description"
        content={description}
      />

      {keywords && (
        <meta
          name="keywords"
          content={keywords}
        />
      )}

      <meta
        name="robots"
        content="index,follow"
      />

      {/* Canonical */}
      {canonical && (
        <link
          rel="canonical"
          href={canonical}
        />
      )}

      {/* Open Graph */}
      <meta
        property="og:type"
        content="website"
      />

      <meta
        property="og:title"
        content={title}
      />

      <meta
        property="og:description"
        content={description}
      />

      {canonical && (
        <meta
          property="og:url"
          content={canonical}
        />
      )}

      <meta
        property="og:image"
        content={image}
      />

      {/* Twitter / X */}
      <meta
        name="twitter:card"
        content="summary_large_image"
      />

      <meta
        name="twitter:title"
        content={title}
      />

      <meta
        name="twitter:description"
        content={description}
      />

      <meta
        name="twitter:image"
        content={image}
      />
    </Helmet>
  );
}

export default SEO;