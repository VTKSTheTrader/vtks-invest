import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";

export default function ProtectedRoute({ children }) {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    /*
      Check the user's role.

      showLoader is true only during the first page load.
      Background session checks must not unmount the admin page.
    */
    const checkAdminAccess = async ({
      showLoader = false,
    } = {}) => {
      try {
        if (showLoader && mounted) {
          setCheckingAuth(true);
        }

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

        const role = String(profile?.role || "")
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
        /*
          Hide the loader only when this was the initial check.
          Background auth events must not replace the page.
        */
        if (showLoader && mounted) {
          setCheckingAuth(false);
        }
      }
    };

    // Initial authentication check
    checkAdminAccess({
      showLoader: true,
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        /*
          Immediately remove access after logout.
        */
        if (event === "SIGNED_OUT" || !session?.user) {
          setIsAdmin(false);
          setCheckingAuth(false);
          return;
        }

        /*
          Recheck the database role only for meaningful
          account changes, without showing the loader.
        */
        if (
          event === "SIGNED_IN" ||
          event === "USER_UPDATED"
        ) {
          checkAdminAccess({
            showLoader: false,
          });
        }

        /*
          TOKEN_REFRESHED and other background events
          are deliberately ignored so open forms and
          modals remain mounted.
        */
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