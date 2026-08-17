import { supabase } from "../lib/supabase";

/* =====================================================
   HELPERS
===================================================== */

const cleanText = (value) =>
  String(value ?? "").trim();

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

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

const addDays = (dateString, days) => {
  if (!dateString) return null;

  const date = new Date(
    `${dateString}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setDate(
    date.getDate() + Number(days || 0)
  );

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/* =====================================================
   SUBSCRIPTION DAYS
===================================================== */

export const getExpenseSubscriptionDays = (
  subscriptionType
) => {
  const type = cleanText(
    subscriptionType
  ).toLowerCase();

  if (type === "monthly") return 30;
  if (type === "quarterly") return 90;
  if (type === "half yearly") return 182;
  if (type === "annual") return 365;

  return 0;
};

/* =====================================================
   AUTO EXPIRY
===================================================== */

export const calculateExpenseExpiry = (
  expenseDate,
  subscriptionType
) => {
  const days =
    getExpenseSubscriptionDays(
      subscriptionType
    );

  if (!expenseDate || !days) {
    return null;
  }

  return addDays(
    expenseDate,
    days
  );
};

/* =====================================================
   GET ALL EXPENSES
===================================================== */

export const getExpenses = async () => {
  const { data, error } =
    await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", {
        ascending: false,
      })
      .order("id", {
        ascending: false,
      });

  if (error) {
    console.error(
      "getExpenses error:",
      error
    );

    throw error;
  }

  return data || [];
};

/* =====================================================
   ADD EXPENSE
===================================================== */

export const addExpense = async (
  expense
) => {
  const expenseDate =
    expense.expenseDate ||
    todayISO();

  const subscriptionType =
    cleanText(
      expense.subscriptionType
    ) || "One Time";

  let expiryDate =
    expense.expiryDate || null;

  if (
    subscriptionType.toLowerCase() !==
      "one time" &&
    subscriptionType.toLowerCase() !==
      "custom"
  ) {
    expiryDate =
      calculateExpenseExpiry(
        expenseDate,
        subscriptionType
      );
  }

  if (
    subscriptionType.toLowerCase() ===
    "one time"
  ) {
    expiryDate = null;
  }

  const payload = {
    expense_date: expenseDate,

    particulars:
      cleanText(
        expense.particulars
      ),

    category:
      cleanText(
        expense.category
      ) || "Miscellaneous",

    amount:
      toNumber(
        expense.amount
      ),

    payment_mode:
      cleanText(
        expense.paymentMode
      ) || null,

    subscription_type:
      subscriptionType,

    expiry_date:
      expiryDate,

    note:
      cleanText(
        expense.note
      ) || null,

    updated_at:
      new Date().toISOString(),
  };

  if (!payload.particulars) {
    throw new Error(
      "Particulars is required."
    );
  }

  if (
    !payload.amount ||
    payload.amount < 0
  ) {
    throw new Error(
      "Valid amount is required."
    );
  }

  const { data, error } =
    await supabase
      .from("expenses")
      .insert([payload])
      .select("*")
      .single();

  if (error) {
    console.error(
      "addExpense error:",
      error
    );

    throw error;
  }

  return data;
};

/* =====================================================
   UPDATE EXPENSE
===================================================== */

export const updateExpense = async (
  id,
  expense
) => {
  if (!id) {
    throw new Error(
      "Expense ID is required."
    );
  }

  const expenseDate =
    expense.expenseDate;

  const subscriptionType =
    cleanText(
      expense.subscriptionType
    ) || "One Time";

  let expiryDate =
    expense.expiryDate || null;

  if (
    subscriptionType.toLowerCase() !==
      "one time" &&
    subscriptionType.toLowerCase() !==
      "custom"
  ) {
    expiryDate =
      calculateExpenseExpiry(
        expenseDate,
        subscriptionType
      );
  }

  if (
    subscriptionType.toLowerCase() ===
    "one time"
  ) {
    expiryDate = null;
  }

  const payload = {
    expense_date:
      expenseDate,

    particulars:
      cleanText(
        expense.particulars
      ),

    category:
      cleanText(
        expense.category
      ) || "Miscellaneous",

    amount:
      toNumber(
        expense.amount
      ),

    payment_mode:
      cleanText(
        expense.paymentMode
      ) || null,

    subscription_type:
      subscriptionType,

    expiry_date:
      expiryDate,

    note:
      cleanText(
        expense.note
      ) || null,

    updated_at:
      new Date().toISOString(),
  };

  if (!payload.particulars) {
    throw new Error(
      "Particulars is required."
    );
  }

  const { data, error } =
    await supabase
      .from("expenses")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

  if (error) {
    console.error(
      "updateExpense error:",
      error
    );

    throw error;
  }

  return data;
};

/* =====================================================
   DELETE EXPENSE
===================================================== */

export const deleteExpense = async (
  id
) => {
  if (!id) {
    throw new Error(
      "Expense ID is required."
    );
  }

  const { error } =
    await supabase
      .from("expenses")
      .delete()
      .eq("id", id);

  if (error) {
    console.error(
      "deleteExpense error:",
      error
    );

    throw error;
  }

  return true;
};

/* =====================================================
   EXPIRY STATUS
===================================================== */

export const getExpenseStatus = (
  expense
) => {
  if (
    !expense?.expiry_date
  ) {
    return "One Time";
  }

  const today =
    new Date(
      `${todayISO()}T00:00:00`
    );

  const expiry =
    new Date(
      `${expense.expiry_date}T00:00:00`
    );

  if (expiry < today) {
    return "Expired";
  }

  const diffDays = Math.floor(
    (
      expiry.getTime() -
      today.getTime()
    ) /
      86400000
  );

  if (diffDays <= 30) {
    return "Expiring Soon";
  }

  return "Active";
};

/* =====================================================
   DASHBOARD STATS
===================================================== */

export const getExpenseStats = (
  expenses = []
) => {
  const today = new Date();

  const currentMonth =
    today.getMonth();

  const currentYear =
    today.getFullYear();

  let totalExpenses = 0;
  let thisMonthExpenses = 0;
  let thisYearExpenses = 0;
  let expiringSoon = 0;
  let activeSubscriptions = 0;

  expenses.forEach(
    (expense) => {
      const amount =
        toNumber(
          expense.amount
        );

      totalExpenses += amount;

      if (
        expense.expense_date
      ) {
        const date =
          new Date(
            `${expense.expense_date}T00:00:00`
          );

        if (
          date.getFullYear() ===
          currentYear
        ) {
          thisYearExpenses +=
            amount;

          if (
            date.getMonth() ===
            currentMonth
          ) {
            thisMonthExpenses +=
              amount;
          }
        }
      }

      const status =
        getExpenseStatus(
          expense
        );

      if (
        status ===
        "Expiring Soon"
      ) {
        expiringSoon += 1;
      }

      if (
        status === "Active" ||
        status ===
          "Expiring Soon"
      ) {
        activeSubscriptions += 1;
      }
    }
  );

  return {
    totalExpenses,
    thisMonthExpenses,
    thisYearExpenses,
    expiringSoon,
    activeSubscriptions,
    totalRecords:
      expenses.length,
  };
};