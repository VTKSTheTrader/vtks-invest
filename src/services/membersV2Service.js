import { supabase } from "../lib/supabase";

/* =========================================================
   HELPERS
========================================================= */

const cleanText = (value) =>
  String(value ?? "").trim();

const normalizeEmail = (value) =>
  cleanText(value).toLowerCase();

const nullableText = (value) => {
  const cleaned = cleanText(value);
  return cleaned || null;
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? number
    : 0;
};

/* =========================================================
   INDIA DATE

   Important:
   Do not use UTC date for membership calculations.
========================================================= */

const todayISO = () => {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(new Date());
};

/* =========================================================
   DATE DIFFERENCE
========================================================= */

const daysBetween = (
  fromDate,
  toDate
) => {
  if (!fromDate || !toDate) {
    return null;
  }

  const from = new Date(
    `${fromDate}T00:00:00`
  );

  const to = new Date(
    `${toDate}T00:00:00`
  );

  return Math.floor(
    (
      to.getTime() -
      from.getTime()
    ) /
      86400000
  );
};

/* =========================================================
   DYNAMIC SUBSCRIPTION STATUS

   Upcoming
   Active
   Expiring Soon
   Expired
========================================================= */

export const getSubscriptionStatusV2 = (
  subscription,
  today = todayISO()
) => {
  if (!subscription) {
    return "Expired";
  }

  const startDate =
    subscription.start_date;

  const expiryDate =
    subscription.expiry_date;

  if (
    !startDate ||
    !expiryDate
  ) {
    return "Expired";
  }

  /*
    Subscription has not started yet.
  */

  if (startDate > today) {
    return "Upcoming";
  }

  /*
    Subscription has already ended.
  */

  if (expiryDate < today) {
    return "Expired";
  }

  const remainingDays =
    daysBetween(
      today,
      expiryDate
    );

  /*
    Still valid, but expires within 7 days.
  */

  if (
    remainingDays !== null &&
    remainingDays >= 0 &&
    remainingDays <= 7
  ) {
    return "Expiring Soon";
  }

  return "Active";
};

/* =========================================================
   SORT SUBSCRIPTIONS

   Latest start first.
   If same start date, highest ID first.
========================================================= */

const sortNewestFirst = (
  subscriptions = []
) => {
  return [...subscriptions].sort(
    (a, b) => {
      const startCompare =
        String(
          b.start_date || ""
        ).localeCompare(
          String(
            a.start_date || ""
          )
        );

      if (startCompare !== 0) {
        return startCompare;
      }

      return (
        Number(b.id || 0) -
        Number(a.id || 0)
      );
    }
  );
};

/* =========================================================
   FIND EFFECTIVE SUBSCRIPTION

   Priority:

   1. Currently running subscription
   2. Nearest upcoming subscription
   3. Most recently expired subscription
========================================================= */

export const getEffectiveSubscriptionV2 = (
  subscriptions = []
) => {
  if (!subscriptions.length) {
    return null;
  }

  const today =
    todayISO();

  const normalized =
    sortNewestFirst(
      subscriptions
    ).map((subscription) => ({
      ...subscription,

      calculated_status:
        getSubscriptionStatusV2(
          subscription,
          today
        ),
    }));

  /*
    First priority:
    subscription valid TODAY.

    If two overlap, newest start wins.
  */

  const current =
    normalized.find(
      (subscription) =>
        subscription.calculated_status ===
          "Active" ||
        subscription.calculated_status ===
          "Expiring Soon"
    );

  if (current) {
    return current;
  }

  /*
    Second priority:
    nearest FUTURE subscription.
  */

  const upcoming =
    normalized
      .filter(
        (subscription) =>
          subscription.calculated_status ===
          "Upcoming"
      )
      .sort((a, b) => {
        const dateCompare =
          String(
            a.start_date
          ).localeCompare(
            String(
              b.start_date
            )
          );

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return (
          Number(a.id || 0) -
          Number(b.id || 0)
        );
      })[0];

  if (upcoming) {
    return upcoming;
  }

  /*
    Otherwise show latest historical subscription.
  */

  return normalized[0];
};

