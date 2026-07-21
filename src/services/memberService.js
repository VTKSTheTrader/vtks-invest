import { supabase } from "../lib/supabase";

export const getMembers = async () => {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("id", { ascending: false });

  if (error) throw error;
  return data;
};

export const addMember = async (member) => {
  const { data, error } = await supabase
    .from("members")
    .insert([
      {
        name: member.name,
        email: member.email,
        mobile: member.mobile,
        tv_id: member.tvId,
        plan: member.plan,
        start_date: member.startDate,
        expiry_date: member.expiryDate,
        amount: Number(member.amount),
        payment_mode: member.paymentMode,
        telegram: member.telegram,
        settlement_status: member.settlementStatus || "Pending",
      },
    ])
    .select();

  if (error) throw error;
  return data[0];
};

export const updateMember = async (id, member) => {
  const { data, error } = await supabase
    .from("members")
    .update({
      name: member.name,
      email: member.email,
      mobile: member.mobile,
      tv_id: member.tvId,
      plan: member.plan,
      start_date: member.startDate,
      expiry_date: member.expiryDate,
      amount: Number(member.amount),
      payment_mode: member.paymentMode,
      telegram: member.telegram,
      settlement_status: member.settlementStatus || "Pending",
      updated_at: new Date(),
    })
    .eq("id", id)
    .select();

  if (error) throw error;
  return data[0];
};

export const deleteMember = async (id) => {
  const { error } = await supabase
    .from("members")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

export const mapMemberFromDB = (m) => ({
  id: m.id,
  name: m.name,
  email: m.email,
  mobile: m.mobile,
  tvId: m.tv_id,
  plan: m.plan,
  startDate: m.start_date,
  expiryDate: m.expiry_date,
  amount: m.amount,
  paymentMode: m.payment_mode,
  telegram: m.telegram,
  settlementStatus: m.settlement_status,
});