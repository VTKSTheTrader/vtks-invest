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

  const [
    resource,
    setResource,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* =========================================================
     LOAD RESOURCE
  ========================================================= */

  useEffect(() => {
    loadResource();
  }, [id]);

  const loadResource =
    async () => {
      try {
        setLoading(true);
        setError("");

        const rows =
          await getSubscriberLibrary();

        const found =
          (rows || []).find(
            (item) =>
              String(item.id) ===
              String(id)
          );

        if (!found) {
          throw new Error(
            "Resource not found or unavailable."
          );
        }

        setResource(found);
      } catch (err) {
        console.error(
          "Resource viewer error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load resource."
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     URL
  ========================================================= */

  const resourceUrl =
    useMemo(() => {
      if (!resource) {
        return "";
      }

      return (
        resource.video_url ||
        resource.file_url ||
        resource.resource_url ||
        resource.url ||
        ""
      );
    }, [resource]);

  /* =========================================================
     TYPE
  ========================================================= */

  const resourceType =
    String(
      resource?.type || ""
    )
      .trim()
      .toLowerCase();

  /* =========================================================
     YOUTUBE
  ========================================================= */

  const getYouTubeEmbedUrl = (
    url
  ) => {
    if (!url) {
      return "";
    }

    try {
      let videoId = "";

      if (
        url.includes(
          "youtube.com/watch?v="
        )
      ) {
        videoId = url
          .split(
            "youtube.com/watch?v="
          )[1]
          .split("&")[0];
      } else if (
        url.includes(
          "youtu.be/"
        )
      ) {
        videoId = url
          .split("youtu.be/")[1]
          .split("?")[0];
      } else if (
        url.includes(
          "youtube.com/embed/"
        )
      ) {
        videoId = url
          .split(
            "youtube.com/embed/"
          )[1]
          .split("?")[0];
      } else if (
        url.includes(
          "youtube.com/shorts/"
        )
      ) {
        videoId = url
          .split(
            "youtube.com/shorts/"
          )[1]
          .split("?")[0];
      }

      return videoId
        ? `https://www.youtube.com/embed/${videoId}`
        : "";
    } catch {
      return "";
    }
  };

  const youtubeEmbedUrl =
    getYouTubeEmbedUrl(
      resourceUrl
    );

  /* =========================================================
     FILE HELPERS
  ========================================================= */

  const lowerUrl =
    resourceUrl.toLowerCase();

  const isImage =
    resourceType.includes(
      "image"
    ) ||
    /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/.test(
      lowerUrl
    );

  const isPdf =
    resourceType.includes(
      "pdf"
    ) ||
    /\.pdf(\?.*)?$/.test(
      lowerUrl
    );

  const isDirectVideo =
    resourceType.includes(
      "video"
    ) &&
    (
      lowerUrl.includes(".mp4") ||
      lowerUrl.includes(".webm") ||
      lowerUrl.includes(".ogg")
    );

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={messageBox}>
          Loading resource...
        </div>
      </main>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (
    error ||
    !resource
  ) {
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

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main style={pageStyle}>

      {/* =====================================================
          HEADER
      ===================================================== */}

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

            <span>
              •
            </span>

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

      {/* =====================================================
          DESCRIPTION
      ===================================================== */}

      {resource.description && (

        <section
          style={
            descriptionCard
          }
        >

          <h2
            style={{
              marginTop: 0,
            }}
          >
            About this resource
          </h2>

          <p
            style={
              descriptionText
            }
          >
            {
              resource.description
            }
          </p>

        </section>

      )}

      {/* =====================================================
          VIEWER
      ===================================================== */}

      <section style={viewerCard}>

        {!resourceUrl ? (

          <div style={emptyViewer}>
            Resource URL is
            unavailable.
          </div>

        ) : youtubeEmbedUrl ? (

          <div
            style={
              videoContainer
            }
          >

            <iframe
              src={
                youtubeEmbedUrl
              }
              title={
                resource.title ||
                "VTKS Video"
              }
              style={iframeStyle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />

          </div>

        ) : isImage ? (

          <div
            style={
              imageContainer
            }
          >

            <img
              src={resourceUrl}
              alt={
                resource.title ||
                "VTKS Analysis"
              }
              style={imageStyle}
            />

          </div>

        ) : isPdf ? (

          <iframe
            src={resourceUrl}
            title={
              resource.title ||
              "VTKS PDF"
            }
            style={documentFrame}
          />

        ) : isDirectVideo ? (

          <video
            src={resourceUrl}
            controls
            style={videoStyle}
          >
            Your browser does not
            support this video.
          </video>

        ) : (

          <>

            <div style={externalInfo}>

              <strong>
                VTKS Resource Viewer
              </strong>

              <p>
                This resource is
                displayed inside VTKS
                whenever the source
                website allows
                embedding.
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

          </>

        )}

      </section>

      {/* =====================================================
          FALLBACK
      ===================================================== */}

      {resourceUrl && (

        <section style={fallbackBox}>

          <p>
            If the resource does not
            display above, the source
            website may block
            embedding.
          </p>

          <a
            href={resourceUrl}
            target="_blank"
            rel="noreferrer"
            style={
              externalButton
            }
          >
            Open Original Resource ↗
          </a>

        </section>

      )}

    </main>
  );
}

/* =========================================================
   STYLES
========================================================= */

const pageStyle = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "40px",
  boxSizing: "border-box",
};

const headerStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  gap: "24px",
  flexWrap: "wrap",
  background:
    "linear-gradient(135deg, #0f172a, #1e3a8a)",
  color: "#ffffff",
  borderRadius: "24px",
  padding: "32px",
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
  fontSize: "34px",
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
  padding: "20px",
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
};

const imageStyle = {
  display: "block",
  maxWidth: "100%",
  maxHeight: "80vh",
  margin: "0 auto",
  objectFit: "contain",
  borderRadius: "12px",
};

const videoStyle = {
  display: "block",
  width: "100%",
  maxHeight: "80vh",
  background: "#000000",
  borderRadius: "14px",
};

const externalInfo = {
  marginBottom: "16px",
  color: "#475569",
};

const emptyViewer = {
  padding: "60px 20px",
  textAlign: "center",
  color: "#64748b",
};

const fallbackBox = {
  marginTop: "18px",
  padding: "18px 20px",
  background: "#eff6ff",
  border:
    "1px solid #bfdbfe",
  borderRadius: "14px",
  color: "#475569",
};

const externalButton = {
  display: "inline-block",
  marginTop: "8px",
  textDecoration: "none",
  background: "#2563eb",
  color: "#ffffff",
  padding: "10px 16px",
  borderRadius: "10px",
  fontWeight: 800,
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