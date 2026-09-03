import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  sendResetEmail,
} from "../../services/authService";

import vtksLogo from "./vtks-invest-logo.png";

import "./ForgotPassword.css";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [modal, setModal] =
    useState({
      open: false,
      type: "success",
      title: "",
      message: "",
    });

  /* =====================================================
     MODAL HELPERS
  ===================================================== */

  const openModal = ({
    type = "success",
    title,
    message,
  }) => {
    setModal({
      open: true,
      type,
      title,
      message,
    });
  };

  const closeModal = () => {
    setModal((previous) => ({
      ...previous,
      open: false,
    }));
  };

  /* =====================================================
     SEND RESET EMAIL
  ===================================================== */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const cleanEmail =
      String(email || "")
        .trim()
        .toLowerCase();

    if (!cleanEmail) {
      openModal({
        type: "error",
        title: "Email Required",
        message:
          "Please enter your registered email address to continue.",
      });

      return;
    }

    try {
      setLoading(true);

      await sendResetEmail(
        cleanEmail
      );

      openModal({
        type: "success",
        title: "Reset Link Sent",
        message:
          "A secure password reset link has been sent to your email address. Please check your inbox and follow the instructions to create a new password.",
      });
    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      const errorMessage =
        String(
          error?.message || ""
        ).toLowerCase();

      /* =================================================
         SUPABASE EMAIL RATE LIMIT
      ================================================= */

      if (
        errorMessage.includes(
          "rate limit"
        )
      ) {
        openModal({
          type: "error",
          title:
            "Please Try Again Shortly",
          message:
            "Too many password reset requests were made recently. Please wait a few minutes and try again.",
        });

        return;
      }

      /* =================================================
         OTHER ERRORS
      ================================================= */

      openModal({
        type: "error",
        title:
          "Unable to Send Reset Link",
        message:
          "We could not send the password reset email. Please verify your email address and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     SUCCESS BUTTON
  ===================================================== */

  const handleSuccessClose =
    () => {
      closeModal();

      navigate(
        "/login",
        {
          replace: true,
        }
      );
    };

  const isSuccess =
    modal.type === "success";

  return (
    <main className="forgot-page">

      <section className="forgot-card">

        {/* ===============================================
            VTKS INVEST LOGO
        =============================================== */}

        <div className="forgot-logo-wrapper">
          <img
            src={vtksLogo}
            alt="VTKS INVEST"
            className="forgot-logo"
          />
        </div>

        {/* ===============================================
            BRAND
        =============================================== */}

        <div className="forgot-brand">

          <span className="forgot-brand-vtks">
            VTKS
          </span>

          <span className="forgot-brand-hub">
            INVEST
          </span>

        </div>

        {/* ===============================================
            HEADING
        =============================================== */}

        <div className="forgot-heading">

          <span className="forgot-badge">
            🔐 Password Recovery
          </span>

          <h1>
            Forgot Password?
          </h1>

          <p>
            Enter your registered email
            address and we’ll send you a
            secure password reset link.
          </p>

        </div>

        {/* ===============================================
            FORM
        =============================================== */}

        <form
          className="forgot-form"
          onSubmit={
            handleSubmit
          }
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
                setEmail(
                  event.target.value
                )
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

        {/* ===============================================
            LINKS
        =============================================== */}

        <div className="forgot-links">

          <Link to="/login">
            ← Back to Login
          </Link>

        </div>

        {/* ===============================================
            SECURITY NOTE
        =============================================== */}

        <p className="forgot-security-note">
          🔒 Your account information is
          securely protected.
        </p>

      </section>

      {/* ===============================================
          STATUS MODAL
      =============================================== */}

      {modal.open && (
        <div
          role="presentation"
          onClick={
            isSuccess
              ? handleSuccessClose
              : closeModal
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
            aria-labelledby="forgot-modal-title"
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
                "vtksForgotModalIn 0.22s ease-out",
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

                display: "flex",
                alignItems: "center",
                justifyContent:
                  "center",

                fontSize:
                  "34px",

                background:
                  isSuccess
                    ? "linear-gradient(135deg, #ecfdf5, #dcfce7)"
                    : "linear-gradient(135deg, #fef2f2, #fee2e2)",

                boxShadow:
                  isSuccess
                    ? "0 8px 24px rgba(22, 163, 74, 0.12)"
                    : "0 8px 24px rgba(220, 38, 38, 0.12)",
              }}
            >
              {isSuccess
                ? "✉️"
                : "⚠️"}
            </div>

            {/* TITLE */}

            <h2
              id="forgot-modal-title"
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
              {modal.title}
            </h2>

            {/* ACCENT */}

            <div
              style={{
                width: "52px",
                height: "4px",

                margin:
                  "0 auto 20px",

                borderRadius:
                  "999px",

                background:
                  isSuccess
                    ? "linear-gradient(90deg, #16a34a, #22c55e)"
                    : "linear-gradient(90deg, #dc2626, #ef4444)",
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
              {modal.message}
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
                  isSuccess
                    ? "#ecfdf5"
                    : "#fef2f2",

                color:
                  isSuccess
                    ? "#15803d"
                    : "#b91c1c",

                fontSize:
                  "13px",

                fontWeight:
                  700,
              }}
            >
              <span>
                ●
              </span>

              {isSuccess
                ? "Email Sent Successfully"
                : "Please Try Again"}
            </div>

            {/* BUTTON */}

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
                  isSuccess
                    ? handleSuccessClose
                    : closeModal
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
                    isSuccess
                      ? "linear-gradient(135deg, #16a34a, #22c55e)"
                      : "linear-gradient(135deg, #dc2626, #ef4444)",

                  color:
                    "#ffffff",

                  fontSize:
                    "16px",

                  fontWeight:
                    800,

                  cursor:
                    "pointer",

                  boxShadow:
                    isSuccess
                      ? "0 10px 25px rgba(22, 163, 74, 0.24)"
                      : "0 10px 25px rgba(220, 38, 38, 0.24)",
                }}
              >
                {isSuccess
                  ? "Back to Login"
                  : "Try Again"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ===============================================
          MODAL ANIMATION
      =============================================== */}

      <style>
        {`
          @keyframes vtksForgotModalIn {
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