import { useState } from "react";
import {
  useNavigate,
} from "react-router-dom";

import {
  updatePassword,
} from "../../services/authService";

import vtksLogo from "./vtks-invest-logo.png";

import "./ResetPassword.css";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    modal,
    setModal,
  ] = useState({
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
     RESET PASSWORD
  ===================================================== */

  const handleReset = async (
    event
  ) => {
    event.preventDefault();

    if (
      !password ||
      !confirmPassword
    ) {
      openModal({
        type: "error",
        title:
          "Password Required",
        message:
          "Please enter and confirm your new password.",
      });

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      openModal({
        type: "error",
        title:
          "Passwords Do Not Match",
        message:
          "The password and confirmation password must be the same.",
      });

      return;
    }

    if (
      password.length < 6
    ) {
      openModal({
        type: "error",
        title:
          "Password Too Short",
        message:
          "Your new password must contain at least 6 characters.",
      });

      return;
    }

    try {
      setLoading(true);

      await updatePassword(
        password
      );

      openModal({
        type: "success",
        title:
          "Password Updated",
        message:
          "Your VTKS password has been changed successfully. You can now log in using your new password.",
      });
    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      const errorMessage =
        String(
          error?.message || ""
        ).toLowerCase();

      if (
        errorMessage.includes(
          "session"
        ) ||
        errorMessage.includes(
          "jwt"
        ) ||
        errorMessage.includes(
          "expired"
        )
      ) {
        openModal({
          type: "error",
          title:
            "Reset Link Expired",
          message:
            "This password reset link is no longer valid. Please request a new reset link from the Forgot Password page.",
        });

        return;
      }

      openModal({
        type: "error",
        title:
          "Password Reset Failed",
        message:
          "We could not update your password. Please try again or request a new password reset link.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     SUCCESS CLOSE
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
    <main className="reset-page">

      <section className="reset-card">

        {/* ===============================================
            VTKS INVEST LOGO
        =============================================== */}

        <div className="reset-image-logo-wrapper">

          <img
            src={vtksLogo}
            alt="VTKS INVEST"
            className="reset-image-logo"
          />

        </div>

        {/* ===============================================
            BRAND
        =============================================== */}

        <div className="reset-logo">

          <span className="reset-vtks">
            VTKS
          </span>

          <span className="reset-hub">
            INVEST
          </span>

        </div>

        {/* ===============================================
            BADGE
        =============================================== */}

        <span className="reset-badge">
          🔐 Secure Password Reset
        </span>

        <h1>
          Create New Password
        </h1>

        <p>
          Your new password should be
          at least 6 characters long.
        </p>

        {/* ===============================================
            FORM
        =============================================== */}

        <form
          className="reset-form"
          onSubmit={
            handleReset
          }
        >

          {/* NEW PASSWORD */}

          <div className="password-group">

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="New Password"
              value={password}
              autoComplete="new-password"
              disabled={loading}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
            />

            <button
              type="button"
              className="eye-btn"
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              disabled={loading}
              onClick={() =>
                setShowPassword(
                  (previous) =>
                    !previous
                )
              }
            >
              {showPassword
                ? "🙈"
                : "👁"}
            </button>

          </div>

          {/* CONFIRM PASSWORD */}

          <div className="password-group">

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Confirm Password"
              value={confirmPassword}
              autoComplete="new-password"
              disabled={loading}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
            />

            <button
              type="button"
              className="eye-btn"
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              disabled={loading}
              onClick={() =>
                setShowPassword(
                  (previous) =>
                    !previous
                )
              }
            >
              {showPassword
                ? "🙈"
                : "👁"}
            </button>

          </div>

          {/* UPDATE BUTTON */}

          <button
            type="submit"
            className="reset-button"
            disabled={loading}
          >
            {loading
              ? "Updating..."
              : "Update Password"}
          </button>

        </form>

      </section>

      {/* =================================================
          STATUS MODAL
      ================================================= */}

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
            aria-labelledby="reset-modal-title"
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
                "vtksResetModalIn 0.22s ease-out",
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
                ? "✅"
                : "⚠️"}
            </div>

            {/* TITLE */}

            <h2
              id="reset-modal-title"
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

            {/* ACCENT LINE */}

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
                ? "Password Secured"
                : "Action Required"}
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
                  : "Close"}
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
          @keyframes vtksResetModalIn {
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