/* =========================================================
   MEMBERS
========================================================= */

export const getMembersV2 =
  async () => {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "members_v2"
        )
        .select("*")
        .order(
          "id",
          {
            ascending: false,
          }
        );

    if (error) {
      console.error(
        "getMembersV2 error:",
        error
      );

      throw error;
    }

    return data || [];
  };

/* =========================================================
   FIND MEMBER BY EMAIL
========================================================= */

export const findMemberByEmailV2 =
  async (email) => {
    const normalizedEmail =
      normalizeEmail(email);

    if (!normalizedEmail) {
      return null;
    }

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "members_v2"
        )
        .select("*")
        .eq(
          "email",
          normalizedEmail
        )
        .maybeSingle();

    if (error) {
      console.error(
        "findMemberByEmailV2 error:",
        error
      );

      throw error;
    }

    return data || null;
  };

/* =========================================================
   CREATE MEMBER
========================================================= */

export const createMemberV2 =
  async ({
    name,
    email,
    mobile,
    tvId,
  }) => {
    const normalizedEmail =
      normalizeEmail(email);

    if (!cleanText(name)) {
      throw new Error(
        "Member name is required."
      );
    }

    if (!normalizedEmail) {
      throw new Error(
        "Email is required."
      );
    }

    const existing =
      await findMemberByEmailV2(
        normalizedEmail
      );

    if (existing) {
      return existing;
    }

    const payload = {
      name:
        cleanText(name),

      email:
        normalizedEmail,

      mobile:
        nullableText(
          mobile
        ),

      tv_id:
        nullableText(
          tvId
        ),

      updated_at:
        new Date()
          .toISOString(),
    };

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "members_v2"
        )
        .insert([
          payload,
        ])
        .select("*")
        .single();

    if (error) {
      console.error(
        "createMemberV2 error:",
        error
      );

      throw error;
    }

    return data;
  };

/* =========================================================
   UPDATE MEMBER PROFILE
========================================================= */

export const updateMemberV2 =
  async (
    memberId,
    updates
  ) => {
    if (!memberId) {
      throw new Error(
        "Member ID is required."
      );
    }

    const payload = {
      name:
        cleanText(
          updates.name
        ),

      email:
        normalizeEmail(
          updates.email
        ),

      mobile:
        nullableText(
          updates.mobile
        ),

      tv_id:
        nullableText(
          updates.tvId ??
            updates.tv_id
        ),

      updated_at:
        new Date()
          .toISOString(),
    };

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "members_v2"
        )
        .update(payload)
        .eq(
          "id",
          memberId
        )
        .select("*")
        .single();

    if (error) {
      console.error(
        "updateMemberV2 error:",
        error
      );

      throw error;
    }

    return data;
  };

/* =========================================================
   ALL SUBSCRIPTIONS
========================================================= */

export const getSubscriptionsV2 =
  async () => {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "member_subscriptions_v2"
        )
        .select(`
          *,
          member:members_v2 (
            id,
            name,
            email,
            mobile,
            tv_id
          )
        `)
        .order(
          "start_date",
          {
            ascending: false,
          }
        )
        .order(
          "id",
          {
            ascending: false,
          }
        );

    if (error) {
      console.error(
        "getSubscriptionsV2 error:",
        error
      );

      throw error;
    }

    return data || [];
  };

/* =========================================================
   MEMBER HISTORY
========================================================= */

export const getMemberHistoryV2 =
  async (
    memberId
  ) => {
    if (!memberId) {
      return [];
    }

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "member_subscriptions_v2"
        )
        .select("*")
        .eq(
          "member_id",
          memberId
        )
        .order(
          "start_date",
          {
            ascending: false,
          }
        )
        .order(
          "id",
          {
            ascending: false,
          }
        );

    if (error) {
      console.error(
        "getMemberHistoryV2 error:",
        error
      );

      throw error;
    }

    return (
      data || []
    ).map(
      (subscription) => ({
        ...subscription,

        calculated_status:
          getSubscriptionStatusV2(
            subscription
          ),
      })
    );
  };

