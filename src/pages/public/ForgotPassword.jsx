import { useState } from "react";
import { Link } from "react-router-dom";

import { sendResetEmail } from "../../services/authService";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      alert("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      await sendResetEmail(cleanEmail);

      alert(
        "✅ Password reset link sent. Please check your email."
      );
    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      alert(
        error?.message ||
          "Failed to send reset email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="forgot-page">
      <section className="forgot-card">
        <div className="forgot-brand">
          <span className="forgot-brand-vtks">
            VTKS
          </span>

          <span className="forgot-brand-hub">
            INVEST
          </span>
        </div>

        <div className="forgot-heading">
          <span className="forgot-badge">
            🔐 Password Recovery
          </span>

          <h1>Forgot Password?</h1>

          <p>
            Enter your registered email address and we’ll
            send you a secure password reset link.
          </p>
        </div>

        <form
          className="forgot-form"
          onSubmit={handleSubmit}
        >
          <div className="forgot-field">
            <label htmlFor="forgot-email">
              Email address
            </label>

            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />
          </div>

          <button
            type="submit"
            className="forgot-submit-button"
            disabled={loading}
          >
            {loading
              ? "Sending..."
              : "Send Reset Link"}
          </button>
        </form>

        <div className="forgot-links">
          <Link to="/login">
            ← Back to Login
          </Link>
        </div>

        <p className="forgot-security-note">
          🔒 Your account information is securely protected.
        </p>
      </section>
    </main>
  );
}
