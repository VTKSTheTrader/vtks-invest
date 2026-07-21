import {
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "../../components/admin/PageHeader";
import ScannerModal from "../../components/admin/modals/ScannerModal";
import Pagination from "../../components/common/Pagination";

import {
  addScanner,
  deleteScanner,
  getScanners,
  mapScannerFromDB,
  updateScanner,
} from "../../services/scannerService";

import "./Scanner.css";

const ITEMS_PER_PAGE = 5;

export default function Scanner() {
  const [scanners, setScanners] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [showModal, setShowModal] =
    useState(false);

  const [
    editingScanner,
    setEditingScanner,
  ] = useState(null);

  const [searchText, setSearchText] =
    useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("All");

  const [
    accessFilter,
    setAccessFilter,
  ] = useState("All");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [currentPage, setCurrentPage] =
    useState(1);

  useEffect(() => {
    loadScanners();
  }, []);

  const loadScanners = async () => {
    try {
      setLoading(true);

      const rows = await getScanners();

      setScanners(
        (rows || []).map(mapScannerFromDB)
      );
    } catch (error) {
      console.error(
        "Scanner load error:",
        error
      );

      alert(
        error?.message ||
          "Unable to load scanners."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredScanners = useMemo(() => {
    const search = searchText
      .trim()
      .toLowerCase();

    return scanners.filter((scanner) => {
      const matchesSearch =
        !search ||
        String(scanner.name || "")
          .toLowerCase()
          .includes(search) ||
        String(scanner.category || "")
          .toLowerCase()
          .includes(search) ||
        String(scanner.timeframe || "")
          .toLowerCase()
          .includes(search);

      const matchesCategory =
        categoryFilter === "All" ||
        scanner.category ===
          categoryFilter;

      const matchesAccess =
        accessFilter === "All" ||
        scanner.access === accessFilter;

      const matchesStatus =
        statusFilter === "All" ||
        scanner.status === statusFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAccess &&
        matchesStatus
      );
    });
  }, [
    scanners,
    searchText,
    categoryFilter,
    accessFilter,
    statusFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchText,
    categoryFilter,
    accessFilter,
    statusFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredScanners.length /
        ITEMS_PER_PAGE
    )
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedScanners = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      ITEMS_PER_PAGE;

    return filteredScanners.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [
    filteredScanners,
    currentPage,
  ]);

  const firstVisibleRecord =
    filteredScanners.length === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const lastVisibleRecord = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredScanners.length
  );

  const openAddModal = () => {
    setEditingScanner(null);
    setShowModal(true);
  };

  const openEditModal = (scanner) => {
    setEditingScanner(scanner);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingScanner(null);
  };

  const handleSave = async (form) => {
    try {
      if (editingScanner) {
        const updatedRow =
          await updateScanner(
            editingScanner.id,
            form
          );

        const updatedScanner =
          mapScannerFromDB(updatedRow);

        setScanners((previous) =>
          previous.map((scanner) =>
            scanner.id ===
            updatedScanner.id
              ? updatedScanner
              : scanner
          )
        );

        return;
      }

      const createdRow =
        await addScanner(form);

      const createdScanner =
        mapScannerFromDB(createdRow);

      setScanners((previous) => [
        createdScanner,
        ...previous,
      ]);

      setCurrentPage(1);
    } catch (error) {
      console.error(
        "Scanner save error:",
        error
      );

      alert(
        error?.message ||
          "Unable to save scanner."
      );

      throw error;
    }
  };

  const handleDelete = async (
    scanner
  ) => {
    const confirmed =
      window.confirm(
        `Delete scanner "${scanner.name}"?`
      );

    if (!confirmed) return;

    try {
      await deleteScanner(scanner.id);

      setScanners((previous) =>
        previous.filter(
          (item) =>
            item.id !== scanner.id
        )
      );
    } catch (error) {
      console.error(
        "Scanner delete error:",
        error
      );

      alert(
        error?.message ||
          "Unable to delete scanner."
      );
    }
  };

  const handleStatusToggle = async (
    scanner
  ) => {
    try {
      const nextStatus =
        scanner.status === "Active"
          ? "Inactive"
          : "Active";

      const updatedRow =
        await updateScanner(scanner.id, {
          ...scanner,
          status: nextStatus,
        });

      const updatedScanner =
        mapScannerFromDB(updatedRow);

      setScanners((previous) =>
        previous.map((item) =>
          item.id ===
          updatedScanner.id
            ? updatedScanner
            : item
        )
      );
    } catch (error) {
      console.error(
        "Scanner status update error:",
        error
      );

      alert(
        error?.message ||
          "Unable to update scanner status."
      );
    }
  };

  const clearFilters = () => {
    setSearchText("");
    setCategoryFilter("All");
    setAccessFilter("All");
    setStatusFilter("All");
    setCurrentPage(1);
  };

  const activeCount = scanners.filter(
    (scanner) =>
      scanner.status === "Active"
  ).length;

  const subscriberCount =
    scanners.filter(
      (scanner) =>
        scanner.access ===
          "Subscriber" ||
        scanner.access === "Premium" ||
        scanner.access === "Community"
    ).length;

  const publicCount = scanners.filter(
    (scanner) =>
      scanner.access === "Public"
  ).length;

  const featuredCount = scanners.filter(
    (scanner) =>
      Boolean(scanner.featured)
  ).length;

  return (
    <>
      <PageHeader
        title="Scanner Management"
        subtitle="Create and manage VTKS scanners for public and subscriber access."
      />

      <div className="scanner-stat-grid">
        <ScannerStat
          icon="📊"
          label="Total Scanners"
          value={scanners.length}
        />

        <ScannerStat
          icon="✅"
          label="Active"
          value={activeCount}
        />

        <ScannerStat
          icon="🌐"
          label="Public"
          value={publicCount}
        />

        <ScannerStat
          icon="🔐"
          label="Subscriber"
          value={subscriberCount}
        />

        <ScannerStat
          icon="⭐"
          label="Featured"
          value={featuredCount}
        />
      </div>

      <section className="scanner-admin-card">
        <div className="scanner-toolbar">
          <div className="scanner-filter-group">
            <input
              type="search"
              className="scanner-search"
              placeholder="Search scanners..."
              value={searchText}
              onChange={(event) =>
                setSearchText(
                  event.target.value
                )
              }
            />

            <select
              className="scanner-filter"
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
            >
              <option value="All">
                All Categories
              </option>

              <option value="Swing">
                Swing
              </option>

              <option value="Momentum">
                Momentum
              </option>

              <option value="Intraday">
                Intraday
              </option>

              <option value="Investment">
                Investment
              </option>

              <option value="Breakout">
                Breakout
              </option>

              <option value="Other">
                Other
              </option>
            </select>

            <select
              className="scanner-filter"
              value={accessFilter}
              onChange={(event) =>
                setAccessFilter(
                  event.target.value
                )
              }
            >
              <option value="All">
                All Access
              </option>

              <option value="Public">
                Public
              </option>

              <option value="Subscriber">
                Subscriber
              </option>

              <option value="Premium">
                Premium
              </option>

              <option value="Community">
                Community
              </option>

              <option value="Private">
                Private
              </option>
            </select>

            <select
              className="scanner-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="All">
                All Status
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>

              <option value="Draft">
                Draft
              </option>
            </select>

            <button
              type="button"
              className="scanner-clear-button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>

          <button
            type="button"
            className="scanner-add-button"
            onClick={openAddModal}
          >
            ＋ Add Scanner
          </button>
        </div>

        {loading ? (
          <div className="scanner-state-message">
            Loading scanners...
          </div>
        ) : filteredScanners.length ===
          0 ? (
          <div className="scanner-state-message">
            <h3>No scanners found</h3>

            <p>
              Add a new scanner or change
              the selected filters.
            </p>
          </div>
        ) : (
          <>
            <div className="scanner-pagination-summary">
              <span>
                Showing{" "}
                {firstVisibleRecord}–
                {lastVisibleRecord} of{" "}
                {filteredScanners.length}{" "}
                scanners
              </span>

              <span>
                Page {currentPage} of{" "}
                {totalPages}
              </span>
            </div>

            <div className="scanner-table-wrapper">
              <table className="scanner-table">
                <thead>
                  <tr>
                    <th>Scanner</th>
                    <th>Category</th>
                    <th>Timeframe</th>
                    <th>Access</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedScanners.map(
                    (scanner) => (
                      <tr key={scanner.id}>
                        <td>
                          <div className="scanner-name-cell">
                            <strong>
                              {scanner.name}
                            </strong>

                            {scanner.link ? (
                              <a
                                href={
                                  scanner.link
                                }
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open Scanner ↗
                              </a>
                            ) : (
                              <span>
                                No scanner link
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <span className="scanner-category-badge">
                            {scanner.category ||
                              "General"}
                          </span>
                        </td>

                        <td>
                          {scanner.timeframe ||
                            "-"}
                        </td>

                        <td>
                          <span
                            className={`scanner-access-badge scanner-access-${String(
                              scanner.access ||
                                "subscriber"
                            ).toLowerCase()}`}
                          >
                            {scanner.access ||
                              "Subscriber"}
                          </span>
                        </td>

                        <td>
                          <label className="scanner-status-switch">
                            <input
                              type="checkbox"
                              checked={
                                scanner.status ===
                                "Active"
                              }
                              onChange={() =>
                                handleStatusToggle(
                                  scanner
                                )
                              }
                            />

                            <span className="scanner-status-slider" />
                          </label>

                          <span className="scanner-status-text">
                            {scanner.status ||
                              "Inactive"}
                          </span>
                        </td>

                        <td>
                          {scanner.featured
                            ? "⭐ Yes"
                            : "No"}
                        </td>

                        <td>
                          {scanner.updatedAt ||
                            "-"}
                        </td>

                        <td>
                          <div className="scanner-actions">
                            <button
                              type="button"
                              className="scanner-edit-button"
                              onClick={() =>
                                openEditModal(
                                  scanner
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="scanner-delete-button"
                              onClick={() =>
                                handleDelete(
                                  scanner
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

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </section>

      {showModal && (
        <ScannerModal
          onClose={closeModal}
          onSave={handleSave}
          editingScanner={
            editingScanner
          }
        />
      )}
    </>
  );
}

function ScannerStat({
  icon,
  label,
  value,
}) {
  return (
    <div className="scanner-stat-card">
      <span>{icon}</span>

      <div>
        <strong>{value}</strong>
        <p>{label}</p>
      </div>
    </div>
  );
}