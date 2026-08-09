import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import RouteSEO from "../components/common/RouteSEO";

import {
  defaultSettings,
  loadSettings,
} from "../services/settingsService";

import "./PublicLayout.css";

export default function PublicLayout() {
  const location = useLocation();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchPublicSettings = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const data = await loadSettings();

        if (!mounted) return;

        setSettings(data || defaultSettings);
      } catch (error) {
        console.error("Public settings load error:", error);

        if (!mounted) return;

        setSettings(defaultSettings);
        setLoadError(
          "Some website settings could not be loaded."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchPublicSettings();

    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  if (loading || !settings) {
    return (
      <div className="public-settings-loader">
        <div className="public-loader-spinner" />
        <p>Loading VTKS INVEST...</p>
      </div>
    );
  }

  const announcementText = String(
    settings.announcement?.text || ""
  ).trim();

  const showAnnouncement =
    Boolean(settings.announcement?.enabled) &&
    announcementText.length > 0;

  const maintenanceMode = Boolean(
    settings.website?.maintenanceMode
  );

  const maintenanceAllowedPaths = [
    "/login",
    "/admin-login",
  ];

  const canOpenDuringMaintenance =
    maintenanceAllowedPaths.includes(location.pathname);

  if (maintenanceMode && !canOpenDuringMaintenance) {
    return (
      <>
        <RouteSEO />

        <MaintenanceScreen
          websiteName={
            settings.platform?.websiteName || "VTKS INVEST"
          }
          supportEmail={
            settings.platform?.supportEmail || ""
          }
          supportMobile={
            settings.platform?.supportMobile || ""
          }
        />
      </>
    );
  }

  return (
    <>
      {/* Dynamic SEO for every public page */}
      <RouteSEO />

      <div className="public-layout">
        {showAnnouncement && (
          <div className="public-announcement">
            <div className="public-announcement-content">
              <span className="public-announcement-icon">
                📢
              </span>

              <span>{announcementText}</span>
            </div>
          </div>
        )}

        {loadError && (
          <div className="public-settings-warning">
            {loadError}
          </div>
        )}

        <Navbar settings={settings} />

        <main className="public-main-content">
          <Outlet context={{ settings }} />
        </main>

        <Footer settings={settings} />
      </div>
    </>
  );
}

function MaintenanceScreen({
  websiteName,
  supportEmail,
  supportMobile,
}) {
  return (
    <div className="maintenance-page">
      <div className="maintenance-card">
        <div className="maintenance-icon">🛠️</div>

        <p className="maintenance-label">
          Scheduled Maintenance
        </p>

        <h1>{websiteName}</h1>

        <h2>We'll be back shortly</h2>

        <p className="maintenance-description">
          The platform is currently undergoing maintenance
          and improvements. Please check again soon.
        </p>

        {(supportEmail || supportMobile) && (
          <div className="maintenance-support">
            <strong>Need assistance?</strong>

            {supportEmail && (
              <a href={`mailto:${supportEmail}`}>
                {supportEmail}
              </a>
            )}

            {supportMobile && (
              <a href={`tel:${supportMobile}`}>
                {supportMobile}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}