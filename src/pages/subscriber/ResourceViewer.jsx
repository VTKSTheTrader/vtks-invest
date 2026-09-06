import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  getSubscriberLibrary,
} from "../../services/subscriberService";

export default function ResourceViewer() {
  const { id } = useParams();

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =====================================================
     LOAD RESOURCE
  ===================================================== */

  useEffect(() => {
    let active = true;

    const loadResource = async () => {
      try {
        setLoading(true);
        setError("");

        const rows =
          await getSubscriberLibrary();

        const found = (rows || []).find(
          (item) =>
            String(item.id) === String(id)
        );

        if (!found) {
          throw new Error(
            "Resource not found or unavailable."
          );
        }

        if (active) {
          setResource(found);
        }
      } catch (err) {
        console.error(
          "Resource viewer error:",
          err
        );

        if (active) {
          setError(
            err?.message ||
              "Unable to load resource."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadResource();

    return () => {
      active = false;
    };
  }, [id]);

  /* =====================================================
     RESOURCE URL
  ===================================================== */

  const resourceUrl = useMemo(() => {
    if (!resource) return "";

    return (
      resource.video_url ||
      resource.file_url ||
      resource.resource_url ||
      resource.url ||
      ""
    );
  }, [resource]);

  const resourceType = String(
    resource?.type || ""
  )
    .trim()
    .toLowerCase();

  /* =====================================================
     YOUTUBE
  ===================================================== */

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return "";

    try {
      const parsed = new URL(url);

      let videoId = "";

      if (
        parsed.hostname.includes(
          "youtu.be"
        )
      ) {
        videoId =
          parsed.pathname
            .replace("/", "")
            .split("/")[0];
      } else if (
        parsed.pathname.includes(
          "/watch"
        )
      ) {
        videoId =
          parsed.searchParams.get("v") ||
          "";
      } else if (
        parsed.pathname.includes(
          "/embed/"
        )
      ) {
        videoId =
          parsed.pathname
            .split("/embed/")[1]
            ?.split("/")[0] || "";
      } else if (
        parsed.pathname.includes(
          "/shorts/"
        )
      ) {
        videoId =
          parsed.pathname
            .split("/shorts/")[1]
            ?.split("/")[0] || "";
      }

      if (!videoId) {
        return "";
      }

      return `https://www.youtube-nocookie.com/embed/${videoId}`;
    } catch {
      return "";
    }
  };

  const youtubeEmbedUrl =
    getYouTubeEmbedUrl(resourceUrl);

  /* =====================================================
     TYPE DETECTION
  ===================================================== */

  const lowerUrl =
    String(resourceUrl || "")
      .toLowerCase();

  const cleanUrl =
    lowerUrl.split("?")[0];

  const isImage =
    resourceType.includes("image") ||
    /\.(jpg|jpeg|png|webp|gif|svg|avif)$/i.test(
      cleanUrl
    );

  const isPdf =
    resourceType.includes("pdf") ||
    /\.pdf$/i.test(cleanUrl);

  const isDirectVideo =
    !youtubeEmbedUrl &&
    (
      resourceType.includes("video") ||
      /\.(mp4|webm|ogg|mov)$/i.test(
        cleanUrl
      )
    );

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={messageBox}>
          Loading resource...
        </div>
      </main>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (error || !resource) {
    return (
      <main style={pageStyle}>
        <div style={messageBox}>
          <h2>
            Resource unavailable
          </h2>

          <p>
            {error}
          </p>

          <Link
            to="/dashboard/library"
            style={backButton}
          >
            ← Back to Library
          </Link>
        </div>
      </main>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main style={pageStyle}>

      {/* ===============================================
          HEADER
      =============================================== */}

      <section style={headerStyle}>

        <div>
          <span style={badgeStyle}>
            VTKS Knowledge Vault
          </span>

          <h1 style={titleStyle}>
            {resource.title ||
              "VTKS Resource"}
          </h1>

          <div style={metaStyle}>
            <span>
              {resource.type ||
                "Resource"}
            </span>

            <span>•</span>

            <span>
              {resource.category ||
                "General"}
            </span>
          </div>
        </div>

        <Link
          to="/dashboard/library"
          style={backButton}
        >
          ← Library
        </Link>

      </section>

      {/* ===============================================
          DESCRIPTION
      =============================================== */}

      {resource.description && (
        <section style={descriptionCard}>

          <h2
            style={{
              marginTop: 0,
              color: "#0f172a",
            }}
          >
            About this resource
          </h2>

          <p style={descriptionText}>
            {resource.description}
          </p>

        </section>
      )}

      {/* ===============================================
          VIEWER
      =============================================== */}

      <section style={viewerCard}>

        {!resourceUrl ? (

          <div style={emptyViewer}>
            Resource URL is unavailable.
          </div>

        ) : youtubeEmbedUrl ? (

          /* ===============================
             YOUTUBE
          =============================== */

          <div style={videoContainer}>

            <iframe
              src={youtubeEmbedUrl}
              title={
                resource.title ||
                "VTKS Video"
              }
              style={iframeStyle}
              allow="
                accelerometer;
                autoplay;
                clipboard-write;
                encrypted-media;
                gyroscope;
                picture-in-picture;
                web-share
              "
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />

          </div>

        ) : isImage ? (

          /* ===============================
             IMAGE
          =============================== */

          <div style={imageContainer}>

            <img
              src={resourceUrl}
              alt={
                resource.title ||
                "VTKS Resource"
              }
              style={imageStyle}
            />

          </div>

        ) : isPdf ? (

          /* ===============================
             PDF
          =============================== */

          <iframe
            src={`${resourceUrl}#toolbar=0&navpanes=0`}
            title={
              resource.title ||
              "VTKS PDF"
            }
            style={documentFrame}
          />

        ) : isDirectVideo ? (

          /* ===============================
             DIRECT VIDEO
          =============================== */

          <video
            src={resourceUrl}
            controls
            controlsList="nodownload"
            style={videoStyle}
          >
            Your browser does not support
            this video.
          </video>

        ) : (

          /* ===============================
             GENERIC EMBED
          =============================== */

          <div>
            <div style={internalInfo}>

              <strong>
                VTKS Resource Viewer
              </strong>

              <p style={{ marginBottom: 0 }}>
                This resource is being displayed
                inside VTKS.
              </p>

            </div>

            <iframe
              src={resourceUrl}
              title={
                resource.title ||
                "VTKS Resource"
              }
              style={documentFrame}
            />
          </div>

        )}

      </section>

    </main>
  );
}

/* =====================================================
   STYLES
===================================================== */

const pageStyle = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px",
  boxSizing: "border-box",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "24px",
  flexWrap: "wrap",

  background:
    "linear-gradient(135deg, #0f172a, #1e3a8a)",

  color: "#ffffff",
  borderRadius: "22px",
  padding: "28px 30px",
  marginBottom: "24px",
};

const badgeStyle = {
  display: "inline-block",
  padding: "7px 12px",
  marginBottom: "12px",
  borderRadius: "999px",

  background:
    "rgba(255,255,255,.12)",

  border:
    "1px solid rgba(255,255,255,.18)",

  color: "#bfdbfe",
  fontSize: "13px",
  fontWeight: 800,
};

const titleStyle = {
  margin: "0 0 10px",
  fontSize: "32px",
};

const metaStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  color: "#dbeafe",
  fontSize: "14px",
};

const backButton = {
  display: "inline-block",
  textDecoration: "none",
  background: "#ffffff",
  color: "#2563eb",
  padding: "11px 18px",
  borderRadius: "11px",
  fontWeight: 800,
};

const descriptionCard = {
  background: "#ffffff",

  border:
    "1px solid #e2e8f0",

  borderRadius: "18px",
  padding: "24px",
  marginBottom: "24px",

  boxShadow:
    "0 8px 24px rgba(15,23,42,.05)",
};

const descriptionText = {
  marginBottom: 0,
  color: "#64748b",
  lineHeight: 1.8,
  whiteSpace: "pre-wrap",
};

const viewerCard = {
  background: "#ffffff",

  border:
    "1px solid #e2e8f0",

  borderRadius: "20px",

  padding: "18px",

  boxShadow:
    "0 12px 30px rgba(15,23,42,.06)",

  overflow: "hidden",
};

const videoContainer = {
  position: "relative",
  width: "100%",
  paddingTop: "56.25%",
  overflow: "hidden",
  borderRadius: "14px",
  background: "#000000",
};

const iframeStyle = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  border: 0,
};

const documentFrame = {
  display: "block",
  width: "100%",
  height: "75vh",
  minHeight: "600px",

  border:
    "1px solid #e2e8f0",

  borderRadius: "14px",
  background: "#ffffff",
};

const imageContainer = {
  width: "100%",
  textAlign: "center",
  overflow: "hidden",
};

const imageStyle = {
  display: "block",
  maxWidth: "100%",
  maxHeight: "82vh",
  margin: "0 auto",
  objectFit: "contain",
  borderRadius: "12px",
};

const videoStyle = {
  display: "block",
  width: "100%",
  maxHeight: "82vh",
  background: "#000000",
  borderRadius: "14px",
};

const internalInfo = {
  marginBottom: "16px",
  padding: "14px 16px",
  background: "#eff6ff",

  border:
    "1px solid #bfdbfe",

  borderRadius: "12px",
  color: "#475569",
};

const emptyViewer = {
  padding: "60px 20px",
  textAlign: "center",
  color: "#64748b",
};

const messageBox = {
  maxWidth: "700px",
  margin: "80px auto",
  background: "#ffffff",
  padding: "35px",
  textAlign: "center",
  borderRadius: "20px",
  color: "#64748b",
};