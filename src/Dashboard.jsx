import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabase";
import { getDetectionsFromSupabase } from "../data-utils";
import WhitelistForm from "./whitelist";
import DetectionCard from "./DetectionCard";
import { Radio, Activity, Wifi, Shield, LogOut } from "lucide-react";

function Dashboard({ onLogout }) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewDetection, setHasNewDetection] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [whitelistCount, setWhitelistCount] = useState(0);

  const prevDataRef = useRef([]);

  const norm = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");
  const normMac = (v) => norm(v);

  //  this is the method that will run every 9 seconds and the one called oninsert on the whitelist form which will get fresh data when submiting the mac or ssid without waiting 9 seconds
  const fetchFromSupabase = async () => {
    setIsLoading(true);

    try {
      const { data: whitelistRows, error: wlErr } = await supabase
        .from("whitelist")
        .select("ssid, mac");

      if (wlErr) console.error("Whitelist error:", wlErr);

      const wlSSID = (whitelistRows || [])
        .map((w) => norm(w.ssid))
        .filter(Boolean);

      const wlMAC = (whitelistRows || [])
        .map((w) => normMac(w.mac))
        .filter(Boolean);

      setWhitelistCount(wlSSID.length + wlMAC.length);

      // this async function you will find it in the data-utills module
      const detections = await getDetectionsFromSupabase();

      const filteredRows = (detections || []).filter((d) => {
        const ssid = norm(d.ssid);
        const mac = normMac(d.mac);

        const ssidMatch = ssid && wlSSID.includes(ssid);
        const macMatch = mac && wlMAC.includes(mac);

        return !(ssidMatch || macMatch);
      });

      const uniqueKey = (d) => {
        const ssid = norm(d.ssid);
        const mac = normMac(d.mac);
        return ssid || mac || String(d.id ?? JSON.stringify(d));
      };

      const uniqueData = Array.from(
        new Map(filteredRows.map((d) => [uniqueKey(d), d])).values()
      );

      const newDetections = uniqueData.filter(
        (d) =>
          !prevDataRef.current.some((prev) => uniqueKey(prev) === uniqueKey(d))
      );

      if (newDetections.length > 0) {
        setHasNewDetection(true);
        setToastMessage(`🎯 ${newDetections.length} new detection(s) found!`);
      } else {
        setHasNewDetection(false);
        setToastMessage("⚠️ No new detections");
      }

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      setData(uniqueData);
      prevDataRef.current = uniqueData;
    } catch (err) {
      console.error(err);
      setToastMessage("❌ Failed to fetch data");
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect(() => {
  //   fetchFromSupabase();
  // }, []);

  useEffect(() => {
    const interval = setInterval(fetchFromSupabase, 9000);
    return () => clearInterval(interval);
  }, []);

  const totalDetections = data.length;
  const uniqueAnchors = new Set(data.map((d) => d.anchor_id ?? d.anchor)).size;

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-circle">
            <Radio className="sidebar-logo-icon" />
          </div>
          <div>
            <h1 className="sidebar-title">ESP32 Monitor</h1>
            <p className="sidebar-subtitle">
              <span className="sidebar-status-dot" />
              Live detection
            </p>
          </div>
        </div>

        <div className="sidebar-quickstats">
          <h3 className="sidebar-quickstats-title">Quick stats</h3>
          <div className="sidebar-quickstats-grid">
            <div className="sidebar-stat-card">
              <div className="sidebar-stat-value">{totalDetections}</div>
              <div className="sidebar-stat-label">Detected devices</div>
            </div>
            <div className="sidebar-stat-card">
              <div className="sidebar-stat-value">{uniqueAnchors}</div>
              <div className="sidebar-stat-label">Anchors (ESP32)</div>
            </div>
            <div className="sidebar-stat-card">
              <div className="sidebar-stat-value">{whitelistCount}</div>
              <div className="sidebar-stat-label">Whitelisted (SSID+MAC)</div>
            </div>
          </div>
        </div>

        <div className="sidebar-whitelist">
          <WhitelistForm onInserted={fetchFromSupabase} />
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="sidebar-user-avatar">A</div>
            <div>
              <p className="sidebar-user-name">Admin User</p>
              <p className="sidebar-user-role">System administrator</p>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={onLogout}>
            <LogOut className="sidebar-logout-icon" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        {showToast && (
          <div
            className={`toast ${
              hasNewDetection ? "toast-success" : "toast-neutral"
            }`}
          >
            {toastMessage}
          </div>
        )}

        <header className="dashboard-header">
          <div>
            <h2 className="dashboard-header-title">Detection monitor</h2>
            <p className="dashboard-header-subtitle">
              Real-time WiFi detection overview
            </p>
            <p className="dashboard-header-small">
              Auto-refresh every 9 seconds
            </p>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="dashboard-top-row">
            <div
              className={`status-card ${
                isLoading
                  ? "status-card-loading"
                  : hasNewDetection
                  ? "status-card-ok"
                  : "status-card-empty"
              }`}
            >
              <div className="status-icon-wrapper">
                {isLoading ? (
                  <Activity className="status-icon spinning" />
                ) : hasNewDetection ? (
                  <Activity className="status-icon" />
                ) : (
                  <Wifi className="status-icon" />
                )}
              </div>
              <div>
                <h3 className="status-title">
                  {isLoading
                    ? "Scanning..."
                    : hasNewDetection
                    ? "New detections"
                    : "No new detections"}
                </h3>
                <p className="status-subtitle">
                  {isLoading ? "Checking for devices" : "Last check just now"}
                </p>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon-circle">
                <Shield className="summary-icon" />
              </div>
              <div>
                <h3 className="summary-title">Network overview</h3>
                <p className="summary-subtitle">
                  {totalDetections} devices • {uniqueAnchors} anchors •{" "}
                  {whitelistCount} whitelisted
                </p>
              </div>
            </div>
          </div>

          <div className="detections-header">
            <h3 className="detections-title">Detected devices</h3>
            <span className="detections-count">
              {data.length} device{data.length !== 1 ? "s" : ""}
            </span>
          </div>

          {data.length === 0 && !isLoading ? (
            <div className="detections-empty">
              <div className="detections-empty-icon">
                <Radio className="detections-empty-radio" />
              </div>
              <h3>No detections yet</h3>
              <p>
                Waiting for ESP32 to send detection data. Make sure your nodes
                are online and connected.
              </p>
            </div>
          ) : (
            <div className="detections-grid">
              {data.map((d, i) => (
                <DetectionCard key={i} detection={d} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
