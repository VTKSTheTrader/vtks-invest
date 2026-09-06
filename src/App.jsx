import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import SubscriberRoute from "./components/auth/SubscriberRoute";
import RouteSEO from "./components/common/RouteSEO";

import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";

/* =====================================================
   PUBLIC PAGES
===================================================== */

import Home from "./pages/public/Home";
import Indicators from "./pages/public/Indicators";
import Pricing from "./pages/public/Pricing";
import Accuracy from "./pages/public/Accuracy";
import Resources from "./pages/public/Resources";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import ForgotPassword from "./pages/public/ForgotPassword";
import ResetPassword from "./pages/public/ResetPassword";

import TradeDetails from "./pages/public/TradeDetails";
import MarketStudyDetails from "./pages/public/MarketStudyDetails";

import Payment from "./pages/public/Payment";
import NotFound from "./pages/public/NotFound";
import PublicTestimonials from "./pages/public/Testimonials";
import AskVTKS from "./pages/public/AskVTKS";
import AnsweredQueries from "./pages/public/AnsweredQueries";
import PublicMonthlyLevels from "./pages/public/MonthlyLevels";
import PublicETF from "./pages/public/ETF";
import ETFAnalysis from "./pages/public/ETFAnalysis";
/* =====================================================
   ADMIN PAGES
===================================================== */

import AdminDashboard from "./pages/admin/Dashboard";
import AdminHoldings from "./pages/admin/Holdings";
import AdminETF from "./pages/admin/ETF";
import MembersV2Test from "./pages/admin/MembersV2Test";
import RegisteredUsers from "./pages/admin/RegisteredUsers";
import AdminScanner from "./pages/admin/Scanner";
import AdminLibrary from "./pages/admin/Library";
import AdminSettings from "./pages/admin/Settings";
import CommunityLinks from "./pages/admin/CommunityLinks";
import AdminTestimonials from "./pages/admin/Testimonials";
import MonthlyLevels from "./pages/admin/MonthlyLevels";
import AdminStockQueries from "./pages/admin/StockQueries";
import AdminExpenses from "./pages/admin/Expenses";
import AdminNotifications from "./pages/admin/Notifications";

/* =====================================================
   SUBSCRIBER PAGES
===================================================== */

import SubscriberDashboard from "./pages/subscriber/Dashboard";
import SubscriberLibrary from "./pages/subscriber/Library";
import SubscriberScanner from "./pages/subscriber/Scanner";
import Feedback from "./pages/subscriber/Feedback";
import SubscriberMonthlyLevels from "./pages/subscriber/MonthlyLevels";
import SubscriberResourceViewer from "./pages/subscriber/ResourceViewer";

import {
  getSubscriberProfile,
  getSubscriberMembership,
} from "./services/subscriberService";

/* =====================================================
   PREMIUM SUBSCRIBER ROUTE
   Monthly: blocked
   Quarterly / Annual: allowed
===================================================== */

function PremiumSubscriberRoute({ children }) {
  const [checkingPlan, setCheckingPlan] = useState(true);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);

  useEffect(() => {
    let active = true;

    const checkPlanAccess = async () => {
      try {
        const profile = await getSubscriberProfile();

        const membership = await getSubscriberMembership(
          profile?.email
        );

        const plan = String(
          membership?.plan || ""
        )
          .trim()
          .toLowerCase();

        const status = String(
          membership?.status || ""
        )
          .trim()
          .toLowerCase();

        const expiryDate = membership?.expiry_date
          ? new Date(membership.expiry_date)
          : null;

        if (expiryDate) {
          expiryDate.setHours(23, 59, 59, 999);
        }

        const isActive =
          Boolean(membership) &&
          status !== "expired" &&
          status !== "inactive" &&
          (!expiryDate ||
            expiryDate.getTime() >= Date.now());

        const premiumPlan =
          plan === "quarterly" ||
          plan === "annual";

        if (active) {
          setHasPremiumAccess(
            isActive && premiumPlan
          );
        }
      } catch (error) {
        console.error(
          "Premium route access check failed:",
          error
        );

        if (active) {
          setHasPremiumAccess(false);
        }
      } finally {
        if (active) {
          setCheckingPlan(false);
        }
      }
    };

    checkPlanAccess();

    return () => {
      active = false;
    };
  }, []);

  if (checkingPlan) {
    return (
      <div className="subscriber-dashboard-loading">
        Checking subscription access...
      </div>
    );
  }

  if (!hasPremiumAccess) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>

      {/* =================================================
          GLOBAL ROUTE SEO
      ================================================== */}

      <RouteSEO />

      <Routes>

        {/* =================================================
            PUBLIC ROUTES
        ================================================== */}

        <Route element={<PublicLayout />}>

          <Route
            path="/"
            element={<Home />}
          />

          {/* =================================================
              OLD FUNDS ROUTE
              Redirect to Market Studies / Accuracy
          ================================================== */}

          <Route
            path="/funds"
            element={
              <Navigate
                to="/accuracy"
                replace
              />
            }
          />
