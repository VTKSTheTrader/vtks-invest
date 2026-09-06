import {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  getSubscriberProfile,
  getSubscriberMembership,
} from "../../services/subscriberService";

/* =========================================================
   HELPERS
========================================================= */

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

/* =========================================================
   TODAY - INDIA
========================================================= */

const getTodayIST = () => {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(new Date());

  const getPart = (type) =>
    parts.find(
      (part) => part.type === type
    )?.value || "";

  return `${getPart("year")}-${getPart(
    "month"
  )}-${getPart("day")}`;
};

/* =========================================================
   SUBSCRIPTION STATUS
========================================================= */

const hasActiveSubscription = (
  membership
) => {
  if (!membership) {
    return false;
  }

  /* ---------------------------------------------------------
     MANUAL ACCESS

     Manual Access continues to receive full access.
  --------------------------------------------------------- */

  const plan = normalize(
    membership?.plan
  );

  if (plan === "manual access") {
    return true;
  }

  /* ---------------------------------------------------------
     NORMAL SUBSCRIPTION
  --------------------------------------------------------- */

  const status = normalize(
    membership?.status ||
      membership?.subscription_status
  );

  if (
    status === "expired" ||
    status === "inactive"
  ) {
    return false;
  }

  const today = getTodayIST();

  const startDate =
    membership?.start_date ||
    membership?.subscription
      ?.start_date ||
    "";

  const expiryDate =
    membership?.expiry_date ||
    membership?.subscription
      ?.expiry_date ||
    "";

  /* Future subscription */

  if (
    startDate &&
    startDate > today
  ) {
    return false;
  }

  /* Expired subscription */

  if (
    expiryDate &&
    expiryDate < today
  ) {
    return false;
  }

  /*
   * A paid subscription should have
   * an expiry date.
   */

  if (!expiryDate) {
    return false;
  }

  return true;
};

/* =========================================================
   PLAN ACCESS
========================================================= */

/*
   MONTHLY
   -------
   Allowed:
   - Main Dashboard
   - Market Studies
   - Market Outlook / Monthly Levels
   - Trade Details
   - Feedback

   Restricted:
   - Knowledge Library
   - Scanner
   - Community premium content

   QUARTERLY / ANNUAL / MANUAL ACCESS
   ----------------------------------
   Full subscriber access.
*/

const hasFullPlanAccess = (
  membership
) => {
  const plan = normalize(
    membership?.plan
  );

  return [
    "quarterly",
    "annual",
    "manual access",
  ].includes(plan);
};

/* =========================================================
   FULL-PLAN-ONLY ROUTES
========================================================= */

const isFullPlanOnlyRoute = (
  pathname
) => {
  const path = normalize(pathname);

  return (
    path === "/dashboard/library" ||
    path.startsWith(
      "/dashboard/library/"
    ) ||
    path === "/dashboard/scanner" ||
    path.startsWith(
      "/dashboard/scanner/"
    )
  );
};

/* =========================================================
   SUBSCRIBER ROUTE

   ACCESS RULES

   1. Valid Supabase session required.
   2. Admin always allowed.
   3. dashboard_access must be TRUE.
   4. Main /dashboard remains available to an expired
      member so renewal/account information can be shown.
   5. Other subscriber routes require active subscription
      or Manual Access.
   6. Monthly members may access:
      - Market Studies
      - Market Outlook / Monthly Levels
      - Trade Details
      - Feedback
   7. Library and Scanner require:
      - Quarterly
      - Annual
      - Manual Access
   8. localStorage is NOT trusted for authorization.
========================================================= */

