import { useState } from "react";
import { supabase } from "../supabase";
import { Shield, Plus, Loader2 } from "lucide-react";

export default function WhitelistForm({ onInserted }) {
  const [ssid, setSsid] = useState("");
  const [mac, setMac] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const norm = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");

  const isValidSSID = (txt) => {
    const clean = txt.trim();
    return clean.length >= 1 && clean.length <= 32;
  };

  const MAC_REGEX = /^([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanSSID = norm(ssid);
    const cleanMAC = mac.trim();

    if (!cleanSSID && !cleanMAC) {
      setError("❌ Enter an SSID or a MAC address (at least one).");
      return;
    }

    if (cleanSSID && !isValidSSID(ssid)) {
      setError("❌ SSID must be 1–32 characters.");
      return;
    }

    if (cleanMAC && !MAC_REGEX.test(cleanMAC)) {
      setError("❌ Invalid MAC format. Use AA:BB:CC:DD:EE:FF ");
      return;
    }

    setLoading(true);

    try {
      if (cleanSSID) {
        const { data: dupeSsid, error: dupeSsidErr } = await supabase
          .from("whitelist")
          .select("id")
          .eq("ssid", cleanSSID)
          .limit(1);

        if (dupeSsidErr) throw dupeSsidErr;
        if (dupeSsid && dupeSsid.length > 0) {
          setError("❌ This SSID is already whitelisted.");
          return;
        }
      }

      if (cleanMAC) {
        const { data: dupeMac, error: dupeMacErr } = await supabase
          .from("whitelist")
          .select("id")
          .eq("mac", cleanMAC)
          .limit(1);

        if (dupeMacErr) throw dupeMacErr;
        if (dupeMac && dupeMac.length > 0) {
          setError("❌ This MAC address is already whitelisted.");
          return;
        }
      }

      const payload = {
        ssid: cleanSSID || null,
        mac: cleanMAC ? cleanMAC.toLocaleLowerCase() : null,
      };

      const { error: insertErr } = await supabase
        .from("whitelist")
        .insert(payload);
      if (insertErr) throw insertErr;

      setSuccess("✔ Device successfully whitelisted!");
      setSsid("");
      setMac("");
      onInserted && onInserted();
    } catch (err) {
      console.error(err);
      setError("❌ Failed to insert entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="whitelist-card">
      <div className="whitelist-header">
        <div className="whitelist-icon-circle">
          <Shield className="whitelist-icon" />
        </div>
        <div>
          <h2 className="whitelist-title">Whitelist device</h2>
          <p className="whitelist-subtitle">Add trusted networks</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="whitelist-form">
        <div className="whitelist-field">
          <label className="whitelist-label">Network SSID</label>
          <input
            className="whitelist-input"
            placeholder="Enter WiFi network name"
            value={ssid}
            onChange={(e) => setSsid(e.target.value)}
          />
        </div>

        <div className="whitelist-field">
          <label className="whitelist-label">Device MAC </label>
          <input
            className="whitelist-input"
            placeholder="AA:BB:CC:DD:EE:FF"
            value={mac}
            onChange={(e) => setMac(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading} className="whitelist-button">
          {loading ? (
            <>
              <Loader2 className="whitelist-button-icon spinning" />
              Checking...
            </>
          ) : (
            <>
              <Plus className="whitelist-button-icon" />
              Add to whitelist
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="whitelist-message whitelist-error">{error}</div>
      )}
      {success && (
        <div className="whitelist-message whitelist-success">{success}</div>
      )}
    </div>
  );
}
