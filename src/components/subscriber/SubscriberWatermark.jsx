import "./SubscriberWatermark.css";

const maskEmail = (email = "") => {
  if (!email || !email.includes("@")) {
    return "VTKS MEMBER";
  }

  const [name, domain] = email.split("@");

  const visible =
    name.length <= 3
      ? name.slice(0, 1)
      : name.slice(0, 3);

  return `${visible}***@${domain}`;
};

export default function SubscriberWatermark() {
  const email =
    localStorage.getItem("vtks_user_email") || "";

  const maskedEmail = maskEmail(email);

  return (
    <div
      className="vtks-watermark-layer"
      aria-hidden="true"
    >
      {Array.from({ length: 15 }).map(
        (_, index) => (
          <div
            className="vtks-watermark-text"
            key={index}
          >
            VTKS INVEST • {maskedEmail}
          </div>
        )
      )}
    </div>
  );
}