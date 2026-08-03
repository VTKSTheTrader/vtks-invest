import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  deleteStockQuery,
  getAllStockQueries,
  publishStockQuery,
  unpublishStockQuery,
  updateStockQuery,
  uploadStockQueryChart,
  uploadStockQueryVideo,
} from "../../services/stockQueryService";

import "./StockQueries.css";

const initialResponseForm = {
  responseType: "text",
  responseText: "",
  responseChartUrl: "",
  responseVideoUrl: "",
};

const initialConfirmation = {
  open: false,
  type: "",
  title: "",
  message: "",
  confirmLabel: "",
  query: null,
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getStatusClass = (status) =>
  String(status || "New")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

export default function StockQueries() {
  const [queries, setQueries] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState("");

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [selectedQuery, setSelectedQuery] =
    useState(null);

  const [responseForm, setResponseForm] =
    useState(initialResponseForm);

  const [chartFile, setChartFile] =
    useState(null);

  const [videoFile, setVideoFile] =
    useState(null);

  const [
    uploadProgressText,
    setUploadProgressText,
  ] = useState("");

  const [confirmation, setConfirmation] =
    useState(initialConfirmation);

  /* ======================================================
     LOAD QUERIES
  ====================================================== */

  const loadQueries = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await getAllStockQueries();

      setQueries(data || []);
    } catch (loadError) {
      console.error(
        "Load stock queries error:",
        loadError
      );

      setError(
        loadError?.message ||
          "Unable to load stock queries."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueries();
  }, []);

  /* ======================================================
     FILTERS
  ====================================================== */

  const filteredQueries = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    return queries.filter((query) => {
      const currentStatus =
        query.status || "New";

      const matchesStatus =
        statusFilter === "All" ||
        currentStatus === statusFilter;

      const searchableText = [
        query.name,
        query.contact,
        query.stock_name,
        query.timeframe,
        query.question,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(
          normalizedSearch
        );

      return (
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    queries,
    searchTerm,
    statusFilter,
  ]);

  const counts = useMemo(() => {
    return {
      total: queries.length,

      new: queries.filter(
        (query) =>
          query.status === "New"
      ).length,

      reviewing: queries.filter(
        (query) =>
          query.status === "Reviewing"
      ).length,

      answered: queries.filter(
        (query) =>
          query.status === "Answered" &&
          query.is_public !== true
      ).length,

      published: queries.filter(
        (query) =>
          query.status === "Published" ||
          query.is_public === true
      ).length,
    };
  }, [queries]);

  /* ======================================================
     RESPONSE MODAL
  ====================================================== */

  const openResponsePanel = (query) => {
    setSelectedQuery(query);

    setResponseForm({
      responseType:
        query.response_type || "text",

      responseText:
        query.response_text || "",

      responseChartUrl:
        query.response_chart_url || "",

      responseVideoUrl:
        query.response_video_url || "",
    });

    setChartFile(null);
    setVideoFile(null);
    setUploadProgressText("");
    setError("");
    setSuccessMessage("");
  };

  const resetResponsePanel = () => {
    setSelectedQuery(null);
    setResponseForm(initialResponseForm);
    setChartFile(null);
    setVideoFile(null);
    setUploadProgressText("");
  };

  const closeResponsePanel = () => {
    if (actionLoading) return;

    resetResponsePanel();
  };

  /* ======================================================
     FORM HANDLERS
  ====================================================== */

  const handleResponseChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setResponseForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (name === "responseType") {
      setChartFile(null);
      setVideoFile(null);
      setUploadProgressText("");
    }

    setError("");
  };

  const handleChartFileChange = (
    event
  ) => {
    const selectedFile =
      event.target.files?.[0] ||
      null;

    setChartFile(selectedFile);

    if (selectedFile) {
      setResponseForm((previous) => ({
        ...previous,
        responseChartUrl: "",
      }));
    }

    setError("");
  };

  const handleVideoFileChange = (
    event
  ) => {
    const selectedFile =
      event.target.files?.[0] ||
      null;

    setVideoFile(selectedFile);

    if (selectedFile) {
      setResponseForm((previous) => ({
        ...previous,
        responseVideoUrl: "",
      }));
    }

    setError("");
  };

  /* ======================================================
     STATUS UPDATE
  ====================================================== */

  const handleStatusChange = async (
    query,
    status
  ) => {
    try {
      setActionLoading(query.id);
      setError("");
      setSuccessMessage("");

      const updatedQuery =
        await updateStockQuery(
          query.id,
          {
            status,
            is_public: false,
          }
        );

      setQueries((previous) =>
        previous.map((item) =>
          item.id === query.id
            ? updatedQuery
            : item
        )
      );

      setSuccessMessage(
        `${query.stock_name} status updated to ${status}.`
      );
    } catch (updateError) {
      console.error(
        "Update status error:",
        updateError
      );

      setError(
        updateError?.message ||
          "Unable to update query status."
      );
    } finally {
      setActionLoading("");
    }
  };

  /* ======================================================
     VALIDATION AND UPLOAD
  ====================================================== */

  const validateResponse = () => {
    const responseType =
      responseForm.responseType;

    if (
      responseType === "text" &&
      !responseForm.responseText.trim()
    ) {
      return "Please enter the written response.";
    }

    if (
      responseType === "chart" &&
      !chartFile &&
      !responseForm.responseChartUrl.trim()
    ) {
      return "Please upload a chart image or paste a chart URL.";
    }

    if (
      responseType === "video" &&
      !videoFile &&
      !responseForm.responseVideoUrl.trim()
    ) {
      return "Please upload a video or paste a video URL.";
    }

    return "";
  };

  const prepareResponsePayload =
    async () => {
      let responseChartUrl =
        responseForm.responseChartUrl.trim();

      let responseVideoUrl =
        responseForm.responseVideoUrl.trim();

      if (
        responseForm.responseType ===
          "chart" &&
        chartFile
      ) {
        setUploadProgressText(
          "Uploading chart image..."
        );

        responseChartUrl =
          await uploadStockQueryChart(
            chartFile
          );
      }

      if (
        responseForm.responseType ===
          "video" &&
        videoFile
      ) {
        setUploadProgressText(
          "Uploading video. Please keep this page open..."
        );

        responseVideoUrl =
          await uploadStockQueryVideo(
            videoFile
          );
      }

      return {
        responseType:
          responseForm.responseType,

        responseText:
          responseForm.responseText.trim(),

        responseChartUrl,

        responseVideoUrl,
      };
    };

  /* ======================================================
     CUSTOM CONFIRMATION
  ====================================================== */

  const closeConfirmation = () => {
    if (actionLoading) return;

    setConfirmation(
      initialConfirmation
    );
  };

  const requestSaveResponse = () => {
    if (!selectedQuery) return;

    const validationError =
      validateResponse();

    if (validationError) {
      setError(validationError);
      return;
    }

    setConfirmation({
      open: true,
      type: "save",
      title: "Save as Answered?",
      message:
        "The response will be saved privately. It will not appear on the public website until you publish it.",
      confirmLabel: "Save Response",
      query: selectedQuery,
    });
  };

  const requestPublishResponse = () => {
    if (!selectedQuery) return;

    const validationError =
      validateResponse();

    if (validationError) {
      setError(validationError);
      return;
    }

    setConfirmation({
      open: true,
      type: "publish",
      title: "Publish Response?",
      message:
        "The stock query and your response will become visible on the public Answered Queries page. The visitor's contact details will remain private.",
      confirmLabel: "Publish Response",
      query: selectedQuery,
    });
  };

  const requestUnpublish = (query) => {
    setConfirmation({
      open: true,
      type: "unpublish",
      title: "Unpublish Response?",
      message:
        "This response will be removed from the public website but will remain saved in the admin panel.",
      confirmLabel: "Unpublish",
      query,
    });
  };

  const requestDelete = (query) => {
    setConfirmation({
      open: true,
      type: "delete",
      title: "Delete Query?",
      message:
        "This query and its response will be permanently deleted. This action cannot be undone.",
      confirmLabel: "Delete Permanently",
      query,
    });
  };

  /* ======================================================
     ACTIONS
  ====================================================== */

  const saveResponse = async () => {
    if (!selectedQuery) return;

    try {
      setActionLoading(
        selectedQuery.id
      );

      setConfirmation(
        initialConfirmation
      );

      setError("");
      setSuccessMessage("");

      const preparedResponse =
        await prepareResponsePayload();

      setUploadProgressText(
        "Saving response..."
      );

      const updatedQuery =
        await updateStockQuery(
          selectedQuery.id,
          {
            status: "Answered",
            response_type:
              preparedResponse.responseType,
            response_text:
              preparedResponse.responseText ||
              null,
            response_chart_url:
              preparedResponse.responseChartUrl ||
              null,
            response_video_url:
              preparedResponse.responseVideoUrl ||
              null,
            is_public: false,
          }
        );

      setQueries((previous) =>
        previous.map((item) =>
          item.id ===
          selectedQuery.id
            ? updatedQuery
            : item
        )
      );

      setSuccessMessage(
        `${selectedQuery.stock_name} response saved privately.`
      );

      resetResponsePanel();
    } catch (saveError) {
      console.error(
        "Save response error:",
        saveError
      );

      setError(
        saveError?.message ||
          "Unable to save the response."
      );
    } finally {
      setActionLoading("");
      setUploadProgressText("");
    }
  };

  const publishResponse = async () => {
    if (!selectedQuery) return;

    try {
      setActionLoading(
        selectedQuery.id
      );

      setConfirmation(
        initialConfirmation
      );

      setError("");
      setSuccessMessage("");

      const preparedResponse =
        await prepareResponsePayload();

      setUploadProgressText(
        "Publishing response..."
      );

      const updatedQuery =
        await publishStockQuery(
          selectedQuery.id,
          preparedResponse
        );

      setQueries((previous) =>
        previous.map((item) =>
          item.id ===
          selectedQuery.id
            ? updatedQuery
            : item
        )
      );

      setSuccessMessage(
        `${selectedQuery.stock_name} response published successfully.`
      );

      resetResponsePanel();
    } catch (publishError) {
      console.error(
        "Publish response error:",
        publishError
      );

      setError(
        publishError?.message ||
          "Unable to publish the response."
      );
    } finally {
      setActionLoading("");
      setUploadProgressText("");
    }
  };

  const unpublishResponse = async (
    query
  ) => {
    try {
      setActionLoading(query.id);

      setConfirmation(
        initialConfirmation
      );

      setError("");
      setSuccessMessage("");

      const updatedQuery =
        await unpublishStockQuery(
          query.id
        );

      setQueries((previous) =>
        previous.map((item) =>
          item.id === query.id
            ? updatedQuery
            : item
        )
      );

      setSuccessMessage(
        `${query.stock_name} response unpublished successfully.`
      );
    } catch (unpublishError) {
      console.error(
        "Unpublish error:",
        unpublishError
      );

      setError(
        unpublishError?.message ||
          "Unable to unpublish the response."
      );
    } finally {
      setActionLoading("");
    }
  };

  const deleteQuery = async (query) => {
    try {
      setActionLoading(query.id);

      setConfirmation(
        initialConfirmation
      );

      setError("");
      setSuccessMessage("");

      await deleteStockQuery(query.id);

      setQueries((previous) =>
        previous.filter(
          (item) =>
            item.id !== query.id
        )
      );

      if (
        selectedQuery?.id === query.id
      ) {
        resetResponsePanel();
      }

      setSuccessMessage(
        `${query.stock_name} query deleted successfully.`
      );
    } catch (deleteError) {
      console.error(
        "Delete query error:",
        deleteError
      );

      setError(
        deleteError?.message ||
          "Unable to delete the query."
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleConfirmedAction =
    async () => {
      const {
        type,
        query,
      } = confirmation;

      if (type === "save") {
        await saveResponse();
        return;
      }

      if (type === "publish") {
        await publishResponse();
        return;
      }

      if (
        type === "unpublish" &&
        query
      ) {
        await unpublishResponse(query);
        return;
      }

      if (
        type === "delete" &&
        query
      ) {
        await deleteQuery(query);
      }
    };

  return (
    <section className="stock-queries-page">
      <header className="stock-queries-header">
        <div>
          <h1>Stock Queries</h1>

          <p>
            Review public submissions and
            respond through text, chart
            images, or videos.
          </p>
        </div>

        <button
          type="button"
          className="stock-queries-refresh-btn"
          onClick={loadQueries}
          disabled={loading}
        >
          {loading
            ? "Refreshing..."
            : "↻ Refresh"}
        </button>
      </header>

      <div className="stock-query-stats">
        <article>
          <span>Total</span>
          <strong>{counts.total}</strong>
        </article>

        <article>
          <span>New</span>
          <strong>{counts.new}</strong>
        </article>

        <article>
          <span>Reviewing</span>
          <strong>
            {counts.reviewing}
          </strong>
        </article>

        <article>
          <span>Answered</span>
          <strong>
            {counts.answered}
          </strong>
        </article>

        <article>
          <span>Published</span>
          <strong>
            {counts.published}
          </strong>
        </article>
      </div>

      {error && (
        <div
          className="stock-query-alert stock-query-alert-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          className="stock-query-alert stock-query-alert-success"
          role="status"
        >
          ✓ {successMessage}
        </div>
      )}

      <div className="stock-query-toolbar">
        <input
          type="search"
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(
              event.target.value
            )
          }
          placeholder="Search stock, name or query..."
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="All">
            All statuses
          </option>
          <option value="New">New</option>
          <option value="Reviewing">
            Reviewing
          </option>
          <option value="Answered">
            Answered
          </option>
          <option value="Published">
            Published
          </option>
          <option value="Rejected">
            Rejected
          </option>
        </select>
      </div>

      {loading ? (
        <div className="stock-query-state">
          Loading stock queries...
        </div>
      ) : filteredQueries.length ===
        0 ? (
        <div className="stock-query-state">
          <h3>
            No stock queries found
          </h3>

          <p>
            New public submissions will
            appear here.
          </p>
        </div>
      ) : (
        <div className="stock-query-list">
          {filteredQueries.map(
            (query) => {
              const isWorking =
                actionLoading === query.id;

              return (
                <article
                  key={query.id}
                  className="stock-query-card"
                >
                  <div className="stock-query-card-top">
                    <div>
                      <div className="stock-query-title-row">
                        <h2>
                          {query.stock_name}
                        </h2>

                        <span
                          className={`stock-query-status status-${getStatusClass(
                            query.status
                          )}`}
                        >
                          {query.status ||
                            "New"}
                        </span>

                        {query.is_public && (
                          <span className="stock-query-public-badge">
                            Public
                          </span>
                        )}
                      </div>

                      <p className="stock-query-meta">
                        Submitted by{" "}
                        <strong>
                          {query.name ||
                            "Anonymous"}
                        </strong>
                        {" • "}
                        {query.timeframe ||
                          "Swing"}
                        {" • "}
                        {formatDate(
                          query.created_at
                        )}
                      </p>
                    </div>

                    <select
                      className="stock-query-status-select"
                      value={
                        query.status ||
                        "New"
                      }
                      onChange={(event) =>
                        handleStatusChange(
                          query,
                          event.target.value
                        )
                      }
                      disabled={
                        isWorking ||
                        query.is_public
                      }
                    >
                      <option value="New">
                        New
                      </option>
                      <option value="Reviewing">
                        Reviewing
                      </option>
                      <option value="Answered">
                        Answered
                      </option>
                      <option value="Rejected">
                        Rejected
                      </option>

                      {query.status ===
                        "Published" && (
                        <option value="Published">
                          Published
                        </option>
                      )}
                    </select>
                  </div>

                  <div className="stock-query-question">
                    <span>User Query</span>
                    <p>{query.question}</p>
                  </div>

                  <div className="stock-query-details">
                    <div>
                      <span>Contact</span>
                      <strong>
                        {query.contact ||
                          "Not provided"}
                      </strong>
                    </div>

                    <div>
                      <span>User chart</span>

                      {query.chart_url ? (
                        <a
                          href={
                            query.chart_url
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          View chart
                        </a>
                      ) : (
                        <strong>
                          Not provided
                        </strong>
                      )}
                    </div>

                    <div>
                      <span>
                        Response type
                      </span>

                      <strong>
                        {query.response_type ||
                          "Not added"}
                      </strong>
                    </div>
                  </div>

                  {query.response_text && (
                    <div className="stock-query-existing-response">
                      <span>
                        Current response
                      </span>
                      <p>
                        {
                          query.response_text
                        }
                      </p>
                    </div>
                  )}

                  {query.response_chart_url && (
                    <div className="stock-query-existing-response">
                      <span>
                        Response chart
                      </span>

                      <a
                        href={
                          query.response_chart_url
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        View response chart
                      </a>
                    </div>
                  )}

                  {query.response_video_url && (
                    <div className="stock-query-existing-response">
                      <span>
                        Response video
                      </span>

                      <a
                        href={
                          query.response_video_url
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        View response video
                      </a>
                    </div>
                  )}

                  <div className="stock-query-actions">
                    <button
                      type="button"
                      className="stock-query-primary-btn"
                      onClick={() =>
                        openResponsePanel(
                          query
                        )
                      }
                      disabled={isWorking}
                    >
                      {query.response_type
                        ? "Edit Response"
                        : "Add Response"}
                    </button>

                    {query.is_public && (
                      <button
                        type="button"
                        className="stock-query-secondary-btn"
                        onClick={() =>
                          requestUnpublish(
                            query
                          )
                        }
                        disabled={isWorking}
                      >
                        Unpublish
                      </button>
                    )}

                    <button
                      type="button"
                      className="stock-query-delete-btn"
                      onClick={() =>
                        requestDelete(query)
                      }
                      disabled={isWorking}
                    >
                      {isWorking
                        ? "Please wait..."
                        : "Delete"}
                    </button>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}

      {/* Response modal */}
      {selectedQuery && (
        <div
          className="stock-query-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeResponsePanel();
            }
          }}
        >
          <div className="stock-query-modal">
            <div className="stock-query-modal-header">
              <div>
                <span>
                  Responding to
                </span>

                <h2>
                  {
                    selectedQuery.stock_name
                  }
                </h2>
              </div>

              <button
                type="button"
                className="stock-query-modal-close"
                onClick={
                  closeResponsePanel
                }
                disabled={Boolean(
                  actionLoading
                )}
              >
                ×
              </button>
            </div>

            <div className="stock-query-modal-question">
              <span>User Query</span>
              <p>
                {selectedQuery.question}
              </p>
            </div>

            <div className="stock-query-response-form">
              <div className="stock-query-field">
                <label htmlFor="responseType">
                  Response Type
                </label>

                <select
                  id="responseType"
                  name="responseType"
                  value={
                    responseForm.responseType
                  }
                  onChange={
                    handleResponseChange
                  }
                  disabled={Boolean(
                    actionLoading
                  )}
                >
                  <option value="text">
                    Written response
                  </option>
                  <option value="chart">
                    Chart image
                  </option>
                  <option value="video">
                    Video
                  </option>
                </select>
              </div>

              <div className="stock-query-field">
                <label htmlFor="responseText">
                  Written Explanation
                </label>

                <textarea
                  id="responseText"
                  name="responseText"
                  value={
                    responseForm.responseText
                  }
                  onChange={
                    handleResponseChange
                  }
                  rows={6}
                  placeholder="Add an educational explanation..."
                  disabled={Boolean(
                    actionLoading
                  )}
                />
              </div>

              {responseForm.responseType ===
                "chart" && (
                <div className="stock-query-upload-section">
                  <div className="stock-query-field">
                    <label htmlFor="chartFile">
                      Upload Chart Image
                    </label>

                    <input
                      id="chartFile"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={
                        handleChartFileChange
                      }
                      disabled={Boolean(
                        actionLoading
                      )}
                    />

                    <small>
                      PNG, JPG or WEBP.
                      Maximum 8 MB.
                    </small>

                    {chartFile && (
                      <div className="stock-query-selected-file">
                        Selected:{" "}
                        {chartFile.name}
                      </div>
                    )}
                  </div>

                  <div className="stock-query-or-divider">
                    <span>OR</span>
                  </div>

                  <div className="stock-query-field">
                    <label htmlFor="responseChartUrl">
                      Chart Image URL
                    </label>

                    <input
                      id="responseChartUrl"
                      name="responseChartUrl"
                      type="url"
                      value={
                        responseForm.responseChartUrl
                      }
                      onChange={
                        handleResponseChange
                      }
                      placeholder="Paste the chart image URL"
                      disabled={
                        Boolean(
                          actionLoading
                        ) ||
                        Boolean(chartFile)
                      }
                    />
                  </div>
                </div>
              )}

              {responseForm.responseType ===
                "video" && (
                <div className="stock-query-upload-section">
                  <div className="stock-query-field">
                    <label htmlFor="videoFile">
                      Upload Video
                    </label>

                    <input
                      id="videoFile"
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={
                        handleVideoFileChange
                      }
                      disabled={Boolean(
                        actionLoading
                      )}
                    />

                    <small>
                      MP4, WEBM or MOV.
                      Maximum 100 MB.
                    </small>

                    {videoFile && (
                      <div className="stock-query-selected-file">
                        Selected:{" "}
                        {videoFile.name}
                      </div>
                    )}
                  </div>

                  <div className="stock-query-or-divider">
                    <span>OR</span>
                  </div>

                  <div className="stock-query-field">
                    <label htmlFor="responseVideoUrl">
                      YouTube / Video URL
                    </label>

                    <input
                      id="responseVideoUrl"
                      name="responseVideoUrl"
                      type="url"
                      value={
                        responseForm.responseVideoUrl
                      }
                      onChange={
                        handleResponseChange
                      }
                      placeholder="Paste YouTube or video URL"
                      disabled={
                        Boolean(
                          actionLoading
                        ) ||
                        Boolean(videoFile)
                      }
                    />
                  </div>
                </div>
              )}

              {uploadProgressText && (
                <div className="stock-query-upload-status">
                  {uploadProgressText}
                </div>
              )}

              <div className="stock-query-modal-note">
                Saving keeps the response
                private. Publishing makes
                it visible on the public
                Answered Queries page.
              </div>

              <div className="stock-query-modal-actions">
                <button
                  type="button"
                  className="stock-query-secondary-btn"
                  onClick={
                    requestSaveResponse
                  }
                  disabled={Boolean(
                    actionLoading
                  )}
                >
                  Save as Answered
                </button>

                <button
                  type="button"
                  className="stock-query-primary-btn"
                  onClick={
                    requestPublishResponse
                  }
                  disabled={Boolean(
                    actionLoading
                  )}
                >
                  Publish Response
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom VTKS confirmation modal */}
      {confirmation.open && (
        <div className="vtks-confirm-backdrop">
          <div
            className="vtks-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vtks-confirm-title"
          >
            <div
              className={`vtks-confirm-icon vtks-confirm-icon-${confirmation.type}`}
            >
              {confirmation.type ===
              "delete"
                ? "!"
                : confirmation.type ===
                    "publish"
                  ? "✓"
                  : "?"}
            </div>

            <h2 id="vtks-confirm-title">
              {confirmation.title}
            </h2>

            <p>
              {confirmation.message}
            </p>

            <div className="vtks-confirm-actions">
              <button
                type="button"
                className="vtks-confirm-cancel"
                onClick={
                  closeConfirmation
                }
                disabled={Boolean(
                  actionLoading
                )}
              >
                Cancel
              </button>

              <button
                type="button"
                className={`vtks-confirm-submit vtks-confirm-submit-${confirmation.type}`}
                onClick={
                  handleConfirmedAction
                }
                disabled={Boolean(
                  actionLoading
                )}
              >
                {actionLoading
                  ? "Please wait..."
                  : confirmation.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}