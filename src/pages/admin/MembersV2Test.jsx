import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createMemberWithSubscriptionV2,
  getMemberSummaryV2,
  getMemberDashboardStatsV2,
  getMemberHistoryV2,
  renewMemberV2,
  deleteSubscriptionV2,
  deleteMemberV2,
  updateSettlementStatusV2,
  updateSubscriptionV2,
  updateDashboardAccessV2,
} from "../../services/membersV2Service";

import {
  getAllPlans,
} from "../../services/settingsService";

import "./MembersV2Test.css";

/* =====================================================
   CONSTANTS
===================================================== */

const MEMBERS_PER_PAGE = 5;

/* =====================================================
   DATE HELPERS
===================================================== */

const formatDateForInput = (date) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getTodayIST = () => {
  const parts =
    new Intl.DateTimeFormat(
      "en-GB",
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

  return `${getPart(
    "year"
  )}-${getPart(
    "month"
  )}-${getPart("day")}`;
};

const today = getTodayIST();

const addDays = (
  startDate,
  days
) => {
  if (!startDate) {
    return "";
  }

  const date = new Date(
    `${startDate}T00:00:00`
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  date.setDate(
    date.getDate() +
      Number(days || 0)
  );

  return formatDateForInput(
    date
  );
};

const addOneDay = (value) => {
  if (!value) {
    return today;
  }

  const date = new Date(
    `${value}T00:00:00`
  );

  date.setDate(
    date.getDate() + 1
  );

  return formatDateForInput(
    date
  );
};

const formatDisplayDate = (
  value
) => {
  if (!value) {
    return "-";
  }

  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString(
    "en-IN"
  );
};

const formatMoney = (value) =>
  `₹${Number(
    value || 0
  ).toLocaleString("en-IN")}`;

/* =====================================================
   STATUS
===================================================== */

const getCalculatedStatus = (
  startDate,
  expiryDate
) => {
  if (
    !startDate ||
    !expiryDate
  ) {
    return "Expired";
  }

  const todayIST =
    getTodayIST();

  if (startDate > todayIST) {
    return "Upcoming";
  }

  if (expiryDate < todayIST) {
    return "Expired";
  }

  const currentDate =
    new Date(
      `${todayIST}T00:00:00`
    );

  const expiry =
    new Date(
      `${expiryDate}T00:00:00`
    );

  const diffDays =
    Math.floor(
      (
        expiry.getTime() -
        currentDate.getTime()
      ) /
        86400000
    );

  if (
    diffDays >= 0 &&
    diffDays <= 7
  ) {
    return "Expiring Soon";
  }

  return "Active";
};

/* =====================================================
   DEFAULT MEMBER FORM
===================================================== */

const buildEmptyForm = (
  plans
) => {
  const defaultPlan =
    plans.find(
      (plan) =>
        plan.name ===
        "Quarterly"
    ) ||
    plans[0] ||
    null;

  return {
    name: "",
    email: "",
    mobile: "",
    tvId: "",

    plan:
      defaultPlan?.name ||
      "Quarterly",

    startDate: today,

    expiryDate:
      defaultPlan
        ? addDays(
            today,
            defaultPlan.days
          )
        : "",

    amount: Number(
      defaultPlan?.price || 0
    ),

    settlementStatus:
      "Pending",
  };
};

/* =====================================================
   MAIN
===================================================== */

export default function MembersV2Test() {
  /* =========================
     CORE DATA
  ========================= */

  const [
    plans,
    setPlans,
  ] = useState([]);

  const [
    members,
    setMembers,
  ] = useState([]);

  const [
    stats,
    setStats,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  /* =========================
     MODALS
  ========================= */

  const [
    showAddModal,
    setShowAddModal,
  ] = useState(false);

  const [
    showHistoryModal,
    setShowHistoryModal,
  ] = useState(false);

  const [
    showEditModal,
    setShowEditModal,
  ] = useState(false);

  /* =========================
     CURRENT MEMBER
  ========================= */

  const [
    selectedMember,
    setSelectedMember,
  ] = useState(null);

  const [
    editingSubscription,
    setEditingSubscription,
  ] = useState(null);

  const [
    history,
    setHistory,
  ] = useState([]);

  /* =========================
     PAGINATION
  ========================= */

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  /* =========================
     FILTERS
  ========================= */

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    planFilter,
    setPlanFilter,
  ] = useState("All");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  /* =========================
     ADD MEMBER FORM
  ========================= */

  const [
    form,
    setForm,
  ] = useState({
    name: "",
    email: "",
    mobile: "",
    tvId: "",
    plan: "",
    startDate: today,
    expiryDate: "",
    amount: 0,
    settlementStatus:
      "Pending",
  });

  /* =========================
     RENEW FORM
  ========================= */

  const [
    renewForm,
    setRenewForm,
  ] = useState({
    plan: "",
    startDate: today,
    expiryDate: "",
    amount: 0,
    settlementStatus:
      "Pending",
  });

  /* =========================
     EDIT FORM
  ========================= */

  const [
    editForm,
    setEditForm,
  ] = useState({
    plan: "",
    startDate: "",
    expiryDate: "",
    amount: 0,
    settlementStatus:
      "Pending",
  });

  /* =====================================================
     PLAN LOOKUP
  ===================================================== */

  const getPlan = (
    planName
  ) =>
    plans.find(
      (plan) =>
        String(
          plan.name || ""
        ).toLowerCase() ===
        String(
          planName || ""
        ).toLowerCase()
    ) || null;

  /* =====================================================
     LOAD PLANS
  ===================================================== */

  const loadPlans =
    async () => {
      const rows =
        await getAllPlans();

      const finalPlans =
        Array.isArray(rows)
          ? rows
          : [];

      setPlans(finalPlans);

      const initialForm =
        buildEmptyForm(
          finalPlans
        );

      setForm(initialForm);

      setRenewForm({
        plan:
          initialForm.plan,

        startDate:
          initialForm.startDate,

        expiryDate:
          initialForm.expiryDate,

        amount:
          initialForm.amount,

        settlementStatus:
          "Pending",
      });
    };

  /* =====================================================
     LOAD MEMBERS + STATS
  ===================================================== */

  const loadMembers =
    async () => {
      const [
        summary,
        dashboardStats,
      ] =
        await Promise.all([
          getMemberSummaryV2(),
          getMemberDashboardStatsV2(),
        ]);

      const finalSummary =
        summary || [];

      setMembers(
        finalSummary
      );

      setStats(
        dashboardStats || null
      );

      return finalSummary;
    };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    const initialise =
      async () => {
        try {
          setLoading(true);
          setError("");

          await loadPlans();
          await loadMembers();
        } catch (err) {
          console.error(
            "Members load error:",
            err
          );

          setError(
            err?.message ||
              "Unable to load members."
          );
        } finally {
          setLoading(false);
        }
      };

    initialise();
  }, []);

  /* =====================================================
     ADD MEMBER
  ===================================================== */

  const openAddModal =
    () => {
      setForm(
        buildEmptyForm(plans)
      );

      setError("");
      setMessage("");

      setShowAddModal(true);
    };

  const handleFormChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      if (name === "plan") {
        const plan =
          getPlan(value);

        setForm(
          (previous) => ({
            ...previous,

            plan: value,

            amount: Number(
              plan?.price || 0
            ),

            expiryDate:
              plan
                ? addDays(
                    previous.startDate,
                    plan.days
                  )
                : "",
          })
        );

        return;
      }

      if (
        name === "startDate"
      ) {
        setForm(
          (previous) => {
            const plan =
              getPlan(
                previous.plan
              );

            return {
              ...previous,

              startDate: value,

              expiryDate:
                plan
                  ? addDays(
                      value,
                      plan.days
                    )
                  : "",
            };
          }
        );

        return;
      }

      setForm(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };

  const handleSaveMember =
    async (event) => {
      event.preventDefault();

      try {
        setSaving(true);
        setError("");
        setMessage("");

        const result =
          await createMemberWithSubscriptionV2({
            name: form.name,

            email:
              form.email,

            mobile:
              form.mobile,

            tvId:
              form.tvId,

            plan:
              form.plan,

            startDate:
              form.startDate,

            expiryDate:
              form.expiryDate,

            amount:
              Number(
                form.amount || 0
              ),

            settlementStatus:
              form.settlementStatus,
          });

        setShowAddModal(false);
        setCurrentPage(1);

        await loadMembers();

        setMessage(
          result?.type ===
          "renewal"
            ? "Existing member found. Renewal added successfully."
            : "Member added successfully."
        );
      } catch (err) {
        console.error(
          "Save member error:",
          err
        );

        setError(
          err?.message ||
            "Unable to save member."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =====================================================
     NEXT RENEWAL START
  ===================================================== */

  const getNextRenewalStart =
    (rows) => {
      if (!rows?.length) {
        return today;
      }

      const expiries =
        rows
          .map(
            (row) =>
              row.expiry_date
          )
          .filter(Boolean)
          .sort();

      return addOneDay(
        expiries[
          expiries.length - 1
        ]
      );
    };

  /* =====================================================
     OPEN HISTORY
  ===================================================== */

  const openHistory =
    async (member) => {
      try {
        setError("");

        const rows =
          await getMemberHistoryV2(
            member.id
          );

        setSelectedMember(
          member
        );

        setHistory(
          rows || []
        );

        const plan =
          getPlan(
            member.currentPlan
          ) ||
          plans.find(
            (item) =>
              item.name ===
              "Quarterly"
          ) ||
          plans[0] ||
          null;

        const start =
          getNextRenewalStart(
            rows
          );

        setRenewForm({
          plan:
            plan?.name ||
            "Quarterly",

          startDate:
            start,

          expiryDate:
            plan
              ? addDays(
                  start,
                  plan.days
                )
              : "",

          amount:
            Number(
              plan?.price || 0
            ),

          settlementStatus:
            "Pending",
        });

        setShowHistoryModal(
          true
        );
      } catch (err) {
        console.error(
          "History load error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load history."
        );
      }
    };

  /* =====================================================
     RENEW MEMBER
  ===================================================== */

  const handleRenewChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      if (name === "plan") {
        const plan =
          getPlan(value);

        setRenewForm(
          (previous) => ({
            ...previous,

            plan: value,

            amount: Number(
              plan?.price || 0
            ),

            expiryDate:
              plan
                ? addDays(
                    previous.startDate,
                    plan.days
                  )
                : "",
          })
        );

        return;
      }

      if (
        name === "startDate"
      ) {
        setRenewForm(
          (previous) => {
            const plan =
              getPlan(
                previous.plan
              );

            return {
              ...previous,

              startDate:
                value,

              expiryDate:
                plan
                  ? addDays(
                      value,
                      plan.days
                    )
                  : "",
            };
          }
        );

        return;
      }

      setRenewForm(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };

  const handleRenew =
    async (event) => {
      event.preventDefault();

      if (
        !selectedMember?.id
      ) {
        return;
      }

      try {
        setSaving(true);
        setError("");

        const memberName =
          selectedMember.name;

        await renewMemberV2({
          memberId:
            selectedMember.id,

          plan:
            renewForm.plan,

          startDate:
            renewForm.startDate,

          expiryDate:
            renewForm.expiryDate,

          amount:
            Number(
              renewForm.amount ||
                0
            ),

          settlementStatus:
            renewForm.settlementStatus,
        });

        setShowHistoryModal(
          false
        );

        setSelectedMember(
          null
        );

        setHistory([]);

        await loadMembers();

        setMessage(
          `${memberName} renewed successfully.`
        );
      } catch (err) {
        console.error(
          "Renew error:",
          err
        );

        setError(
          err?.message ||
            "Unable to renew member."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =====================================================
     EDIT SUBSCRIPTION
  ===================================================== */

  const openEditSubscription =
    (subscription) => {
      setEditingSubscription(
        subscription
      );

      setEditForm({
        plan:
          subscription.plan,

        startDate:
          subscription
            .start_date,

        expiryDate:
          subscription
            .expiry_date,

        amount:
          Number(
            subscription.amount ||
              0
          ),

        settlementStatus:
          subscription
            .settlement_status ||
          "Pending",
      });

      setShowHistoryModal(
        false
      );

      setShowEditModal(
        true
      );
    };

  const handleEditChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      if (name === "plan") {
        const plan =
          getPlan(value);

        setEditForm(
          (previous) => ({
            ...previous,

            plan: value,

            amount: Number(
              plan?.price || 0
            ),

            expiryDate:
              plan
                ? addDays(
                    previous.startDate,
                    plan.days
                  )
                : "",
          })
        );

        return;
      }

      if (
        name === "startDate"
      ) {
        setEditForm(
          (previous) => {
            const plan =
              getPlan(
                previous.plan
              );

            return {
              ...previous,

              startDate:
                value,

              expiryDate:
                plan
                  ? addDays(
                      value,
                      plan.days
                    )
                  : "",
            };
          }
        );

        return;
      }

      setEditForm(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };

  const closeEditModal =
    () => {
      setShowEditModal(
        false
      );

      setEditingSubscription(
        null
      );

      if (selectedMember) {
        setShowHistoryModal(
          true
        );
      }
    };

  const handleSaveEdit =
    async (event) => {
      event.preventDefault();

      if (
        !editingSubscription
          ?.id
      ) {
        return;
      }

      try {
        setSaving(true);
        setError("");

        await updateSubscriptionV2({
          subscriptionId:
            editingSubscription.id,

          plan:
            editForm.plan,

          startDate:
            editForm.startDate,

          expiryDate:
            editForm.expiryDate,

          amount:
            Number(
              editForm.amount ||
                0
            ),

          settlementStatus:
            editForm.settlementStatus,
        });

        const memberId =
          selectedMember?.id;

        const updatedMembers =
          await loadMembers();

        if (memberId) {
          const updatedHistory =
            await getMemberHistoryV2(
              memberId
            );

          setHistory(
            updatedHistory ||
              []
          );

          const refreshed =
            updatedMembers.find(
              (member) =>
                member.id ===
                memberId
            );

          if (refreshed) {
            setSelectedMember(
              refreshed
            );
          }
        }

        setShowEditModal(
          false
        );

        setEditingSubscription(
          null
        );

        setShowHistoryModal(
          true
        );

        setMessage(
          "Subscription updated successfully."
        );
      } catch (err) {
        console.error(
          "Edit error:",
          err
        );

        setError(
          err?.message ||
            "Unable to update subscription."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =====================================================
     CURRENT SUBSCRIPTION
  ===================================================== */

  const getCurrentSubscription =
    (member) => {
      if (
        !member
          ?.subscriptions
          ?.length
      ) {
        return null;
      }

      const exact =
        member.subscriptions.find(
          (subscription) =>
            subscription
              .start_date ===
              member
                .currentStartDate &&
            subscription
              .expiry_date ===
              member
                .currentExpiryDate
        );

      return (
        exact ||
        member.subscriptions[0]
      );
    };

  /* =====================================================
     SETTLEMENT
  ===================================================== */

  const handleSettleSubscription =
    async (
      subscription,
      targetMember =
        selectedMember
    ) => {
      if (
        !subscription?.id
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Mark ${subscription.plan} subscription as Settled?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setSaving(true);
        setError("");

        await updateSettlementStatusV2(
          subscription.id,
          "Settled"
        );

        const updatedMembers =
          await loadMembers();

        if (
          targetMember?.id &&
          showHistoryModal
        ) {
          const rows =
            await getMemberHistoryV2(
              targetMember.id
            );

          setHistory(
            rows || []
          );

          const refreshed =
            updatedMembers.find(
              (member) =>
                member.id ===
                targetMember.id
            );

          if (refreshed) {
            setSelectedMember(
              refreshed
            );
          }
        }

        setMessage(
          "Subscription settled successfully."
        );
      } catch (err) {
        console.error(
          "Settlement error:",
          err
        );

        setError(
          err?.message ||
            "Unable to settle subscription."
        );
      } finally {
        setSaving(false);
      }
    };

  const handleSettleMember =
    async (member) => {
      const subscription =
        getCurrentSubscription(
          member
        );

      if (!subscription) {
        setError(
          "Subscription not found."
        );

        return;
      }

      await handleSettleSubscription(
        subscription,
        member
      );
    };

  /* =====================================================
     DELETE SUBSCRIPTION
  ===================================================== */

  const handleDeleteSubscription =
    async (subscription) => {
      if (
        !subscription?.id
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete ${subscription.plan} subscription?\n\nThis will reduce Lifetime Revenue.`
        );

      if (!confirmed) {
        return;
      }

      try {
        setSaving(true);
        setError("");

        const memberId =
          selectedMember.id;

        await deleteSubscriptionV2(
          subscription.id
        );

        const rows =
          await getMemberHistoryV2(
            memberId
          );

        setHistory(
          rows || []
        );

        const updatedMembers =
          await loadMembers();

        if (
          rows.length === 0
        ) {
          setShowHistoryModal(
            false
          );

          setSelectedMember(
            null
          );
        } else {
          const refreshed =
            updatedMembers.find(
              (member) =>
                member.id ===
                memberId
            );

          if (refreshed) {
            setSelectedMember(
              refreshed
            );
          }
        }

        setMessage(
          "Subscription deleted successfully."
        );
      } catch (err) {
        console.error(
          "Delete subscription error:",
          err
        );

        setError(
          err?.message ||
            "Unable to delete subscription."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =====================================================
     DELETE MEMBER
  ===================================================== */

  const deleteMember =
    async (member) => {
      if (!member?.id) {
        return;
      }

      const confirmed =
        window.confirm(
          `Permanently delete ${member.name} and ALL V2 subscription history?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setSaving(true);
        setError("");

        await deleteMemberV2(
          member.id
        );

        setShowHistoryModal(
          false
        );

        setSelectedMember(
          null
        );

        setHistory([]);

        await loadMembers();

        setMessage(
          `${member.name} deleted successfully.`
        );
      } catch (err) {
        console.error(
          "Delete member error:",
          err
        );

        setError(
          err?.message ||
            "Unable to delete member."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =====================================================
     DASHBOARD ACCESS
  ===================================================== */

  const handleDashboardAccess =
    async (member) => {
      if (!member?.id) {
        return;
      }

      const nextValue =
        !Boolean(
          member.dashboard_access
        );

      const confirmed =
        window.confirm(
          nextValue
            ? `Enable dashboard access for ${member.name}?`
            : `Disable dashboard access for ${member.name}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setSaving(true);
        setError("");
        setMessage("");

        await updateDashboardAccessV2(
          member.id,
          nextValue
        );

        await loadMembers();

        setMessage(
          nextValue
            ? `${member.name} dashboard access enabled.`
            : `${member.name} dashboard access disabled.`
        );
      } catch (err) {
        console.error(
          "Dashboard access update error:",
          err
        );

        setError(
          err?.message ||
            "Unable to update dashboard access."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =====================================================
     FILTER MEMBERS
  ===================================================== */

  const filteredMembers =
    useMemo(() => {
      const search =
        searchText
          .trim()
          .toLowerCase();

      return members.filter(
        (member) => {
          /* -------------------------
             SEARCH
          ------------------------- */

          const matchesSearch =
            !search ||
            String(
              member.name || ""
            )
              .toLowerCase()
              .includes(
                search
              ) ||
            String(
              member.email || ""
            )
              .toLowerCase()
              .includes(
                search
              );

          /* -------------------------
             PLAN FILTER
          ------------------------- */

          const matchesPlan =
            planFilter ===
              "All" ||
            String(
              member.currentPlan ||
                ""
            ).toLowerCase() ===
              planFilter.toLowerCase();

          /* -------------------------
             STATUS FILTER
          ------------------------- */

          const actualStatus =
            member.currentStatus ||
            getCalculatedStatus(
              member
                .currentStartDate,
              member
                .currentExpiryDate
            );

          const matchesStatus =
            statusFilter ===
              "All" ||
            String(
              actualStatus || ""
            ).toLowerCase() ===
              statusFilter.toLowerCase();

          return (
            matchesSearch &&
            matchesPlan &&
            matchesStatus
          );
        }
      );
    }, [
      members,
      searchText,
      planFilter,
      statusFilter,
    ]);

  /* =====================================================
     SORT
  ===================================================== */

  const sortedMembers =
    useMemo(
      () =>
        [
          ...filteredMembers,
        ].sort(
          (a, b) =>
            String(
              a.name || ""
            ).localeCompare(
              String(
                b.name || ""
              )
            )
        ),
      [filteredMembers]
    );

  /* =====================================================
     PAGINATION
  ===================================================== */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        sortedMembers.length /
          MEMBERS_PER_PAGE
      )
    );

  const paginatedMembers =
    useMemo(() => {
      const start =
        (
          currentPage - 1
        ) *
        MEMBERS_PER_PAGE;

      return sortedMembers.slice(
        start,
        start +
          MEMBERS_PER_PAGE
      );
    }, [
      sortedMembers,
      currentPage,
    ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchText,
    planFilter,
    statusFilter,
  ]);

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  /* =====================================================
     CLEAR FILTERS
  ===================================================== */

  const clearFilters =
    () => {
      setSearchText("");
      setPlanFilter("All");
      setStatusFilter("All");
      setCurrentPage(1);
    };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <section className="members-v2-page">
        <div className="members-v2-loading">
          Loading Members V2...
        </div>
      </section>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <section className="members-v2-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="members-v2-topbar">

        <div>
          <h1>
            VTKS Members 
          </h1>

          <p>
            Unique members with complete subscription and renewal history.
          </p>
        </div>

        <button
          type="button"
          className="members-v2-primary-btn"
          onClick={
            openAddModal
          }
        >
          + Add Member
        </button>

      </div>

      {/* =================================================
          MESSAGES
      ================================================= */}

      {message && (
        <div className="members-v2-message success">
          {message}
        </div>
      )}

      {error && (
        <div className="members-v2-message error">
          {error}
        </div>
      )}

      {/* =================================================
          MEMBER STATS
      ================================================= */}

      <div className="members-v2-stats">

        <StatCard
          value={
            stats?.totalMembers ||
            0
          }
          label="Total Members"
        />

        <StatCard
          value={
            stats?.activeMembers ||
            0
          }
          label="Active Members"
        />

        <StatCard
          value={
            stats
              ?.expiringSoonMembers ||
            0
          }
          label="Expiring Soon"
        />

        <StatCard
          value={
            stats?.upcomingMembers ||
            0
          }
          label="Upcoming"
        />

        <StatCard
          value={
            stats?.expiredMembers ||
            0
          }
          label="Expired Members"
        />

        <StatCard
          value={
            stats?.annualPlans ||
            0
          }
          label="Annual Plans"
        />

        <StatCard
          value={
            stats?.quarterlyPlans ||
            0
          }
          label="Quarterly Plans"
        />

        <StatCard
          value={
            stats?.monthlyPlans ||
            0
          }
          label="Monthly Plans"
        />

      </div>

      {/* =================================================
          REVENUE
      ================================================= */}

      <h2 className="members-v2-section-title">
        Revenue Tracker
      </h2>

      <div className="members-v2-revenue-grid">

        <RevenueCard
          value={formatMoney(
            stats?.lifetimeRevenue
          )}
          label="Lifetime Revenue"
        />

        <RevenueCard
          value={formatMoney(
            stats?.settledRevenue
          )}
          label="Settled Revenue"
        />

        <RevenueCard
          value={formatMoney(
            stats?.pendingRevenue
          )}
          label="Pending Revenue"
        />

        <RevenueCard
          value={
            stats
              ?.subscriptionsCount ||
            0
          }
          label="Total Subscriptions"
        />

      </div>

      {/* =================================================
          MEMBERS
      ================================================= */}

      <section className="members-v2-panel">

        <div className="members-v2-section-head">

          <div>
            <h2>
              Members
            </h2>

            <p>
              Each person appears only once. Renewals remain in subscription history.
            </p>
          </div>

        </div>

        {/* =================================================
            SEARCH + FILTERS
        ================================================= */}

        <div className="members-v2-filters">

          <div className="members-v2-search-box">

            <input
              type="text"
              placeholder="Search by name or email..."
              value={
                searchText
              }
              onChange={(
                event
              ) =>
                setSearchText(
                  event.target
                    .value
                )
              }
            />

          </div>

          <select
            value={
              planFilter
            }
            onChange={(
              event
            ) =>
              setPlanFilter(
                event.target
                  .value
              )
            }
          >
            <option value="All">
              All Subscriptions
            </option>

            <option value="Monthly">
              Monthly
            </option>

            <option value="Quarterly">
              Quarterly
            </option>

            <option value="Annual">
              Annual
            </option>
          </select>

          <select
            value={
              statusFilter
            }
            onChange={(
              event
            ) =>
              setStatusFilter(
                event.target
                  .value
              )
            }
          >
            <option value="All">
              All Status
            </option>

            <option value="Active">
              Active
            </option>

            <option value="Expiring Soon">
              Expiring Soon
            </option>

            <option value="Upcoming">
              Upcoming
            </option>

            <option value="Expired">
              Expired
            </option>
          </select>

          <button
            type="button"
            className="members-v2-clear-filters"
            onClick={
              clearFilters
            }
            disabled={
              !searchText &&
              planFilter ===
                "All" &&
              statusFilter ===
                "All"
            }
          >
            Clear Filters
          </button>

        </div>

        {/* FILTER SUMMARY */}

        <div className="members-v2-filter-summary">

          <span>
            Showing{" "}
            <strong>
              {
                sortedMembers.length
              }
            </strong>{" "}
            of{" "}
            <strong>
              {
                members.length
              }
            </strong>{" "}
            members
          </span>

          {(planFilter !==
            "All" ||
            statusFilter !==
              "All" ||
            searchText) && (
            <span className="members-v2-filter-active">
              Filters Active
            </span>
          )}

        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="members-v2-table-wrap">

          <table className="members-v2-table">

            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>
                  Current Plan
                </th>
                <th>Start</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Access</th>
                <th>
                  Current Amount
                </th>
                <th>
                  Lifetime Revenue
                </th>
                <th>
                  Renewals
                </th>
                <th>
                  Settlement
                </th>
                <th>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>

              {paginatedMembers.map(
                (member) => {
                  const status =
                    member.currentStatus ||
                    getCalculatedStatus(
                      member
                        .currentStartDate,
                      member
                        .currentExpiryDate
                    );

                  const settled =
                    String(
                      member
                        .currentSettlementStatus ||
                        ""
                    ).toLowerCase() ===
                    "settled";

                  return (
                    <tr
                      key={
                        member.id
                      }
                    >

                      <td>
                        <strong>
                          {
                            member.name
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          member.email
                        }
                      </td>

                      <td>
                        {member
                          .currentPlan ? (
                          <PlanBadge
                            value={
                              member
                                .currentPlan
                            }
                          />
                        ) : (
                          "-"
                        )}
                      </td>

                      <td>
                        {formatDisplayDate(
                          member
                            .currentStartDate
                        )}
                      </td>

                      <td>
                        {formatDisplayDate(
                          member
                            .currentExpiryDate
                        )}
                      </td>

                      <td>
                        <StatusBadge
                          value={
                            status
                          }
                        />
                      </td>

                      <td>
                        <button
                          type="button"
                          disabled={
                            saving
                          }
                          onClick={() =>
                            handleDashboardAccess(
                              member
                            )
                          }
                          style={{
                            border:
                              "none",
                            borderRadius:
                              "18px",
                            padding:
                              "7px 12px",
                            cursor:
                              saving
                                ? "not-allowed"
                                : "pointer",
                            fontWeight:
                              700,
                            background:
                              member.dashboard_access
                                ? "#dcfce7"
                                : "#fee2e2",
                            color:
                              member.dashboard_access
                                ? "#166534"
                                : "#991b1b",
                            whiteSpace:
                              "nowrap",
                            opacity:
                              saving
                                ? 0.65
                                : 1,
                          }}
                        >
                          {member.dashboard_access
                            ? "ON"
                            : "OFF"}
                        </button>
                      </td>

                      <td>
                        {formatMoney(
                          member
                            .currentAmount
                        )}
                      </td>

                      <td>
                        <strong>
                          {formatMoney(
                            member
                              .lifetimeRevenue
                          )}
                        </strong>
                      </td>

                      <td>
                        {
                          member
                            .renewalCount ||
                          0
                        }
                      </td>

                      <td>

                        {!member
                          .currentPlan ? (
                          "-"
                        ) : settled ? (
                          <SettlementBadge
                            value="Settled"
                          />
                        ) : (
                          <button
                            type="button"
                            className="members-v2-settle-btn"
                            disabled={
                              saving
                            }
                            onClick={() =>
                              handleSettleMember(
                                member
                              )
                            }
                          >
                            ✅ Settle
                          </button>
                        )}

                      </td>

                      <td>

                        <div className="members-v2-row-actions">

                          <button
                            type="button"
                            className="members-v2-action-btn"
                            onClick={() =>
                              openHistory(
                                member
                              )
                            }
                          >
                            View / Renew
                          </button>

                          <button
                            type="button"
                            className="members-v2-delete-small-btn"
                            disabled={
                              saving
                            }
                            onClick={() =>
                              deleteMember(
                                member
                              )
                            }
                          >
                            🗑 Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                }
              )}

              {paginatedMembers.length ===
                0 && (
                <tr>
                  <td
                    colSpan="12"
                    className="members-v2-empty"
                  >
                    No members match the selected filters.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

        {/* =================================================
            PAGINATION
        ================================================= */}

        <div className="members-v2-pagination">

          <div className="members-v2-pagination-info">

            Showing{" "}

            {sortedMembers.length ===
            0
              ? 0
              : (
                  currentPage -
                  1
                ) *
                  MEMBERS_PER_PAGE +
                1}

            {" – "}

            {Math.min(
              currentPage *
                MEMBERS_PER_PAGE,
              sortedMembers.length
            )}

            {" of "}

            {
              sortedMembers.length
            }

            {" members"}

          </div>

          <div className="members-v2-pagination-controls">

            <button
              type="button"
              disabled={
                currentPage ===
                1
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.max(
                      1,
                      page - 1
                    )
                )
              }
            >
              Previous
            </button>

            <span>
              Page{" "}
              {currentPage}{" "}
              of{" "}
              {totalPages}
            </span>

            <button
              type="button"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.min(
                      totalPages,
                      page + 1
                    )
                )
              }
            >
              Next
            </button>

          </div>

        </div>

      </section>

      {/* =================================================
          ADD MEMBER MODAL
      ================================================= */}

      {showAddModal && (
        <Modal
          title="Add Member"
          onClose={() =>
            setShowAddModal(
              false
            )
          }
        >

          <form
            className="members-v2-modal-form"
            onSubmit={
              handleSaveMember
            }
          >

            <Input
              label="Name"
              name="name"
              value={
                form.name
              }
              onChange={
                handleFormChange
              }
              required
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={
                form.email
              }
              onChange={
                handleFormChange
              }
              required
            />

            <Input
              label="Mobile"
              name="mobile"
              value={
                form.mobile
              }
              onChange={
                handleFormChange
              }
            />

            <Input
              label="TV ID"
              name="tvId"
              value={
                form.tvId
              }
              onChange={
                handleFormChange
              }
            />

            <PlanSelect
              label="Plan"
              name="plan"
              value={
                form.plan
              }
              onChange={
                handleFormChange
              }
              plans={
                plans
              }
            />

            <Input
              label="Start Date"
              type="date"
              name="startDate"
              value={
                form.startDate
              }
              onChange={
                handleFormChange
              }
              required
            />

            <Input
              label="Expiry Date"
              type="date"
              value={
                form.expiryDate
              }
              readOnly
            />

            <Input
              label="Amount"
              type="number"
              value={
                form.amount
              }
              readOnly
            />

            <SimpleSelect
              label="Settlement"
              name="settlementStatus"
              value={
                form
                  .settlementStatus
              }
              onChange={
                handleFormChange
              }
              options={[
                "Pending",
                "Settled",
              ]}
            />

            <div className="members-v2-plan-preview">

              <span>
                Selected Plan
              </span>

              <strong>
                {
                  form.plan
                }
              </strong>

              <small>
                {formatMoney(
                  form.amount
                )}
                {" • "}
                {getPlan(
                  form.plan
                )?.days || 0}{" "}
                days
              </small>

            </div>

            <div className="members-v2-modal-actions">

              <button
                type="button"
                className="members-v2-secondary-btn"
                onClick={() =>
                  setShowAddModal(
                    false
                  )
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="members-v2-primary-btn"
                disabled={
                  saving
                }
              >
                {saving
                  ? "Saving..."
                  : "Add Member"}
              </button>

            </div>

          </form>

        </Modal>
      )}

      {/* =================================================
          HISTORY / RENEW
      ================================================= */}

      {showHistoryModal &&
        selectedMember && (
          <Modal
            large
            title={`${selectedMember.name} — Membership`}
            onClose={() =>
              setShowHistoryModal(
                false
              )
            }
          >

            <div className="members-v2-history-summary">

              <SummaryBox
                label="Lifetime Revenue"
                value={formatMoney(
                  selectedMember
                    .lifetimeRevenue
                )}
              />

              <SummaryBox
                label="Renewals"
                value={
                  selectedMember
                    .renewalCount ||
                  0
                }
              />

              <SummaryBox
                label="Current Plan"
                value={
                  selectedMember
                    .currentPlan ||
                  "-"
                }
              />

            </div>

            <h3>
              Subscription History
            </h3>

            <div className="members-v2-table-wrap">

              <table className="members-v2-table">

                <thead>
                  <tr>
                    <th>
                      Plan
                    </th>
                    <th>
                      Start
                    </th>
                    <th>
                      Expiry
                    </th>
                    <th>
                      Amount
                    </th>
                    <th>
                      Status
                    </th>
                    <th>
                      Settlement
                    </th>
                    <th>
                      Renewal
                    </th>
                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {history.map(
                    (
                      subscription
                    ) => {
                      const status =
                        subscription
                          .calculated_status ||
                        getCalculatedStatus(
                          subscription
                            .start_date,
                          subscription
                            .expiry_date
                        );

                      const settled =
                        String(
                          subscription
                            .settlement_status ||
                            ""
                        ).toLowerCase() ===
                        "settled";

                      return (
                        <tr
                          key={
                            subscription.id
                          }
                        >

                          <td>
                            <PlanBadge
                              value={
                                subscription.plan
                              }
                            />
                          </td>

                          <td>
                            {formatDisplayDate(
                              subscription
                                .start_date
                            )}
                          </td>

                          <td>
                            {formatDisplayDate(
                              subscription
                                .expiry_date
                            )}
                          </td>

                          <td>
                            {formatMoney(
                              subscription
                                .amount
                            )}
                          </td>

                          <td>
                            <StatusBadge
                              value={
                                status
                              }
                            />
                          </td>

                          <td>
                            <SettlementBadge
                              value={
                                subscription
                                  .settlement_status ||
                                "Pending"
                              }
                            />
                          </td>

                          <td>
                            {subscription
                              .is_renewal
                              ? "Yes"
                              : "No"}
                          </td>

                          <td>

                            <div className="members-v2-history-actions">

                              <button
                                type="button"
                                className="members-v2-edit-btn"
                                onClick={() =>
                                  openEditSubscription(
                                    subscription
                                  )
                                }
                              >
                                ✏ Edit
                              </button>

                              {!settled && (
                                <button
                                  type="button"
                                  className="members-v2-settle-btn"
                                  disabled={
                                    saving
                                  }
                                  onClick={() =>
                                    handleSettleSubscription(
                                      subscription
                                    )
                                  }
                                >
                                  ✅ Settle
                                </button>
                              )}

                              <button
                                type="button"
                                className="members-v2-delete-small-btn"
                                disabled={
                                  saving
                                }
                                onClick={() =>
                                  handleDeleteSubscription(
                                    subscription
                                  )
                                }
                              >
                                🗑 Delete
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                  {history.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan="8"
                        className="members-v2-empty"
                      >
                        No subscription history.
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

            <h3 className="members-v2-renew-title">
              Renew Membership
            </h3>

            <form
              className="members-v2-modal-form"
              onSubmit={
                handleRenew
              }
            >

              <PlanSelect
                label="New Plan"
                name="plan"
                value={
                  renewForm.plan
                }
                onChange={
                  handleRenewChange
                }
                plans={
                  plans
                }
              />

              <Input
                label="Start Date"
                type="date"
                name="startDate"
                value={
                  renewForm
                    .startDate
                }
                onChange={
                  handleRenewChange
                }
              />

              <Input
                label="Expiry Date"
                type="date"
                value={
                  renewForm
                    .expiryDate
                }
                readOnly
              />

              <Input
                label="Amount"
                type="number"
                value={
                  renewForm.amount
                }
                readOnly
              />

              <SimpleSelect
                label="Settlement"
                name="settlementStatus"
                value={
                  renewForm
                    .settlementStatus
                }
                onChange={
                  handleRenewChange
                }
                options={[
                  "Pending",
                  "Settled",
                ]}
              />

              <div className="members-v2-plan-preview">

                <span>
                  Renewal Plan
                </span>

                <strong>
                  {
                    renewForm.plan
                  }
                </strong>

                <small>
                  {formatMoney(
                    renewForm.amount
                  )}
                  {" • "}
                  {getPlan(
                    renewForm.plan
                  )?.days || 0}{" "}
                  days
                </small>

              </div>

              <div className="members-v2-modal-actions members-v2-modal-actions-delete">

                <button
                  type="button"
                  className="members-v2-delete-member-btn"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    deleteMember(
                      selectedMember
                    )
                  }
                >
                  Delete Member
                </button>

                <div className="members-v2-modal-actions-right">

                  <button
                    type="button"
                    className="members-v2-secondary-btn"
                    onClick={() =>
                      setShowHistoryModal(
                        false
                      )
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="members-v2-primary-btn"
                    disabled={
                      saving
                    }
                  >
                    {saving
                      ? "Renewing..."
                      : "Renew Member"}
                  </button>

                </div>

              </div>

            </form>

          </Modal>
        )}

      {/* =================================================
          EDIT SUBSCRIPTION
      ================================================= */}

      {showEditModal &&
        editingSubscription && (
          <Modal
            title="Edit Subscription"
            onClose={
              closeEditModal
            }
          >

            <form
              className="members-v2-modal-form"
              onSubmit={
                handleSaveEdit
              }
            >

              <PlanSelect
                label="Plan"
                name="plan"
                value={
                  editForm.plan
                }
                onChange={
                  handleEditChange
                }
                plans={
                  plans
                }
              />

              <Input
                label="Start Date"
                type="date"
                name="startDate"
                value={
                  editForm
                    .startDate
                }
                onChange={
                  handleEditChange
                }
              />

              <Input
                label="Expiry Date"
                type="date"
                value={
                  editForm
                    .expiryDate
                }
                readOnly
              />

              <Input
                label="Amount"
                type="number"
                value={
                  editForm.amount
                }
                readOnly
              />

              <SimpleSelect
                label="Settlement"
                name="settlementStatus"
                value={
                  editForm
                    .settlementStatus
                }
                onChange={
                  handleEditChange
                }
                options={[
                  "Pending",
                  "Settled",
                ]}
              />

              <div className="members-v2-plan-preview">

                <span>
                  Updated Subscription
                </span>

                <strong>
                  {
                    editForm.plan
                  }
                </strong>

                <small>
                  {formatMoney(
                    editForm.amount
                  )}
                  {" • "}
                  {getPlan(
                    editForm.plan
                  )?.days || 0}{" "}
                  days
                </small>

              </div>

              <div className="members-v2-modal-actions">

                <button
                  type="button"
                  className="members-v2-secondary-btn"
                  onClick={
                    closeEditModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="members-v2-primary-btn"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>

          </Modal>
        )}

    </section>
  );
}

/* =====================================================
   UI COMPONENTS
===================================================== */

function StatCard({
  value,
  label,
}) {
  return (
    <article className="members-v2-stat-card">

      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>

    </article>
  );
}

function RevenueCard({
  value,
  label,
}) {
  return (
    <article className="members-v2-revenue-card">

      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>

    </article>
  );
}

function SummaryBox({
  value,
  label,
}) {
  return (
    <div>

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

function StatusBadge({
  value,
}) {
  const normalized =
    String(
      value || ""
    ).toLowerCase();

  let className =
    "active";

  if (
    normalized ===
    "expired"
  ) {
    className =
      "expired";
  } else if (
    normalized ===
    "upcoming"
  ) {
    className =
      "upcoming";
  } else if (
    normalized ===
    "expiring soon"
  ) {
    className =
      "expiring";
  }

  return (
    <span
      className={`members-v2-badge ${className}`}
    >
      {value || "-"}
    </span>
  );
}

function SettlementBadge({
  value,
}) {
  const settled =
    String(
      value || ""
    ).toLowerCase() ===
    "settled";

  return (
    <span
      className={`members-v2-settlement-badge ${
        settled
          ? "settled"
          : "pending"
      }`}
    >
      {value || "Pending"}
    </span>
  );
}

function PlanBadge({
  value,
}) {
  const normalized =
    String(
      value || ""
    ).toLowerCase();

  return (
    <span
      className={`members-v2-plan-badge ${normalized}`}
    >
      {value}
    </span>
  );
}

function Input({
  label,
  ...props
}) {
  return (
    <label className="members-v2-field">

      <span>
        {label}
      </span>

      <input
        {...props}
      />

    </label>
  );
}

function PlanSelect({
  label,
  plans,
  ...props
}) {
  return (
    <label className="members-v2-field">

      <span>
        {label}
      </span>

      <select
        {...props}
      >

        {plans.map(
          (plan) => (
            <option
              key={
                plan.name
              }
              value={
                plan.name
              }
            >
              {plan.name}
              {" — "}
              {formatMoney(
                plan.price
              )}
              {" / "}
              {plan.days}
              {" days"}
            </option>
          )
        )}

      </select>

    </label>
  );
}

function SimpleSelect({
  label,
  options,
  ...props
}) {
  return (
    <label className="members-v2-field">

      <span>
        {label}
      </span>

      <select
        {...props}
      >

        {options.map(
          (option) => (
            <option
              key={
                option
              }
              value={
                option
              }
            >
              {option}
            </option>
          )
        )}

      </select>

    </label>
  );
}

function Modal({
  title,
  children,
  onClose,
  large = false,
}) {
  return (
    <div className="members-v2-modal-backdrop">

      <div
        className={`members-v2-modal ${
          large
            ? "large"
            : ""
        }`}
      >

        <div className="members-v2-modal-header">

          <h2>
            {title}
          </h2>

          <button
            type="button"
            className="members-v2-modal-close"
            onClick={
              onClose
            }
            aria-label="Close modal"
          >
            ×
          </button>

        </div>

        <div className="members-v2-modal-body">
          {children}
        </div>

      </div>

    </div>
  );
}