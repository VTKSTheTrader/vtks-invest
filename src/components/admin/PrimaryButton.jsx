import "./PrimaryButton.css";

export default function PrimaryButton({
  children,
  onClick,
  type = "button",
}) {
  return (
    <button
      className="primary-button"
      type={type}
      onClick={onClick}
    >
      {children}
    </button>
  );
}