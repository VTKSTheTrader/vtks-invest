import { useEffect, useMemo, useState } from "react";
import {
  addETF,
  addETFAccumulation,
  deleteETF,
  deleteETFAccumulation,
  getETFAccumulations,
  getETFById,
  getETFSummaries,
  updateETF,
  updateETFAccumulation,
} from "../../services/etfService";
import { fetchLiveCMP } from "../../services/marketService";
import { supabase } from "../../lib/supabase";
import "./ETF.css";

const ETF_TYPES = [
  "Commodity",
  "BEES",
  "Index ETF",
  "Sector ETF",
  "Stock SIP",
];

const ETF_STATUSES = [
  "Accumulating",
  "Active",
  "Paused",
  "Closed",
];

const PUBLISH_FILTERS = ["All", "Published", "Draft"];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest Added" },
  { value: "name-asc", label: "Name A → Z" },
  { value: "return-desc", label: "Return %: High → Low" },
  { value: "return-asc", label: "Return %: Low → High" },
  { value: "invested-desc", label: "Invested: High → Low" },
  { value: "value-desc", label: "Current Value: High → Low" },
  { value: "cmp-desc", label: "CMP: High → Low" },
  { value: "avg-desc", label: "Avg Price: High → Low" },
];

const PAGE_SIZE = 10;

const emptyETF = {
  name: "",
  symbol: "",
  fullName: "",
  etfType: "Commodity",
  description: "",
  dhanSecurityId: "",
  exchangeSegment: "NSE_EQ",
  cmp: "",
  status: "Accumulating",
  publishStatus: "draft",
  notes: "",
};

const getEmptyAccumulation = () => ({
  accumulationDate: new Date().toISOString().split("T")[0],
  price: "",
  amount: "10000",
  note: "",
});

const formatCurrency = (value, maximumFractionDigits = 2) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(Number(value || 0));
};

const formatNumber = (value, digits = 2) => {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
};

