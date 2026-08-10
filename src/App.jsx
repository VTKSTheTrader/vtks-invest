import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import SubscriberRoute from "./components/auth/SubscriberRoute";
import RouteSEO from "./components/common/RouteSEO";

import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";

/* =====================================================
   PUBLIC PAGES
===================================================== */

import Home from "./pages/public/Home";
import Funds from "./pages/public/Funds";
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
import Payment from "./pages/public/Payment";
import NotFound from "./pages/public/NotFound";
import PublicTestimonials from "./pages/public/Testimonials";
import AskVTKS from "./pages/public/AskVTKS";
import AnsweredQueries from "./pages/public/AnsweredQueries";
import PublicMonthlyLevels from "./pages/public/MonthlyLevels";

/* =====================================================
   ADMIN PAGES
===================================================== */

import AdminDashboard from "./pages/admin/Dashboard";
import AdminHoldings from "./pages/admin/Holdings";
import AdminMembers from "./pages/admin/Members";
import AdminScanner from "./pages/admin/Scanner";
import AdminLibrary from "./pages/admin/Library";
import AdminSettings from "./pages/admin/Settings";
import CommunityLinks from "./pages/admin/CommunityLinks";
import AdminTestimonials from "./pages/admin/Testimonials";
import MonthlyLevels from "./pages/admin/MonthlyLevels";
import AdminStockQueries from "./pages/admin/StockQueries";

/* =====================================================
   SUBSCRIBER PAGES
===================================================== */

import SubscriberDashboard from "./pages/subscriber/Dashboard";
import SubscriberLibrary from "./pages/subscriber/Library";
import SubscriberScanner from "./pages/subscriber/Scanner";
import Feedback from "./pages/subscriber/Feedback";
import SubscriberMonthlyLevels from "./pages/subscriber/MonthlyLevels";

function App() {
  return (
    <BrowserRouter>
      {/* =================================================
          GLOBAL ROUTE SEO

          This automatically updates:
          - Page title
          - Description
          - Canonical URL
          - Robots
          - Open Graph
          - Twitter metadata
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

          <Route
            path="/funds"
            element={<Funds />}
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

          <Route
            path="/accuracy"
            element={<Accuracy />}
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

          <Route
            path="/trade/:id"
            element={<TradeDetails />}
          />

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

          <Route
            path="members"
            element={<AdminMembers />}
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
          path="/dashboard/library"
          element={
            <SubscriberRoute>
              <SubscriberLibrary />
            </SubscriberRoute>
          }
        />

        <Route
          path="/dashboard/scanner"
          element={
            <SubscriberRoute>
              <SubscriberScanner />
            </SubscriberRoute>
          }
        />

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
              <Feedback />
            </SubscriberRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;