<Route
  path="/etf"
  element={<PublicETF />}
/>

<Route
  path="/etf/:id"
  element={<ETFAnalysis />}
/>
          <Route
            path="/indicators"
            element={<Indicators />}
          />

          <Route
            path="/pricing"
            element={<Pricing />}
          />

          <Route
            path="/payment"
            element={<Payment />}
          />

          {/* =================================================
              MAIN PUBLIC MARKET STUDIES PAGE
          ================================================== */}

          <Route
            path="/accuracy"
            element={<Accuracy />}
          />

          {/* =================================================
              INDIVIDUAL MARKET STUDY
          ================================================== */}

          <Route
            path="/market-study/:id"
            element={<MarketStudyDetails />}
          />

          <Route
            path="/resources"
            element={<Resources />}
          />

          <Route
            path="/about"
            element={<About />}
          />

          <Route
            path="/contact"
            element={<Contact />}
          />

          <Route
            path="/testimonials"
            element={<PublicTestimonials />}
          />

          <Route
            path="/monthly-levels"
            element={<PublicMonthlyLevels />}
          />

          <Route
            path="/ask-vtks"
            element={<AskVTKS />}
          />

          <Route
            path="/answered-queries"
            element={<AnsweredQueries />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          {/* =================================================
              LEGACY PUBLIC TRADE DETAILS
              KEEP FOR EXISTING / OLD LINKS
          ================================================== */}

          <Route
            path="/trade/:id"
            element={<TradeDetails />}
          />

          {/* =================================================
              404
          ================================================== */}

          <Route
            path="*"
            element={<NotFound />}
          />

        </Route>

        {/* =================================================
            ADMIN ROUTES
        ================================================== */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >

          <Route
            index
            element={<AdminDashboard />}
          />

          <Route
            path="holdings"
            element={<AdminHoldings />}
          />

          {/* =================================================
              ETF PORTFOLIO
          ================================================== */}

          <Route
            path="etf"
            element={<AdminETF />}
          />

          {/* =================================================
              MEMBERS
          ================================================== */}

          <Route
            path="members"
            element={<MembersV2Test />}
          />
<Route
  path="registered-users"
  element={<RegisteredUsers />}
/>
<Route
  path="notifications"
  element={<AdminNotifications />}
/>
          <Route
            path="expenses"
            element={<AdminExpenses />}
          />

          {/* TEMPORARY FALLBACK TEST ROUTE */}

          <Route
            path="members-v2-test"
            element={<MembersV2Test />}
          />

          <Route
            path="scanner"
            element={<AdminScanner />}
          />

          <Route
            path="library"
            element={<AdminLibrary />}
          />

          <Route
            path="stock-queries"
            element={<AdminStockQueries />}
          />

          <Route
            path="settings"
            element={<AdminSettings />}
          />

          <Route
            path="community-links"
            element={<CommunityLinks />}
          />

          <Route
            path="testimonials"
            element={<AdminTestimonials />}
          />

          <Route
            path="monthly-levels"
            element={<MonthlyLevels />}
          />

        </Route>

        {/* =================================================
            SUBSCRIBER ROUTES
        ================================================== */}

        <Route
          path="/dashboard"
          element={
            <SubscriberRoute>
              <SubscriberDashboard />
            </SubscriberRoute>
          }
        />

        <Route
          path="/dashboard/monthly-levels"
          element={
            <SubscriberRoute>
              <SubscriberMonthlyLevels />
            </SubscriberRoute>
          }
        />
<Route
  path="/dashboard/library/:id"
  element={
    <SubscriberRoute>
      <PremiumSubscriberRoute>
        <SubscriberResourceViewer />
      </PremiumSubscriberRoute>
    </SubscriberRoute>
  }
/>
        <Route
          path="/dashboard/library"
          element={
            <SubscriberRoute>
              <PremiumSubscriberRoute>
                <SubscriberLibrary />
              </PremiumSubscriberRoute>
            </SubscriberRoute>
          }
        />

        <Route
          path="/dashboard/scanner"
          element={
            <SubscriberRoute>
              <PremiumSubscriberRoute>
                <SubscriberScanner />
              </PremiumSubscriberRoute>
            </SubscriberRoute>
          }
        />

        {/* =================================================
            SUBSCRIBER TRADE DETAILS
            KEEP UNTOUCHED
        ================================================== */}

        <Route
          path="/dashboard/trade/:id"
          element={
            <SubscriberRoute>
              <TradeDetails />
            </SubscriberRoute>
          }
        />

        <Route
          path="/subscriber/feedback"
          element={
            <SubscriberRoute>
              <PremiumSubscriberRoute>
                <Feedback />
              </PremiumSubscriberRoute>
            </SubscriberRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;