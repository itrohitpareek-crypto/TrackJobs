import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

import "../styles/accountSettings.css";

const initialNotifications = {
  applicationUpdates: true,
  messages: true,
  jobAlerts: true,
  marketingEmails: false,
};

const initialPrivacy = {
  profileVisibility: "public",
  allowRecruiterMessages: true,
};

export default function AccountSettings() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [privacy, setPrivacy] = useState(initialPrivacy);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [actionLoading, setActionLoading] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  const [activeSection, setActiveSection] = useState("account");

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/settings");
      setAccount(response.data?.account || null);
      setNotifications({
        ...initialNotifications,
        ...(response.data?.notifications || {}),
      });
      setPrivacy({
        ...initialPrivacy,
        ...(response.data?.privacy || {}),
      });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load account settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const savePreferences = async () => {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      await api.patch("/settings", {
        notifications,
        privacy,
      });

      setMessage("Your account preferences were saved successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save your preferences.");
    } finally {
      setSaving(false);
    }
  };

  const updateNotification = (key, value) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
    setMessage("");
  };

  const updatePrivacy = (key, value) => {
    setPrivacy((prev) => ({ ...prev, [key]: value }));
    setMessage("");
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setPasswordSaving(true);
      const response = await api.post("/settings/change-password", {
        currentPassword,
        newPassword,
      });

      if (response.data?.token) {
        localStorage.setItem("jt_token", response.data.token);
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage(response.data?.message || "Password changed successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const signOutAllDevices = async () => {
    if (!window.confirm("Sign out all other active sessions?")) return;

    try {
      setActionLoading("sessions");
      setError("");
      const response = await api.post("/settings/sign-out-all");

      if (response.data?.token) {
        localStorage.setItem("jt_token", response.data.token);
      }

      setMessage(response.data?.message || "Other sessions have been signed out.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign out other sessions.");
    } finally {
      setActionLoading("");
    }
  };

  const exportData = async () => {
    try {
      setActionLoading("export");
      setError("");

      const response = await api.get("/settings/export", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "trackjobs-account-data.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage("Your account data export is ready.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to export account data.");
    } finally {
      setActionLoading("");
    }
  };

  const deactivate = async () => {
    const googleOnly = account?.authProvider === "google" && !account?.hasPassword;
    const password = window.prompt(
      googleOnly
        ? "This will sign you out and deactivate your account. Type DEACTIVATE to continue."
        : "Enter your password to deactivate your account."
    );

    if (password === null) return;

    try {
      setActionLoading("deactivate");
      setError("");

      const payload = googleOnly
        ? { confirmation: password }
        : { password };

      const response = await api.post("/settings/deactivate", payload);
      setMessage(response.data?.message || "Account deactivated.");
      localStorage.removeItem("jt_token");
      logout();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to deactivate account.");
    } finally {
      setActionLoading("");
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      setError("Type DELETE exactly to confirm account deletion.");
      return;
    }

    try {
      setActionLoading("delete");
      setError("");

      const response = await api.post("/settings/delete", {
        confirmation: deleteConfirmation,
        password: deletePassword,
      });

      localStorage.removeItem("jt_token");
      logout();
      navigate("/", { replace: true });
      window.alert(response.data?.message || "Account deleted.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete account.");
    } finally {
      setActionLoading("");
    }
  };

  const passwordLabel = useMemo(
    () => (account?.authProvider === "google" && !account?.hasPassword ? "Set password" : "Change password"),
    [account]
  );

  if (loading) {
    return (
      <main className="container account-settings-page">
        <div className="empty">Loading account settings...</div>
      </main>
    );
  }

  return (
    <main className="container account-settings-page">
      <div className="page-head account-settings-head">
        <div>
          <span className="eyebrow">Account settings</span>
          <h1>Manage your TrackJobs account.</h1>
          <p>Control your security, notifications, privacy and account preferences from one place.</p>
        </div>
      </div>

      {message && (
        <div className="settings-alert success">
          <CheckCircle2 size={17} />
          {message}
        </div>
      )}

      {error && (
        <div className="settings-alert error">
          <AlertTriangle size={17} />
          {error}
        </div>
      )}

      <div className="account-settings-layout">
        <aside className="settings-sidebar">
          <div className="settings-user-card">
            <div className="settings-user-avatar">
              {(account?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{account?.name || "TrackJobs user"}</strong>
              <span>{account?.email}</span>
            </div>
          </div>

          <button className={activeSection === "account" ? "settings-nav active" : "settings-nav"} onClick={() => setActiveSection("account")}><UserRound size={17} /> Account</button>
          <button className={activeSection === "security" ? "settings-nav active" : "settings-nav"} onClick={() => setActiveSection("security")}><LockKeyhole size={17} /> Security</button>
          <button className={activeSection === "notifications" ? "settings-nav active" : "settings-nav"} onClick={() => setActiveSection("notifications")}><Bell size={17} /> Notifications</button>
          <button className={activeSection === "privacy" ? "settings-nav active" : "settings-nav"} onClick={() => setActiveSection("privacy")}><ShieldCheck size={17} /> Privacy</button>
          <button className={activeSection === "data" ? "settings-nav active" : "settings-nav"} onClick={() => setActiveSection("data")}><Download size={17} /> Your data</button>
          <button className={activeSection === "danger" ? "settings-nav active danger" : "settings-nav danger"} onClick={() => setActiveSection("danger")}><Trash2 size={17} /> Deactivate / delete</button>
        </aside>

        <div className="settings-content">
          {activeSection === "account" && (
            <section className="settings-card">
              <div className="settings-card-heading">
                <div>
                  <span className="settings-icon"><UserRound size={19} /></span>
                  <div>
                    <h2>Account information</h2>
                    <p>Your basic TrackJobs account details.</p>
                  </div>
                </div>
              </div>

              <div className="settings-info-grid">
                <div><span>Email address</span><strong>{account?.email}</strong><small>Email changes require verification and are intentionally protected.</small></div>
                <div><span>Account type</span><strong className="capitalize">{account?.role}</strong><small>Your role controls the workspace and permissions you receive.</small></div>
                <div><span>Sign-in method</span><strong className="capitalize">{account?.authProvider === "google" ? "Google" : "Email & password"}</strong><small>{account?.authProvider === "google" ? "Google identity is connected to this account." : "Password-based sign-in is enabled."}</small></div>
                <div><span>Member since</span><strong>{account?.createdAt ? new Date(account.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</strong><small>Account creation date.</small></div>
              </div>

              <div className="settings-inline-actions">
                <button className="outline" onClick={() => navigate("/profile")}><UserRound size={16} /> Edit profile</button>
                <button className="outline" onClick={() => navigate("/messages")}><Mail size={16} /> Open messages</button>
              </div>
            </section>
          )}

          {activeSection === "security" && (
            <>
              <section className="settings-card">
                <div className="settings-card-heading">
                  <div>
                    <span className="settings-icon"><LockKeyhole size={19} /></span>
                    <div><h2>{passwordLabel}</h2><p>Keep your account protected with a strong password.</p></div>
                  </div>
                </div>

                {account?.authProvider === "google" && !account?.hasPassword && (
                  <div className="settings-note"><ShieldCheck size={17} /><span>You currently use Google sign-in. Setting a password gives you an additional email/password sign-in method.</span></div>
                )}

                <form className="settings-form" onSubmit={handleChangePassword}>
                  {account?.hasPassword && (
                    <label>
                      Current password
                      <div className="settings-password-field">
                        <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required />
                        <button type="button" onClick={() => setShowCurrent((v) => !v)}>{showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                      </div>
                    </label>
                  )}

                  <label>
                    New password
                    <div className="settings-password-field">
                      <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} autoComplete="new-password" required />
                      <button type="button" onClick={() => setShowNew((v) => !v)}>{showNew ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                    </div>
                  </label>

                  <label>
                    Confirm new password
                    <div className="settings-password-field">
                      <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} autoComplete="new-password" required />
                      <button type="button" onClick={() => setShowConfirm((v) => !v)}>{showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}</button>
                    </div>
                  </label>

                  <div className="settings-form-actions">
                    <button className="btn" type="submit" disabled={passwordSaving}>{passwordSaving ? "Saving password..." : passwordLabel}</button>
                  </div>
                </form>
              </section>

              <section className="settings-card">
                <div className="settings-card-heading">
                  <div><span className="settings-icon"><LogOut size={19} /></span><div><h2>Active sessions</h2><p>Protect your account if you think another device is signed in.</p></div></div>
                </div>
                <div className="settings-action-row">
                  <div><strong>Sign out of other devices</strong><span>This invalidates your other active login tokens while keeping this device signed in.</span></div>
                  <button className="outline" onClick={signOutAllDevices} disabled={actionLoading === "sessions"}>{actionLoading === "sessions" ? "Signing out..." : "Sign out all"}</button>
                </div>
              </section>
            </>
          )}

          {activeSection === "notifications" && (
            <section className="settings-card">
              <div className="settings-card-heading"><div><span className="settings-icon"><Bell size={19} /></span><div><h2>Notification preferences</h2><p>Choose which account updates you want TrackJobs to keep you informed about.</p></div></div></div>
              <div className="settings-toggle-list">
                <ToggleRow icon={<CheckCircle2 size={18} />} title="Application updates" description="Status changes, interview updates and application activity." checked={notifications.applicationUpdates} onChange={(v) => updateNotification("applicationUpdates", v)} />
                <ToggleRow icon={<Mail size={18} />} title="Messages" description="Receive notifications when another user sends you a message." checked={notifications.messages} onChange={(v) => updateNotification("messages", v)} />
                <ToggleRow icon={<Bell size={18} />} title="Job alerts" description="Receive alerts for relevant job opportunities and hiring activity." checked={notifications.jobAlerts} onChange={(v) => updateNotification("jobAlerts", v)} />
                <ToggleRow icon={<Mail size={18} />} title="Product emails" description="Occasional TrackJobs product news, tips and improvements." checked={notifications.marketingEmails} onChange={(v) => updateNotification("marketingEmails", v)} />
              </div>
              <div className="settings-form-actions"><button className="btn" onClick={savePreferences} disabled={saving}>{saving ? "Saving..." : "Save notification settings"}</button></div>
            </section>
          )}

          {activeSection === "privacy" && (
            <section className="settings-card">
              <div className="settings-card-heading"><div><span className="settings-icon"><ShieldCheck size={19} /></span><div><h2>Privacy & discoverability</h2><p>Decide how visible your profile is to other people on TrackJobs.</p></div></div></div>

              <div className="settings-privacy-choice">
                <button className={privacy.profileVisibility === "public" ? "privacy-choice active" : "privacy-choice"} onClick={() => updatePrivacy("profileVisibility", "public")}><Eye size={18} /><div><strong>Public profile</strong><span>Your professional profile can be discovered by recruiters and hiring users.</span></div><span className="choice-dot" /></button>
                <button className={privacy.profileVisibility === "private" ? "privacy-choice active" : "privacy-choice"} onClick={() => updatePrivacy("profileVisibility", "private")}><EyeOff size={18} /><div><strong>Private profile</strong><span>Keep your profile less discoverable while you continue using TrackJobs.</span></div><span className="choice-dot" /></button>
              </div>

              <ToggleRow icon={<UsersRound size={18} />} title="Allow recruiter messages" description="Recruiters can start a professional conversation with you from TrackJobs." checked={privacy.allowRecruiterMessages} onChange={(v) => updatePrivacy("allowRecruiterMessages", v)} />

              <div className="settings-form-actions"><button className="btn" onClick={savePreferences} disabled={saving}>{saving ? "Saving..." : "Save privacy settings"}</button></div>
            </section>
          )}

          {activeSection === "data" && (
            <section className="settings-card">
              <div className="settings-card-heading"><div><span className="settings-icon"><Download size={19} /></span><div><h2>Your data</h2><p>Keep a copy of the account information currently stored in TrackJobs.</p></div></div></div>
              <div className="settings-data-box"><Download size={22} /><div><strong>Download your account data</strong><span>Export your profile and account information as a JSON file. Sensitive authentication secrets are excluded.</span></div><button className="outline" onClick={exportData} disabled={actionLoading === "export"}>{actionLoading === "export" ? "Preparing..." : "Download data"}</button></div>
            </section>
          )}

          {activeSection === "danger" && (
            <section className="settings-card danger-zone">
              <div className="settings-card-heading"><div><span className="settings-icon danger"><AlertTriangle size={19} /></span><div><h2>Account lifecycle</h2><p>These actions affect your access to TrackJobs.</p></div></div></div>

              <div className="danger-action">
                <div><strong>Deactivate account</strong><span>Temporarily disable access. Your account data remains stored so the account can be handled by support later.</span></div>
                <button className="outline danger-button" onClick={deactivate} disabled={actionLoading === "deactivate"}>{actionLoading === "deactivate" ? "Deactivating..." : "Deactivate"}</button>
              </div>

              <div className="delete-account-box">
                <div className="delete-account-heading"><Trash2 size={19} /><div><strong>Delete account</strong><span>This permanently removes your active identity from TrackJobs. Historical records may remain anonymized so application and hiring history is not corrupted.</span></div></div>
                <label>Type <strong>DELETE</strong> to confirm<input value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} placeholder="DELETE" autoComplete="off" /></label>
                {account?.authProvider !== "google" || account?.hasPassword ? (
                  <label>Account password<input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" /></label>
                ) : null}
                <button className="danger-solid" onClick={deleteAccount} disabled={actionLoading === "delete" || deleteConfirmation !== "DELETE"}>{actionLoading === "delete" ? "Deleting account..." : "Permanently delete account"}</button>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function ToggleRow({ icon, title, description, checked, onChange }) {
  return (
    <div className="settings-toggle-row">
      <span className="toggle-icon">{icon}</span>
      <div><strong>{title}</strong><span>{description}</span></div>
      <button type="button" className={checked ? "toggle on" : "toggle"} onClick={() => onChange(!checked)} aria-pressed={checked}><span /></button>
    </div>
  );
}
