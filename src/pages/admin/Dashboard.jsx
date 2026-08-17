import {
  useEffect,
  useState,
} from "react";

import PageHeader from "../../components/admin/PageHeader";
import DashboardStats from "../../components/admin/dashboard/DashboardStats";

import {
  getMemberSummaryV2,
  getMemberDashboardStatsV2,
} from "../../services/membersV2Service";

import {
  getExpenses,
  getExpenseStats,
} from "../../services/expenseService";

import {
  getResources,
} from "../../services/libraryService";

import {
  getScanners,
} from "../../services/scannerService";

import {
  getHoldings,
} from "../../services/holdingService";

import "./Dashboard.css";

export default function Dashboard() {
  const [
    stats,
    setStats,
  ] = useState({
    holdings: [],
    members: [],
    resources: [],
    scanners: [],

    memberStats: null,
    expenseStats: null,

    settledRevenue: 0,
    pendingRevenue: 0,
    totalExpenses: 0,
    netRevenue: 0,
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =====================================================
     LOAD DASHBOARD
  ===================================================== */

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        holdings,
        members,
        memberStats,
        expenses,
        resources,
        scanners,
      ] = await Promise.all([
        getHoldings(),
        getMemberSummaryV2(),
        getMemberDashboardStatsV2(),
        getExpenses(),
        getResources(),
        getScanners(),
      ]);

      /* =================================================
         EXPENSE STATS
      ================================================= */

      const expenseStats =
        getExpenseStats(
          expenses || []
        );

      /* =================================================
         FINANCE VALUES
      ================================================= */

      const settledRevenue =
        Number(
          memberStats?.settledRevenue ||
            0
        );

      const pendingRevenue =
        Number(
          memberStats?.pendingRevenue ||
            0
        );

      const totalExpenses =
        Number(
          expenseStats?.totalExpenses ||
            0
        );

      /*
        VTKS preferred calculation:

        Net Revenue =
        Pending Revenue - Total Expenses
      */

      const netRevenue =
        pendingRevenue -
        totalExpenses;

      /* =================================================
         SAVE DASHBOARD STATE
      ================================================= */

      setStats({
        holdings:
          holdings || [],

        members:
          members || [],

        resources:
          resources || [],

        scanners:
          scanners || [],

        memberStats:
          memberStats || null,

        expenseStats:
          expenseStats || null,

        settledRevenue,

        pendingRevenue,

        totalExpenses,

        netRevenue,
      });
    } catch (err) {
      console.error(
        "Dashboard load error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <section className="admin-dashboard-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <PageHeader
        title="VTKS Admin Dashboard"
        subtitle={
          loading
            ? "Loading dashboard..."
            : "Welcome back, VTKS 👋"
        }
      />

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      {!loading && (
        <>

          {/* =================================================
              FINANCE OVERVIEW
          ================================================= */}

          <section className="dashboard-finance-section">

            <h2>
              Finance Overview
            </h2>

            <div className="dashboard-finance-grid">

              {/* SETTLED REVENUE */}

              <FinanceCard
                label="Settled Revenue"
                value={
                  formatMoney(
                    stats.settledRevenue
                  )
                }
              />

              {/* PENDING REVENUE */}

              <FinanceCard
                label="Pending Revenue"
                value={
                  formatMoney(
                    stats.pendingRevenue
                  )
                }
              />

              {/* TOTAL EXPENSES */}

              <FinanceCard
                label="Total Expenses"
                value={
                  formatMoney(
                    stats.totalExpenses
                  )
                }
              />

              {/* NET REVENUE */}

              <FinanceCard
                label="Net Revenue"
                value={
                  formatMoney(
                    stats.netRevenue
                  )
                }
                highlight
              />

            </div>

          </section>

          {/* =================================================
              PLATFORM OVERVIEW
          ================================================= */}

          <section className="dashboard-performance-section">

            <h2>
              Platform Overview
            </h2>

            <DashboardStats
              holdings={
                stats.holdings
              }
              members={
                stats.members
              }
              resources={
                stats.resources
              }
              scanners={
                stats.scanners
              }
            />

          </section>

        </>
      )}

    </section>
  );
}

/* =====================================================
   MONEY FORMAT
===================================================== */

function formatMoney(value) {
  return `₹${Number(
    value || 0
  ).toLocaleString(
    "en-IN"
  )}`;
}

/* =====================================================
   FINANCE CARD
===================================================== */

function FinanceCard({
  label,
  value,
  highlight = false,
}) {
  return (
    <article
      className={`dashboard-finance-card ${
        highlight
          ? "highlight"
          : ""
      }`}
    >

      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>

    </article>
  );
}