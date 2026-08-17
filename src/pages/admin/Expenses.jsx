import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
  getExpenseStatus,
  calculateExpenseExpiry,
} from "../../services/expenseService";

import "./Expenses.css";

const ITEMS_PER_PAGE = 10;

const todayISO = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatMoney = (value) =>
  `₹${Number(
    value || 0
  ).toLocaleString("en-IN")}`;

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString("en-IN");
};

const EXPENSE_CATEGORIES = [
  "API / Software",
  "Website / Hosting",
  "Domain",
  "Marketing",
  "Data Subscription",
  "Professional Fees",
  "Office",
  "Miscellaneous",
];

const SUBSCRIPTION_TYPES = [
  "One Time",
  "Monthly",
  "Quarterly",
  "Half Yearly",
  "Annual",
  "Custom",
];

const PAYMENT_MODES = [
  "UPI",
  "Card",
  "Bank Transfer",
  "Cash",
  "Other",
];

const buildEmptyForm = () => ({
  expenseDate: todayISO(),

  particulars: "",

  category:
    "Miscellaneous",

  amount: "",

  paymentMode:
    "UPI",

  subscriptionType:
    "One Time",

  expiryDate: "",

  note: "",
});

export default function Expenses() {
  const [
    expenses,
    setExpenses,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    editingExpense,
    setEditingExpense,
  ] = useState(null);

  const [
    form,
    setForm,
  ] = useState(
    buildEmptyForm()
  );

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("All");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    yearFilter,
    setYearFilter,
  ] = useState("All");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  /* =====================================================
     LOAD
  ===================================================== */

  const loadExpenses =
    async () => {
      const rows =
        await getExpenses();

      setExpenses(rows || []);

      return rows || [];
    };

  useEffect(() => {
    const initialise =
      async () => {
        try {
          setLoading(true);
          setError("");

          await loadExpenses();
        } catch (err) {
          console.error(
            "Expenses load error:",
            err
          );

          setError(
            err?.message ||
              "Unable to load expenses."
          );
        } finally {
          setLoading(false);
        }
      };

    initialise();
  }, []);

  /* =====================================================
     STATS
  ===================================================== */

  const stats =
    useMemo(
      () =>
        getExpenseStats(
          expenses
        ),
      [expenses]
    );

  /* =====================================================
     AVAILABLE YEARS
  ===================================================== */

  const availableYears =
    useMemo(() => {
      const values =
        expenses
          .map(
            (expense) =>
              expense.expense_date
                ? String(
                    expense.expense_date
                  ).slice(0, 4)
                : null
          )
          .filter(Boolean);

      return [
        ...new Set(values),
      ].sort(
        (a, b) =>
          Number(b) -
          Number(a)
      );
    }, [expenses]);

  /* =====================================================
     OPEN ADD
  ===================================================== */

  const openAddExpense =
    () => {
      setEditingExpense(
        null
      );

      setForm(
        buildEmptyForm()
      );

      setError("");
      setMessage("");

      setShowModal(true);
    };

  /* =====================================================
     OPEN EDIT
  ===================================================== */

  const openEditExpense =
    (expense) => {
      setEditingExpense(
        expense
      );

      setForm({
        expenseDate:
          expense.expense_date ||
          todayISO(),

        particulars:
          expense.particulars ||
          "",

        category:
          expense.category ||
          "Miscellaneous",

        amount:
          expense.amount || "",

        paymentMode:
          expense.payment_mode ||
          "UPI",

        subscriptionType:
          expense.subscription_type ||
          "One Time",

        expiryDate:
          expense.expiry_date ||
          "",

        note:
          expense.note || "",
      });

      setError("");
      setMessage("");

      setShowModal(true);
    };

  /* =====================================================
     FORM CHANGE
  ===================================================== */

  const handleFormChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      if (
        name ===
        "subscriptionType"
      ) {
        setForm(
          (previous) => {
            let expiryDate =
              previous.expiryDate;

            if (
              value ===
              "One Time"
            ) {
              expiryDate = "";
            } else if (
              value !==
              "Custom"
            ) {
              expiryDate =
                calculateExpenseExpiry(
                  previous.expenseDate,
                  value
                ) || "";
            }

            return {
              ...previous,

              subscriptionType:
                value,

              expiryDate,
            };
          }
        );

        return;
      }

      if (
        name ===
        "expenseDate"
      ) {
        setForm(
          (previous) => {
            let expiryDate =
              previous.expiryDate;

            if (
              previous.subscriptionType !==
                "One Time" &&
              previous.subscriptionType !==
                "Custom"
            ) {
              expiryDate =
                calculateExpenseExpiry(
                  value,
                  previous.subscriptionType
                ) || "";
            }

            return {
              ...previous,

              expenseDate:
                value,

              expiryDate,
            };
          }
        );

        return;
      }

      setForm(
        (previous) => ({
          ...previous,
          [name]:
            value,
        })
      );
    };

  /* =====================================================
     SAVE
  ===================================================== */

  const handleSaveExpense =
    async (event) => {
      event.preventDefault();

      try {
        setSaving(true);
        setError("");
        setMessage("");

        const payload = {
          expenseDate:
            form.expenseDate,

          particulars:
            form.particulars,

          category:
            form.category,

          amount:
            Number(
              form.amount || 0
            ),

          paymentMode:
            form.paymentMode,

          subscriptionType:
            form.subscriptionType,

          expiryDate:
            form.expiryDate ||
            null,

          note:
            form.note,
        };

        if (editingExpense) {
          await updateExpense(
            editingExpense.id,
            payload
          );

          setMessage(
            "Expense updated successfully."
          );
        } else {
          await addExpense(
            payload
          );

          setMessage(
            "Expense added successfully."
          );
        }

        setShowModal(false);
        setEditingExpense(
          null
        );

        await loadExpenses();
      } catch (err) {
        console.error(
          "Save expense error:",
          err
        );

        setError(
          err?.message ||
            "Unable to save expense."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =====================================================
     DELETE
  ===================================================== */

  const handleDeleteExpense =
    async (expense) => {
      const confirmed =
        window.confirm(
          `Delete ${expense.particulars} expense?\n\n${formatMoney(
            expense.amount
          )}`
        );

      if (!confirmed) {
        return;
      }

      try {
        setSaving(true);
        setError("");
        setMessage("");

        await deleteExpense(
          expense.id
        );

        await loadExpenses();

        setMessage(
          "Expense deleted successfully."
        );
      } catch (err) {
        console.error(
          "Delete expense error:",
          err
        );

        setError(
          err?.message ||
            "Unable to delete expense."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =====================================================
     FILTER
  ===================================================== */

  const filteredExpenses =
    useMemo(() => {
      const search =
        searchText
          .trim()
          .toLowerCase();

      return expenses.filter(
        (expense) => {
          const matchesSearch =
            !search ||
            String(
              expense.particulars ||
                ""
            )
              .toLowerCase()
              .includes(search) ||
            String(
              expense.note || ""
            )
              .toLowerCase()
              .includes(search);

          const matchesCategory =
            categoryFilter ===
              "All" ||
            expense.category ===
              categoryFilter;

          const status =
            getExpenseStatus(
              expense
            );

          const matchesStatus =
            statusFilter ===
              "All" ||
            status ===
              statusFilter;

          const expenseYear =
            expense.expense_date
              ? String(
                  expense.expense_date
                ).slice(0, 4)
              : "";

          const matchesYear =
            yearFilter ===
              "All" ||
            expenseYear ===
              yearFilter;

          return (
            matchesSearch &&
            matchesCategory &&
            matchesStatus &&
            matchesYear
          );
        }
      );
    }, [
      expenses,
      searchText,
      categoryFilter,
      statusFilter,
      yearFilter,
    ]);

  /* =====================================================
     FILTERED TOTAL
  ===================================================== */

  const filteredTotal =
    useMemo(
      () =>
        filteredExpenses.reduce(
          (
            total,
            expense
          ) =>
            total +
            Number(
              expense.amount ||
                0
            ),
          0
        ),
      [filteredExpenses]
    );

  /* =====================================================
     SORT
  ===================================================== */

  const sortedExpenses =
    useMemo(
      () =>
        [
          ...filteredExpenses,
        ].sort(
          (a, b) =>
            String(
              b.expense_date ||
                ""
            ).localeCompare(
              String(
                a.expense_date ||
                  ""
              )
            )
        ),
      [filteredExpenses]
    );

  /* =====================================================
     PAGINATION
  ===================================================== */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        sortedExpenses.length /
          ITEMS_PER_PAGE
      )
    );

  const paginatedExpenses =
    useMemo(() => {
      const start =
        (
          currentPage - 1
        ) *
        ITEMS_PER_PAGE;

      return sortedExpenses.slice(
        start,
        start +
          ITEMS_PER_PAGE
      );
    }, [
      sortedExpenses,
      currentPage,
    ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchText,
    categoryFilter,
    statusFilter,
    yearFilter,
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
      setCategoryFilter(
        "All"
      );
      setStatusFilter(
        "All"
      );
      setYearFilter(
        "All"
      );
    };

  if (loading) {
    return (
      <section className="expenses-page">
        Loading Expenses...
      </section>
    );
  }

  return (
    <section className="expenses-page">

      {/* HEADER */}

      <div className="expenses-topbar">

        <div>
          <h1>
            VTKS Expenses
          </h1>

          <p>
            Track operating costs, subscriptions and upcoming renewals.
          </p>
        </div>

        <button
          type="button"
          className="expenses-primary-btn"
          onClick={
            openAddExpense
          }
        >
          + Add Expense
        </button>

      </div>

      {message && (
        <div className="expenses-message success">
          {message}
        </div>
      )}

      {error && (
        <div className="expenses-message error">
          {error}
        </div>
      )}

      {/* SUMMARY */}

      <div className="expenses-stats">

        <ExpenseStatCard
          label="Total Expenses"
          value={formatMoney(
            stats.totalExpenses
          )}
        />

        <ExpenseStatCard
          label="This Month"
          value={formatMoney(
            stats.thisMonthExpenses
          )}
        />

        <ExpenseStatCard
          label="This Year"
          value={formatMoney(
            stats.thisYearExpenses
          )}
        />

        <ExpenseStatCard
          label="Expiring Soon"
          value={
            stats.expiringSoon
          }
        />

        <ExpenseStatCard
          label="Active Subscriptions"
          value={
            stats.activeSubscriptions
          }
        />

        <ExpenseStatCard
          label="Total Records"
          value={
            stats.totalRecords
          }
        />

      </div>

      {/* PANEL */}

      <section className="expenses-panel">

        <div className="expenses-panel-head">

          <div>
            <h2>
              Expense Details
            </h2>

            <p>
              Manage VTKS operational and recurring expenses.
            </p>
          </div>

        </div>

        {/* FILTERS */}

        <div className="expenses-filters">

          <input
            type="text"
            placeholder="Search expense or note..."
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

          <select
            value={
              categoryFilter
            }
            onChange={(
              event
            ) =>
              setCategoryFilter(
                event.target
                  .value
              )
            }
          >
            <option value="All">
              All Categories
            </option>

            {EXPENSE_CATEGORIES.map(
              (category) => (
                <option
                  key={
                    category
                  }
                  value={
                    category
                  }
                >
                  {category}
                </option>
              )
            )}
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

            <option value="Expired">
              Expired
            </option>

            <option value="One Time">
              One Time
            </option>
          </select>

          <select
            value={
              yearFilter
            }
            onChange={(
              event
            ) =>
              setYearFilter(
                event.target
                  .value
              )
            }
          >
            <option value="All">
              All Years
            </option>

            {availableYears.map(
              (year) => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              )
            )}
          </select>

          <button
            type="button"
            className="expenses-clear-btn"
            onClick={
              clearFilters
            }
          >
            Clear
          </button>

        </div>

        {/* FILTER SUMMARY */}

        <div className="expenses-filter-summary">

          <span>
            Showing{" "}
            <strong>
              {
                sortedExpenses.length
              }
            </strong>{" "}
            expense records
          </span>

          <span>
            Filtered Total:{" "}
            <strong>
              {formatMoney(
                filteredTotal
              )}
            </strong>
          </span>

        </div>

        {/* TABLE */}

        <div className="expenses-table-wrap">

          <table className="expenses-table">

            <thead>
              <tr>
                <th>Date</th>
                <th>
                  Particulars
                </th>
                <th>
                  Category
                </th>
                <th>
                  Amount
                </th>
                <th>
                  Payment
                </th>
                <th>
                  Subscription
                </th>
                <th>
                  Expiry
                </th>
                <th>
                  Status
                </th>
                <th>
                  Note
                </th>
                <th>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>

              {paginatedExpenses.map(
                (expense) => {
                  const status =
                    getExpenseStatus(
                      expense
                    );

                  return (
                    <tr
                      key={
                        expense.id
                      }
                    >

                      <td>
                        {formatDate(
                          expense.expense_date
                        )}
                      </td>

                      <td>
                        <strong>
                          {
                            expense.particulars
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          expense.category
                        }
                      </td>

                      <td>
                        <strong>
                          {formatMoney(
                            expense.amount
                          )}
                        </strong>
                      </td>

                      <td>
                        {
                          expense.payment_mode ||
                          "-"
                        }
                      </td>

                      <td>
                        {
                          expense.subscription_type ||
                          "One Time"
                        }
                      </td>

                      <td>
                        {formatDate(
                          expense.expiry_date
                        )}
                      </td>

                      <td>
                        <ExpenseStatusBadge
                          value={
                            status
                          }
                        />
                      </td>

                      <td>
                        {
                          expense.note ||
                          "-"
                        }
                      </td>

                      <td>

                        <div className="expenses-actions">

                          <button
                            type="button"
                            className="expenses-edit-btn"
                            onClick={() =>
                              openEditExpense(
                                expense
                              )
                            }
                          >
                            ✏ Edit
                          </button>

                          <button
                            type="button"
                            className="expenses-delete-btn"
                            disabled={
                              saving
                            }
                            onClick={() =>
                              handleDeleteExpense(
                                expense
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

              {paginatedExpenses.length ===
                0 && (
                <tr>
                  <td
                    colSpan="10"
                    className="expenses-empty"
                  >
                    No expense records found.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

        {/* PAGINATION */}

        <div className="expenses-pagination">

          <span>
            Showing{" "}

            {sortedExpenses.length ===
            0
              ? 0
              : (
                  currentPage -
                  1
                ) *
                  ITEMS_PER_PAGE +
                1}

            {" – "}

            {Math.min(
              currentPage *
                ITEMS_PER_PAGE,
              sortedExpenses.length
            )}

            {" of "}

            {
              sortedExpenses.length
            }
          </span>

          <div>

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

            <strong>
              Page{" "}
              {currentPage}{" "}
              of{" "}
              {totalPages}
            </strong>

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

      {/* ADD / EDIT MODAL */}

      {showModal && (
        <ExpenseModal
          title={
            editingExpense
              ? "Edit Expense"
              : "Add Expense"
          }
          onClose={() =>
            setShowModal(
              false
            )
          }
        >

          <form
            className="expenses-form"
            onSubmit={
              handleSaveExpense
            }
          >

            <ExpenseInput
              label="Expense Date"
              type="date"
              name="expenseDate"
              value={
                form.expenseDate
              }
              onChange={
                handleFormChange
              }
              required
            />

            <ExpenseInput
              label="Particulars"
              name="particulars"
              value={
                form.particulars
              }
              onChange={
                handleFormChange
              }
              placeholder="Example: Dhan API"
              required
            />

            <ExpenseSelect
              label="Category"
              name="category"
              value={
                form.category
              }
              onChange={
                handleFormChange
              }
              options={
                EXPENSE_CATEGORIES
              }
            />

            <ExpenseInput
              label="Amount"
              type="number"
              name="amount"
              min="0"
              step="0.01"
              value={
                form.amount
              }
              onChange={
                handleFormChange
              }
              required
            />

            <ExpenseSelect
              label="Payment Mode"
              name="paymentMode"
              value={
                form.paymentMode
              }
              onChange={
                handleFormChange
              }
              options={
                PAYMENT_MODES
              }
            />

            <ExpenseSelect
              label="Subscription Type"
              name="subscriptionType"
              value={
                form.subscriptionType
              }
              onChange={
                handleFormChange
              }
              options={
                SUBSCRIPTION_TYPES
              }
            />

            <ExpenseInput
              label="Expiry / Renewal Date"
              type="date"
              name="expiryDate"
              value={
                form.expiryDate
              }
              onChange={
                handleFormChange
              }
              disabled={
                form.subscriptionType ===
                "One Time"
              }
              readOnly={
                form.subscriptionType !==
                  "Custom" &&
                form.subscriptionType !==
                  "One Time"
              }
            />

            <label className="expenses-field expenses-note-field">

              <span>
                Note
              </span>

              <textarea
                name="note"
                rows="4"
                value={
                  form.note
                }
                onChange={
                  handleFormChange
                }
                placeholder="Optional note..."
              />

            </label>

            <div className="expenses-form-actions">

              <button
                type="button"
                className="expenses-secondary-btn"
                onClick={() =>
                  setShowModal(
                    false
                  )
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="expenses-primary-btn"
                disabled={
                  saving
                }
              >
                {saving
                  ? "Saving..."
                  : editingExpense
                  ? "Save Changes"
                  : "Add Expense"}
              </button>

            </div>

          </form>

        </ExpenseModal>
      )}

    </section>
  );
}

/* =====================================================
   STAT CARD
===================================================== */

function ExpenseStatCard({
  label,
  value,
}) {
  return (
    <article className="expenses-stat-card">

      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>

    </article>
  );
}

/* =====================================================
   STATUS BADGE
===================================================== */

function ExpenseStatusBadge({
  value,
}) {
  const normalized =
    String(
      value || ""
    )
      .toLowerCase()
      .replaceAll(" ", "-");

  return (
    <span
      className={`expenses-status-badge ${normalized}`}
    >
      {value}
    </span>
  );
}

/* =====================================================
   INPUT
===================================================== */

function ExpenseInput({
  label,
  ...props
}) {
  return (
    <label className="expenses-field">

      <span>
        {label}
      </span>

      <input
        {...props}
      />

    </label>
  );
}

/* =====================================================
   SELECT
===================================================== */

function ExpenseSelect({
  label,
  options,
  ...props
}) {
  return (
    <label className="expenses-field">

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

/* =====================================================
   MODAL
===================================================== */

function ExpenseModal({
  title,
  children,
  onClose,
}) {
  return (
    <div className="expenses-modal-backdrop">

      <div className="expenses-modal">

        <div className="expenses-modal-header">

          <h2>
            {title}
          </h2>

          <button
            type="button"
            onClick={
              onClose
            }
          >
            ×
          </button>

        </div>

        <div className="expenses-modal-body">
          {children}
        </div>

      </div>

    </div>
  );
}