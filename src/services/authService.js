import { supabase } from "../lib/supabase";

/* ---------------- REGISTER ---------------- */

export async function registerUser({
  fullName,
  email,
  mobile,
  password,
}) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: fullName,
        mobile,
      },
    },
  });

  if (error) throw error;

  return data;
}

/* ---------------- LOGIN ---------------- */

export async function loginUser(email, password) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

  if (error) throw error;

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

  if (profileError) throw profileError;

  return {
    user: data.user,
    profile,
  };
}

/* ---------------- LOGOUT ---------------- */

export async function logoutUser() {
  await supabase.auth.signOut();
}

/* ---------------- RESET MAIL ---------------- */

export async function sendResetEmail(email) {
  const { error } =
    await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo:
          window.location.origin + "/reset-password",
      }
    );

  if (error) throw error;
}

/* ---------------- CHANGE PASSWORD ---------------- */

export async function updatePassword(password) {
  const { error } =
    await supabase.auth.updateUser({
      password,
    });

  if (error) throw error;
}

/* ---------------- CURRENT USER ---------------- */

export async function getCurrentUser() {
  const { data } =
    await supabase.auth.getUser();

  return data.user;
}