import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FaTelegramPlane,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa";

import { FaXTwitter } from "react-icons/fa6";
import {
  defaultSettings,
  loadSettings,
} from "../../services/settingsService";

import "./Footer.css";

export default function Footer() {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await loadSettings();
        setSettings(data || defaultSettings);
      } catch (error) {
        console.error("Footer settings error:", error);
      }
    };

    fetchSettings();
  }, []);

  const platform =
    settings?.platform || defaultSettings.platform;

  const socialLinks = [
  {
    label: "Telegram",
    icon: <FaTelegramPlane />,
    url: platform.telegramLink,
  },
  {
    label: "Instagram",
    icon: <FaInstagram />,
    url: platform.instagramLink,
  },
  {
    label: "X / Twitter",
    icon: <FaXTwitter />,
    url: platform.twitterLink,
  },
  {
    label: "YouTube",
    icon: <FaYoutube />,
    url: platform.youtubeLink,
  },
].filter((item) => item.url);
  return (
    <footer className="public-footer">
      <div className="footer-container">
        <section className="footer-brand">
          <div className="footer-logo">
            { "VTKS INVEST"}
          </div>

          <h2>
            Trade with Structure.
            <br />
            Invest with Conviction.
          </h2>

          <p>
            A structured trading and investment learning
            platform focused on education, discipline,
            risk management and independent decision-making.
          </p>
        </section>

        <section className="footer-column">
          <h3>Quick Links</h3>

          <Link to="/">Home</Link>
          <Link to="/funds">Public Fund</Link>
          <Link to="/indicators">Indicators</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/resources">Resources</Link>
          <Link to="/accuracy">Accuracy</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </section>

        <section className="footer-column">
          <h3>Platform</h3>

          <Link to="/resources">Learning Resources</Link>
          <Link to="/indicators">Trading Indicators</Link>
          <Link to="/funds">Portfolio Tracking</Link>
          <Link to="/accuracy">Performance Analytics</Link>
          <Link to="/pricing">Membership Plans</Link>
        </section>

        <section className="footer-column">
          <h3>Contact</h3>

          {platform.supportEmail && (
            <a href={`mailto:${platform.supportEmail}`}>
              ✉️ {platform.supportEmail}
            </a>
          )}

          {platform.supportMobile && (
            <a href={`tel:${platform.supportMobile}`}>
              📞 {platform.supportMobile}
            </a>
          )}

          <Link to="/contact">Contact Us</Link>

          {socialLinks.length > 0 && (
            <div className="footer-social-links">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  title={item.label}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="footer-bottom">
        <p>
  © {new Date().getFullYear()} VTKS INVEST. All rights reserved.
</p>

        <p className="footer-disclaimer">
          VTKS is an educational platform and does not provide
          trading calls, personalised investment advice or
          guaranteed returns. Please conduct your own research.
        </p>
      </div>
    </footer>
  );
}