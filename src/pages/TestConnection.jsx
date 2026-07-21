import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function TestConnection() {
  useEffect(() => {
    async function test() {
      const { data, error } = await supabase
        .from("funds")
        .select("*");

      console.log("DATA:", data);
      console.log("ERROR:", error);
    }

    test();
  }, []);

  return (
    <div style={{ padding: "40px", color: "white" }}>
      <h1>Testing Supabase Connection...</h1>
      <p>Open F12 → Console</p>
    </div>
  );
}