import {
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "../../components/admin/PageHeader";
import MonthlyLevelModal from "../../components/admin/modals/MonthlyLevelModal";
import Pagination from "../../components/common/Pagination";

import {
  addMonthlyLevel,
  deleteMonthlyLevel,
  getMonthlyLevels,
  updateMonthlyLevel,
} from "../../services/monthlyLevelsService";

import "./MonthlyLevels.css";

const ITEMS_PER_PAGE = 5;

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const capitalize = (value) => {
  const text = String(value || "").trim();

  if (!text) return "-";

  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  );
};

export default function MonthlyLevels() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] =
    useState(true);

  const [showModal, setShowModal] =
    useState(false);

  const [editingLevel, setEditingLevel] =
    useState(null);

  const [searchText, setSearchText] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [visibilityFilter, setVisibilityFilter] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [currentPage, setCurrentPage] =
    useState(1);

  useEffect(() => {
    loadLevels();
  }, []);

  const loadLevels = async () => {
    try {
      setLoading(true);

      const rows = await getMonthlyLevels();

      setLevels(rows || []);
    } catch (error) {
      console.error(
        "Monthly levels load error:",
        error
      );

      alert(
        error?.message ||
          "Unable to load monthly market levels."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredLevels = useMemo(() => {
    const search = searchText
      .trim()
      .toLowerCase();

    return levels.filter((level) => {
      const matchesSearch =
        !search ||
        String(level.instrument || "")
          .toLowerCase()
          .includes(search) ||
        String(level.month || "")
          .toLowerCase()
          .includes(search) ||
        String(level.trend || "")
          .toLowerCase()
          .includes(search);

      const matchesCategory =
        categoryFilter === "All" ||
        level.category ===
          categoryFilter.toLowerCase();

      const matchesVisibility =
        visibilityFilter === "All" ||
        level.visibility ===
          visibilityFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "All" ||
        level.status ===
          statusFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesCategory &&
        matchesVisibility &&
        matchesStatus
      );
    });
  }, [
    levels,
    searchText,
    categoryFilter,
    visibilityFilter,
    statusFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchText,
    categoryFilter,
    visibilityFilter,
    statusFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredLevels.length /
        ITEMS_PER_PAGE
    )
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedLevels = useMemo(() => {
    const startIndex =
      (currentPage - 1) *
      ITEMS_PER_PAGE;

    return filteredLevels.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [
    filteredLevels,
    currentPage,
  ]);

  const firstVisibleRecord =
    filteredLevels.length === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const lastVisibleRecord = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredLevels.length
  );

  const openAddModal = () => {
    setEditingLevel(null);
    setShowModal(true);
  };

  const openEditModal = (level) => {
    setEditingLevel(level);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLevel(null);
  };

  const handleSave = async (form) => {
    try {
      if (editingLevel) {
        const updatedLevel =
          await updateMonthlyLevel(
            editingLevel.id,
            form
          );

        setLevels((previous) =>
          previous.map((level) =>
            level.id === updatedLevel.id
              ? updatedLevel
              : level
          )
        );

        return;
      }

      const createdLevel =
        await addMonthlyLevel(form);

      setLevels((previous) => [
        createdLevel,
        ...previous,
      ]);

      setCurrentPage(1);
    } catch (error) {
      console.error(
        "Monthly levels save error:",
        error
      );

      alert(
        error?.message ||
          "Unable to save monthly market levels."
      );

      throw error;
    }
  };

  const handleDelete = async (level) => {
    const confirmed =
      window.confirm(
        `Delete monthly market levels for "${level.instrument}" - ${level.month}?`
      );

    if (!confirmed) return;

    try {
      await deleteMonthlyLevel(level.id);

      setLevels((previous) =>
        previous.filter(
          (item) =>
            item.id !== level.id
        )
      );
    } catch (error) {
      console.error(
        "Monthly levels delete error:",
        error
      );

      alert(
        error?.message ||
          "Unable to delete monthly market levels."
      );
    }
  };

  const clearFilters = () => {
    setSearchText("");
    setCategoryFilter("All");
    setVisibilityFilter("All");
    setStatusFilter("All");
    setCurrentPage(1);
  };

  const publishedCount = levels.filter(
    (level) =>
      level.status === "published"
  ).length;

  const draftCount = levels.filter(
    (level) =>
      level.status === "draft"
  ).length;

  const publicCount = levels.filter(
    (level) =>
      level.visibility === "public"
  ).length;

  const subscriberCount = levels.filter(
    (level) =>
      level.visibility === "subscriber"
  ).length;

  const privateCount = levels.filter(
    (level) =>
      level.visibility === "private"
  ).length;

  return (
    <>
      <PageHeader
        title="Monthly Market Levels"
        subtitle="Create and manage monthly levels for indices and commodities."
      />

      <div className="monthly-level-stat-grid">
        <MonthlyLevelStat
          icon="📊"
          label="Total Records"
          value={levels.length}
        />

        <MonthlyLevelStat
          icon="✅"
          label="Published"
          value={publishedCount}
        />

        <MonthlyLevelStat
          icon="📝"
          label="Draft"
          value={draftCount}
        />

        <MonthlyLevelStat
          icon="🌐"
          label="Public"
          value={publicCount}
        />

        <MonthlyLevelStat
          icon="🔐"
          label="Subscriber"
          value={subscriberCount}
        />

        <MonthlyLevelStat
          icon="🔒"
          label="Private"
          value={privateCount}
        />
      </div>

      <section className="monthly-level-admin-card">
        <div className="monthly-level-toolbar">
          <div className="monthly-level-filter-group">
            <input
              type="search"
              className="monthly-level-search"
              placeholder="Search instrument, month or trend..."
              value={searchText}
              onChange={(event) =>
                setSearchText(
                  event.target.value
                )
              }
            />

            <select
              className="monthly-level-filter"
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

              <option value="Index">
                Index
              </option>

              <option value="Commodity">
                Commodity
              </option>
            </select>

            <select
              className="monthly-level-filter"
              value={visibilityFilter}
              onChange={(event) =>
                setVisibilityFilter(
                  event.target.value
                )
              }
            >
              <option value="All">
                All Visibility
              </option>

              <option value="Public">
                Public
              </option>

              <option value="Subscriber">
                Subscriber
              </option>

              <option value="Private">
                Private
              </option>
            </select>

            <select
              className="monthly-level-filter"
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

              <option value="Published">
                Published
              </option>

              <option value="Draft">
                Draft
              </option>

              <option value="Archived">
                Archived
              </option>
            </select>

            <button
              type="button"
              className="monthly-level-clear-button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>

          <button
            type="button"
            className="monthly-level-add-button"
            onClick={openAddModal}
          >
            ＋ Create Monthly Market Levels
          </button>
        </div>

        {loading ? (
          <div className="monthly-level-state-message">
            Loading monthly market levels...
          </div>
        ) : filteredLevels.length === 0 ? (
          <div className="monthly-level-state-message">
            <h3>
              No monthly market levels found
            </h3>

            <p>
              Create a new record or change
              the selected filters.
            </p>
          </div>
        ) : (
          <>
            <div className="monthly-level-pagination-summary">
              <span>
                Showing{" "}
                {firstVisibleRecord}–
                {lastVisibleRecord} of{" "}
                {filteredLevels.length}{" "}
                records
              </span>

              <span>
                Page {currentPage} of{" "}
                {totalPages}
              </span>
            </div>

            <div className="monthly-level-table-wrapper">
              <table className="monthly-level-table">
                <thead>
                  <tr>
                    <th>Instrument</th>
                    <th>Category</th>
                    <th>Month</th>
                    <th>Bias</th>
                    <th>Pivot</th>
                    <th>Visibility</th>
                    <th>Status</th>
                    <th>Charts</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedLevels.map(
                    (level) => (
                      <tr key={level.id}>
                        <td>
                          <div className="monthly-level-instrument-cell">
                            <strong>
                              {level.instrument}
                            </strong>

                            <span>
                              {level.trend ||
                                "No trend added"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className="monthly-level-category-badge">
                            {capitalize(
                              level.category
                            )}
                          </span>
                        </td>

                        <td>
                          {level.month || "-"}
                        </td>

                        <td>
                          <span
                            className={`monthly-level-bias-badge monthly-level-bias-${String(
                              level.bias ||
                                "neutral"
                            ).toLowerCase()}`}
                          >
                            {capitalize(
                              level.bias
                            )}
                          </span>
                        </td>

                        <td>
                          {level.pivot === ""
                            ? "-"
                            : level.pivot}
                        </td>

                        <td>
                          <span
                            className={`monthly-level-visibility-badge monthly-level-visibility-${String(
                              level.visibility ||
                                "private"
                            ).toLowerCase()}`}
                          >
                            {capitalize(
                              level.visibility
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`monthly-level-status-badge monthly-level-status-${String(
                              level.status ||
                                "draft"
                            ).toLowerCase()}`}
                          >
                            {capitalize(
                              level.status
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="monthly-level-chart-links">
                            {level.beforeChartUrl ? (
                              <a
                                href={
                                  level.beforeChartUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                              >
                                Before ↗
                              </a>
                            ) : (
                              <span>
                                No before chart
                              </span>
                            )}

                            {level.afterChartUrl ? (
                              <a
                                href={
                                  level.afterChartUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                              >
                                After ↗
                              </a>
                            ) : (
                              <span>
                                No after chart
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          {formatDate(
                            level.updatedAt
                          )}
                        </td>

                        <td>
                          <div className="monthly-level-actions">
                            <button
                              type="button"
                              className="monthly-level-edit-button"
                              onClick={() =>
                                openEditModal(
                                  level
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="monthly-level-delete-button"
                              onClick={() =>
                                handleDelete(
                                  level
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
            <div className="monthly-level-mobile-list">
  {paginatedLevels.map((level) => (
    <article
      key={level.id}
      className="monthly-level-mobile-card"
    >
      <div className="monthly-level-mobile-card-header">
        <div>
          <strong>{level.instrument}</strong>

          <span>
            {level.month || "-"}
          </span>
        </div>

        <span
          className={`monthly-level-status-badge monthly-level-status-${String(
            level.status || "draft"
          ).toLowerCase()}`}
        >
          {capitalize(level.status)}
        </span>
      </div>

      <div className="monthly-level-mobile-card-grid">
        <div>
          <span>Category</span>
          <strong>
            {capitalize(level.category)}
          </strong>
        </div>

        <div>
          <span>Bias</span>
          <strong>
            {capitalize(level.bias)}
          </strong>
        </div>

        <div>
          <span>Pivot</span>
          <strong>
            {level.pivot === ""
              ? "-"
              : level.pivot}
          </strong>
        </div>

        <div>
          <span>Visibility</span>
          <strong>
            {capitalize(level.visibility)}
          </strong>
        </div>
      </div>

      <div className="monthly-level-mobile-chart-row">
        {level.beforeChartUrl ? (
          <a
            href={level.beforeChartUrl}
            target="_blank"
            rel="noreferrer"
          >
            Before Chart ↗
          </a>
        ) : (
          <span>No before chart</span>
        )}

        {level.afterChartUrl ? (
          <a
            href={level.afterChartUrl}
            target="_blank"
            rel="noreferrer"
          >
            After Chart ↗
          </a>
        ) : (
          <span>No after chart</span>
        )}
      </div>

      <div className="monthly-level-mobile-actions">
        <button
          type="button"
          className="monthly-level-edit-button"
          onClick={() =>
            openEditModal(level)
          }
        >
          Edit
        </button>

        <button
          type="button"
          className="monthly-level-delete-button"
          onClick={() =>
            handleDelete(level)
          }
        >
          Delete
        </button>
      </div>
    </article>
  ))}
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
        <MonthlyLevelModal
          editingLevel={editingLevel}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </>
  );
}

function MonthlyLevelStat({
  icon,
  label,
  value,
}) {
  return (
    <div className="monthly-level-stat-card">
      <span>{icon}</span>

      <div>
        <strong>{value}</strong>
        <p>{label}</p>
      </div>
    </div>
  );
}