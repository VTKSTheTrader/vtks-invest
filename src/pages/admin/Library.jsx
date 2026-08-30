import {
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "../../components/admin/PageHeader";
import PrimaryButton from "../../components/admin/PrimaryButton";
import DataTable from "../../components/admin/DataTable";
import LibraryModal from "../../components/admin/modals/LibraryModal";
import PreviewModal from "../../components/admin/modals/PreviewModal";
import Pagination from "../../components/common/Pagination";

import {
  getResources,
  addResource,
  updateResource,
  deleteResource,
  uploadLibraryFile,
  mapResourceFromDB,
} from "../../services/libraryService";

import "./Library.css";

const ITEMS_PER_PAGE = 5;

/* =====================================================
   LIBRARY
===================================================== */

export default function Library() {
  const [showModal, setShowModal] = useState(false);

  const [editingResource, setEditingResource] =
    useState(null);

  const [previewResource, setPreviewResource] =
    useState(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [typeFilter, setTypeFilter] =
    useState("All");

  const [accessFilter, setAccessFilter] =
    useState("All");

  const [resources, setResources] = useState([]);

  const [currentPage, setCurrentPage] =
    useState(1);

  /* ===================================================
     LOAD RESOURCES
  =================================================== */

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);

      const rows = await getResources();

      setResources(
        (rows || []).map(mapResourceFromDB)
      );
    } catch (error) {
      console.error(
        "Library load error:",
        error
      );

      alert(
        error?.message ||
          "Failed to load library resources."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ===================================================
     YOUTUBE THUMBNAIL
  =================================================== */

  const getYouTubeThumbnail = (url) => {
    if (!url) return "";

    try {
      let videoId = "";

      if (url.includes("watch?v=")) {
        videoId = url
          .split("watch?v=")[1]
          .split("&")[0];
      } else if (url.includes("youtu.be/")) {
        videoId = url
          .split("youtu.be/")[1]
          .split("?")[0];
      } else if (
        url.includes("youtube.com/embed/")
      ) {
        videoId = url
          .split("youtube.com/embed/")[1]
          .split("?")[0];
      } else if (
        url.includes("youtube.com/shorts/")
      ) {
        videoId = url
          .split("youtube.com/shorts/")[1]
          .split("?")[0];
      }

      return videoId
        ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        : "";
    } catch {
      return "";
    }
  };

  /* ===================================================
     BADGE
  =================================================== */

  const renderBadge = (value) => {
    const badgeClass =
      String(value || "")
        .toLowerCase()
        .replace(/\s+/g, "-");

    return (
      <span
        className={`library-badge library-badge-${badgeClass}`}
      >
        {value || "-"}
      </span>
    );
  };

  /* ===================================================
     SAVE RESOURCE
  =================================================== */

  const handleSave = async (resource) => {
    try {
      setSaving(true);

      let finalUrl = resource.url || "";

      /*
        Upload only when a new file
        has actually been selected.
      */

      if (
        resource.sourceType === "Upload" &&
        resource.file
      ) {
        finalUrl = await uploadLibraryFile(
          resource.file
        );
      }

      const cleanResource = {
        ...resource,

        title: String(
          resource.title || ""
        ).trim(),

        stockName:
          resource.category === "Stock Analysis"
            ? String(
                resource.stockName || ""
              ).trim()
            : "",

        category:
          resource.category ||
          "Beginner Course",

        type:
          resource.type || "Video",

        sourceType:
          resource.sourceType || "Link",

        access:
          resource.access || "Subscriber",

        status:
          resource.status || "Published",

        description: String(
          resource.description || ""
        ).trim(),

        url: String(finalUrl || "").trim(),

        views: Number(
          resource.views || 0
        ),

        featured: Boolean(
          resource.featured
        ),

        pinned: Boolean(
          resource.pinned
        ),
      };

      delete cleanResource.file;

      /* EDIT */

      if (editingResource) {
        const updated = await updateResource(
          editingResource.id,
          cleanResource
        );

        const mapped =
          mapResourceFromDB(updated);

        setResources((previous) =>
          previous.map((item) =>
            item.id === editingResource.id
              ? mapped
              : item
          )
        );

        setEditingResource(null);

        return;
      }

      /* ADD */

      const inserted = await addResource(
        cleanResource
      );

      const mapped =
        mapResourceFromDB(inserted);

      setResources((previous) => [
        mapped,
        ...previous,
      ]);

      setCurrentPage(1);
    } catch (error) {
      console.error(
        "Library save error:",
        error
      );

      alert(
        error?.message ||
          "Failed to save resource."
      );

      throw error;
    } finally {
      setSaving(false);
    }
  };

  /* ===================================================
     DELETE RESOURCE
  =================================================== */

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this resource?"
    );

    if (!confirmed) return;

    try {
      await deleteResource(id);

      setResources((previous) =>
        previous.filter(
          (resource) =>
            resource.id !== id
        )
      );
    } catch (error) {
      console.error(
        "Library delete error:",
        error
      );

      alert(
        error?.message ||
          "Failed to delete resource."
      );
    }
  };

  /* ===================================================
     TOGGLE FEATURED
  =================================================== */

  const toggleFeatured = async (row) => {
    try {
      const updated = await updateResource(
        row.id,
        {
          ...row,
          featured: !row.featured,
        }
      );

      const mapped =
        mapResourceFromDB(updated);

      setResources((previous) =>
        previous.map((item) =>
          item.id === row.id
            ? mapped
            : item
        )
      );
    } catch (error) {
      console.error(
        "Featured update error:",
        error
      );

      alert(
        error?.message ||
          "Failed to update featured status."
      );
    }
  };

  /* ===================================================
     TOGGLE PIN
  =================================================== */

  const togglePinned = async (row) => {
    try {
      const updated = await updateResource(
        row.id,
        {
          ...row,
          pinned: !row.pinned,
        }
      );

      const mapped =
        mapResourceFromDB(updated);

      setResources((previous) =>
        previous.map((item) =>
          item.id === row.id
            ? mapped
            : item
        )
      );
    } catch (error) {
      console.error(
        "Pinned update error:",
        error
      );

      alert(
        error?.message ||
          "Failed to update pin status."
      );
    }
  };

  /* ===================================================
     PREVIEW
  =================================================== */

  const handlePreview = async (row) => {
    /*
      Show preview immediately.
      View count update happens separately.
    */

    setPreviewResource(row);

    try {
      const updated = await updateResource(
        row.id,
        {
          ...row,
          views:
            Number(row.views || 0) + 1,
        }
      );

      const mapped =
        mapResourceFromDB(updated);

      setResources((previous) =>
        previous.map((item) =>
          item.id === row.id
            ? mapped
            : item
        )
      );

      setPreviewResource(mapped);
    } catch (error) {
      console.error(
        "View update error:",
        error
      );
    }
  };

  /* ===================================================
     SORT RESOURCES
  =================================================== */

  const sortedResources = useMemo(() => {
    return [...resources].sort(
      (first, second) => {
        /*
          Pinned first
        */

        if (
          first.pinned &&
          !second.pinned
        ) {
          return -1;
        }

        if (
          !first.pinned &&
          second.pinned
        ) {
          return 1;
        }

        /*
          Featured second
        */

        if (
          first.featured &&
          !second.featured
        ) {
          return -1;
        }

        if (
          !first.featured &&
          second.featured
        ) {
          return 1;
        }

        /*
          Latest IDs first
        */

        return (
          Number(second.id || 0) -
          Number(first.id || 0)
        );
      }
    );
  }, [resources]);

  /* ===================================================
     FILTER RESOURCES
  =================================================== */

  const filteredResources = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return sortedResources.filter(
      (item) => {
        const matchesSearch =
          !query ||
          String(item.title || "")
            .toLowerCase()
            .includes(query) ||
          String(item.stockName || "")
            .toLowerCase()
            .includes(query) ||
          String(item.category || "")
            .toLowerCase()
            .includes(query) ||
          String(item.description || "")
            .toLowerCase()
            .includes(query);

        const matchesCategory =
          categoryFilter === "All" ||
          item.category ===
            categoryFilter;

        const matchesType =
          typeFilter === "All" ||
          item.type === typeFilter;

        const matchesAccess =
          accessFilter === "All" ||
          item.access === accessFilter;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesType &&
          matchesAccess
        );
      }
    );
  }, [
    sortedResources,
    search,
    categoryFilter,
    typeFilter,
    accessFilter,
  ]);

  /* ===================================================
     RESET PAGE WHEN FILTER CHANGES
  =================================================== */

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    categoryFilter,
    typeFilter,
    accessFilter,
  ]);

  /* ===================================================
     PAGINATION
  =================================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredResources.length /
        ITEMS_PER_PAGE
    )
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const paginatedResources =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      return filteredResources.slice(
        startIndex,
        startIndex +
          ITEMS_PER_PAGE
      );
    }, [
      filteredResources,
      currentPage,
    ]);

  const firstVisibleRecord =
    filteredResources.length === 0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const lastVisibleRecord = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredResources.length
  );

  /* ===================================================
     STATS
  =================================================== */

  const totalVideos =
    resources.filter(
      (resource) =>
        resource.type === "Video"
    ).length;

  const totalPdfs =
    resources.filter(
      (resource) =>
        resource.type === "PDF"
    ).length;

  const stockAnalysisCount =
    resources.filter(
      (resource) =>
        resource.category ===
        "Stock Analysis"
    ).length;

  const subscriberOnly =
    resources.filter(
      (resource) =>
        resource.access ===
        "Subscriber"
    ).length;

  const pinnedCount =
    resources.filter(
      (resource) =>
        resource.pinned
    ).length;

  const totalViews =
    resources.reduce(
      (total, resource) =>
        total +
        Number(resource.views || 0),
      0
    );

  /* ===================================================
     TABLE COLUMNS
  =================================================== */

  const columns = [
    {
      key: "thumbnail",
      label: "Preview",

      render: (row) => {
        const youtubeThumbnail =
          getYouTubeThumbnail(
            row.url
          );

        if (youtubeThumbnail) {
          return (
            <img
              className="library-thumbnail"
              src={youtubeThumbnail}
              alt={row.title}
            />
          );
        }

        if (
          row.type === "Image" &&
          row.url
        ) {
          return (
            <img
              className="library-thumbnail"
              src={row.url}
              alt={
                row.stockName ||
                row.title
              }
            />
          );
        }

        return (
          <div className="library-type-icon">
            {row.type === "Video"
              ? "🎥"
              : row.type === "PDF"
                ? "📄"
                : row.type === "Image"
                  ? "📊"
                  : "🔗"}
          </div>
        );
      },
    },

    {
      key: "title",
      label: "Title",

      render: (row) => (
        <div className="library-title-cell">
          <strong>
            {row.title || "-"}
          </strong>

          {row.category ===
            "Stock Analysis" &&
            row.stockName && (
              <span className="library-stock-inline">
                {row.stockName}
              </span>
            )}
        </div>
      ),
    },

    {
      key: "stockName",
      label: "Stock",

      render: (row) =>
        row.category ===
        "Stock Analysis"
          ? row.stockName || "-"
          : "-",
    },

    {
      key: "category",
      label: "Category",

      render: (row) => (
        <span className="library-category-text">
          {row.category || "-"}
        </span>
      ),
    },

    {
      key: "type",
      label: "Type",

      render: (row) =>
        renderBadge(row.type),
    },

    {
      key: "access",
      label: "Access",

      render: (row) =>
        renderBadge(row.access),
    },

    {
      key: "status",
      label: "Status",

      render: (row) =>
        renderBadge(row.status),
    },

    {
      key: "pinned",
      label: "Pin",

      render: (row) => (
        <button
          type="button"
          className="library-icon-button"
          onClick={() =>
            togglePinned(row)
          }
          title={
            row.pinned
              ? "Remove Pin"
              : "Pin Resource"
          }
        >
          {row.pinned
            ? "📌"
            : "📍"}
        </button>
      ),
    },

    {
      key: "featured",
      label: "Featured",

      render: (row) => (
        <button
          type="button"
          className="library-icon-button"
          onClick={() =>
            toggleFeatured(row)
          }
          title={
            row.featured
              ? "Remove Featured"
              : "Mark Featured"
          }
        >
          {row.featured
            ? "⭐"
            : "☆"}
        </button>
      ),
    },

    {
      key: "views",
      label: "Views",

      render: (row) => (
        <span className="library-views">
          {Number(row.views || 0)}
        </span>
      ),
    },

    {
      key: "updatedAt",
      label: "Updated",

      render: (row) =>
        row.updatedAt ||
        row.uploaded ||
        "-",
    },

    {
      key: "watch",
      label: "Watch",

      render: (row) => (
        <button
          type="button"
          className="library-preview-button"
          onClick={() =>
            handlePreview(row)
          }
        >
          ▶ Preview
        </button>
      ),
    },

    {
      key: "link",
      label: "Link",

      render: (row) => (
        <button
          type="button"
          className="library-open-button"
          disabled={!row.url}
          onClick={() => {
            if (!row.url) return;

            window.open(
              row.url,
              "_blank",
              "noopener,noreferrer"
            );
          }}
        >
          🔗 Open
        </button>
      ),
    },

    {
      key: "action",
      label: "Action",

      render: (row) => (
        <div className="library-action-buttons">
          <button
            type="button"
            className="library-edit-button"
            onClick={() => {
              setEditingResource(
                row
              );

              setShowModal(true);
            }}
          >
            ✏️ Edit
          </button>

          <button
            type="button"
            className="library-delete-button"
            onClick={() =>
              handleDelete(row.id)
            }
          >
            🗑 Delete
          </button>
        </div>
      ),
    },
  ];

  /* ===================================================
     CLEAR FILTERS
  =================================================== */

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("All");
    setTypeFilter("All");
    setAccessFilter("All");
    setCurrentPage(1);
  };

  /* ===================================================
     OPEN ADD MODAL
  =================================================== */

  const openAddModal = () => {
    setEditingResource(null);
    setShowModal(true);
  };

  /* ===================================================
     CLOSE MODAL
  =================================================== */

  const closeModal = () => {
    setShowModal(false);
    setEditingResource(null);
  };

  /* ===================================================
     PAGE
  =================================================== */

  return (
    <div className="library-admin-page">
      <PageHeader
        title="VTKS Knowledge Vault"
        subtitle="Manage videos, stock analysis, PDFs, courses and learning resources."
        action={
          <PrimaryButton
            onClick={openAddModal}
            disabled={saving}
          >
            + Add Resource
          </PrimaryButton>
        }
      />

      {loading ? (
        <div className="library-loading">
          Loading resources...
        </div>
      ) : (
        <>
          {/* ==========================================
              STATS
          ========================================== */}

          <div className="library-stats-grid">
            <div className="library-stat-card">
              <div className="library-stat-icon">
                📚
              </div>

              <div>
                <h2>
                  {resources.length}
                </h2>

                <p>
                  Total Resources
                </p>
              </div>
            </div>

            <div className="library-stat-card">
              <div className="library-stat-icon">
                🎥
              </div>

              <div>
                <h2>
                  {totalVideos}
                </h2>

                <p>Videos</p>
              </div>
            </div>

            <div className="library-stat-card">
              <div className="library-stat-icon">
                📈
              </div>

              <div>
                <h2>
                  {stockAnalysisCount}
                </h2>

                <p>
                  Stock Analysis
                </p>
              </div>
            </div>

            <div className="library-stat-card">
              <div className="library-stat-icon">
                📄
              </div>

              <div>
                <h2>
                  {totalPdfs}
                </h2>

                <p>PDFs</p>
              </div>
            </div>

            <div className="library-stat-card">
              <div className="library-stat-icon">
                👥
              </div>

              <div>
                <h2>
                  {subscriberOnly}
                </h2>

                <p>
                  Subscriber Only
                </p>
              </div>
            </div>

            <div className="library-stat-card">
              <div className="library-stat-icon">
                📌
              </div>

              <div>
                <h2>
                  {pinnedCount}
                </h2>

                <p>Pinned</p>
              </div>
            </div>

            <div className="library-stat-card">
              <div className="library-stat-icon">
                👁
              </div>

              <div>
                <h2>
                  {totalViews}
                </h2>

                <p>Total Views</p>
              </div>
            </div>
          </div>

          {/* ==========================================
              FILTERS
          ========================================== */}

          <div className="library-filter-panel">
            <div className="library-filter-row">
              <div className="library-search-wrapper">
                <span className="library-search-icon">
                  🔍
                </span>

                <input
                  type="search"
                  className="library-search-input"
                  placeholder="Search Resource or Stock..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />
              </div>

              <select
                className="library-filter-select library-category-filter"
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  📂 All Categories
                </option>

                <option value="Stock Analysis">
                  📈 Stock Analysis
                </option>

                <option value="Beginner Course">
                  Beginner Course
                </option>

                <option value="Live Sessions">
                  Live Sessions
                </option>

                <option value="Swing Trading">
                  Swing Trading
                </option>

                <option value="Investment">
                  Investment
                </option>

                <option value="STF 2.0">
                  STF
                </option>

                <option value="Psychology">
                  Psychology
                </option>

                <option value="PDF Notes">
                  PDF Notes
                </option>

                <option value="Case Studies">
                  Case Studies
                </option>

                <option value="Recordings">
                  Recordings
                </option>

                <option value="Bonus">
                  Bonus
                </option>
              </select>

              <select
                className="library-filter-select"
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  🎞 All Types
                </option>

                <option value="Video">
                  Video
                </option>

                <option value="Image">
                  Chart / Image
                </option>

                <option value="PDF">
                  PDF
                </option>

                <option value="Link">
                  Link
                </option>
              </select>

              <select
                className="library-filter-select"
                value={accessFilter}
                onChange={(event) =>
                  setAccessFilter(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  👁 All Access
                </option>

                <option value="Subscriber">
                  Subscriber
                </option>

                <option value="Public">
                  Public
                </option>

                <option value="Private">
                  Private
                </option>
              </select>

              <button
                type="button"
                className="library-clear-button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* ==========================================
              RESULT COUNT
          ========================================== */}

          <div className="library-result-info">
            <span>
              Showing{" "}
              {firstVisibleRecord}–
              {lastVisibleRecord} of{" "}
              {
                filteredResources.length
              }{" "}
              resources
            </span>

            <span>
              Page {currentPage} of{" "}
              {totalPages}
            </span>
          </div>

          {/* ==========================================
              TABLE
          ========================================== */}

          {filteredResources.length ===
          0 ? (
            <div className="library-empty-state">
              <div className="library-empty-icon">
                📚
              </div>

              <h3>
                No resources found
              </h3>

              <p>
                Try changing your
                search or filters.
              </p>
            </div>
          ) : (
            <>
              <div className="library-table-container">
                <DataTable
                  columns={columns}
                  data={
                    paginatedResources
                  }
                />
              </div>

              {totalPages > 1 && (
                <div className="library-pagination">
                  <Pagination
                    currentPage={
                      currentPage
                    }
                    totalPages={
                      totalPages
                    }
                    onPageChange={
                      setCurrentPage
                    }
                  />
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ==============================================
          ADD / EDIT MODAL
      ============================================== */}

      {showModal && (
        <LibraryModal
          onClose={closeModal}
          onSave={handleSave}
          editingResource={
            editingResource
          }
        />
      )}

      {/* ==============================================
          PREVIEW MODAL
      ============================================== */}

      {previewResource && (
        <PreviewModal
          resource={
            previewResource
          }
          onClose={() =>
            setPreviewResource(
              null
            )
          }
        />
      )}
    </div>
  );
}