import {
  useEffect,
  useState,
} from "react";
import { Navigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";

export default function ProtectedRoute({ children }) {
  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [isAdmin, setIsAdmin] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAdminAccess = async () => {
      try {
        setCheckingAuth(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          if (mounted) {
            setIsAdmin(false);
          }

          return;
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        const role = String(
          profile?.role || ""
        )
          .trim()
          .toLowerCase();

        if (mounted) {
          setIsAdmin(role === "admin");
        }
      } catch (error) {
        console.error(
          "Admin authentication check failed:",
          error
        );

        if (mounted) {
          setIsAdmin(false);
        }
      } finally {
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    };

    checkAdminAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      () => {
        checkAdminAccess();
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (checkingAuth) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "grid",
          placeItems: "center",
          color: "#64748b",
          fontWeight: 700,
        }}
      >
        Checking admin access...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          message:
            "Please log in with an authorized admin account.",
        }}
      />
    );
  }

  return children;
}