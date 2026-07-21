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

const ITEMS_PER_PAGE = 5;

export default function Library() {
  const [showModal, setShowModal] =
    useState(false);

  const [
    editingResource,
    setEditingResource,
  ] = useState(null);

  const [
    previewResource,
    setPreviewResource,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("All");

  const [typeFilter, setTypeFilter] =
    useState("All");

  const [
    accessFilter,
    setAccessFilter,
  ] = useState("All");

  const [resources, setResources] =
    useState([]);

  const [currentPage, setCurrentPage] =
    useState(1);

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
          "Failed to load library resources from Supabase"
      );
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeThumbnail = (url) => {
    if (!url) return "";

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
    }

    return videoId
      ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      : "";
  };

  const badge = (value) => {
    const colors = {
      Video: ["#fee2e2", "#991b1b"],
      PDF: ["#dbeafe", "#1e40af"],
      Link: ["#dcfce7", "#166534"],

      Subscriber: [
        "#dbeafe",
        "#1e40af",
      ],

      Public: ["#dcfce7", "#166534"],
      Private: ["#fee2e2", "#991b1b"],

      Published: [
        "#dcfce7",
        "#166534",
      ],

      Draft: ["#fef3c7", "#92400e"],
      Hidden: ["#fee2e2", "#991b1b"],
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
          fontWeight: 600,
          fontSize: "13px",
          whiteSpace: "nowrap",
        }}
      >
        {value || "-"}
      </span>
    );
  };

  const handleSave = async (
    resource
  ) => {
    try {
      setSaving(true);

      let finalUrl =
        resource.url || "";

      if (
        resource.sourceType === "Upload" &&
        resource.file
      ) {
        finalUrl =
          await uploadLibraryFile(
            resource.file
          );
      }

      const cleanResource = {
        ...resource,

        title: String(
          resource.title || ""
        ).trim(),

        category:
          resource.category || "General",

        type:
          resource.type || "Link",

        sourceType:
          resource.sourceType || "URL",

        access:
          resource.access || "Subscriber",

        status:
          resource.status || "Published",

        description: String(
          resource.description || ""
        ).trim(),

        url: finalUrl,

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

      if (editingResource) {
        const updated =
          await updateResource(
            editingResource.id,
            cleanResource
          );

        setResources((previous) =>
          previous.map(
            (currentResource) =>
              currentResource.id ===
              editingResource.id
                ? mapResourceFromDB(
                    updated
                  )
                : currentResource
          )
        );

        setEditingResource(null);
        return;
      }

      const inserted =
        await addResource(cleanResource);

      setResources((previous) => [
        mapResourceFromDB(inserted),
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
          "Failed to save resource"
      );

      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed =
      window.confirm(
        "Delete this resource?"
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
          "Failed to delete resource"
      );
    }
  };

  const toggleFeatured = async (
    row
  ) => {
    try {
      const updated =
        await updateResource(row.id, {
          ...row,
          featured: !row.featured,
        });

      setResources((previous) =>
        previous.map((resource) =>
          resource.id === row.id
            ? mapResourceFromDB(updated)
            : resource
        )
      );
    } catch (error) {
      console.error(
        "Featured update error:",
        error
      );

      alert(
        error?.message ||
          "Failed to update featured status"
      );
    }
  };

  const togglePinned = async (row) => {
    try {
      const updated =
        await updateResource(row.id, {
          ...row,
          pinned: !row.pinned,
        });

      setResources((previous) =>
        previous.map((resource) =>
          resource.id === row.id
            ? mapResourceFromDB(updated)
            : resource
        )
      );
    } catch (error) {
      console.error(
        "Pinned update error:",
        error
      );

      alert(
        error?.message ||
          "Failed to update pinned status"
      );
    }
  };

  const handlePreview = async (
    row
  ) => {
    try {
      const updated =
        await updateResource(row.id, {
          ...row,

          views:
            Number(row.views || 0) + 1,
        });

      const mapped =
        mapResourceFromDB(updated);

      setResources((previous) =>
        previous.map((resource) =>
          resource.id === row.id
            ? mapped
            : resource
        )
      );

      setPreviewResource(mapped);
    } catch (error) {
      console.error(
        "Preview update error:",
        error
      );

      setPreviewResource(row);
    }
  };

  const sortedResources = useMemo(
    () =>
      [...resources].sort(
        (first, second) => {
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

          const firstDate =
            new Date(
              first.updatedAt ||
                first.uploaded ||
                0
            ).getTime();

          const secondDate =
            new Date(
              second.updatedAt ||
                second.uploaded ||
                0
            ).getTime();

          return secondDate - firstDate;
        }
      ),
    [resources]
  );

  const filteredResources = useMemo(
    () => {
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
    },
    [
      sortedResources,
      search,
      categoryFilter,
      typeFilter,
      accessFilter,
    ]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    categoryFilter,
    typeFilter,
    accessFilter,
  ]);

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
  }, [currentPage, totalPages]);

  const paginatedResources =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      return filteredResources.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
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

  const subscriberOnly =
    resources.filter(
      (resource) =>
        resource.access === "Subscriber"
    ).length;

  const pinnedCount =
    resources.filter(
      (resource) =>
        resource.pinned
    ).length;

  const totalViews = resources.reduce(
    (sum, resource) =>
      sum +
      Number(resource.views || 0),
    0
  );

  const columns = [
    {
      key: "thumbnail",
      label: "Preview",

      render: (row) => {
        const thumbnail =
          getYouTubeThumbnail(row.url);

        if (thumbnail) {
          return (
            <img
              src={thumbnail}
              alt={row.title}
              style={{
                width: "90px",
                height: "55px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
          );
        }

        return (
          <span
            style={{
              fontSize: "26px",
            }}
          >
            {row.type === "Video"
              ? "🎥"
              : row.type === "PDF"
                ? "📄"
                : "🔗"}
          </span>
        );
      },
    },

    {
      key: "title",
      label: "Title",
    },

    {
      key: "category",
      label: "Category",
    },

    {
      key: "type",
      label: "Type",
      render: (row) =>
        badge(row.type),
    },

    {
      key: "access",
      label: "Access",
      render: (row) =>
        badge(row.access),
    },

    {
      key: "status",
      label: "Status",
      render: (row) =>
        badge(row.status),
    },

    {
      key: "pinned",
      label: "Pin",

      render: (row) => (
        <button
          type="button"
          onClick={() =>
            togglePinned(row)
          }
          title={
            row.pinned
              ? "Remove pin"
              : "Pin resource"
          }
          style={{
            border: "none",
            background: "transparent",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          {row.pinned ? "📌" : "📍"}
        </button>
      ),
    },

    {
      key: "featured",
      label: "Featured",

      render: (row) => (
        <button
          type="button"
          onClick={() =>
            toggleFeatured(row)
          }
          title={
            row.featured
              ? "Remove featured status"
              : "Feature resource"
          }
          style={{
            border: "none",
            background: "transparent",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          {row.featured ? "⭐" : "☆"}
        </button>
      ),
    },

    {
      key: "views",
      label: "Views",
      render: (row) =>
        Number(row.views || 0),
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
      key: "previewAction",
      label: "Watch",

      render: (row) => (
        <button
          type="button"
          onClick={() =>
            handlePreview(row)
          }
          style={{
            border: "none",
            background: "#16a34a",
            color: "#ffffff",
            padding: "8px 14px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          ▶ Preview
        </button>
      ),
    },

    {
      key: "open",
      label: "Link",

      render: (row) => (
        <button
          type="button"
          onClick={() => {
            if (!row.url) {
              alert(
                "No resource URL available."
              );

              return;
            }

            window.open(
              row.url,
              "_blank",
              "noopener,noreferrer"
            );
          }}
          style={{
            border: "none",
            background: "#2563eb",
            color: "#ffffff",
            padding: "8px 14px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
            whiteSpace: "nowrap",
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "7px",
            minWidth: "90px",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setEditingResource(row);
              setShowModal(true);
            }}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#2563eb",
              fontWeight: 700,
              padding: 0,
            }}
          >
            ✏️ Edit
          </button>

          <button
            type="button"
            onClick={() =>
              handleDelete(row.id)
            }
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#dc2626",
              fontWeight: 700,
              padding: 0,
            }}
          >
            🗑 Delete
          </button>
        </div>
      ),
    },
  ];

  const filterStyle = {
    minHeight: "48px",
    padding: "11px 13px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    background: "#ffffff",
    boxSizing: "border-box",
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("All");
    setTypeFilter("All");
    setAccessFilter("All");
    setCurrentPage(1);
  };

  return (
    <>
      <PageHeader
        title="VTKS Knowledge Vault"
        subtitle="Manage videos, PDFs, courses and learning resources."
        action={
          <PrimaryButton
            onClick={() => {
              setEditingResource(null);
              setShowModal(true);
            }}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "+ Add Resource"}
          </PrimaryButton>
        }
      />

      {loading ? (
        <p>Loading resources...</p>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "20px",
              marginBottom: "30px",
            }}
          >
            <div className="admin-card">
              <h2>{resources.length}</h2>
              <p>Total Resources</p>
            </div>

            <div className="admin-card">
              <h2>{totalVideos}</h2>
              <p>Videos</p>
            </div>

            <div className="admin-card">
              <h2>{totalPdfs}</h2>
              <p>PDFs</p>
            </div>

            <div className="admin-card">
              <h2>
                {subscriberOnly}
              </h2>
              <p>Subscriber Only</p>
            </div>

            <div className="admin-card">
              <h2>{pinnedCount}</h2>
              <p>Pinned</p>
            </div>

            <div className="admin-card">
              <h2>{totalViews}</h2>
              <p>Total Views</p>
            </div>
          </div>

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
              type="search"
              placeholder="🔍 Search Resource..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              style={{
                ...filterStyle,
                minWidth: "280px",
                flex: "1 1 280px",
              }}
            />

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
              style={filterStyle}
            >
              <option value="All">
                📂 All Categories
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
                STF 2.0
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
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value
                )
              }
              style={filterStyle}
            >
              <option value="All">
                🎞 All Types
              </option>
              <option value="Video">
                Video
              </option>
              <option value="PDF">
                PDF
              </option>
              <option value="Link">
                Link
              </option>
            </select>

            <select
              value={accessFilter}
              onChange={(event) =>
                setAccessFilter(
                  event.target.value
                )
              }
              style={filterStyle}
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
              onClick={clearFilters}
              style={{
                ...filterStyle,
                cursor: "pointer",
                color: "#475569",
                fontWeight: 700,
              }}
            >
              Clear Filters
            </button>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "15px",
              marginBottom: "12px",
              color: "#64748b",
              fontSize: "14px",
              flexWrap: "wrap",
            }}
          >
            <span>
              Showing{" "}
              {firstVisibleRecord}–
              {lastVisibleRecord} of{" "}
              {filteredResources.length}{" "}
              resources
            </span>

            <span>
              Page {currentPage} of{" "}
              {totalPages}
            </span>
          </div>

          <DataTable
            columns={columns}
            data={paginatedResources}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {showModal && (
        <LibraryModal
          onClose={() => {
            setShowModal(false);
            setEditingResource(null);
          }}
          onSave={handleSave}
          editingResource={
            editingResource
          }
        />
      )}

      {previewResource && (
        <PreviewModal
          resource={previewResource}
          onClose={() =>
            setPreviewResource(null)
          }
        />
      )}
    </>
  );
}