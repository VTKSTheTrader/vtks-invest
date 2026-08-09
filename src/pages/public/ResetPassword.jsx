import { useState } from "react";
import { updatePassword } from "../../services/authService";
import "./ResetPassword.css";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      return alert("Please fill both fields.");
    }

    if (password !== confirmPassword) {
      return alert("Passwords do not match.");
    }

    if (password.length < 6) {
      return alert("Password must be at least 6 characters.");
    }

    try {
      setLoading(true);

      await updatePassword(password);

      alert("Password updated successfully.");

      window.location.href = "/login";
    } catch (error) {
      alert(error.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="reset-page">
      <section className="reset-card">

        <div className="reset-logo">
          <span className="reset-vtks">VTKS</span>
          <span className="reset-hub">INVEST</span>
        </div>

        <span className="reset-badge">
          🔐 Secure Password Reset
        </span>

        <h1>Create New Password</h1>

        <p>
          Your new password should be at least 6 characters long.
        </p>

        <form
          className="reset-form"
          onSubmit={handleReset}
        >

          <div className="password-group">

            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            <button
              type="button"
              className="eye-btn"
              onClick={() =>
                setShowPassword(!showPassword)
              }
            >
              {showPassword ? "🙈" : "👁"}
            </button>

          </div>

          <div className="password-group">

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
            />

            <button
              type="button"
              className="eye-btn"
              onClick={() =>
                setShowPassword(!showPassword)
              }
            >
              {showPassword ? "🙈" : "👁"}
            </button>

          </div>

          <button
            className="reset-button"
            disabled={loading}
          >
            {loading
              ? "Updating..."
              : "Update Password"}
          </button>

        </form>

      </section>
    </main>
  );
}