export default function SubscriberRoute({
  children,
}) {
  const location = useLocation();

  const [
    checking,
    setChecking,
  ] = useState(true);

  const [
    accessState,
    setAccessState,
  ] = useState("checking");

  /* =======================================================
     MAIN DASHBOARD

     Only this page remains available when subscription
     has expired, provided Admin access remains ON.
  ======================================================= */

  const isMainDashboard =
    location.pathname === "/dashboard";

  useEffect(() => {
    let active = true;

    const checkAccess = async () => {
      try {
        setChecking(true);
        setAccessState("checking");

        /* ===============================================
           PROFILE / AUTH SESSION
        =============================================== */

        const profile =
          await getSubscriberProfile();

        if (!active) {
          return;
        }

        if (!profile?.id) {
          setAccessState(
            "not_logged_in"
          );

          return;
        }

        const role = normalize(
          profile?.role
        );

        /* ===============================================
           ADMIN
        =============================================== */

        if (role === "admin") {
          localStorage.setItem(
            "vtks_user_role",
            "admin"
          );

          setAccessState("allowed");

          return;
        }

        /* ===============================================
           GET MEMBER ACCESS
        =============================================== */

        const membership =
          await getSubscriberMembership(
            profile?.email || ""
          );

        if (!active) {
          return;
        }

        /* ===============================================
           DASHBOARD ACCESS SWITCH
        =============================================== */

        const dashboardEnabled =
          membership?.dashboard_access ===
            true &&
          membership?.access_denied !==
            true;

        if (!dashboardEnabled) {
          localStorage.removeItem(
            "vtks_user_role"
          );

          setAccessState(
            "access_denied"
          );

          return;
        }

        /* ===============================================
           SAVE COMPATIBILITY STATE

           This is not used as authorization authority.
        =============================================== */

        localStorage.setItem(
          "vtks_user_role",
          "subscriber"
        );

        localStorage.setItem(
          "vtks_user_email",
          membership?.email ||
            profile?.email ||
            ""
        );

        localStorage.setItem(
          "vtks_user_name",
          membership?.name ||
            profile?.full_name ||
            ""
        );

        /* ===============================================
           MAIN DASHBOARD

           Expired member is allowed here so they can
           see renewal message and account security.
        =============================================== */

        if (isMainDashboard) {
          setAccessState("allowed");
          return;
        }

        /* ===============================================
           ACTIVE SUBSCRIPTION CHECK
        =============================================== */

        const premiumAccess =
          hasActiveSubscription(
            membership
          );

        if (!premiumAccess) {
          setAccessState(
            "subscription_expired"
          );

          return;
        }

        /* ===============================================
           PLAN-RESTRICTED ROUTES

           Monthly cannot directly open Library/Scanner.

           Quarterly / Annual / Manual Access can.
        =============================================== */

        if (
          isFullPlanOnlyRoute(
            location.pathname
          ) &&
          !hasFullPlanAccess(
            membership
          )
        ) {
          setAccessState(
            "plan_restricted"
          );

          return;
        }

        /* ===============================================
           ACCESS GRANTED
        =============================================== */

        setAccessState("allowed");
      } catch (error) {
        console.error(
          "Subscriber route access error:",
          error
        );

        localStorage.removeItem(
          "vtks_user_role"
        );

        const message = normalize(
          error?.message
        );

        if (
          message.includes(
            "not logged in"
          ) ||
          message.includes(
            "auth session"
          ) ||
          message.includes("jwt")
        ) {
          setAccessState(
            "not_logged_in"
          );
        } else {
          setAccessState(
            "access_denied"
          );
        }
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    };

    checkAccess();

    return () => {
      active = false;
    };
  }, [
    location.pathname,
    isMainDashboard,
  ]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (
    checking ||
    accessState === "checking"
  ) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "Arial, sans-serif",
          color: "#475569",
          fontWeight: 600,
        }}
      >
        Checking account access...
      </div>
    );
  }

  /* =========================================================
     NOT LOGGED IN
  ========================================================= */

  if (
    accessState ===
    "not_logged_in"
  ) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  /* =========================================================
     ACCESS SWITCH OFF
  ========================================================= */

  if (
    accessState ===
    "access_denied"
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  /* =========================================================
     SUBSCRIPTION EXPIRED
  ========================================================= */

  if (
    accessState ===
    "subscription_expired"
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
        state={{
          subscriptionExpired: true,
        }}
      />
    );
  }

  /* =========================================================
     PLAN RESTRICTED

     Monthly member attempted to directly open
     Library or Scanner.

     Return safely to subscriber dashboard.
  ========================================================= */

  if (
    accessState ===
    "plan_restricted"
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
        state={{
          planRestricted: true,
        }}
      />
    );
  }

  /* =========================================================
     ACCESS GRANTED
  ========================================================= */

  return children;
}