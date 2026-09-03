import { supabase } from "../lib/supabase";
import { getResources } from "./libraryService";
import { getScanners } from "./scannerService";

/* =========================================================
   HELPERS
========================================================= */

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const firstAvailable = (...values) =>
  values.find(
    (value) =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
  );

/* =========================================================
   INDIA DATE

   Important:
   Membership dates are calculated using India timezone.
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
   SUBSCRIPTION STATUS
========================================================= */

const calculateSubscriptionStatus = (
  subscription
) => {
  if (!subscription) {
    return "expired";
  }

  const startDate =
    subscription.start_date;

  const expiryDate =
    subscription.expiry_date;

  if (
    !startDate ||
    !expiryDate
  ) {
    return "expired";
  }

  const today = todayISO();

  /*
   * Subscription starts in future.
   */
  if (startDate > today) {
    return "inactive";
  }

  /*
   * Subscription expired.
   */
  if (expiryDate < today) {
    return "expired";
  }

  /*
   * Subscription is valid today.
   */
  return "active";
};

/* =========================================================
   SORT SUBSCRIPTIONS
========================================================= */

const sortSubscriptionsNewestFirst = (
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
   SELECT EFFECTIVE SUBSCRIPTION

   Priority:

   1. Subscription valid TODAY
   2. Nearest upcoming subscription
   3. Latest historical subscription
========================================================= */

const getEffectiveSubscription = (
  subscriptions = []
) => {
  if (!subscriptions.length) {
    return null;
  }

  const today = todayISO();

  const sorted =
    sortSubscriptionsNewestFirst(
      subscriptions
    );

  /* =====================================================
     CURRENT ACTIVE SUBSCRIPTION
  ===================================================== */

  const active =
    sorted.find(
      (subscription) =>
        subscription.start_date &&
        subscription.expiry_date &&
        subscription.start_date <=
          today &&
        subscription.expiry_date >=
          today
    );

  if (active) {
    return active;
  }

  /* =====================================================
     NEAREST UPCOMING SUBSCRIPTION
  ===================================================== */

  const upcoming =
    sorted
      .filter(
        (subscription) =>
          subscription.start_date &&
          subscription.start_date >
            today
      )
      .sort(
        (a, b) => {
          const dateCompare =
            String(
              a.start_date || ""
            ).localeCompare(
              String(
                b.start_date || ""
              )
            );

          if (
            dateCompare !== 0
          ) {
            return dateCompare;
          }

          return (
            Number(a.id || 0) -
            Number(b.id || 0)
          );
        }
      )[0];

  if (upcoming) {
    return upcoming;
  }

  /* =====================================================
     LATEST HISTORICAL SUBSCRIPTION
  ===================================================== */

  return sorted[0] || null;
};

/* =========================================================
   CONTENT VISIBILITY
========================================================= */

const isVisibleToSubscriber = (
  item
) => {
  const access = normalize(
    item.access ||
      item.visibility ||
      item.audience ||
      item.access_type
  );

  return (
    !access ||
    access === "public" ||
    access === "subscriber" ||
    access === "subscribers" ||
    access === "premium" ||
    access === "community"
  );
};

/* =========================================================
   CONTENT ACTIVE STATUS
========================================================= */

const isActive = (item) => {
  const status = normalize(
    item.status ||
      item.publish_status ||
      item.publishStatus
  );

  if (
    item.is_active === false ||
    item.active === false
  ) {
    return false;
  }

  return ![
    "inactive",
    "disabled",
    "draft",
    "unpublished",
  ].includes(status);
};

/* =========================================================
   SUBSCRIBER PROFILE
========================================================= */

export const getSubscriberProfile =
  async () => {
    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error(
        "User is not logged in."
      );
    }

    const {
      data: profile,
      error,
    } =
      await supabase
        .from("profiles")
        .select("*")
        .eq(
          "id",
          user.id
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    /*
     * Use Supabase Auth as fallback
     * if profile information is missing.
     */
    return {
      ...(profile || {}),

      id:
        profile?.id ||
        user.id,

      email:
        firstAvailable(
          profile?.email,
          user.email
        ) || "",

      full_name:
        firstAvailable(
          profile?.full_name,
          profile?.fullName,
          user.user_metadata
            ?.full_name,
          user.user_metadata
            ?.name,
          user.email?.split(
            "@"
          )[0]
        ) ||
        "Subscriber",
    };
  };

/* =========================================================
   SUBSCRIBER MEMBERSHIP

   NEW ACCESS ENGINE:

   1. Get logged-in Supabase Auth user.
   2. Find members_v2 using auth_user_id.
   3. Email fallback for existing accounts not linked yet.
   4. dashboard_access must be TRUE.
   5. Existing subscription engine remains intact.
========================================================= */

export const getSubscriberMembership =
  async (email) => {
    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return null;
    }

    const membershipEmail =
      normalize(
        email || user.email
      );

    /* =====================================================
       STEP 1
       FIND MEMBER BY AUTH UUID FIRST
    ===================================================== */

    let member = null;

    const {
      data: memberByAuth,
      error: authMemberError,
    } =
      await supabase
        .from("members_v2")
        .select("*")
        .eq(
          "auth_user_id",
          user.id
        )
        .maybeSingle();

    if (authMemberError) {
      console.error(
        "members_v2 auth lookup error:",
        authMemberError
      );

      throw authMemberError;
    }

    member =
      memberByAuth || null;

    /* =====================================================
       TEMPORARY EMAIL FALLBACK

       This protects existing subscribers whose old
       members_v2 records do not yet have auth_user_id.
    ===================================================== */

    if (
      !member &&
      membershipEmail
    ) {
      const {
        data: memberByEmail,
        error: emailMemberError,
      } =
        await supabase
          .from("members_v2")
          .select("*")
          .eq(
            "email",
            membershipEmail
          )
          .maybeSingle();

      if (emailMemberError) {
        console.error(
          "members_v2 email fallback error:",
          emailMemberError
        );

        throw emailMemberError;
      }

      member =
        memberByEmail || null;
    }

    if (!member) {
      console.warn(
        "No members_v2 record found for logged-in user."
      );

      return null;
    }

    /* =====================================================
       STEP 2
       ADMIN-CONTROLLED DASHBOARD ACCESS

       Registration alone DOES NOT grant dashboard access.
    ===================================================== */

    if (
      member.dashboard_access !==
      true
    ) {
      console.warn(
        `Dashboard access is disabled for member ${member.id}`
      );

      return {
        id: null,

        member_id:
          member.id,

        name:
          member.name || "",

        email:
          member.email ||
          membershipEmail ||
          user.email ||
          "",

        mobile:
          member.mobile || "",

        tv_id:
          member.tv_id || "",

        plan:
          "Registered User",

        start_date:
          null,

        expiry_date:
          null,

        amount:
          0,

        status:
          "inactive",

        subscription_status:
          "inactive",

        settlement_status:
          null,

        payment_date:
          null,

        is_renewal:
          false,

        dashboard_access:
          false,

        access_denied:
          true,

        member,

        subscription:
          null,

        subscriptions:
          [],
      };
    }

    /* =====================================================
       STEP 3
       GET SUBSCRIPTION HISTORY
    ===================================================== */

    const {
      data: subscriptions,
      error:
        subscriptionError,
    } =
      await supabase
        .from(
          "member_subscriptions_v2"
        )
        .select("*")
        .eq(
          "member_id",
          member.id
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

    if (
      subscriptionError
    ) {
      console.error(
        "member_subscriptions_v2 lookup error:",
        subscriptionError
      );

      throw subscriptionError;
    }

    /* =====================================================
       MANUAL DASHBOARD ACCESS

       Admin can enable a registered account even when
       there is no subscription record.
    ===================================================== */

    if (
      !subscriptions ||
      subscriptions.length === 0
    ) {
      return {
        id: null,

        member_id:
          member.id,

        name:
          member.name || "",

        email:
          member.email ||
          membershipEmail ||
          user.email ||
          "",

        mobile:
          member.mobile || "",

        tv_id:
          member.tv_id || "",

        plan:
          "Manual Access",

        start_date:
          null,

        expiry_date:
          null,

        amount:
          0,

        status:
          "active",

        subscription_status:
          "active",

        settlement_status:
          null,

        payment_date:
          null,

        is_renewal:
          false,

        dashboard_access:
          true,

        access_denied:
          false,

        member,

        subscription:
          null,

        subscriptions:
          [],
      };
    }

    /* =====================================================
       STEP 4
       SELECT CURRENT/EFFECTIVE SUBSCRIPTION
    ===================================================== */

    const selectedSubscription =
      getEffectiveSubscription(
        subscriptions
      );

    if (
      !selectedSubscription
    ) {
      return null;
    }

    /* =====================================================
       STEP 5
       CALCULATE SUBSCRIPTION STATUS
    ===================================================== */

    const calculatedStatus =
      calculateSubscriptionStatus(
        selectedSubscription
      );

    /* =====================================================
       STEP 6
       RETURN FORMAT EXPECTED BY EXISTING DASHBOARD
    ===================================================== */

    return {
      /* Subscription ID */
      id:
        selectedSubscription.id,

      /* Member ID */
      member_id:
        member.id,

      /* Member information */
      name:
        member.name ||
        "",

      email:
        member.email ||
        membershipEmail ||
        user.email ||
        "",

      mobile:
        member.mobile ||
        "",

      tv_id:
        member.tv_id ||
        "",

      /* Subscription information */
      plan:
        selectedSubscription.plan ||
        "Subscriber",

      start_date:
        selectedSubscription
          .start_date ||
        null,

      expiry_date:
        selectedSubscription
          .expiry_date ||
        null,

      amount:
        Number(
          selectedSubscription
            .amount ||
          0
        ),

      /*
       * Existing Dashboard.jsx uses this status.
       */
      status:
        calculatedStatus,

      subscription_status:
        calculatedStatus,

      settlement_status:
        selectedSubscription
          .settlement_status ||
        null,

      payment_date:
        selectedSubscription
          .payment_date ||
        null,

      is_renewal:
        Boolean(
          selectedSubscription
            .is_renewal
        ),

      /*
       * New dashboard permission fields.
       */
      dashboard_access:
        true,

      access_denied:
        false,

      /* Complete source records */
      member,

      subscription:
        selectedSubscription,

      subscriptions,
    };
  };

/* =========================================================
   SUBSCRIBER LIBRARY
========================================================= */

export const getSubscriberLibrary =
  async () => {
    const resources =
      await getResources();

    return (resources || [])
      .filter(
        (item) =>
          isActive(item) &&
          isVisibleToSubscriber(
            item
          )
      )
      .map((item) => ({
        id:
          item.id,

        title:
          item.title ||
          item.name ||
          "VTKS Resource",

        category:
          item.category ||
          "General",

        type:
          item.type ||
          "Resource",

        description:
          item.description ||
          "",

        access:
          item.access ||
          "Subscriber",

        status:
          item.status ||
          "Active",

        featured:
          Boolean(
            item.featured
          ),

        pinned:
          Boolean(
            item.pinned
          ),

        views:
          Number(
            item.views || 0
          ),

        video_url:
          normalize(
            item.type
          ).includes(
            "video"
          )
            ? item.url ||
              ""
            : "",

        file_url:
          normalize(
            item.type
          ).includes(
            "pdf"
          ) ||
          normalize(
            item.type
          ).includes(
            "document"
          ) ||
          normalize(
            item.source_type
          ).includes(
            "upload"
          )
            ? item.url ||
              ""
            : "",

        url:
          item.url ||
          "",

        created_at:
          item.created_at ||
          item.uploaded ||
          null,
      }));
  };

/* =========================================================
   SUBSCRIBER SCANNERS
========================================================= */

export const getSubscriberScanners =
  async () => {
    const scanners =
      await getScanners();

    return (scanners || [])
      .filter(
        (item) =>
          isActive(item) &&
          isVisibleToSubscriber(
            item
          )
      )
      .map((item) => ({
        id:
          item.id,

        title:
          item.name ||
          item.title ||
          "VTKS Scanner",

        description: [
          item.category,
          item.timeframe,
        ]
          .filter(Boolean)
          .join(" • "),

        category:
          item.category ||
          "General",

        timeframe:
          item.timeframe ||
          "",

        url:
          item.link ||
          item.url ||
          "",

        access:
          item.access ||
          "Subscriber",

        status:
          item.status ||
          "Active",

        featured:
          Boolean(
            item.featured
          ),

        updated_at:
          item.updated_at ||
          item.updatedAt ||
          null,
      }));
  };