/* =========================================================
   LATEST CREATED/FUTURE SUBSCRIPTION

   Used when necessary for history,
   NOT for deciding whether member
   is active today.
========================================================= */

export const getLatestSubscriptionV2 =
  async (
    memberId
  ) => {
    if (!memberId) {
      return null;
    }

    const history =
      await getMemberHistoryV2(
        memberId
      );

    return (
      history[0] ||
      null
    );
  };

/* =========================================================
   CREATE SUBSCRIPTION
========================================================= */

export const createSubscriptionV2 =
  async ({
    memberId,
    plan,
    startDate,
    expiryDate,
    amount,
    settlementStatus =
      "Pending",
    paymentDate = null,
    isRenewal = false,
  }) => {
    if (!memberId) {
      throw new Error(
        "Member ID is required."
      );
    }

    if (!cleanText(plan)) {
      throw new Error(
        "Plan is required."
      );
    }

    if (!startDate) {
      throw new Error(
        "Start date is required."
      );
    }

    if (!expiryDate) {
      throw new Error(
        "Expiry date is required."
      );
    }

    if (
      expiryDate <
      startDate
    ) {
      throw new Error(
        "Expiry date cannot be before start date."
      );
    }

    /*
      Stored status is useful for reference,
      but all dashboards use calculated status.
    */

    const calculatedStatus =
      getSubscriptionStatusV2({
        start_date:
          startDate,

        expiry_date:
          expiryDate,
      });

    const payload = {
      member_id:
        memberId,

      plan:
        cleanText(plan),

      start_date:
        startDate,

      expiry_date:
        expiryDate,

      amount:
        toNumber(
          amount
        ),

      subscription_status:
        calculatedStatus,

      settlement_status:
        settlementStatus,

      payment_date:
        paymentDate ||
        null,

      is_renewal:
        Boolean(
          isRenewal
        ),

      updated_at:
        new Date()
          .toISOString(),
    };

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "member_subscriptions_v2"
        )
        .insert([
          payload,
        ])
        .select("*")
        .single();

    if (error) {
      console.error(
        "createSubscriptionV2 error:",
        error
      );

      throw error;
    }

    return data;
  };

/* =========================================================
   RENEW MEMBER

   IMPORTANT FIX:

   DO NOT expire previous subscription
   when renewal is created.

   Example:

   Existing Quarterly:
   10 May → 16 Aug

   Renewal Annual:
   17 Aug → 17 Aug next year

   On 16 Aug:
   Quarterly remains valid.
   Annual = Upcoming.

   On 17 Aug:
   Quarterly becomes Expired automatically.
   Annual becomes Active automatically.
========================================================= */

export const renewMemberV2 =
  async ({
    memberId,
    plan,
    startDate,
    expiryDate,
    amount,
    settlementStatus =
      "Pending",
    paymentDate = null,
  }) => {
    if (!memberId) {
      throw new Error(
        "Member ID is required."
      );
    }

    return await createSubscriptionV2({
      memberId,

      plan,

      startDate,

      expiryDate,

      amount,

      settlementStatus,

      paymentDate,

      isRenewal: true,
    });
  };

/* =========================================================
   CREATE MEMBER + FIRST SUBSCRIPTION

   EXISTING EMAIL = RENEWAL
========================================================= */

export const createMemberWithSubscriptionV2 =
  async ({
    name,
    email,
    mobile,
    tvId,

    plan,
    startDate,
    expiryDate,
    amount,

    settlementStatus =
      "Pending",

    paymentDate = null,
  }) => {
    const existingMember =
      await findMemberByEmailV2(
        email
      );

    /*
      Existing member:
      DO NOT create another member.
    */

    if (existingMember) {
      const subscription =
        await renewMemberV2({
          memberId:
            existingMember.id,

          plan,

          startDate,

          expiryDate,

          amount,

          settlementStatus,

          paymentDate,
        });

      return {
        member:
          existingMember,

        subscription,

        type:
          "renewal",
      };
    }

    /*
      Brand new member.
    */

    const member =
      await createMemberV2({
        name,
        email,
        mobile,
        tvId,
      });

    const subscription =
      await createSubscriptionV2({
        memberId:
          member.id,

        plan,

        startDate,

        expiryDate,

        amount,

        settlementStatus,

        paymentDate,

        isRenewal: false,
      });

    return {
      member,
      subscription,
      type: "new",
    };
  };

