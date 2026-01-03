import { supabase } from "./supabase";

export const getDetectionsFromSupabase = async () => {
  const { data, error } = await supabase
    .from("espData")
    .select("anchor_id, ssid, rssi, block_number,mac")
    .limit(50);

  if (error) {
    console.error("Supabase fetch error:", error.message);
    return [];
  }

  return data.map((row) => ({
    mac: row.mac,
    anchor: row.anchor_id,
    ssid: row.ssid,
    rssi: row.rssi,
    block: row.block_number,
  }));
};
