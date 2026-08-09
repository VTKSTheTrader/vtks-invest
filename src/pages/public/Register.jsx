import { useState } from "react";
import { Link } from "react-router-dom";

import { registerUser } from "../../services/authService";
import vtksLogo from "./vtks-invest-logo.png";

import "./Register.css";

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(value || "")
      .trim()
      .toLowerCase()
  );

export default function Register() {
  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [mobile, setMobile] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [registeredEmail, setRegisteredEmail] =
    useState("");

  const [registrationComplete, setRegistrationComplete] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const handleRegister = async (event) => {
    event.preventDefault();

    setFormError("");

    const normalizedFullName =
      fullName.trim();

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    const normalizedMobile =
      mobile.trim();

    if (
      !normalizedFullName ||
      !normalizedEmail ||
      !password ||
      !confirmPassword
    ) {
      setFormError(
        "Please fill in all required fields."
      );

      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setFormError(
        "Please enter a valid email address."
      );

      return;
    }

    if (password.length < 6) {
      setFormError(
        "Password must contain at least 6 characters."
      );

      return;
    }

    if (password !== confirmPassword) {
      setFormError(
        "Password and confirm password do not match."
      );

      return;
    }

    try {
      setLoading(true);

      await registerUser({
        fullName: normalizedFullName,
        email: normalizedEmail,
        mobile: normalizedMobile,
        password,
      });

      setRegisteredEmail(
        normalizedEmail
      );

      setRegistrationComplete(
        true
      );

      setFullName("");
      setEmail("");
      setMobile("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      const message = String(
        error?.message || ""
      ).toLowerCase();

      if (
        message.includes(
          "already registered"
        ) ||
        message.includes(
          "already exists"
        ) ||
        message.includes(
          "user already"
        )
      ) {
        setFormError(
          "An account may already exist with this email address. Please log in or use Forgot Password."
        );

        return;
      }

      if (
        message.includes(
          "invalid email"
        ) ||
        message.includes(
          "email address is invalid"
        )
      ) {
        setFormError(
          "Please enter a valid email address."
        );

        return;
      }

      if (
        message.includes("password") &&
        message.includes("characters")
      ) {
        setFormError(
          "Please use a stronger password containing at least 6 characters."
        );

        return;
      }

      if (
        message.includes(
          "rate limit"
        ) ||
        message.includes(
          "too many requests"
        )
      ) {
        setFormError(
          "Too many registration attempts. Please wait a few minutes and try again."
        );

        return;
      }

      setFormError(
        error?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (registrationComplete) {
    return (
      <main className="register-page">
        <section className="register-card register-success-card">

          {/* VTKS INVEST LOGO */}
          <div className="register-logo-wrapper register-logo-success">
            <img
              src={vtksLogo}
              alt="VTKS INVEST"
              className="register-logo"
            />
          </div>

          <div className="register-success-icon">
            ✉️
          </div>

          <div className="register-brand">
            <span className="register-brand-vtks">
              VTKS
            </span>

            <span className="register-brand-hub">
              INVEST
            </span>
          </div>

          <div className="register-success-content">
            <span className="register-badge">
              Registration Submitted
            </span>

            <h1>
              Verify Your Email
            </h1>

            <p>
              A verification email has been sent to:
            </p>

            <div className="register-email-highlight">
              {registeredEmail}
            </div>

            <div className="register-next-steps">
              <h2>
                Next Steps
              </h2>

              <div className="register-step">
                <span>1</span>

                <p>
                  Open your registered email inbox.
                </p>
              </div>

              <div className="register-step">
                <span>2</span>

                <p>
                  Check your Spam or Junk folder if
                  the email is not visible.
                </p>
              </div>

              <div className="register-step">
                <span>3</span>

                <p>
                  Click the verification link sent
                  by VTKS INVEST.
                </p>
              </div>

              <div className="register-step">
                <span>4</span>

                <p>
                  Return to VTKS INVEST and log in.
                </p>
              </div>
            </div>

            <div className="register-verification-note">
              Your account will remain inactive until
              your email address has been verified.
            </div>

            <p className="register-existing-account-note">
              Already registered with this email? Use
              Login or Forgot Password instead.
            </p>

            <div className="register-success-actions">
              <Link
                to="/login"
                className="register-success-primary"
              >
                Go to Login
              </Link>

              <Link
                to="/forgot-password"
                className="register-success-secondary"
              >
                Forgot Password
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="register-page">
      <section className="register-card">

        {/* VTKS INVEST LOGO */}
        <div className="register-logo-wrapper">
          <img
            src={vtksLogo}
            alt="VTKS INVEST"
            className="register-logo"
          />
        </div>

        {/* BRAND */}
        <div className="register-brand">
          <span className="register-brand-vtks">
            VTKS
          </span>

          <span className="register-brand-hub">
            INVEST
          </span>
        </div>

        <div className="register-heading">
          <span className="register-badge">
            🚀 Join VTKS Community
          </span>

          <h1>
            Create Account
          </h1>

          <p>
            Register to access VTKS indicators,
            scanners, portfolio tracking and premium
            educational resources.
          </p>
        </div>

        {formError && (
          <div
            className="register-error-message"
            role="alert"
          >
            {formError}
          </div>
        )}

        <form
          className="register-form"
          onSubmit={handleRegister}
          noValidate
        >
          <div className="register-field">
            <label htmlFor="register-full-name">
              Full Name
            </label>

            <input
              id="register-full-name"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              autoComplete="name"
              disabled={loading}
              onChange={(event) =>
                setFullName(
                  event.target.value
                )
              }
            />
          </div>

          <div className="register-field">
            <label htmlFor="register-email">
              Email Address
            </label>

            <input
              id="register-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              autoComplete="email"
              inputMode="email"
              disabled={loading}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
            />
          </div>

          <div className="register-field">
            <label htmlFor="register-mobile">
              Mobile Number
            </label>

            <input
              id="register-mobile"
              type="tel"
              placeholder="Enter mobile number"
              value={mobile}
              autoComplete="tel"
              inputMode="tel"
              disabled={loading}
              onChange={(event) =>
                setMobile(
                  event.target.value
                )
              }
            />
          </div>

          <div className="register-field">
            <label htmlFor="register-password">
              Password
            </label>

            <input
              id="register-password"
              type="password"
              placeholder="Create password"
              value={password}
              autoComplete="new-password"
              disabled={loading}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
            />

            <small className="register-field-help">
              Use at least 6 characters.
            </small>
          </div>

          <div className="register-field">
            <label htmlFor="register-confirm-password">
              Confirm Password
            </label>

            <input
              id="register-confirm-password"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              autoComplete="new-password"
              disabled={loading}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
            />
          </div>

          <button
            type="submit"
            className="register-submit-button"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>
        </form>

        <div className="register-links">
          <span>
            Already have an account?
          </span>

          <Link to="/login">
            Login
          </Link>
        </div>

        <div className="register-links">
          <span>
            Forgot your password?
          </span>

          <Link to="/forgot-password">
            Reset Password
          </Link>
        </div>

      </section>
    </main>
  );
}