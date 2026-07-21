import "./PreviewModal.css";

const getYouTubeEmbedUrl = (url) => {
  if (!url) return "";

  const videoId =
    url.includes("watch?v=")
      ? url.split("watch?v=")[1].split("&")[0]
      : url.includes("youtu.be/")
      ? url.split("youtu.be/")[1].split("?")[0]
      : "";

  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};

export default function PreviewModal({ resource, onClose }) {
  if (!resource) return null;

  const isYouTube =
    resource.url.includes("youtube.com") || resource.url.includes("youtu.be");

  return (
    <div className="modal-overlay">
      <div
        style={{
          background: "#fff",
          width: "900px",
          maxWidth: "95%",
          borderRadius: "16px",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <h2>{resource.title}</h2>
          <button onClick={onClose}>✕</button>
        </div>

        {resource.type === "Video" && isYouTube && (
          <iframe
            title={resource.title}
            src={getYouTubeEmbedUrl(resource.url)}
            width="100%"
            height="520"
            allowFullScreen
            style={{ border: "none", borderRadius: "12px" }}
          />
        )}

        {resource.type === "Video" && !isYouTube && (
          <video
            width="100%"
            controls
            controlsList="nodownload"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
          >
            <source src={resource.url} />
          </video>
        )}

        {resource.type === "PDF" && (
          <iframe
            title="PDF"
            src={resource.url}
            width="100%"
            height="600"
          />
        )}

        {resource.type === "Link" && (
          <iframe
            title="Resource"
            src={resource.url}
            width="100%"
            height="600"
          />
        )}
      </div>
    </div>
  );
}