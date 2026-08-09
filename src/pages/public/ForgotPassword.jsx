import { useState } from "react";
import { Link } from "react-router-dom";

import { sendResetEmail } from "../../services/authService";
import vtksLogo from "./vtks-invest-logo.png";

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

        {/* VTKS INVEST LOGO */}
        <div className="forgot-logo-wrapper">
          <img
            src={vtksLogo}
            alt="VTKS INVEST"
            className="forgot-logo"
          />
        </div>

        {/* BRAND */}
        <div className="forgot-brand">
          <span className="forgot-brand-vtks">
            VTKS
          </span>

          <span className="forgot-brand-hub">
            INVEST
          </span>
        </div>

        {/* HEADING */}
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

        {/* FORM */}
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
              disabled={loading}
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

        {/* LINKS */}
        <div className="forgot-links">
          <Link to="/login">
            ← Back to Login
          </Link>
        </div>

        {/* SECURITY NOTE */}
        <p className="forgot-security-note">
          🔒 Your account information is securely protected.
        </p>

      </section>
    </main>
  );
}