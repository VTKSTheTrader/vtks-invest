import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/admin/PageHeader";
import CommunityLinkModal from "../../components/admin/modals/CommunityLinkModal";

import {
  addCommunityLink,
  deleteCommunityLink,
  getCommunityLinks,
  updateCommunityLink,
  updateCommunityLinkStatus,
} from "../../services/communityService";

import "./CommunityLinks.css";

const ITEMS_PER_PAGE = 5;

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const formatLabel = (value) =>
  String(value || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getPlatformIcon = (platform) => {
  const icons = {
    telegram: "✈️",
    whatsapp: "💬",
    discord: "🎮",
    youtube: "▶️",
    zoom: "🎥",
    "google meet": "📹",
    other: "🔗",
  };

  return icons[normalize(platform)] || "🔗";
};

export default function CommunityLinks() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [accessFilter, setAccessFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const loadCommunityLinks = async () => {
    try {
      setLoading(true);
      const rows = await getCommunityLinks();
      setLinks(rows || []);
    } catch (error) {
      console.error("Community link load error:", error);
      alert(error?.message || "Unable to load community links.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunityLinks();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, platformFilter, accessFilter, statusFilter]);

  const handleAdd = () => {
    setEditingLink(null);
    setShowModal(true);
  };

  const handleEdit = (link) => {
    setEditingLink(link);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingLink(null);
  };

  const handleSave = async (formData) => {
    try {
      if (editingLink?.id) {
        await updateCommunityLink(editingLink.id, formData);
      } else {
        await addCommunityLink(formData);
      }

      handleModalClose();
      await loadCommunityLinks();
    } catch (error) {
      console.error("Community link save error:", error);
      alert(error?.message || "Unable to save community link.");
      throw error;
    }
  };

  const handleDelete = async (link) => {
    const confirmed = window.confirm(
      `Delete "${link.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(link.id);
      await deleteCommunityLink(link.id);
      setLinks((current) => current.filter((item) => item.id !== link.id));
    } catch (error) {
      console.error("Community link delete error:", error);
      alert(error?.message || "Unable to delete community link.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStatusToggle = async (link) => {
    const nextStatus =
      normalize(link.status) === "active" ? "inactive" : "active";

    try {
      setActionLoadingId(link.id);
      const updated = await updateCommunityLinkStatus(link.id, nextStatus);

      setLinks((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (error) {
      console.error("Community link status error:", error);
      alert(error?.message || "Unable to update link status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredLinks = useMemo(() => {
    const query = normalize(searchText);

    return links.filter((item) => {
      const searchMatch =
        !query ||
        normalize(item.title).includes(query) ||
        normalize(item.description).includes(query) ||
        normalize(item.platform).includes(query) ||
        normalize(item.url).includes(query);

      const platformMatch =
        platformFilter === "All" ||
        normalize(item.platform) === normalize(platformFilter);

      const accessMatch =
        accessFilter === "All" ||
        normalize(item.access) === normalize(accessFilter);

      const statusMatch =
        statusFilter === "All" ||
        normalize(item.status) === normalize(statusFilter);

      return searchMatch && platformMatch && accessMatch && statusMatch;
    });
  }, [links, searchText, platformFilter, accessFilter, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLinks.length / ITEMS_PER_PAGE)
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedLinks = filteredLinks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const activeCount = links.filter(
    (item) => normalize(item.status) === "active"
  ).length;

  const subscriberCount = links.filter((item) =>
    ["subscriber", "community"].includes(normalize(item.access))
  ).length;

  const telegramCount = links.filter(
    (item) => normalize(item.platform) === "telegram"
  ).length;

  const clearFilters = () => {
    setSearchText("");
    setPlatformFilter("All");
    setAccessFilter("All");
    setStatusFilter("All");
  };

  return (
    <div className="community-links-page">
      <PageHeader
        title="Community Links"
        subtitle="Manage Telegram and other subscriber community links."
      />

      <section className="community-stats-grid">
        <article className="community-stat-card">
          <span className="community-stat-icon">🔗</span>
          <div><p>Total Links</p><h3>{links.length}</h3></div>
        </article>

        <article className="community-stat-card">
          <span className="community-stat-icon">✅</span>
          <div><p>Active Links</p><h3>{activeCount}</h3></div>
        </article>

        <article className="community-stat-card">
          <span className="community-stat-icon">👥</span>
          <div><p>Subscriber Access</p><h3>{subscriberCount}</h3></div>
        </article>

        <article className="community-stat-card">
          <span className="community-stat-icon">✈️</span>
          <div><p>Telegram Links</p><h3>{telegramCount}</h3></div>
        </article>
      </section>

      <section className="admin-card community-toolbar-card">
        <div className="community-toolbar-top">
          <div>
            <h2>Community Access Links</h2>
            <p>Add, edit, disable or remove links shown to subscribers.</p>
          </div>

          <button type="button" className="community-add-btn" onClick={handleAdd}>
            + Add Community Link
          </button>
        </div>

        <div className="community-filters">
          <div className="community-search-box">
            <label htmlFor="community-search">Search</label>
            <input
              id="community-search"
              type="search"
              value={searchText}
              placeholder="Search title, platform or link..."
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>

          <div className="community-filter-field">
            <label htmlFor="platform-filter">Platform</label>
            <select
              id="platform-filter"
              value={platformFilter}
              onChange={(event) => setPlatformFilter(event.target.value)}
            >
              <option value="All">All Platforms</option>
              <option value="Telegram">Telegram</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Discord">Discord</option>
              <option value="YouTube">YouTube</option>
              <option value="Zoom">Zoom</option>
              <option value="Google Meet">Google Meet</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="community-filter-field">
            <label htmlFor="access-filter">Access</label>
            <select
              id="access-filter"
              value={accessFilter}
              onChange={(event) => setAccessFilter(event.target.value)}
            >
              <option value="All">All Access</option>
              <option value="Public">Public</option>
              <option value="Subscriber">Subscriber</option>
              <option value="Community">Community</option>
              <option value="Private">Private</option>
            </select>
          </div>

          <div className="community-filter-field">
            <label htmlFor="status-filter">Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <button type="button" className="community-clear-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </section>

      <section className="admin-card community-table-card">
        {loading ? (
          <div className="community-state">
            <div className="community-spinner" />
            <p>Loading community links...</p>
          </div>
        ) : paginatedLinks.length === 0 ? (
          <div className="community-state">
            <span className="community-empty-icon">🔗</span>
            <h3>No community links found</h3>
            <p>
              {links.length === 0
                ? "Add your first Telegram or community link."
                : "Try changing or clearing the selected filters."}
            </p>
            <button
              type="button"
              className={links.length === 0 ? "community-add-btn" : "community-clear-btn"}
              onClick={links.length === 0 ? handleAdd : clearFilters}
            >
              {links.length === 0 ? "+ Add Community Link" : "Clear Filters"}
            </button>
          </div>
        ) : (
          <>
            <div className="community-table-wrap">
              <table className="community-table">
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>Platform</th>
                    <th>Access</th>
                    <th>Order</th>
                    <th>Status</th>
                    <th>Link</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedLinks.map((link) => {
                    const isActive = normalize(link.status) === "active";
                    const isBusy = actionLoadingId === link.id;

                    return (
                      <tr key={link.id}>
                        <td>
                          <div className="community-title-cell">
                            <span className="community-platform-icon">
                              {getPlatformIcon(link.platform)}
                            </span>
                            <div>
                              <div className="community-title-line">
                                <strong>{link.title}</strong>
                                {link.featured && (
                                  <span className="community-featured">⭐ Featured</span>
                                )}
                              </div>
                              {link.description && <p>{link.description}</p>}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="community-platform-badge">
                            {formatLabel(link.platform)}
                          </span>
                        </td>

                        <td>
                          <span className={`community-access-badge access-${normalize(link.access)}`}>
                            {formatLabel(link.access)}
                          </span>
                        </td>

                        <td>{link.sortOrder}</td>

                        <td>
                          <button
                            type="button"
                            className={`community-status-btn ${isActive ? "is-active" : "is-inactive"}`}
                            onClick={() => handleStatusToggle(link)}
                            disabled={isBusy}
                          >
                            {isBusy ? "Updating..." : formatLabel(link.status)}
                          </button>
                        </td>

                        <td>
                          <a
                            className="community-open-link"
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            title={link.url}
                          >
                            Open ↗
                          </a>
                        </td>

                        <td>
                          <div className="community-actions">
                            <button
                              type="button"
                              className="community-action-btn edit"
                              onClick={() => handleEdit(link)}
                              disabled={isBusy}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="community-action-btn delete"
                              onClick={() => handleDelete(link)}
                              disabled={isBusy}
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
            </div>

            <div className="community-pagination">
              <p>
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredLinks.length)} of {filteredLinks.length}
              </p>

              <div className="community-pagination-buttons">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    type="button"
                    key={page}
                    className={currentPage === page ? "active" : ""}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {showModal && (
        <CommunityLinkModal
          isOpen={showModal}
          open={showModal}
          link={editingLink}
          editingLink={editingLink}
          initialData={editingLink}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
