import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  getEnabledPlans,
  loadSettings,
} from "../../services/settingsService";

import "./Payment.css";

export default function Payment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const requestedPlan =
    searchParams.get("plan") || "";

  const [settings, setSettings] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentConfirmed, setPaymentConfirmed] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    loadPaymentDetails();
  }, []);

  const loadPaymentDetails = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [latestSettings, enabledPlans] =
        await Promise.all([
          loadSettings(),
          getEnabledPlans(),
        ]);

      setSettings(latestSettings);
      setPlans(enabledPlans || []);
    } catch (error) {
      console.error(
        "Payment details load error:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to load payment details."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = useMemo(() => {
    const normalizedRequestedPlan = String(
      requestedPlan
    )
      .trim()
      .toLowerCase();

    return (
      plans.find(
        (plan) =>
          String(plan.name)
            .trim()
            .toLowerCase() ===
          normalizedRequestedPlan
      ) || null
    );
  }, [plans, requestedPlan]);

  const payment = settings?.payment || {};

  const hasBankDetails =
    payment.bankName ||
    payment.accountNumber ||
    payment.ifscCode;

  const hasPaymentDetails =
    payment.upiId ||
    payment.qrUrl ||
    hasBankDetails;

  const formatPrice = (price) =>
    `₹${Number(price || 0).toLocaleString(
      "en-IN"
    )}`;

  const copyText = async (value, label) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      alert(`${label} copied successfully.`);
    } catch (error) {
      console.error("Copy error:", error);
      alert(`Unable to copy ${label}.`);
    }
  };

  const continueToRegistration = () => {
    if (!selectedPlan) return;

    navigate(
      `/register?plan=${encodeURIComponent(
        selectedPlan.name
      )}&amount=${encodeURIComponent(
        selectedPlan.price
      )}`
    );
  };

  if (loading) {
    return (
      <div className="payment-loading">
        Loading payment details...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <main className="payment-page">
        <section className="payment-message-card">
          <h1>Unable to load payment details</h1>
          <p>{errorMessage}</p>

          <button
            type="button"
            onClick={loadPaymentDetails}
          >
            Try Again
          </button>
        </section>
      </main>
    );
  }

  if (!selectedPlan) {
    return (
      <main className="payment-page">
        <section className="payment-message-card">
          <h1>Plan unavailable</h1>

          <p>
            The selected plan is currently disabled or
            unavailable.
          </p>

          <Link to="/pricing">
            Return to Pricing
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="payment-page">
      <section className="payment-header">
        <span>💳 Secure VTKS Subscription</span>

        <h1>Complete your payment</h1>

        <p>
          Pay using UPI or bank transfer, then continue
          to registration.
        </p>
      </section>

      <section className="payment-layout">
        <article className="payment-plan-card">
          <p className="payment-section-label">
            Selected Plan
          </p>

          <h2>{selectedPlan.name}</h2>

          <strong className="payment-plan-price">
            {formatPrice(selectedPlan.price)}
          </strong>

          <p>
            {selectedPlan.days} days platform access
          </p>

          {selectedPlan.description && (
            <div className="payment-plan-description">
              {selectedPlan.description}
            </div>
          )}

          <Link
            to="/pricing"
            className="payment-change-plan"
          >
            ← Change plan
          </Link>
        </article>

        <article className="payment-details-card">
          <h2>Payment Details</h2>

          {!hasPaymentDetails ? (
            <div className="payment-unavailable">
              <h3>Payment details unavailable</h3>

              <p>
                Please contact the VTKS support team.
              </p>
            </div>
          ) : (
            <>
              {payment.qrUrl && (
                <div className="payment-qr-section">
                  <p>Scan and pay</p>

                  <img
                    src={payment.qrUrl}
                    alt="VTKS payment QR code"
                    className="payment-qr-image"
                  />
                </div>
              )}

              {payment.upiId && (
                <PaymentDetail
                  label="UPI ID"
                  value={payment.upiId}
                  onCopy={() =>
                    copyText(
                      payment.upiId,
                      "UPI ID"
                    )
                  }
                />
              )}

              {payment.bankName && (
                <PaymentDetail
                  label="Bank Name"
                  value={payment.bankName}
                />
              )}

              {payment.accountNumber && (
                <PaymentDetail
                  label="Account Number"
                  value={payment.accountNumber}
                  onCopy={() =>
                    copyText(
                      payment.accountNumber,
                      "Account number"
                    )
                  }
                />
              )}

              {payment.ifscCode && (
                <PaymentDetail
                  label="IFSC Code"
                  value={payment.ifscCode}
                  onCopy={() =>
                    copyText(
                      payment.ifscCode,
                      "IFSC code"
                    )
                  }
                />
              )}

              <div className="payment-amount-box">
                <span>Amount to pay</span>

                <strong>
                  {formatPrice(selectedPlan.price)}
                </strong>
              </div>
            </>
          )}
        </article>
      </section>

      {hasPaymentDetails && (
        <section className="payment-confirmation-card">

  <label className="payment-confirm-checkbox">
    ...
  </label>

  {/* Paste here */}
  <div className="payment-screenshot-note">
    <strong>Payment completed?</strong>

    <p>
      Please send your payment screenshot to our Telegram ID:
    </p>

    <a
      href="https://t.me/Kshah888"
      target="_blank"
      rel="noreferrer"
    >
      @Kshah888
    </a>
  </div>

  <button
    type="button"
    className="payment-continue-button"
    disabled={!paymentConfirmed}
    onClick={continueToRegistration}
  >
    Continue to Registration →
  </button>

  <p className="payment-note">
    Your subscription will be activated after payment verification.
  </p>

</section>
      )}
    </main>
  );
}

function PaymentDetail({
  label,
  value,
  onCopy,
}) {
  return (
    <div className="payment-detail-row">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
        >
          Copy
        </button>
      )}
    </div>
  );
}