import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  submitStockQuery,
} from "../../services/stockQueryService";

import "./AskVTKS.css";

const initialForm = {
  name: "",
  contact: "",
  stockName: "",
  timeframe: "Swing",
  question: "",
  chartUrl: "",
};

export default function AskVTKS() {
  const [form, setForm] =
    useState(initialForm);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("");

  useEffect(() => {
    document.title =
      "Ask VTKS | Stock Queries";

    return () => {
      document.title =
        "VTKS Hub | Trade with Structure. Invest with Conviction.";
    };
  }, []);

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));

    if (message) {
      setMessage("");
      setMessageType("");
    }
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Please enter your name.";
    }

    if (!form.stockName.trim()) {
      return "Please enter the stock name.";
    }

    if (!form.question.trim()) {
      return "Please enter your query.";
    }

    if (
      form.question.trim().length < 10
    ) {
      return "Please describe your query in at least 10 characters.";
    }

    return "";
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    const validationError =
      validateForm();

    if (validationError) {
      setMessage(validationError);
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);

      await submitStockQuery(form);

      setForm(initialForm);

      setMessage(
        "Your query has been submitted successfully. Selected queries may be answered through a chart, video, or written explanation."
      );

      setMessageType("success");
    } catch (error) {
      console.error(
        "Ask VTKS submission error:",
        error
      );

      setMessage(
        error?.message ||
          "Unable to submit your query right now. Please try again."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="ask-vtks-page">
      <section className="ask-vtks-hero">
        <div className="ask-vtks-hero-content">
          <span className="ask-vtks-badge">
            Ask VTKS
          </span>

          <h1>
            Have a Stock Analysis Query?
          </h1>

          <p>
            Submit your technical-analysis question.
            Selected queries may be answered through an
            educational chart, video, or written
            explanation.
          </p>
        </div>
      </section>

      <section className="ask-vtks-content">
        <div className="ask-vtks-grid">
          <aside className="ask-vtks-info-card">
            <h2>
              Before You Submit
            </h2>

            <ul>
              <li>
                Keep your question clear and
                stock-specific.
              </li>

              <li>
                Mention the preferred perspective.
              </li>

              <li>
                Chart links are optional.
              </li>

              <li>
                Submission does not guarantee a response.
              </li>
            </ul>

            <div className="ask-vtks-disclaimer">
              Queries are reviewed for educational
              purposes only and should not be considered
              investment advice.
            </div>

            <div className="ask-vtks-info-extra">
              <div className="ask-vtks-info-block">
                <span className="ask-vtks-info-icon">
                  📊
                </span>

                <div>
                  <strong>
                    Chart Response
                  </strong>

                  <p>
                    Selected queries may receive an
                    annotated chart with a structured
                    educational explanation.
                  </p>
                </div>
              </div>

              <div className="ask-vtks-info-block">
                <span className="ask-vtks-info-icon">
                  🎥
                </span>

                <div>
                  <strong>
                    Video Explanation
                  </strong>

                  <p>
                    Detailed queries may be answered
                    through a recorded video or YouTube
                    analysis.
                  </p>
                </div>
              </div>

              <div className="ask-vtks-info-block">
                <span className="ask-vtks-info-icon">
                  🔒
                </span>

                <div>
                  <strong>
                    Contact Remains Private
                  </strong>

                  <p>
                    Your email or Telegram username will
                    not be displayed on the public
                    answered-queries page.
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/answered-queries"
              className="ask-vtks-view-answers"
            >
              View Answered Queries →
            </Link>
          </aside>

          <div className="ask-vtks-form-card">
            <h2>
              Submit Your Query
            </h2>

            <form
              className="ask-vtks-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="ask-vtks-form-row">
                <div className="ask-vtks-field">
                  <label htmlFor="name">
                    Name *
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>

                <div className="ask-vtks-field">
                  <label htmlFor="contact">
                    Email / Telegram
                  </label>

                  <input
                    id="contact"
                    name="contact"
                    type="text"
                    value={form.contact}
                    onChange={handleChange}
                    placeholder="Email or Telegram username"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="ask-vtks-field">
                <label htmlFor="stockName">
                  Stock Name *
                </label>

                <input
                  id="stockName"
                  name="stockName"
                  type="text"
                  value={form.stockName}
                  onChange={handleChange}
                  placeholder="Example: LT, TCS, Reliance"
                  disabled={loading}
                />
              </div>

              <div className="ask-vtks-field">
                <label htmlFor="timeframe">
                  Perspective
                </label>

                <select
                  id="timeframe"
                  name="timeframe"
                  value={form.timeframe}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="Intraday">
                    Intraday
                  </option>

                  <option value="Swing">
                    Swing
                  </option>

                  <option value="Positional">
                    Positional
                  </option>

                  <option value="Long-Term">
                    Long-Term
                  </option>
                </select>
              </div>

              <div className="ask-vtks-field">
                <label htmlFor="question">
                  Your Query *
                </label>

                <textarea
                  id="question"
                  name="question"
                  value={form.question}
                  onChange={handleChange}
                  placeholder="Write your technical-analysis question..."
                  rows={6}
                  maxLength={1000}
                  disabled={loading}
                />

                <small className="ask-vtks-character-count">
                  {form.question.length}/1000
                </small>
              </div>

              <div className="ask-vtks-field">
                <label htmlFor="chartUrl">
                  Chart Image Link
                </label>

                <input
                  id="chartUrl"
                  name="chartUrl"
                  type="url"
                  value={form.chartUrl}
                  onChange={handleChange}
                  placeholder="Optional TradingView or image URL"
                  disabled={loading}
                />
              </div>

              {message && (
                <div
                  className={`ask-vtks-message ask-vtks-message-${messageType}`}
                  role={
                    messageType === "error"
                      ? "alert"
                      : "status"
                  }
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="ask-vtks-submit-button"
                disabled={loading}
              >
                {loading
                  ? "Submitting..."
                  : "Submit Query"}
              </button>

              <p className="ask-vtks-form-note">
                By submitting this form, you agree that
                selected queries may be displayed publicly
                without showing your contact details.
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}