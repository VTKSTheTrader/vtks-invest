import { Link } from "react-router-dom";
import "./Contact.css";
import SEO from "../../components/common/SEO";
<>
 

  {/* Existing page content */}
</>
const contactDetails = {
  email: "thetrader.ks@gmail.com",
  phone: "+91 8516884030",
  telegram: "https://t.me/KS_TheTrader",
  twitter: "https://x.com/TheTraderKS",
  youtube: "",
};

export default function Contact() {
   <SEO
    title="VTKS Invest | Contact US."
    description="Professional stock market education platform focused on technical analysis, swing trading, investment research, and disciplined trading."
    keywords="VTKS, Swing Trading, Technical Analysis, Stock Market, VTKS Contact"
    canonical="https://www.vtksinvest.com/contact"
  />
  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const mobile = String(formData.get("mobile") || "").trim();
    const subject = String(formData.get("subject") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!name || !email || !message) {
      alert("Please enter your name, email and message.");
      return;
    }

    const emailSubject = encodeURIComponent(
      subject || "VTKS Contact Enquiry"
    );

    const emailBody = encodeURIComponent(
      `Name: ${name}
Email: ${email}
Mobile: ${mobile || "-"}

Message:
${message}`
    );

    window.location.href =
      `mailto:${contactDetails.email}` +
      `?subject=${emailSubject}` +
      `&body=${emailBody}`;
  };

  return (
    <main className="contact-page">
      <section className="contact-hero">
        <div className="contact-hero-copy">
          <span className="contact-eyebrow">
            📩 VTKS Support
          </span>

          <h1>Let’s connect and grow together.</h1>

          <p>
            Need help with your VTKS subscription, indicators,
            scanners, portfolio access or learning resources? Send
            your query and the VTKS team will assist you.
          </p>

          <div className="contact-hero-actions">
            <a
              href={`mailto:${contactDetails.email}`}
              className="contact-primary-link"
            >
              Email Support
            </a>

            <a
              href={contactDetails.telegram}
              target="_blank"
              rel="noreferrer"
              className="contact-secondary-link"
            >
              Join Telegram
            </a>
          </div>
        </div>

        <div className="contact-hero-card">
          <div className="contact-hero-icon">⚡</div>

          <div>
            <strong>Fast member support</strong>

            <p>
              Account, membership and platform-related queries are
              usually answered within 24 hours.
            </p>
          </div>
        </div>
      </section>

      <section className="contact-content">
        <div className="contact-information">
          <div className="contact-section-title">
            <span>🤝</span>

            <div>
              <h2>Contact information</h2>
              <p>
                Reach the VTKS team through the channel most suitable
                for your query.
              </p>
            </div>
          </div>

          <div className="contact-details-grid">
            <article className="contact-detail-card">
              <div className="contact-detail-icon">✉️</div>

              <div>
                <span>Email</span>

                <a href={`mailto:${contactDetails.email}`}>
                  {contactDetails.email}
                </a>

                <p>
                  For account, subscription and technical support.
                </p>
              </div>
            </article>

            <article className="contact-detail-card">
              <div className="contact-detail-icon">📞</div>

              <div>
                <span>Phone</span>

                <a
                  href={`tel:${contactDetails.phone.replace(
                    /\s/g,
                    ""
                  )}`}
                >
                  {contactDetails.phone}
                </a>

                <p>
                  Available during regular business hours.
                </p>
              </div>
            </article>

            <article className="contact-detail-card">
              <div className="contact-detail-icon">✈️</div>

              <div>
                <span>Telegram</span>

                <a
                  href={contactDetails.telegram}
                  target="_blank"
                  rel="noreferrer"
                >
                  KS_TheTrader
                </a>

                <p>
                  Join the community for updates and learning.
                </p>
              </div>
            </article>

            <article className="contact-detail-card">
              <div className="contact-detail-icon">🕒</div>

              <div>
                <span>Response time</span>

                <strong>Within 24 hours</strong>

                <p>
                  Weekends and holidays may require additional time.
                </p>
              </div>
            </article>
          </div>

          <div className="contact-social-box">
            <div>
              <span className="contact-social-heading">
                Follow VTKS
              </span>

              <p>
                Stay connected for market education, platform
                updates and VTKS insights.
              </p>
            </div>

            <div className="contact-social-links">
              <a
                href={contactDetails.telegram}
                target="_blank"
                rel="noreferrer"
                aria-label="Telegram"
              >
                ✈️
                <span>Telegram</span>
              </a>

              <a
                href={contactDetails.twitter}
                target="_blank"
                rel="noreferrer"
                aria-label="X"
              >
                𝕏
                <span>X</span>
              </a>

              {contactDetails.youtube && (
                <a
                  href={contactDetails.youtube}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                >
                  ▶️
                  <span>YouTube</span>
                </a>
              )}
            </div>
          </div>
        </div>

        <section className="contact-form-card">
          <div className="contact-section-title">
            <span>💬</span>

            <div>
              <h2>Send a message</h2>
              <p>
                Fill out the form and your email application will open
                with the enquiry details.
              </p>
            </div>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-form-row">
              <div className="contact-field">
                <label htmlFor="contact-name">
                  Full name *
                </label>

                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contact-email">
                  Email address *
                </label>

                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <div className="contact-form-row">
              <div className="contact-field">
                <label htmlFor="contact-mobile">
                  Mobile number
                </label>

                <input
                  id="contact-mobile"
                  name="mobile"
                  type="tel"
                  placeholder="Enter mobile number"
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contact-subject">
                  Enquiry type
                </label>

                <select
                  id="contact-subject"
                  name="subject"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select enquiry type
                  </option>

                  <option value="Subscription Enquiry">
                    Subscription enquiry
                  </option>

                  <option value="Account Support">
                    Account support
                  </option>

                  <option value="Indicator Support">
                    Indicator support
                  </option>

                  <option value="Scanner Support">
                    Scanner support
                  </option>

                  <option value="Knowledge Vault Support">
                    Knowledge Vault support
                  </option>

                  <option value="General Enquiry">
                    General enquiry
                  </option>
                </select>
              </div>
            </div>

            <div className="contact-field">
              <label htmlFor="contact-message">
                Message *
              </label>

              <textarea
                id="contact-message"
                name="message"
                rows="7"
                placeholder="Describe your query or issue..."
              />
            </div>

            <button
              type="submit"
              className="contact-submit-button"
            >
              Send message
              <span>→</span>
            </button>

            <p className="contact-form-note">
              Your default email application will open. No personal
              information is stored through this form.
            </p>
          </form>
        </section>
      </section>

      <section className="contact-member-banner">
        <div>
          <div className="contact-member-icon">📚</div>

          <div>
            <h2>Already a VTKS subscriber?</h2>

            <p>
              Login to access your portfolio, scanners, library and
              account options.
            </p>
          </div>
        </div>

        <Link to="/login">
          Open subscriber login
          <span>→</span>
        </Link>
      </section>

      <section className="contact-disclaimer">
        <strong>Educational disclosure</strong>

        <p>
          VTKS provides educational and research-based content. We do
          not promise guaranteed returns or provide personalized
          investment advice through this contact page.
        </p>
      </section>
    </main>
  );
}