/* =========================================================
   UPDATE SETTLEMENT
========================================================= */

export const updateSettlementStatusV2 =
  async (
    subscriptionId,
    status
  ) => {
    if (!subscriptionId) {
      throw new Error(
        "Subscription ID is required."
      );
    }

    const payload = {
      settlement_status:
        status,

      payment_date:
        String(
          status
        ).toLowerCase() ===
        "settled"
          ? todayISO()
          : null,

      updated_at:
        new Date()
          .toISOString(),
    };

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "member_subscriptions_v2"
        )
        .update(payload)
        .eq(
          "id",
          subscriptionId
        )
        .select("*")
        .single();

    if (error) {
      console.error(
        "updateSettlementStatusV2 error:",
        error
      );

      throw error;
    }

    return data;
  };

/* =========================================================
   BUILD MEMBER STATE
========================================================= */

const buildMemberState = (
  history
) => {
  const normalizedHistory =
    sortNewestFirst(
      history
    ).map(
      (subscription) => ({
        ...subscription,

        calculated_status:
          getSubscriptionStatusV2(
            subscription
          ),
      })
    );

  const effective =
    getEffectiveSubscriptionV2(
      normalizedHistory
    );

  const today =
    todayISO();

  const activeSubscription =
    normalizedHistory.find(
      (subscription) =>
        subscription.start_date <=
          today &&
        subscription.expiry_date >=
          today
    );

  const upcomingSubscription =
    normalizedHistory
      .filter(
        (subscription) =>
          subscription.start_date >
          today
      )
      .sort(
        (a, b) =>
          String(
            a.start_date
          ).localeCompare(
            String(
              b.start_date
            )
          )
      )[0] ||
    null;

  return {
    history:
      normalizedHistory,

    effective,

    activeSubscription,

    upcomingSubscription,
  };
};

/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