const ETF = () => {
  const [etfs, setETFs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingCMP, setFetchingCMP] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [publishFilter, setPublishFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateMatchedETFIds, setDateMatchedETFIds] = useState(null);
  const [dateFiltering, setDateFiltering] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [showETFModal, setShowETFModal] = useState(false);
  const [editingETF, setEditingETF] = useState(null);
  const [etfForm, setETFForm] = useState(emptyETF);

  const [showAccumulationModal, setShowAccumulationModal] =
    useState(false);

  const [selectedETF, setSelectedETF] = useState(null);
  const [accumulations, setAccumulations] = useState([]);
  const [loadingAccumulations, setLoadingAccumulations] =
    useState(false);

  const [editingAccumulation, setEditingAccumulation] =
    useState(null);

  const [accumulationForm, setAccumulationForm] = useState(
    getEmptyAccumulation()
  );

  // =========================================================
  // LOAD ETFs
  // =========================================================

  const loadETFs = async () => {
    try {
      setLoading(true);

      const data = await getETFSummaries();

      setETFs(data || []);

      if (selectedETF) {
        const refreshed = (data || []).find(
          (item) => Number(item.id) === Number(selectedETF.id)
        );

        if (refreshed) {
          setSelectedETF(refreshed);
        }
      }
    } catch (error) {
      console.error("ETF load error:", error);
      alert(error?.message || "Unable to load ETFs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadETFs();
  }, []);

  // =========================================================
  // ACCUMULATION DATE FILTER
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const loadDateMatchedETFs = async () => {
      if (!fromDate && !toDate) {
        setDateMatchedETFIds(null);
        setDateFiltering(false);
        return;
      }

      if (fromDate && toDate && fromDate > toDate) {
        setDateMatchedETFIds(new Set());
        setDateFiltering(false);
        return;
      }

      try {
        setDateFiltering(true);

        let query = supabase
          .from("etf_accumulations")
          .select("etf_id");

        if (fromDate) {
          query = query.gte("accumulation_date", fromDate);
        }

        if (toDate) {
          query = query.lte("accumulation_date", toDate);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (!cancelled) {
          setDateMatchedETFIds(
            new Set(
              (data || []).map((item) => Number(item.etf_id))
            )
          );
        }
      } catch (error) {
        console.error("ETF date filter error:", error);

        if (!cancelled) {
          setDateMatchedETFIds(new Set());
          alert(
            error?.message ||
              "Unable to filter ETFs by accumulation date."
          );
        }
      } finally {
        if (!cancelled) {
          setDateFiltering(false);
        }
      }
    };

    loadDateMatchedETFs();

    return () => {
      cancelled = true;
    };
  }, [fromDate, toDate]);

  // =========================================================
  // FILTER
  // =========================================================

  const filteredETFs = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = etfs.filter((etf) => {
      const matchesSearch =
        !query ||
        etf.name?.toLowerCase().includes(query) ||
        etf.symbol?.toLowerCase().includes(query) ||
        etf.fullName?.toLowerCase().includes(query);

      const matchesType =
        typeFilter === "All" || etf.etfType === typeFilter;

      const matchesStatus =
        statusFilter === "All" || etf.status === statusFilter;

      const matchesPublish =
        publishFilter === "All" ||
        (publishFilter === "Published" &&
          etf.publishStatus === "published") ||
        (publishFilter === "Draft" &&
          etf.publishStatus !== "published");

      const matchesAccumulationDate =
        dateMatchedETFIds === null ||
        dateMatchedETFIds.has(Number(etf.id));

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesPublish &&
        matchesAccumulationDate
      );
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return String(a.name || "").localeCompare(
            String(b.name || "")
          );

        case "return-desc":
          return (
            Number(b.returnPercentage || 0) -
            Number(a.returnPercentage || 0)
          );

        case "return-asc":
          return (
            Number(a.returnPercentage || 0) -
            Number(b.returnPercentage || 0)
          );

        case "invested-desc":
          return (
            Number(b.totalInvested || 0) -
            Number(a.totalInvested || 0)
          );

        case "value-desc":
          return (
            Number(b.currentValue || 0) -
            Number(a.currentValue || 0)
          );

        case "cmp-desc":
          return Number(b.cmp || 0) - Number(a.cmp || 0);

        case "avg-desc":
          return (
            Number(b.averagePrice || 0) -
            Number(a.averagePrice || 0)
          );

        case "newest":
        default:
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
      }
    });
  }, [
    etfs,
    search,
    typeFilter,
    statusFilter,
    publishFilter,
    sortBy,
    dateMatchedETFIds,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredETFs.length / PAGE_SIZE)
  );

  const paginatedETFs = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredETFs.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );
  }, [filteredETFs, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    typeFilter,
    statusFilter,
    publishFilter,
    sortBy,
    fromDate,
    toDate,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // =========================================================
  // ETF MODAL
  // =========================================================

  const openAddETF = () => {
    setEditingETF(null);
    setETFForm(emptyETF);
    setShowETFModal(true);
  };

  const openEditETF = async (etf) => {
    try {
      const fullETF = (await getETFById(etf.id)) || etf;

      setEditingETF(fullETF);

      setETFForm({
        name: fullETF.name || "",
        symbol: fullETF.symbol || "",
        fullName: fullETF.fullName || "",
        etfType: fullETF.etfType || "Commodity",
        description: fullETF.description || "",
        dhanSecurityId: fullETF.dhanSecurityId ?? "",
        exchangeSegment: fullETF.exchangeSegment || "NSE_EQ",
        cmp: fullETF.cmp ?? "",
        status: fullETF.status || "Accumulating",
        publishStatus: fullETF.publishStatus || "draft",
        notes: fullETF.notes || "",
      });

      setShowETFModal(true);
    } catch (error) {
      console.error("ETF edit load error:", error);
      alert(error?.message || "Unable to load ETF details.");
    }
  };

  const closeETFModal = () => {
    if (saving) return;

    setShowETFModal(false);
    setEditingETF(null);
    setETFForm(emptyETF);
  };

  const handleETFChange = (event) => {
    const { name, value } = event.target;

    setETFForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFetchCMP = async () => {
    const symbol = etfForm.symbol?.trim()?.toUpperCase();

    if (!symbol) {
      alert("Enter Trading Symbol first.");
      return;
    }

    try {
      setFetchingCMP(true);

      let securityId = Number(etfForm.dhanSecurityId || 0);
      let exchangeSegment = etfForm.exchangeSegment || "NSE_EQ";

      if (!Number.isFinite(securityId) || securityId <= 0) {
        const exchange =
          exchangeSegment === "BSE_EQ" ? "BSE" : "NSE";

        const { data, error } = await supabase.functions.invoke(
          "search-dhan-instrument-v1",
          {
            body: {
              symbol,
              exchange,
            },
          }
        );

        if (error) {
          console.error("Dhan instrument search error:", error);
          alert(
            error?.message ||
              "Unable to find Dhan Security ID for this symbol."
          );
          return;
        }

        if (
          data?.success !== true ||
          !data?.securityId ||
          Number(data.securityId) <= 0
        ) {
          alert(
            data?.error ||
              `No Dhan instrument found for ${symbol}.`
          );
          return;
        }

        securityId = Number(data.securityId);
        exchangeSegment =
          data.exchangeSegment || exchangeSegment || "NSE_EQ";

        setETFForm((prev) => ({
          ...prev,
          symbol:
            data.tradingSymbol ||
            prev.symbol?.trim()?.toUpperCase() ||
            symbol,
          dhanSecurityId: securityId,
          exchangeSegment,
          fullName:
            prev.fullName ||
            data.displayName ||
            data.symbolName ||
            "",
        }));
      }

      const cmp = await fetchLiveCMP(
        securityId,
        exchangeSegment
      );

      if (!cmp || Number(cmp) <= 0) {
        alert(
          "Security ID found, but CMP could not be fetched from Dhan. Please verify the live CMP function/token."
        );
        return;
      }

      setETFForm((prev) => ({
        ...prev,
        dhanSecurityId: securityId,
        exchangeSegment,
        cmp: Number(cmp),
      }));
    } catch (error) {
      console.error("ETF automatic Dhan fetch error:", error);
      alert(
        error?.message ||
          "Unable to find ETF instrument or fetch CMP from Dhan."
      );
    } finally {
      setFetchingCMP(false);
    }
  };

  const handleSaveETF = async (event) => {
    event.preventDefault();

    if (!etfForm.name.trim()) {
      alert("ETF name is required.");
      return;
    }

    if (!etfForm.symbol.trim()) {
      alert("ETF symbol is required.");
      return;
    }

    if (
      etfForm.dhanSecurityId &&
      (!Number.isFinite(Number(etfForm.dhanSecurityId)) ||
        Number(etfForm.dhanSecurityId) <= 0)
    ) {
      alert("Dhan Security ID must be a valid positive number.");
      return;
    }

    if (Number(etfForm.cmp || 0) < 0) {
      alert("CMP cannot be negative.");
      return;
    }

    try {
      setSaving(true);

      if (editingETF) {
        await updateETF(editingETF.id, etfForm);
      } else {
        await addETF(etfForm);
      }

      setShowETFModal(false);
      setEditingETF(null);
      setETFForm(emptyETF);

      await loadETFs();
    } catch (error) {
      console.error("ETF save error:", error);

      if (error?.code === "23505") {
        alert("This ETF symbol already exists.");
      } else {
        alert(error?.message || "Unable to save ETF.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteETF = async (etf) => {
    const confirmed = window.confirm(
      `Delete ${etf.name}?\n\nIts complete accumulation history will also be deleted.`
    );

    if (!confirmed) return;

    try {
      await deleteETF(etf.id);

      if (Number(selectedETF?.id) === Number(etf.id)) {
        setSelectedETF(null);
        setAccumulations([]);
      }

      await loadETFs();
    } catch (error) {
      console.error("ETF delete error:", error);
      alert(error?.message || "Unable to delete ETF.");
    }
  };

  // =========================================================
  // ACCUMULATION HISTORY
  // =========================================================

  const loadAccumulations = async (etfId) => {
    try {
      setLoadingAccumulations(true);

      const data = await getETFAccumulations(etfId);

      setAccumulations(data || []);
    } catch (error) {
      console.error("Accumulation load error:", error);
      alert(error?.message || "Unable to load accumulation history.");
    } finally {
      setLoadingAccumulations(false);
    }
  };

  const openAccumulations = async (etf) => {
    setSelectedETF(etf);
    setEditingAccumulation(null);
    setAccumulationForm(getEmptyAccumulation());
    setShowAccumulationModal(true);

    await loadAccumulations(etf.id);
  };

  const closeAccumulationModal = () => {
    if (saving) return;

    setShowAccumulationModal(false);
    setSelectedETF(null);
    setAccumulations([]);
    setEditingAccumulation(null);
    setAccumulationForm(getEmptyAccumulation());
  };

  const handleAccumulationChange = (event) => {
    const { name, value } = event.target;

    setAccumulationForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetAccumulationForm = () => {
    setEditingAccumulation(null);
    setAccumulationForm(getEmptyAccumulation());
  };

  const openEditAccumulation = (item) => {
    setEditingAccumulation(item);

    setAccumulationForm({
      accumulationDate:
        item.accumulationDate ||
        new Date().toISOString().split("T")[0],
      price: item.price ?? "",
      amount: item.amount ?? "",
      note: item.note || "",
    });
  };

  const handleSaveAccumulation = async (event) => {
    event.preventDefault();

    if (!selectedETF?.id) {
      alert("ETF not selected.");
      return;
    }

    const price = Number(accumulationForm.price || 0);
    const amount = Number(accumulationForm.amount || 0);

    if (price <= 0) {
      alert("ETF price must be greater than zero.");
      return;
    }

    if (amount <= 0) {
      alert("Accumulation amount must be greater than zero.");
      return;
    }

    try {
      setSaving(true);

      if (editingAccumulation) {
        await updateETFAccumulation(
          editingAccumulation.id,
          accumulationForm
        );
      } else {
        await addETFAccumulation({
          ...accumulationForm,
          etfId: selectedETF.id,
        });
      }

      resetAccumulationForm();

      await Promise.all([
        loadAccumulations(selectedETF.id),
        loadETFs(),
      ]);
    } catch (error) {
      console.error("Accumulation save error:", error);
      alert(error?.message || "Unable to save accumulation.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccumulation = async (item) => {
    const confirmed = window.confirm(
      `Delete accumulation dated ${item.accumulationDate}?`
    );

    if (!confirmed) return;

    try {
      await deleteETFAccumulation(item.id);

      await Promise.all([
        loadAccumulations(selectedETF.id),
        loadETFs(),
      ]);

      if (
        Number(editingAccumulation?.id) === Number(item.id)
      ) {
        resetAccumulationForm();
      }
    } catch (error) {
      console.error("Accumulation delete error:", error);
      alert(error?.message || "Unable to delete accumulation.");
    }
  };

  // =========================================================
  // RUNNING AVERAGE HISTORY
  // =========================================================

  const accumulationHistory = useMemo(() => {
    let runningAmount = 0;
    let runningUnits = 0;

    return accumulations.map((item) => {
      const amount = Number(item.amount || 0);
      const units = Number(item.units || 0);

      runningAmount += amount;
      runningUnits += units;

      const runningAverage =
        runningUnits > 0
          ? runningAmount / runningUnits
          : 0;

      return {
        ...item,
        runningAmount,
        runningUnits,
        runningAverage,
      };
    });
  }, [accumulations]);

  // =========================================================
  // SUMMARY
  // =========================================================

  const totals = useMemo(() => {
    return etfs.reduce(
      (acc, etf) => {
        acc.totalInvested += Number(etf.totalInvested || 0);
        acc.currentValue += Number(etf.currentValue || 0);

        return acc;
      },
      {
        totalInvested: 0,
        currentValue: 0,
      }
    );
  }, [etfs]);

  const totalGainLoss =
    totals.currentValue - totals.totalInvested;

  const totalReturn =
    totals.totalInvested > 0
      ? (totalGainLoss / totals.totalInvested) * 100
      : 0;

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="admin-etf-page">
      <div className="admin-etf-header">
        <div>
          <p className="admin-etf-eyebrow">
            VTKS ETF MODULE
          </p>

          <h1>ETF Portfolio Management</h1>

          <p>
            Manage ETFs, live prices and systematic
            accumulation history.
          </p>
        </div>

        <button
          type="button"
          className="admin-etf-primary-button"
          onClick={openAddETF}
        >
          + Add ETF
        </button>
      </div>

      {/* SUMMARY */}

      <div className="admin-etf-summary-grid">
        <div className="admin-etf-summary-card">
          <span>ETFs Tracked</span>
          <strong>{etfs.length}</strong>
          <small>All ETF records</small>
        </div>

        <div className="admin-etf-summary-card">
          <span>Total Invested</span>
          <strong>
            {formatCurrency(totals.totalInvested)}
          </strong>
          <small>Across ETF accumulations</small>
        </div>

        <div className="admin-etf-summary-card">
          <span>Current Value</span>
          <strong>
            {formatCurrency(totals.currentValue)}
          </strong>
          <small>Based on current CMP</small>
        </div>

        <div className="admin-etf-summary-card">
          <span>Overall Change</span>

          <strong
            className={
              totalGainLoss >= 0
                ? "admin-etf-positive"
                : "admin-etf-negative"
            }
          >
            {totalGainLoss >= 0 ? "+" : ""}
            {formatCurrency(totalGainLoss)}
          </strong>

          <small
            className={
              totalReturn >= 0
                ? "admin-etf-positive"
                : "admin-etf-negative"
            }
          >
            {totalReturn >= 0 ? "+" : ""}
            {totalReturn.toFixed(2)}%
          </small>
        </div>
      </div>

      {/* FILTER */}

      <div className="admin-etf-toolbar">
        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search ETF name or symbol..."
        />

        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value)
          }
        >
          <option value="All">All ETF Types</option>

          {ETF_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="All">All Status</option>

          {ETF_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={publishFilter}
          onChange={(event) =>
            setPublishFilter(event.target.value)
          }
        >
          {PUBLISH_FILTERS.map((item) => (
            <option key={item} value={item}>
              {item === "All" ? "All Publish Status" : item}
            </option>
          ))}
        </select>

        <div className="admin-etf-date-filter">
          <span>Accumulated</span>

          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) =>
              setFromDate(event.target.value)
            }
            title="Accumulation from date"
          />

          <span>to</span>

          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) =>
              setToDate(event.target.value)
            }
            title="Accumulation to date"
          />
        </div>

        <select
          value={sortBy}
          onChange={(event) =>
            setSortBy(event.target.value)
          }
        >
          {SORT_OPTIONS.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        {(search ||
          typeFilter !== "All" ||
          statusFilter !== "All" ||
          publishFilter !== "All" ||
          sortBy !== "newest" ||
          fromDate ||
          toDate) && (
          <button
            type="button"
            className="admin-etf-clear-button"
            onClick={() => {
              setSearch("");
              setTypeFilter("All");
              setStatusFilter("All");
              setPublishFilter("All");
              setSortBy("newest");
              setFromDate("");
              setToDate("");
              setDateMatchedETFIds(null);
              setCurrentPage(1);
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* TABLE */}

      <div className="admin-etf-table-wrapper">
        {loading || dateFiltering ? (
          <div className="admin-etf-empty">
            {dateFiltering
              ? "Filtering accumulation dates..."
              : "Loading ETF portfolio..."}
          </div>
        ) : filteredETFs.length === 0 ? (
          <div className="admin-etf-empty">
            No ETFs found.
          </div>
        ) : (
          <table className="admin-etf-table">
            <thead>
              <tr>
                <th>ETF</th>
                <th>Type</th>
                <th>CMP</th>
                <th>Avg Price</th>
                <th>Invested</th>
                <th>Units</th>
                <th>Current Value</th>
                <th>Change</th>
                <th>Status</th>
                <th>Publish</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedETFs.map((etf) => {
                const positive =
                  Number(etf.returnPercentage || 0) >= 0;

                return (
                  <tr key={etf.id}>
                    <td>
                      <div className="admin-etf-name-cell">
                        <strong>{etf.name}</strong>

                        <span>{etf.symbol}</span>

                        {etf.fullName && (
                          <small>{etf.fullName}</small>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="admin-etf-type-badge">
                        {etf.etfType}
                      </span>
                    </td>

                    <td>
                      {formatCurrency(etf.cmp)}
                    </td>

                    <td>
                      {formatCurrency(etf.averagePrice)}
                    </td>

                    <td>
                      {formatCurrency(etf.totalInvested)}
                    </td>

                    <td>
                      {formatNumber(etf.totalUnits, 4)}
                    </td>

                    <td>
                      {formatCurrency(etf.currentValue)}
                    </td>

                    <td>
                      <div
                        className={
                          positive
                            ? "admin-etf-positive"
                            : "admin-etf-negative"
                        }
                      >
                        <strong>
                          {positive ? "+" : ""}
                          {Number(
                            etf.returnPercentage || 0
                          ).toFixed(2)}
                          %
                        </strong>

                        <small>
                          {Number(etf.gainLoss || 0) >= 0
                            ? "+"
                            : ""}
                          {formatCurrency(etf.gainLoss)}
                        </small>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`admin-etf-status admin-etf-status-${String(
                          etf.status
                        )
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {etf.status}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`admin-etf-publish ${
                          etf.publishStatus ===
                          "published"
                            ? "published"
                            : "draft"
                        }`}
                      >
                        {etf.publishStatus ===
                        "published"
                          ? "Published"
                          : "Draft"}
                      </span>
                    </td>

                    <td>
                      <div className="admin-etf-actions">
                        <button
                          type="button"
                          className="manage"
                          onClick={() =>
                            openAccumulations(etf)
                          }
                        >
                          Manage
                        </button>

                        <button
                          type="button"
                          className="edit"
                          onClick={() =>
                            openEditETF(etf)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="danger"
                          onClick={() =>
                            handleDeleteETF(etf)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filteredETFs.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            marginTop: "14px",
          }}
        >
          <small style={{ color: "#64748b" }}>
            Showing{" "}
            {(currentPage - 1) * PAGE_SIZE + 1}
            {" - "}
            {Math.min(
              currentPage * PAGE_SIZE,
              filteredETFs.length
            )}{" "}
            of {filteredETFs.length} ETFs
          </small>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <button
              type="button"
              className="admin-etf-secondary-button"
              onClick={() =>
                setCurrentPage((page) =>
                  Math.max(1, page - 1)
                )
              }
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <span
              style={{
                minWidth: "90px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              className="admin-etf-secondary-button"
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(totalPages, page + 1)
                )
              }
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          ETF MODAL
      ===================================================== */}

      {showETFModal && (
        <div
          className="admin-etf-modal-overlay"
          onMouseDown={closeETFModal}
        >
          <div
            className="admin-etf-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="admin-etf-modal-header">
              <div>
                <h2>
                  {editingETF
                    ? "Edit ETF"
                    : "Add New ETF"}
                </h2>

                <p>
                  Enter the trading symbol to auto-find the Dhan
                  Security ID and fetch live CMP.
                </p>
              </div>

              <button
                type="button"
                className="admin-etf-modal-close"
                onClick={closeETFModal}
              >
                ×
              </button>
            </div>

            <form
              className="admin-etf-form"
              onSubmit={handleSaveETF}
            >
              <div className="admin-etf-form-grid">
                <label>
                  ETF Name *
                  <input
                    name="name"
                    value={etfForm.name}
                    onChange={handleETFChange}
                    placeholder="NIFTYBEES"
                    required
                  />
                </label>

                <label>
                  Trading Symbol *
                  <input
                    name="symbol"
                    value={etfForm.symbol}
                    onChange={handleETFChange}
                    placeholder="NIFTYBEES"
                    required
                  />
                </label>

                <label className="full-width">
                  Full Name
                  <input
                    name="fullName"
                    value={etfForm.fullName}
                    onChange={handleETFChange}
                    placeholder="Nippon India ETF Nifty 50 BeES"
                  />
                </label>

                <label>
                  ETF Type *
                  <select
                    name="etfType"
                    value={etfForm.etfType}
                    onChange={handleETFChange}
                  >
                    {ETF_TYPES.map((type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Dhan Security ID
                  <input
                    type="text"
                    name="dhanSecurityId"
                    value={etfForm.dhanSecurityId}
                    readOnly
                    placeholder="Auto-filled after symbol lookup"
                  />
                  <small style={{ marginTop: "6px", display: "block" }}>
                    Enter the ETF symbol above, then click Auto Find & Fetch CMP.
                  </small>
                </label>

                <label>
                  Exchange Segment
                  <select
                    name="exchangeSegment"
                    value={etfForm.exchangeSegment}
                    onChange={handleETFChange}
                  >
                    <option value="NSE_EQ">NSE_EQ</option>
                    <option value="BSE_EQ">BSE_EQ</option>
                  </select>
                </label>

                <label>
                  CMP
                  <input
                    type="number"
                    name="cmp"
                    value={etfForm.cmp}
                    onChange={handleETFChange}
                    step="0.01"
                    min="0"
                    placeholder="Fetch from Dhan"
                  />

                  <button
                    type="button"
                    className="admin-etf-secondary-button"
                    onClick={handleFetchCMP}
                    disabled={
                      fetchingCMP ||
                      !etfForm.symbol?.trim()
                    }
                    style={{ marginTop: "8px", width: "fit-content" }}
                  >
                    {fetchingCMP
                      ? "Finding ETF & Fetching CMP..."
                      : "Auto Find & Fetch CMP"}
                  </button>
                </label>

                <label>
                  Status
                  <select
                    name="status"
                    value={etfForm.status}
                    onChange={handleETFChange}
                  >
                    {ETF_STATUSES.map((status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Publish Status
                  <select
                    name="publishStatus"
                    value={etfForm.publishStatus}
                    onChange={handleETFChange}
                  >
                    <option value="draft">
                      Draft
                    </option>

                    <option value="published">
                      Published
                    </option>
                  </select>
                </label>

                <label className="full-width">
                  Description
                  <textarea
                    name="description"
                    value={etfForm.description}
                    onChange={handleETFChange}
                    rows="3"
                    placeholder="Short public description..."
                  />
                </label>

                <label className="full-width">
                  Notes
                  <textarea
                    name="notes"
                    value={etfForm.notes}
                    onChange={handleETFChange}
                    rows="3"
                    placeholder="ETF study / accumulation notes..."
                  />
                </label>
              </div>

              <div className="admin-etf-modal-footer">
                <button
                  type="button"
                  className="admin-etf-secondary-button"
                  onClick={closeETFModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-etf-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingETF
                    ? "Update ETF"
                    : "Add ETF"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          ACCUMULATION MODAL
      ===================================================== */}

      {showAccumulationModal && selectedETF && (
        <div
          className="admin-etf-modal-overlay"
          onMouseDown={closeAccumulationModal}
        >
          <div
            className="admin-etf-modal admin-etf-accumulation-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="admin-etf-modal-header">
              <div>
                <p className="admin-etf-eyebrow">
                  {selectedETF.etfType}
                </p>

                <h2>
                  {selectedETF.name} Accumulations
                </h2>

                <p>
                  Avg Price{" "}
                  <strong>
                    {formatCurrency(
                      selectedETF.averagePrice
                    )}
                  </strong>
                  {" • "}
                  Invested{" "}
                  <strong>
                    {formatCurrency(
                      selectedETF.totalInvested
                    )}
                  </strong>
                  {" • "}
                  Units{" "}
                  <strong>
                    {formatNumber(
                      selectedETF.totalUnits,
                      4
                    )}
                  </strong>
                </p>
              </div>

              <button
                type="button"
                className="admin-etf-modal-close"
                onClick={closeAccumulationModal}
              >
                ×
              </button>
            </div>

            <div className="admin-etf-accumulation-layout">
              {/* ADD / EDIT */}

              <form
                className="admin-etf-accumulation-form"
                onSubmit={handleSaveAccumulation}
              >
                <h3>
                  {editingAccumulation
                    ? "Edit Accumulation"
                    : "Add Accumulation"}
                </h3>

                <label>
                  Date *
                  <input
                    type="date"
                    name="accumulationDate"
                    value={
                      accumulationForm.accumulationDate
                    }
                    onChange={
                      handleAccumulationChange
                    }
                    required
                  />
                </label>

                <label>
                  ETF Price *
                  <input
                    type="number"
                    name="price"
                    value={accumulationForm.price}
                    onChange={
                      handleAccumulationChange
                    }
                    min="0.0001"
                    step="0.0001"
                    placeholder="265"
                    required
                  />
                </label>

                <label>
                  Amount *
                  <input
                    type="number"
                    name="amount"
                    value={accumulationForm.amount}
                    onChange={
                      handleAccumulationChange
                    }
                    min="0.01"
                    step="0.01"
                    placeholder="10000"
                    required
                  />
                </label>

                <div className="admin-etf-calculated-units">
                  <span>Estimated Units</span>

                  <strong>
                    {Number(
                      accumulationForm.price
                    ) > 0
                      ? formatNumber(
                          Number(
                            accumulationForm.amount ||
                              0
                          ) /
                            Number(
                              accumulationForm.price
                            ),
                          6
                        )
                      : "0"}
                  </strong>
                </div>

                <label>
                  Note
                  <textarea
                    name="note"
                    value={accumulationForm.note}
                    onChange={
                      handleAccumulationChange
                    }
                    rows="3"
                    placeholder="Optional accumulation note..."
                  />
                </label>

                <div className="admin-etf-accumulation-form-actions">
                  {editingAccumulation && (
                    <button
                      type="button"
                      className="admin-etf-secondary-button"
                      onClick={resetAccumulationForm}
                      disabled={saving}
                    >
                      Cancel Edit
                    </button>
                  )}

                  <button
                    type="submit"
                    className="admin-etf-primary-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingAccumulation
                      ? "Update"
                      : "+ Add Accumulation"}
                  </button>
                </div>
              </form>

              {/* HISTORY */}

              <div className="admin-etf-history">
                <div className="admin-etf-history-header">
                  <h3>Accumulation History</h3>

                  <span>
                    {accumulations.length} entries
                  </span>
                </div>

                {loadingAccumulations ? (
                  <div className="admin-etf-empty">
                    Loading history...
                  </div>
                ) : accumulationHistory.length ===
                  0 ? (
                  <div className="admin-etf-empty">
                    No accumulation entries yet.
                  </div>
                ) : (
                  <div className="admin-etf-history-table-wrapper">
                    <table className="admin-etf-history-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Price</th>
                          <th>Amount</th>
                          <th>Units</th>
                          <th>Running Avg</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {accumulationHistory.map(
                          (item) => (
                            <tr key={item.id}>
                              <td>
                                {item.accumulationDate}
                              </td>

                              <td>
                                {formatCurrency(
                                  item.price
                                )}
                              </td>

                              <td>
                                {formatCurrency(
                                  item.amount
                                )}
                              </td>

                              <td>
                                {formatNumber(
                                  item.units,
                                  4
                                )}
                              </td>

                              <td>
                                {formatCurrency(
                                  item.runningAverage
                                )}
                              </td>

                              <td>
                                <div className="admin-etf-actions">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditAccumulation(
                                        item
                                      )
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="danger"
                                    onClick={() =>
                                      handleDeleteAccumulation(
                                        item
                                      )
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ETF;