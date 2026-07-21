import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import { loginUser } from "../../services/authService";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      alert(
        "Please enter email and password"
      );
      return;
    }

    try {
      setLoading(true);

      const { profile } =
        await loginUser(
          email.trim(),
          password
        );

      const role = String(
        profile.role || ""
      )
        .trim()
        .toLowerCase();

      localStorage.setItem(
        "vtks_user_role",
        role
      );

      localStorage.setItem(
        "vtks_user_email",
        profile.email || email.trim()
      );

      localStorage.setItem(
        "vtks_user_name",
        profile.full_name || ""
      );

      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      alert(
        error?.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <span className="login-brand-vtks">
            VTKS
          </span>

          <span className="login-brand-hub">
            HUB
          </span>
        </div>

        <div className="login-heading">
          <span className="login-badge">
            🔐 Secure Member Access
          </span>

          <h1>Welcome back</h1>

          <p>
            Login to access your VTKS
            dashboard, portfolio, scanners
            and learning resources.
          </p>
        </div>

        <form
          className="login-form"
          onSubmit={handleLogin}
        >
          <div className="login-field">
            <label htmlFor="login-email">
              Email address
            </label>

            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">
              Password
            </label>

            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
            />
          </div>

          <button
            type="submit"
            className="login-submit-button"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login to VTKS HUB"}
          </button>
        </form>

        <div className="login-links">
          <Link to="/forgot-password">
            Forgot password?
          </Link>

          <p>
            New subscriber?{" "}
            <Link to="/register">
              Create account
            </Link>
          </p>
        </div>

        <p className="login-security-note">
          🔒 Your account information is
          securely protected.
        </p>
      </section>
    </main>
  );
}