import { useState } from "react";
import { updatePassword } from "../../services/authService";

export default function ChangePassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) return alert("Please fill both fields.");
    if (password !== confirmPassword) return alert("Passwords do not match.");
    if (password.length < 6) return alert("Password must be at least 6 characters.");

    try {
      setLoading(true);
      await updatePassword(password);
      setPassword("");
      setConfirmPassword("");
      alert("✅ Password changed successfully.");
    } catch (error) {
      alert(error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleChangePassword} style={{ marginTop: 20 }}>
      <div style={passwordBox}>
        <input
          type={show ? "text" : "password"}
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        <span onClick={() => setShow(!show)} style={eyeStyle}>
          {show ? "🙈" : "👁️"}
        </span>
      </div>

      <div style={passwordBox}>
        <input
          type={show ? "text" : "password"}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={inputStyle}
        />
        <span onClick={() => setShow(!show)} style={eyeStyle}>
          {show ? "🙈" : "👁️"}
        </span>
      </div>

      <button disabled={loading} style={buttonStyle}>
        {loading ? "Updating..." : "🔐 Change Password"}
      </button>
    </form>
  );
}

const passwordBox = {
  position: "relative",
  marginBottom: 16,
};

const inputStyle = {
  width: "100%",
  padding: "15px 45px 15px 15px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
};

const eyeStyle = {
  position: "absolute",
  right: 14,
  top: "50%",
  transform: "translateY(-50%)",
  cursor: "pointer",
};

const buttonStyle = {
  width: "100%",
  padding: 16,
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 14,
  fontWeight: 800,
};