export const getMemberDashboardStatsV2 =
  async () => {
    const [
      members,
      subscriptions,
    ] =
      await Promise.all([
        getMembersV2(),
        getSubscriptionsV2(),
      ]);

    /*
      Group subscriptions by member.
    */

    const subscriptionsByMember =
      new Map();

    for (
      const subscription of
        subscriptions
    ) {
      const memberId =
        subscription.member_id;

      if (
        !subscriptionsByMember.has(
          memberId
        )
      ) {
        subscriptionsByMember.set(
          memberId,
          []
        );
      }

      subscriptionsByMember
        .get(memberId)
        .push(
          subscription
        );
    }

    const memberStates =
      members.map(
        (member) => {
          const history =
            subscriptionsByMember.get(
              member.id
            ) || [];

          return {
            member,
            ...buildMemberState(
              history
            ),
          };
        }
      );

    /* =====================================================
       STATUS COUNTS
    ===================================================== */

    const activeMembers =
      memberStates.filter(
        (item) =>
          item.effective
            ?.calculated_status ===
          "Active"
      );

    const expiringSoonMembers =
      memberStates.filter(
        (item) =>
          item.effective
            ?.calculated_status ===
          "Expiring Soon"
      );

    /*
      Upcoming means:
      no current subscription,
      but future subscription exists.
    */

    const upcomingMembers =
      memberStates.filter(
        (item) =>
          !item.activeSubscription &&
          item.upcomingSubscription
      );

    const expiredMembers =
      memberStates.filter(
        (item) =>
          !item.activeSubscription &&
          !item.upcomingSubscription
      );

    /* =====================================================
       REVENUE
    ===================================================== */

    const lifetimeRevenue =
      subscriptions.reduce(
        (
          sum,
          subscription
        ) =>
          sum +
          toNumber(
            subscription.amount
          ),
        0
      );

    const settledRevenue =
      subscriptions
        .filter(
          (subscription) =>
            String(
              subscription
                .settlement_status
            ).toLowerCase() ===
            "settled"
        )
        .reduce(
          (
            sum,
            subscription
          ) =>
            sum +
            toNumber(
              subscription.amount
            ),
          0
        );

    const pendingRevenue =
      subscriptions
        .filter(
          (subscription) =>
            String(
              subscription
                .settlement_status
            ).toLowerCase() ===
            "pending"
        )
        .reduce(
          (
            sum,
            subscription
          ) =>
            sum +
            toNumber(
              subscription.amount
            ),
          0
        );

    /* =====================================================
       PLAN COUNTS

       Count effective membership plan.

       If active membership exists:
       count active plan.

       If no active membership but upcoming exists:
       count upcoming plan.

       Expired-only members are not included.
    ===================================================== */

    const planSubscriptions =
      memberStates
        .map(
          (item) => {
            if (
              item.activeSubscription
            ) {
              return (
                getEffectiveSubscriptionV2(
                  item.history
                )
              );
            }

            return (
              item.upcomingSubscription ||
              null
            );
          }
        )
        .filter(Boolean);

    const annualPlans =
      planSubscriptions.filter(
        (subscription) =>
          String(
            subscription.plan
          ).toLowerCase() ===
          "annual"
      ).length;

    const quarterlyPlans =
      planSubscriptions.filter(
        (subscription) =>
          String(
            subscription.plan
          ).toLowerCase() ===
          "quarterly"
      ).length;

    const monthlyPlans =
      planSubscriptions.filter(
        (subscription) =>
          String(
            subscription.plan
          ).toLowerCase() ===
          "monthly"
      ).length;

    return {
      totalMembers:
        members.length,

      activeMembers:
        activeMembers.length,

      expiringSoonMembers:
        expiringSoonMembers.length,

      upcomingMembers:
        upcomingMembers.length,

      expiredMembers:
        expiredMembers.length,

      lifetimeRevenue,

      settledRevenue,

      pendingRevenue,

      annualPlans,

      quarterlyPlans,

      monthlyPlans,

      subscriptionsCount:
        subscriptions.length,
    };
  };

/* =========================================================
   MEMBER SUMMARY

   One row per unique member.
========================================================= */

export const getMemberSummaryV2 =
  async () => {
    const [
      members,
      subscriptions,
    ] =
      await Promise.all([
        getMembersV2(),
        getSubscriptionsV2(),
      ]);

    const subscriptionsByMember =
      new Map();

    for (
      const subscription of
        subscriptions
    ) {
      const memberId =
        subscription.member_id;

      if (
        !subscriptionsByMember.has(
          memberId
        )
      ) {
        subscriptionsByMember.set(
          memberId,
          []
        );
      }

      subscriptionsByMember
        .get(memberId)
        .push(
          subscription
        );
    }

    return members.map(
      (member) => {
        const rawHistory =
          subscriptionsByMember.get(
            member.id
          ) || [];

        const {
          history,
          effective,
          activeSubscription,
          upcomingSubscription,
        } =
          buildMemberState(
            rawHistory
          );

        const lifetimeRevenue =
          history.reduce(
            (
              sum,
              subscription
            ) =>
              sum +
              toNumber(
                subscription.amount
              ),
            0
          );

        const renewalCount =
          history.filter(
            (subscription) =>
              subscription.is_renewal ===
              true
          ).length;

        /*
          For display:

          Active subscription first.

          If no active subscription:
          nearest upcoming subscription.

          Otherwise latest expired.
        */

        const displaySubscription =
          activeSubscription
            ? effective
            : upcomingSubscription ||
              effective;

        return {
          ...member,

          currentPlan:
            displaySubscription
              ?.plan ||
            null,

          currentStartDate:
            displaySubscription
              ?.start_date ||
            null,

          currentExpiryDate:
            displaySubscription
              ?.expiry_date ||
            null,

          currentStatus:
            displaySubscription
              ?.calculated_status ||
            "Expired",

          currentSettlementStatus:
            displaySubscription
              ?.settlement_status ||
            null,

          currentAmount:
            toNumber(
              displaySubscription
                ?.amount
            ),

          lifetimeRevenue,

          renewalCount,

          subscriptions:
            history,

          /*
            Useful for future UI.
          */

          hasUpcomingRenewal:
            Boolean(
              upcomingSubscription
            ),

          upcomingPlan:
            upcomingSubscription
              ?.plan ||
            null,

          upcomingStartDate:
            upcomingSubscription
              ?.start_date ||
            null,

          upcomingExpiryDate:
            upcomingSubscription
              ?.expiry_date ||
            null,
        };
      }
    );
  };
  /* =========================================================
   DELETE ONE SUBSCRIPTION
========================================================= */

