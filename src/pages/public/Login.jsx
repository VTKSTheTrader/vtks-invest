import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  loginUser,
} from "../../services/authService";

import {
  getSubscriberMembership,
} from "../../services/subscriberService";

import vtksLogo from "./vtks-invest-logo.png";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    accessDenied,
    setAccessDenied,
  ] = useState(false);

  /* =====================================================
     LOGIN
  ===================================================== */

  const handleLogin = async (event) => {
    event.preventDefault();

    const normalizedEmail = String(
      email || ""
    )
      .trim()
      .toLowerCase();

    if (
      !normalizedEmail ||
      !password
    ) {
      alert(
        "Please enter email and password"
      );

      return;
    }

    try {
      setLoading(true);

      const {
        user,
        profile,
        isAdmin,
      } =
        await loginUser(
          normalizedEmail,
          password
        );

      /* =================================================
         ADMIN

         Admin continues using the SAME login page.
      ================================================= */

      if (isAdmin) {
        localStorage.setItem(
          "vtks_user_role",
          "admin"
        );

        localStorage.setItem(
          "vtks_user_email",
          profile?.email ||
            user?.email ||
            normalizedEmail
        );

        localStorage.setItem(
          "vtks_user_name",
          profile?.full_name ||
            ""
        );

        navigate(
          "/admin",
          {
            replace: true,
          }
        );

        return;
      }

      /* =================================================
         NORMAL REGISTERED USER / SUBSCRIBER

         Real access comes from members_v2.
      ================================================= */

      const membership =
        await getSubscriberMembership(
          profile?.email ||
            user?.email ||
            normalizedEmail
        );

      const hasDashboardAccess =
        membership
          ?.dashboard_access ===
          true &&
        membership
          ?.access_denied !==
          true;

      /* =================================================
         REGISTERED USER - ACCESS OFF
      ================================================= */

      if (!hasDashboardAccess) {
        /*
         * User remains authenticated with Supabase.
         *
         * Do NOT assign subscriber role.
         */

        localStorage.removeItem(
          "vtks_user_role"
        );

        localStorage.setItem(
          "vtks_user_email",
          profile?.email ||
            user?.email ||
            normalizedEmail
        );

        localStorage.setItem(
          "vtks_user_name",
          profile?.full_name ||
            ""
        );

        setAccessDenied(true);

        return;
      }

      /* =================================================
         SUBSCRIBER - ACCESS ON
      ================================================= */

      localStorage.setItem(
        "vtks_user_role",
        "subscriber"
      );

      localStorage.setItem(
        "vtks_user_email",
        membership?.email ||
          profile?.email ||
          user?.email ||
          normalizedEmail
      );

      localStorage.setItem(
        "vtks_user_name",
        membership?.name ||
          profile?.full_name ||
          ""
      );

      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      /*
       * Remove any stale browser role.
       */

      localStorage.removeItem(
        "vtks_user_role"
      );

      alert(
        error?.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     CLOSE ACCESS MODAL
  ===================================================== */

  const handleAccessModalClose =
    () => {
      setAccessDenied(false);

      navigate(
        "/",
        {
          replace: true,
        }
      );
    };

  return (
    <main className="login-page">

      <section className="login-card">

        {/* ===============================================
            VTKS INVEST LOGO
        =============================================== */}

        <div className="login-logo-wrapper">
          <img
            src={vtksLogo}
            alt="VTKS INVEST"
            className="login-logo"
          />
        </div>

        {/* ===============================================
            BRAND
        =============================================== */}

        <div className="login-brand">

          <span className="login-brand-vtks">
            VTKS
          </span>

          <span className="login-brand-hub">
            INVEST
          </span>

        </div>

        {/* ===============================================
            HEADING
        =============================================== */}

        <div className="login-heading">

          <span className="login-badge">
            🔐 Secure Member Access
          </span>

          <h1>
            Welcome back
          </h1>

          <p>
            Login to access your VTKS
            account, subscriber dashboard,
            portfolio, scanners and learning
            resources.
          </p>

        </div>

        {/* ===============================================
            LOGIN FORM
        =============================================== */}

        <form
          className="login-form"
          onSubmit={
            handleLogin
          }
        >

          {/* EMAIL */}

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
              disabled={loading}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
            />

          </div>

          {/* PASSWORD */}

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
              disabled={loading}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
            />

          </div>

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            className="login-submit-button"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login to VTKS INVEST"}
          </button>

        </form>

        {/* ===============================================
            LINKS
        =============================================== */}

        <div className="login-links">

          <Link to="/forgot-password">
            Forgot password?
          </Link>

          <p>
            New to VTKS?{" "}
            <Link to="/register">
              Create account
            </Link>
          </p>

        </div>

        {/* ===============================================
            SECURITY
        =============================================== */}

        <p className="login-security-note">
          🔒 Your account information is
          securely protected.
        </p>

      </section>

      {/* =================================================
          DASHBOARD ACCESS NOT ENABLED MODAL
      ================================================= */}

      {accessDenied && (
        <div
          role="presentation"
          onClick={
            handleAccessModalClose
          }
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            padding: "20px",

            background:
              "rgba(15, 23, 42, 0.65)",

            backdropFilter:
              "blur(5px)",
          }}
        >

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="access-modal-title"
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              width: "100%",
              maxWidth: "470px",

              background:
                "#ffffff",

              borderRadius:
                "24px",

              padding:
                "36px 32px 30px",

              textAlign:
                "center",

              boxShadow:
                "0 25px 80px rgba(15, 23, 42, 0.32)",

              border:
                "1px solid rgba(226, 232, 240, 0.9)",

              animation:
                "vtksAccessModalIn 0.22s ease-out",
            }}
          >

            {/* ICON */}

            <div
              style={{
                width: "76px",
                height: "76px",

                margin:
                  "0 auto 20px",

                borderRadius:
                  "50%",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                fontSize:
                  "34px",

                background:
                  "linear-gradient(135deg, #eff6ff, #e0e7ff)",

                boxShadow:
                  "0 8px 24px rgba(37, 99, 235, 0.12)",
              }}
            >
              🔐
            </div>

            {/* TITLE */}

            <h2
              id="access-modal-title"
              style={{
                margin:
                  "0 0 12px",

                color:
                  "#0f172a",

                fontSize:
                  "28px",

                lineHeight:
                  1.2,

                fontWeight:
                  800,
              }}
            >
              Access Not Enabled
            </h2>

            {/* SMALL DECORATIVE LINE */}

            <div
              style={{
                width: "52px",
                height: "4px",

                margin:
                  "0 auto 20px",

                borderRadius:
                  "999px",

                background:
                  "linear-gradient(90deg, #2563eb, #4f46e5)",
              }}
            />

            {/* MESSAGE */}

            <p
              style={{
                margin:
                  "0 auto",

                maxWidth:
                  "390px",

                color:
                  "#475569",

                fontSize:
                  "16px",

                lineHeight:
                  1.7,
              }}
            >
              Your VTKS account is
              registered successfully,
              but subscriber dashboard
              access is not enabled yet.
            </p>

            <p
              style={{
                margin:
                  "12px auto 0",

                maxWidth:
                  "390px",

                color:
                  "#64748b",

                fontSize:
                  "15px",

                lineHeight:
                  1.65,
              }}
            >
              Please complete your
              subscription and contact
              VTKS Admin to activate
              dashboard access.
            </p>

            {/* STATUS BADGE */}

            <div
              style={{
                display:
                  "inline-flex",

                alignItems:
                  "center",

                gap:
                  "7px",

                marginTop:
                  "20px",

                padding:
                  "8px 14px",

                borderRadius:
                  "999px",

                background:
                  "#fff7ed",

                color:
                  "#c2410c",

                fontSize:
                  "13px",

                fontWeight:
                  700,
              }}
            >
              <span>
                ●
              </span>

              Activation Pending
            </div>

            {/* OK BUTTON */}

            <div
              style={{
                marginTop:
                  "26px",
              }}
            >
              <button
                type="button"
                autoFocus
                onClick={
                  handleAccessModalClose
                }
                style={{
                  width:
                    "100%",

                  maxWidth:
                    "230px",

                  border:
                    "none",

                  borderRadius:
                    "12px",

                  padding:
                    "14px 24px",

                  background:
                    "linear-gradient(135deg, #2563eb, #4f46e5)",

                  color:
                    "#ffffff",

                  fontSize:
                    "16px",

                  fontWeight:
                    800,

                  cursor:
                    "pointer",

                  boxShadow:
                    "0 10px 25px rgba(37, 99, 235, 0.25)",

                  transition:
                    "transform 0.18s ease, box-shadow 0.18s ease",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform =
                    "translateY(-1px)";

                  event.currentTarget.style.boxShadow =
                    "0 14px 30px rgba(37, 99, 235, 0.30)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform =
                    "translateY(0)";

                  event.currentTarget.style.boxShadow =
                    "0 10px 25px rgba(37, 99, 235, 0.25)";
                }}
              >
                OK
              </button>
            </div>

          </div>

        </div>
      )}

      {/* =================================================
          MODAL ANIMATION
      ================================================= */}

      <style>
        {`
          @keyframes vtksAccessModalIn {
            from {
              opacity: 0;
              transform:
                translateY(10px)
                scale(0.97);
            }

            to {
              opacity: 1;
              transform:
                translateY(0)
                scale(1);
            }
          }
        `}
      </style>

    </main>
  );
}