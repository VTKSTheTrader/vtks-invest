import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/admin/PageHeader";
import PrimaryButton from "../../components/admin/PrimaryButton";
import DataTable from "../../components/admin/DataTable";
import MemberModal from "../../components/admin/modals/MemberModal";
import Pagination from "../../components/common/Pagination";

import "./Members.css";

import {
  getMembers,
  addMember,
  updateMember,
  deleteMember,
  mapMemberFromDB,
} from "../../services/memberService";

const ITEMS_PER_PAGE = 5;

const formatInputDate = (date) =>
  date.toLocaleDateString("en-CA");

const getCurrentMonthRange = () => {
  const now = new Date();

  return {
    from: formatInputDate(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      )
    ),

    to: formatInputDate(
      new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      )
    ),
  };
};

const currentMonthRange =
  getCurrentMonthRange();

export default function Members() {
  const [showModal, setShowModal] =
    useState(false);

  const [editingMember, setEditingMember] =
    useState(null);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [fromDate, setFromDate] = useState(
    currentMonthRange.from
  );

  const [toDate, setToDate] = useState(
    currentMonthRange.to
  );

  const [currentPage, setCurrentPage] =
    useState(1);

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);

      const memberRows = await getMembers();

      setMembers(
        (memberRows || []).map(mapMemberFromDB)
      );
    } catch (error) {
      console.error(
        "Members load error:",
        error
      );

      alert(
        error?.message ||
          "Failed to load members"
      );
    } finally {
      setLoading(false);
    }
  };

  const getMemberStatus = (expiryDate) => {
    if (!expiryDate) {
      return "Expired";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(
      `${expiryDate}T00:00:00`
    );

    expiry.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (expiry.getTime() -
        today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      return "Expired";
    }

    if (diffDays <= 7) {
      return "Expiring Soon";
    }

    return "Active";
  };

  const badge = (value) => {
    const colors = {
      Annual: ["#dbeafe", "#1e40af"],
      Quarterly: ["#fef3c7", "#92400e"],
      Monthly: ["#fee2e2", "#991b1b"],

      Active: ["#dcfce7", "#166534"],
      "Expiring Soon": [
        "#fef3c7",
        "#92400e",
      ],
      Expired: ["#fee2e2", "#991b1b"],

      Settled: ["#dcfce7", "#166534"],
      Pending: ["#fef3c7", "#92400e"],
    };

    const [background, color] =
      colors[value] ||
      ["#f1f5f9", "#334155"];

    return (
      <span
        style={{
          background,
          color,
          padding: "6px 10px",
          borderRadius: "20px",
          fontSize: "13px",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    );
  };

  const tvBadge = (tvId) => {
    if (!tvId) {
      return "-";
    }

    return (
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(
              String(tvId)
            );

            alert("TV ID copied");
          } catch (error) {
            console.error(
              "Copy TV ID error:",
              error
            );

            alert("Failed to copy TV ID");
          }
        }}
        title="Click to copy TV ID"
        style={{
          border: "none",
          background: "#dbeafe",
          color: "#1e40af",
          padding: "6px 10px",
          borderRadius: "18px",
          fontWeight: 700,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        📋 @{tvId}
      </button>
    );
  };

  const handleSaveMember = async (
    member
  ) => {
    try {
      const cleanMember = {
        ...member,

        name: String(
          member.name || ""
        ).trim(),

        email: String(
          member.email || ""
        )
          .trim()
          .toLowerCase(),

        mobile: String(
          member.mobile || ""
        ).trim(),

        tvId: String(
          member.tvId || ""
        ).trim(),

        telegram: String(
          member.telegram || ""
        ).trim(),

        amount: Number(
          member.amount || 0
        ),

        settlementStatus:
          member.settlementStatus ||
          "Pending",
      };

      if (editingMember) {
        const updated =
          await updateMember(
            editingMember.id,
            cleanMember
          );

        setMembers((previous) =>
          previous.map(
            (currentMember) =>
              currentMember.id ===
              editingMember.id
                ? mapMemberFromDB(
                    updated
                  )
                : currentMember
          )
        );

        setEditingMember(null);
        return;
      }

      const inserted =
        await addMember(cleanMember);

      setMembers((previous) => [
        mapMemberFromDB(inserted),
        ...previous,
      ]);

      setCurrentPage(1);
    } catch (error) {
      console.error(
        "Save member error:",
        error
      );

      alert(
        error?.message ||
          "Failed to save member"
      );

      throw error;
    }
  };

  const handleDelete = async (id) => {
    const confirmed =
      window.confirm(
        "Delete this member?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteMember(id);

      setMembers((previous) =>
        previous.filter(
          (member) => member.id !== id
        )
      );
    } catch (error) {
      console.error(
        "Delete member error:",
        error
      );

      alert(
        error?.message ||
          "Failed to delete member"
      );
    }
  };

  const markSettled = async (member) => {
    try {
      const updated =
        await updateMember(member.id, {
          ...member,
          settlementStatus: "Settled",
        });

      setMembers((previous) =>
        previous.map(
          (currentMember) =>
            currentMember.id ===
            member.id
              ? mapMemberFromDB(updated)
              : currentMember
        )
      );
    } catch (error) {
      console.error(
        "Settle member error:",
        error
      );

      alert(
        error?.message ||
          "Failed to settle member"
      );
    }
  };

  const actionButton = (
    label,
    color,
    onClick
  ) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        color,
        cursor: "pointer",
        fontSize: "15px",
        fontWeight: 700,
        marginRight: "10px",
        marginBottom: "6px",
        padding: 0,
      }}
    >
      {label}
    </button>
  );

  const lifetimeRevenue = useMemo(
    () =>
      members.reduce(
        (sum, member) =>
          sum +
          Number(member.amount || 0),
        0
      ),
    [members]
  );

  const settledRevenue = useMemo(
    () =>
      members
        .filter(
          (member) =>
            member.settlementStatus ===
            "Settled"
        )
        .reduce(
          (sum, member) =>
            sum +
            Number(
              member.amount || 0
            ),
          0
        ),
    [members]
  );

  const pendingRevenue = useMemo(
    () =>
      members
        .filter(
          (member) =>
            member.settlementStatus !==
            "Settled"
        )
        .reduce(
          (sum, member) =>
            sum +
            Number(
              member.amount || 0
            ),
          0
        ),
    [members]
  );

  const customRevenue = useMemo(() => {
    if (!fromDate || !toDate) {
      return 0;
    }

    const from = new Date(
      `${fromDate}T00:00:00`
    );

    const to = new Date(
      `${toDate}T23:59:59`
    );

    return members
      .filter((member) => {
        if (!member.startDate) {
          return false;
        }

        const memberDate = new Date(
          `${member.startDate}T00:00:00`
        );

        return (
          memberDate >= from &&
          memberDate <= to
        );
      })
      .reduce(
        (sum, member) =>
          sum +
          Number(member.amount || 0),
        0
      );
  }, [members, fromDate, toDate]);

  const totalActive = members.filter(
    (member) =>
      getMemberStatus(
        member.expiryDate
      ) === "Active"
  ).length;

  const totalExpiringSoon =
    members.filter(
      (member) =>
        getMemberStatus(
          member.expiryDate
        ) === "Expiring Soon"
    ).length;

  const totalExpired = members.filter(
    (member) =>
      getMemberStatus(
        member.expiryDate
      ) === "Expired"
  ).length;

  const totalAnnual = members.filter(
    (member) =>
      member.plan === "Annual"
  ).length;

  const filteredMembers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return members.filter((member) => {
      const currentStatus =
        getMemberStatus(
          member.expiryDate
        );

      const matchesSearch =
        !query ||
        String(member.name || "")
          .toLowerCase()
          .includes(query) ||
        String(member.email || "")
          .toLowerCase()
          .includes(query) ||
        String(member.mobile || "")
          .toLowerCase()
          .includes(query) ||
        String(member.tvId || "")
          .toLowerCase()
          .includes(query);

      const matchesPlan =
        planFilter === "All" ||
        member.plan === planFilter;

      const matchesStatus =
        statusFilter === "All" ||
        currentStatus === statusFilter;

      return (
        matchesSearch &&
        matchesPlan &&
        matchesStatus
      );
    });
  }, [
    members,
    search,
    planFilter,
    statusFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    planFilter,
    statusFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredMembers.length /
        ITEMS_PER_PAGE
    )
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedMembers = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      ITEMS_PER_PAGE;

    return filteredMembers.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [
    filteredMembers,
    currentPage,
  ]);

  const firstVisibleRecord =
    filteredMembers.length === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const lastVisibleRecord = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredMembers.length
  );

  const formatDisplayDate = (value) => {
    if (!value) {
      return "-";
    }

    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString("en-IN");
  };

  const columns = [
    {
      key: "name",
      label: "Name",
    },

    {
      key: "email",
      label: "Email",
    },

    {
      key: "mobile",
      label: "Mobile",
    },

    {
      key: "tvId",
      label: "TV ID",
      render: (row) =>
        tvBadge(row.tvId),
    },

    {
      key: "plan",
      label: "Plan",
      render: (row) =>
        badge(row.plan),
    },

    {
      key: "startDate",
      label: "Start",
      render: (row) =>
        formatDisplayDate(
          row.startDate
        ),
    },

    {
      key: "expiryDate",
      label: "Expiry",
      render: (row) =>
        formatDisplayDate(
          row.expiryDate
        ),
    },

    {
      key: "amount",
      label: "Amount",
      render: (row) =>
        `₹${Number(
          row.amount || 0
        ).toLocaleString("en-IN")}`,
    },

    {
      key: "status",
      label: "Status",
      render: (row) =>
        badge(
          getMemberStatus(
            row.expiryDate
          )
        ),
    },

    {
      key: "settlementStatus",
      label: "Settlement",
      render: (row) =>
        badge(
          row.settlementStatus ||
            "Pending"
        ),
    },

    {
      key: "action",
      label: "Action",
      render: (row) => (
        <div
          style={{
            minWidth: "170px",
          }}
        >
          {actionButton(
            "✏️ Edit",
            "#2563eb",
            () => {
              setEditingMember(row);
              setShowModal(true);
            }
          )}

          {row.settlementStatus !==
            "Settled" &&
            actionButton(
              "✅ Settle",
              "#16a34a",
              () =>
                markSettled(row)
            )}

          {actionButton(
            "🗑 Delete",
            "#dc2626",
            () =>
              handleDelete(row.id)
          )}
        </div>
      ),
    },
  ];

  const clearFilters = () => {
    setSearch("");
    setPlanFilter("All");
    setStatusFilter("All");
    setFromDate(currentMonthRange.from);
    setToDate(currentMonthRange.to);
    setCurrentPage(1);
  };

  return (
    <section className="members-page">
      <PageHeader
        title="VTKS Members"
        subtitle="Manage subscribers, payments and membership access from one dashboard."
        action={
          <PrimaryButton
            onClick={() => {
              setEditingMember(null);
              setShowModal(true);
            }}
          >
            + Add Member
          </PrimaryButton>
        }
      />

      {loading ? (
        <div className="members-loading">Loading members...</div>
      ) : (
        <>
          <div className="members-stats-grid">
            <article className="members-stat-card">
              <strong>{members.length}</strong>
              <span>Total Members</span>
            </article>

            <article className="members-stat-card">
              <strong>{totalActive}</strong>
              <span>Active Members</span>
            </article>

            <article className="members-stat-card">
              <strong>{totalExpiringSoon}</strong>
              <span>Expiring Soon</span>
            </article>

            <article className="members-stat-card">
              <strong>{totalExpired}</strong>
              <span>Expired Members</span>
            </article>

            <article className="members-stat-card">
              <strong>{totalAnnual}</strong>
              <span>Annual Plans</span>
            </article>
          </div>

          <h2 className="members-section-title">Revenue Tracker</h2>

          <div className="members-revenue-grid">
            <article className="members-revenue-card">
              <strong>₹{lifetimeRevenue.toLocaleString("en-IN")}</strong>
              <span>Lifetime Revenue</span>
            </article>

            <article className="members-revenue-card">
              <strong>₹{settledRevenue.toLocaleString("en-IN")}</strong>
              <span>Settled Revenue</span>
            </article>

            <article className="members-revenue-card">
              <strong>₹{pendingRevenue.toLocaleString("en-IN")}</strong>
              <span>Pending Revenue</span>
            </article>

            <article className="members-revenue-card">
              <strong>₹{customRevenue.toLocaleString("en-IN")}</strong>
              <span>Custom Date Revenue</span>
            </article>
          </div>

          <div className="members-filter-panel">
            <input
              className="members-date-input"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              aria-label="Revenue start date"
            />

            <input
              className="members-date-input"
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              aria-label="Revenue end date"
            />

            <input
              className="members-search-input"
              type="search"
              placeholder="🔍 Search Name / Email / Mobile / TV ID..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              className="members-filter-select"
              value={planFilter}
              onChange={(event) => setPlanFilter(event.target.value)}
            >
              <option value="All">💳 All Plans</option>
              <option value="Annual">Annual</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Monthly">Monthly</option>
            </select>

            <select
              className="members-filter-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">📌 All Status</option>
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
            </select>

            <button
              type="button"
              className="members-clear-button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>

          <div className="members-results-bar">
            <span>
              Showing {firstVisibleRecord}–{lastVisibleRecord} of{" "}
              {filteredMembers.length} members
            </span>
            <span>Page {currentPage} of {totalPages}</span>
          </div>

          <div className="members-table-shell">
            <DataTable columns={columns} data={paginatedMembers} />
          </div>

          <div className="members-pagination-shell">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}

      {showModal && (
        <MemberModal
          onClose={() => {
            setShowModal(false);
            setEditingMember(null);
          }}
          onSave={handleSaveMember}
          editingMember={editingMember}
        />
      )}
    </section>
  );
}