export const deleteSubscriptionV2 = async (subscriptionId) => {
  if (!subscriptionId) {
    throw new Error("Subscription ID is required.");
  }

  const { error } = await supabase
    .from("member_subscriptions_v2")
    .delete()
    .eq("id", subscriptionId);

  if (error) {
    console.error("deleteSubscriptionV2 error:", error);
    throw error;
  }

  return true;
};


/* =========================================================
   DELETE MEMBER COMPLETELY

   IMPORTANT:
   1. Delete subscription history first.
   2. Delete member after that.
   3. Does NOT touch old public.members table.
========================================================= */

export const deleteMemberV2 = async (memberId) => {
  if (!memberId) {
    throw new Error("Member ID is required.");
  }

  // Delete all V2 subscription history
  const { error: subscriptionsError } = await supabase
    .from("member_subscriptions_v2")
    .delete()
    .eq("member_id", memberId);

  if (subscriptionsError) {
    console.error(
      "deleteMemberV2 subscription error:",
      subscriptionsError
    );

    throw subscriptionsError;
  }

  // Delete unique V2 member
  const { error: memberError } = await supabase
    .from("members_v2")
    .delete()
    .eq("id", memberId);

  if (memberError) {
    console.error(
      "deleteMemberV2 member error:",
      memberError
    );

    throw memberError;
  }

  return true;
};
/* =========================================================
   UPDATE SUBSCRIPTION
========================================================= */

export const updateSubscriptionV2 = async ({
  subscriptionId,
  plan,
  startDate,
  expiryDate,
  amount,
  settlementStatus = "Pending",
}) => {
  if (!subscriptionId) {
    throw new Error("Subscription ID is required.");
  }

  if (!cleanText(plan)) {
    throw new Error("Plan is required.");
  }

  if (!startDate) {
    throw new Error("Start date is required.");
  }

  if (!expiryDate) {
    throw new Error("Expiry date is required.");
  }

  if (expiryDate < startDate) {
    throw new Error(
      "Expiry date cannot be before start date."
    );
  }

  const calculatedStatus =
    getSubscriptionStatusV2({
      start_date: startDate,
      expiry_date: expiryDate,
    });

  const normalizedSettlement =
    cleanText(settlementStatus) || "Pending";

  const payload = {
    plan: cleanText(plan),

    start_date: startDate,

    expiry_date: expiryDate,

    amount: toNumber(amount),

    subscription_status:
      calculatedStatus,

    settlement_status:
      normalizedSettlement,

    payment_date:
      normalizedSettlement.toLowerCase() ===
      "settled"
        ? todayISO()
        : null,

    updated_at:
      new Date().toISOString(),
  };

  const { data, error } =
    await supabase
      .from(
        "member_subscriptions_v2"
      )
      .update(payload)
      .eq(
        "id",
        subscriptionId
      )
      .select("*")
      .single();

  if (error) {
    console.error(
      "updateSubscriptionV2 error:",
      error
    );

    throw error;
  }

  return data;
};