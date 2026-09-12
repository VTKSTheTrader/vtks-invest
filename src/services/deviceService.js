import { supabase } from "../lib/supabase";

const DEVICE_KEY = "vtks_device_id";

/* =====================================================
   GET / CREATE DEVICE ID
===================================================== */

export const getDeviceId = () => {
  let deviceId =
    localStorage.getItem(DEVICE_KEY);

  if (!deviceId) {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      deviceId =
        crypto.randomUUID();
    } else if (
      typeof crypto !== "undefined" &&
      typeof crypto.getRandomValues ===
        "function"
    ) {
      const bytes =
        new Uint8Array(16);

      crypto.getRandomValues(bytes);

      bytes[6] =
        (bytes[6] & 0x0f) | 0x40;

      bytes[8] =
        (bytes[8] & 0x3f) | 0x80;

      const hex = Array.from(
        bytes,
        (byte) =>
          byte
            .toString(16)
            .padStart(2, "0")
      );

      deviceId =
        `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-` +
        `${hex[4]}${hex[5]}-` +
        `${hex[6]}${hex[7]}-` +
        `${hex[8]}${hex[9]}-` +
        `${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`;
    } else {
      deviceId =
        `vtks-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}-${Math.random()
          .toString(36)
          .slice(2)}`;
    }

    localStorage.setItem(
      DEVICE_KEY,
      deviceId
    );
  }

  return deviceId;
};

/* =====================================================
   DEVICE INFORMATION
===================================================== */

const getDeviceInfo = () => {
  const ua = navigator.userAgent;

  let browser = "Unknown Browser";

  if (ua.includes("Firefox")) {
    browser = "Firefox";
  } else if (ua.includes("Edg")) {
    browser = "Edge";
  } else if (
    ua.includes("Chrome") ||
    ua.includes("CriOS")
  ) {
    browser = "Chrome";
  } else if (ua.includes("Safari")) {
    browser = "Safari";
  }

  let operatingSystem =
    "Unknown OS";

  if (ua.includes("Windows")) {
    operatingSystem =
      "Windows";
  } else if (ua.includes("Android")) {
    operatingSystem =
      "Android";
  } else if (
    ua.includes("iPhone") ||
    ua.includes("iPad")
  ) {
    operatingSystem =
      "iOS";
  } else if (ua.includes("Mac")) {
    operatingSystem =
      "macOS";
  } else if (ua.includes("Linux")) {
    operatingSystem =
      "Linux";
  }

  return {
    browser,
    operatingSystem,
    deviceName:
      `${browser} • ${operatingSystem}`,
  };
};

/* =====================================================
   GET REGISTERED DEVICES
===================================================== */

export const getRegisteredDevices =
  async (userId) => {
    if (!userId) {
      return [];
    }

    const {
      data,
      error,
    } = await supabase
      .from("subscriber_devices")
      .select("*")
      .eq(
        "user_id",
        userId
      )
      .order(
        "last_active_at",
        {
          ascending: false,
        }
      );

    if (error) {
      console.error(
        "GET DEVICES ERROR:",
        error
      );

      throw error;
    }

    return data || [];
  };

/* =====================================================
   REMOVE REGISTERED DEVICE
===================================================== */

export const removeRegisteredDevice =
  async (
    userId,
    deviceRowId
  ) => {
    if (
      !userId ||
      !deviceRowId
    ) {
      throw new Error(
        "Invalid device information."
      );
    }

    const {
      error,
    } = await supabase
      .from("subscriber_devices")
      .delete()
      .eq(
        "id",
        deviceRowId
      )
      .eq(
        "user_id",
        userId
      );

    if (error) {
      console.error(
        "REMOVE DEVICE ERROR:",
        error
      );

      throw error;
    }

    return {
      success: true,
    };
  };

/* =====================================================
   UPDATE DEVICE LAST ACTIVE
===================================================== */

export const updateDeviceActivity =
  async (
    userId
  ) => {
    if (!userId) {
      return;
    }

    const deviceId =
      getDeviceId();

    const {
      error,
    } = await supabase
      .from("subscriber_devices")
      .update({
        last_active_at:
          new Date().toISOString(),
      })
      .eq(
        "user_id",
        userId
      )
      .eq(
        "device_id",
        deviceId
      );

    if (error) {
      console.error(
        "DEVICE ACTIVITY ERROR:",
        error
      );
    }
  };

/* =====================================================
   CHECK CURRENT DEVICE
===================================================== */

export const isCurrentDeviceRegistered =
  async (
    userId
  ) => {
    if (!userId) {
      return false;
    }

    const deviceId =
      getDeviceId();

    const {
      data,
      error,
    } = await supabase
      .from("subscriber_devices")
      .select("id")
      .eq(
        "user_id",
        userId
      )
      .eq(
        "device_id",
        deviceId
      )
      .maybeSingle();

    if (error) {
      console.error(
        "DEVICE VALIDATION ERROR:",
        error
      );

      return false;
    }

    return Boolean(data);
  };

/* =====================================================
   REGISTER / CHECK DEVICE
===================================================== */

export const registerDevice =
  async (
    userId
  ) => {
    if (!userId) {
      return {
        allowed: false,
        reason: "NO_USER",
      };
    }

    const deviceId =
      getDeviceId();

    /* =================================================
       CHECK WHETHER THIS DEVICE ALREADY EXISTS
    ================================================= */

    const {
      data: existingDevice,
      error: existingError,
    } = await supabase
      .from("subscriber_devices")
      .select("*")
      .eq(
        "user_id",
        userId
      )
      .eq(
        "device_id",
        deviceId
      )
      .maybeSingle();

    if (existingError) {
      console.error(
        "DEVICE CHECK ERROR:",
        existingError
      );

      throw existingError;
    }

    /* =================================================
       EXISTING DEVICE
    ================================================= */

    if (existingDevice) {
      const now =
        new Date().toISOString();

      const {
        data: updatedDevice,
        error: updateError,
      } = await supabase
        .from("subscriber_devices")
        .update({
          last_active_at:
            now,
        })
        .eq(
          "id",
          existingDevice.id
        )
        .select()
        .single();

      if (updateError) {
        console.error(
          "DEVICE UPDATE ERROR:",
          updateError
        );

        throw updateError;
      }

      return {
        allowed: true,
        existing: true,
        device:
          updatedDevice ||
          existingDevice,
      };
    }

    /* =================================================
       LOAD CURRENT REGISTERED DEVICES
    ================================================= */

    const devices =
      await getRegisteredDevices(
        userId
      );

    /* =================================================
       MAXIMUM 2 DEVICES
    ================================================= */

    if (
      devices.length >= 2
    ) {
      return {
        allowed: false,
        reason:
          "DEVICE_LIMIT",
        devices,
      };
    }

    /* =================================================
       REGISTER NEW DEVICE
    ================================================= */

    const info =
      getDeviceInfo();

    const {
      data: newDevice,
      error: insertError,
    } = await supabase
      .from("subscriber_devices")
      .insert({
        user_id:
          userId,

        device_id:
          deviceId,

        device_name:
          info.deviceName,

        browser:
          info.browser,

        operating_system:
          info.operatingSystem,

        last_active_at:
          new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error(
        "DEVICE REGISTER ERROR:",
        insertError
      );

      throw insertError;
    }

    return {
      allowed: true,
      existing: false,
      device:
        newDevice,
    };
  };