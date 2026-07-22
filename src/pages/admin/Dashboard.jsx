import { useEffect, useState } from "react";

import PageHeader from "../../components/admin/PageHeader";
import DashboardStats from "../../components/admin/dashboard/DashboardStats";

import { getMembers } from "../../services/memberService";
import { getResources } from "../../services/libraryService";
import { getScanners } from "../../services/scannerService";
import { getHoldings } from "../../services/holdingService";

import "./Dashboard.css";

export default function Dashboard() {
  const [stats, setStats] = useState({
    holdings: [],
    members: [],
    resources: [],
    scanners: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [holdings, members, resources, scanners] =
        await Promise.all([
          getHoldings(),
          getMembers(),
          getResources(),
          getScanners(),
        ]);

      setStats({
        holdings: holdings || [],
        members: members || [],
        resources: resources || [],
        scanners: scanners || [],
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="admin-dashboard-page">
      <PageHeader
        title="VTKS Admin Dashboard"
        subtitle={
          loading
            ? "Loading dashboard..."
            : "Welcome back, VTKS 👋"
        }
      />

      {!loading && (
        <DashboardStats
          holdings={stats.holdings}
          members={stats.members}
          resources={stats.resources}
          scanners={stats.scanners}
        />
      )}
    </section>
  );
}