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
   *
   * Dashboard.jsx treats "inactive"
   * as restricted access.
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

   IMPORTANT:

   OLD SYSTEM:
   public.members

   NEW V2 SYSTEM:
   public.members_v2
   public.member_subscriptions_v2
========================================================= */

export const getSubscriberMembership =
  async (email) => {
    let membershipEmail =
      normalize(email);

    /* =====================================================
       GET EMAIL FROM AUTH IF REQUIRED
    ===================================================== */

    if (!membershipEmail) {
      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      membershipEmail =
        normalize(
          user?.email
        );
    }

    if (!membershipEmail) {
      console.warn(
        "Subscriber membership lookup skipped: no email available."
      );

      return null;
    }

    console.log(
      "Looking up V2 member:",
      membershipEmail
    );

    /* =====================================================
       STEP 1
       FIND MEMBER IN members_v2
    ===================================================== */

    const {
      data: member,
      error: memberError,
    } =
      await supabase
        .from("members_v2")
        .select("*")
        .eq(
          "email",
          membershipEmail
        )
        .maybeSingle();

    if (memberError) {
      console.error(
        "members_v2 lookup error:",
        memberError
      );

      throw memberError;
    }

    if (!member) {
      console.warn(
        `No members_v2 record found for ${membershipEmail}`
      );

      return null;
    }

    console.log(
      "V2 member found:",
      member
    );

    /* =====================================================
       STEP 2
       GET MEMBER SUBSCRIPTION HISTORY
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

    if (
      !subscriptions ||
      subscriptions.length === 0
    ) {
      console.warn(
        `No subscription history found for member ${member.id}`
      );

      return null;
    }

    console.log(
      "V2 subscription history:",
      subscriptions
    );

    /* =====================================================
       STEP 3
       SELECT CURRENT/EFFECTIVE SUBSCRIPTION
    ===================================================== */

    const selectedSubscription =
      getEffectiveSubscription(
        subscriptions
      );

    if (
      !selectedSubscription
    ) {
      console.warn(
        `No effective subscription found for ${membershipEmail}`
      );

      return null;
    }

    /* =====================================================
       STEP 4
       CALCULATE STATUS
    ===================================================== */

    const calculatedStatus =
      calculateSubscriptionStatus(
        selectedSubscription
      );

    console.log(
      "Selected subscriber membership:",
      {
        member,
        subscription:
          selectedSubscription,
        calculatedStatus,
      }
    );

    /* =====================================================
       STEP 5
       RETURN FORMAT EXPECTED BY Dashboard.jsx
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
        membershipEmail,

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

      /* Dashboard uses this status */
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

      /* Complete source records if needed later */
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