import { useState } from "react";

import PageHeader from "../../components/admin/PageHeader";
import PrimaryButton from "../../components/admin/PrimaryButton";
import DataTable from "../../components/admin/DataTable";

export default function Members() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [members] = useState([
    {
      id: 1,
      name: "Krishna Shah",
      email: "krishna@vtks.com",
      mobile: "91888XXXXX",
      plan: "Annual",
      startDate: "2026-07-04",
      expiryDate: "2027-07-03",
      amount: 21000,
      status: "Active",
    },
    {
      id: 2,
      name: "Rahul Patel",
      email: "rahul@example.com",
      mobile: "98765XXXXX",
      plan: "Quarterly",
      startDate: "2026-07-01",
      expiryDate: "2026-09-30",
      amount: 7000,
      status: "Active",
    },
  ]);

  const badgeStyle = (value) => {
    const colors = {
      Active: ["#dcfce7", "#166534"],
      Expired: ["#fee2e2", "#991b1b"],
      Annual: ["#dbeafe", "#1e40af"],
      Quarterly: ["#fef3c7", "#92400e"],
      Monthly: ["#f1f5f9", "#334155"],
    };

    const [bg, color] = colors[value] || ["#f1f5f9", "#334155"];

    return (
      <span
        style={{
          background: bg,
          color,
          padding: "6px 10px",
          borderRadius: "20px",
          fontSize: "13px",
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    );
  };

  const filteredMembers = members.filter((member) => {
    const matchSearch =
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase()) ||
      member.mobile.toLowerCase().includes(search.toLowerCase());

    const matchPlan = planFilter === "All" || member.plan === planFilter;
    const matchStatus = statusFilter === "All" || member.status === statusFilter;

    return matchSearch && matchPlan && matchStatus;
  });

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "mobile", label: "Mobile" },
    {
      key: "plan",
      label: "Plan",
      render: (row) => badgeStyle(row.plan),
    },
    {
      key: "startDate",
      label: "Start Date",
      render: (row) => new Date(row.startDate).toLocaleDateString("en-IN"),
    },
    {
      key: "expiryDate",
      label: "Expiry",
      render: (row) => new Date(row.expiryDate).toLocaleDateString("en-IN"),
    },
    {
      key: "amount",
      label: "Amount",
      render: (row) => `₹${row.amount}`,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => badgeStyle(row.status),
    },
    {
      key: "action",
      label: "Action",
      render: () => <>✏️ Edit &nbsp;&nbsp; 🗑 Delete</>,
    },
  ];

  return (
    <>
      <PageHeader
        title="VTKS Members"
        subtitle="Manage subscriber plans, renewals, access, and membership lifecycle from one dashboard."
        action={<PrimaryButton>+ Add Member</PrimaryButton>}
      />

      <div
        style={{
          display: "flex",
          gap: "15px",
          marginBottom: "25px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          placeholder="🔍 Search Members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "12px 16px",
            border: "1px solid #d1d5db",
            borderRadius: "10px",
            minWidth: "280px",
            fontSize: "15px",
          }}
        />

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          style={{
            padding: "12px 16px",
            border: "1px solid #d1d5db",
            borderRadius: "10px",
            fontSize: "15px",
            minWidth: "150px",
          }}
        >
          <option value="All">💳 Plan</option>
          <option value="Annual">Annual</option>
          <option value="Quarterly">Quarterly</option>
          <option value="Monthly">Monthly</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "12px 16px",
            border: "1px solid #d1d5db",
            borderRadius: "10px",
            fontSize: "15px",
            minWidth: "150px",
          }}
        >
          <option value="All">📌 Status</option>
          <option value="Active">Active</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      <DataTable columns={columns} data={filteredMembers} />
    </>
  );
}