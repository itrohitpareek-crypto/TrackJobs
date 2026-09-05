import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import api, { getFileUrl } from "../services/api";
import "../styles/adminDashboard.css";

const tabs = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: Users },
  { id: "jobs", label: "Jobs", icon: BriefcaseBusiness },
  { id: "applications", label: "Applications", icon: ClipboardList },
];

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const roleLabel = (role) =>
  role ? role.charAt(0).toUpperCase() + role.slice(1) : "Unknown";

const statusClass = (status = "") =>
  status.toLowerCase().replace(/\s+/g, "-");

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCandidates: 0,
    totalRecruiters: 0,
    totalAdmins: 0,
    totalJobs: 0,
    activeJobs: 0,
    draftJobs: 0,
    closedJobs: 0,
    totalApplications: 0,
    statusMap: {},
    recentUsers: [],
    recentJobs: [],
    recentApplications: [],
  });
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [applicationFilter, setApplicationFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

  const loadDashboard = async (silent = false) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError("");

      const [statsResponse, usersResponse, jobsResponse, applicationsResponse] =
        await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/users"),
          api.get("/admin/jobs"),
          api.get("/admin/applications"),
        ]);

      setStats((current) => ({
        ...current,
        ...(statsResponse.data?.stats || {}),
      }));
      setUsers(usersResponse.data?.users || []);
      setJobs(jobsResponse.data?.jobs || []);
      setApplications(applicationsResponse.data?.applications || []);
    } catch (err) {
      console.error("Admin dashboard error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load the admin dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") loadDashboard();
  }, [user]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((item) => {
      const matchesRole = roleFilter === "all" || item.role === roleFilter;
      const haystack = [item.name, item.email, item.company, item.location]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesRole && (!term || haystack.includes(term));
    });
  }, [users, search, roleFilter]);

  const filteredJobs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return jobs.filter((item) => {
      const matchesStatus = jobFilter === "all" || item.status === jobFilter;
      const haystack = [
        item.title,
        item.company,
        item.location,
        item.recruiter?.name,
        item.recruiter?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesStatus && (!term || haystack.includes(term));
    });
  }, [jobs, search, jobFilter]);

  const filteredApplications = useMemo(() => {
    const term = search.trim().toLowerCase();
    return applications.filter((item) => {
      const matchesStatus =
        applicationFilter === "all" || item.status === applicationFilter;
      const haystack = [
        item.candidate?.name,
        item.candidate?.email,
        item.job?.title,
        item.job?.company,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesStatus && (!term || haystack.includes(term));
    });
  }, [applications, search, applicationFilter]);

  const confirmAction = (message) => window.confirm(message);

  const handleDeleteUser = async (id) => {
    if (!confirmAction("Delete this user and their related jobs/applications?")) return;
    try {
      setActionId(id);
      await api.delete(`/admin/users/${id}`);
      await loadDashboard(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user.");
    } finally {
      setActionId("");
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      setActionId(id);
      await api.patch(`/admin/users/${id}/role`, { role });
      setUsers((current) =>
        current.map((item) =>
          item._id === id ? { ...item, role } : item
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user role.");
      await loadDashboard(true);
    } finally {
      setActionId("");
    }
  };

  const handleJobStatus = async (id, status) => {
    try {
      setActionId(id);
      const response = await api.patch(`/admin/jobs/${id}/status`, { status });
      const updated = response.data?.job;
      setJobs((current) =>
        current.map((item) =>
          item._id === id ? { ...item, ...(updated || {}), status } : item
        )
      );
      setStats((current) => {
        const next = { ...current };
        next.activeJobs = jobs.filter((item) =>
          item._id === id ? status === "active" : item.status === "active"
        ).length;
        return next;
      });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update job status.");
    } finally {
      setActionId("");
    }
  };

  const handleDeleteJob = async (id) => {
    if (!confirmAction("Delete this job and all applications attached to it?")) return;
    try {
      setActionId(id);
      await api.delete(`/admin/jobs/${id}`);
      await loadDashboard(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete job.");
    } finally {
      setActionId("");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setJobFilter("all");
    setApplicationFilter("all");
  };

  if (loading) {
    return (
      <main className="admin-page">
        <div className="admin-loading">
          <div className="admin-loader" />
          <p>Preparing your admin workspace…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <div className="admin-container">
        <section className="admin-hero">
          <div className="admin-hero-copy">
            <div className="admin-eyebrow">
              <span className="admin-eyebrow-dot" />
              PLATFORM CONTROL CENTER
            </div>
            <h1>Good to see you, {user?.name?.split(" ")[0] || "Admin"}.</h1>
            <p>
              Monitor the TrackJobs marketplace, moderate job listings,
              manage accounts and keep the hiring experience healthy.
            </p>
          </div>

          <div className="admin-hero-actions">
            <button
              className="admin-secondary-btn"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
            >
              <RefreshCw size={15} className={refreshing ? "spin" : ""} />
              {refreshing ? "Refreshing" : "Refresh"}
            </button>
            <button className="admin-primary-btn" onClick={() => navigate("/")}>
              View platform <ChevronRight size={15} />
            </button>
          </div>
        </section>

        {error && (
          <div className="admin-alert">
            <AlertTriangle size={17} />
            <span>{error}</span>
            <button onClick={() => loadDashboard()}>Retry</button>
          </div>
        )}

        <section className="admin-kpi-grid">
          <div className="admin-kpi-card accent-primary">
            <div className="admin-kpi-top"><span>Total users</span><span className="admin-kpi-icon"><Users size={17} /></span></div>
            <strong>{stats.totalUsers}</strong>
            <small>{stats.totalCandidates} candidates · {stats.totalRecruiters} recruiters</small>
          </div>
          <div className="admin-kpi-card accent-green">
            <div className="admin-kpi-top"><span>Live jobs</span><span className="admin-kpi-icon"><BriefcaseBusiness size={17} /></span></div>
            <strong>{stats.activeJobs}</strong>
            <small>{stats.draftJobs} drafts · {stats.closedJobs} closed</small>
          </div>
          <div className="admin-kpi-card accent-orange">
            <div className="admin-kpi-top"><span>Applications</span><span className="admin-kpi-icon"><FileText size={17} /></span></div>
            <strong>{stats.totalApplications}</strong>
            <small>Across the TrackJobs marketplace</small>
          </div>
          <div className="admin-kpi-card accent-blue">
            <div className="admin-kpi-top"><span>Platform admins</span><span className="admin-kpi-icon"><ShieldCheck size={17} /></span></div>
            <strong>{stats.totalAdmins}</strong>
            <small>Protected administrator accounts</small>
          </div>
        </section>

        <section className="admin-workspace">
          <aside className="admin-sidebar">
            <div className="admin-sidebar-title">Workspace</div>
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`admin-tab ${activeTab === id ? "active" : ""}`}
                onClick={() => {
                  setActiveTab(id);
                  resetFilters();
                }}
              >
                <Icon size={17} />
                <span>{label}</span>
                {id === "users" && <b>{users.length}</b>}
                {id === "jobs" && <b>{jobs.length}</b>}
                {id === "applications" && <b>{applications.length}</b>}
              </button>
            ))}
            <div className="admin-sidebar-note">
              <Activity size={16} />
              <div>
                <strong>Admin mode</strong>
                <span>Changes here affect the live platform.</span>
              </div>
            </div>
          </aside>

          <div className="admin-content">
            {activeTab === "overview" && (
              <div className="admin-overview">
                <div className="admin-section-heading">
                  <div>
                    <span>PLATFORM PULSE</span>
                    <h2>What needs your attention?</h2>
                  </div>
                  <span className="admin-live"><i /> Live data</span>
                </div>

                <div className="admin-overview-grid">
                  <section className="admin-panel admin-health-panel">
                    <div className="admin-panel-head">
                      <div><strong>Marketplace health</strong><span>Current inventory snapshot</span></div>
                      <TrendingUp size={18} />
                    </div>
                    <div className="admin-health-list">
                      <div><span>Active jobs</span><b>{stats.activeJobs}</b><em>{stats.totalJobs ? Math.round((stats.activeJobs / stats.totalJobs) * 100) : 0}% of all jobs</em></div>
                      <div><span>Candidates</span><b>{stats.totalCandidates}</b><em>{stats.totalUsers ? Math.round((stats.totalCandidates / stats.totalUsers) * 100) : 0}% of users</em></div>
                      <div><span>Recruiters</span><b>{stats.totalRecruiters}</b><em>{stats.totalUsers ? Math.round((stats.totalRecruiters / stats.totalUsers) * 100) : 0}% of users</em></div>
                    </div>
                  </section>

                  <section className="admin-panel">
                    <div className="admin-panel-head">
                      <div><strong>Application funnel</strong><span>All-time status distribution</span></div>
                      <ClipboardList size={18} />
                    </div>
                    <div className="admin-funnel">
                      {Object.entries(stats.statusMap || {}).slice(0, 6).map(([label, count]) => {
                        const max = Math.max(...Object.values(stats.statusMap || {}).map(Number), 1);
                        return (
                          <div className="admin-funnel-row" key={label}>
                            <div><span>{label}</span><b>{count}</b></div>
                            <div className="admin-progress"><i style={{ width: `${Math.max(5, (Number(count) / max) * 100)}%` }} /></div>
                          </div>
                        );
                      })}
                      {!Object.keys(stats.statusMap || {}).length && <div className="admin-empty-small">No application data yet.</div>}
                    </div>
                  </section>
                </div>

                <div className="admin-section-heading compact-heading">
                  <div><span>RECENT ACTIVITY</span><h2>Latest on TrackJobs</h2></div>
                </div>

                <div className="admin-activity-grid">
                  <section className="admin-panel">
                    <div className="admin-panel-head"><div><strong>New users</strong><span>Most recently registered</span></div><UserRound size={18} /></div>
                    <div className="admin-mini-list">
                      {stats.recentUsers.map((item) => (
                        <div className="admin-mini-item" key={item._id}>
                          <div className="admin-avatar-sm">{item.avatar ? <img src={getFileUrl(item.avatar)} alt="" /> : item.name?.charAt(0)?.toUpperCase() || "U"}</div>
                          <div><strong>{item.name || "Unnamed user"}</strong><span>{item.email}</span></div>
                          <em className={`admin-role ${item.role}`}>{roleLabel(item.role)}</em>
                        </div>
                      ))}
                      {!stats.recentUsers.length && <div className="admin-empty-small">No users yet.</div>}
                    </div>
                  </section>

                  <section className="admin-panel">
                    <div className="admin-panel-head"><div><strong>Latest jobs</strong><span>Newest listings on the platform</span></div><BriefcaseBusiness size={18} /></div>
                    <div className="admin-mini-list">
                      {stats.recentJobs.map((item) => (
                        <div className="admin-mini-item" key={item._id}>
                          <div className="admin-job-icon">{item.company?.charAt(0)?.toUpperCase() || "J"}</div>
                          <div><strong>{item.title || "Untitled job"}</strong><span>{item.company || "Company"} · {formatDate(item.createdAt)}</span></div>
                          <em className={`admin-status ${statusClass(item.status)}`}>{item.status || "active"}</em>
                        </div>
                      ))}
                      {!stats.recentJobs.length && <div className="admin-empty-small">No jobs yet.</div>}
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <section className="admin-panel admin-table-panel">
                <div className="admin-section-heading">
                  <div><span>ACCOUNT MANAGEMENT</span><h2>Users & permissions</h2></div>
                  <span className="admin-count">{filteredUsers.length} shown</span>
                </div>
                <div className="admin-toolbar">
                  <label className="admin-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, company…" /></label>
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}><option value="all">All roles</option><option value="candidate">Candidates</option><option value="recruiter">Recruiters</option><option value="admin">Admins</option></select>
                </div>
                <div className="admin-table-scroll">
                  <table className="admin-table">
                    <thead><tr><th>User</th><th>Role</th><th>Company / location</th><th>Joined</th><th>Action</th></tr></thead>
                    <tbody>
                      {filteredUsers.map((item) => (
                        <tr key={item._id}>
                          <td><div className="admin-user-cell"><div className="admin-avatar-md">{item.avatar ? <img src={getFileUrl(item.avatar)} alt="" /> : item.name?.charAt(0)?.toUpperCase() || "U"}</div><div><strong>{item.name || "Unnamed"}</strong><span>{item.email}</span></div></div></td>
                          <td><select className={`admin-role-select ${item.role}`} value={item.role || "candidate"} disabled={item._id === user?._id || actionId === item._id} onChange={(e) => handleRoleChange(item._id, e.target.value)}><option value="candidate">Candidate</option><option value="recruiter">Recruiter</option><option value="admin">Admin</option></select></td>
                          <td><div className="admin-muted-cell"><strong>{item.company || "Independent"}</strong><span>{item.location || "Location not set"}</span></div></td>
                          <td>{formatDate(item.createdAt)}</td>
                          <td>{item._id !== user?._id ? <button className="admin-icon-danger" disabled={actionId === item._id} onClick={() => handleDeleteUser(item._id)} title="Delete user"><Trash2 size={15} /></button> : <span className="admin-self-label">You</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!filteredUsers.length && <div className="admin-empty">No users match your filters.</div>}
                </div>
              </section>
            )}

            {activeTab === "jobs" && (
              <section className="admin-panel admin-table-panel">
                <div className="admin-section-heading">
                  <div><span>CONTENT MODERATION</span><h2>Job listings</h2></div>
                  <span className="admin-count">{filteredJobs.length} shown</span>
                </div>
                <div className="admin-toolbar">
                  <label className="admin-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, company, recruiter…" /></label>
                  <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="draft">Draft</option><option value="closed">Closed</option></select>
                </div>
                <div className="admin-job-list">
                  {filteredJobs.map((job) => (
                    <article className="admin-job-row" key={job._id}>
                      <div className="admin-job-icon large">{job.company?.charAt(0)?.toUpperCase() || "J"}</div>
                      <div className="admin-job-main"><div className="admin-job-title-line"><h3>{job.title || "Untitled job"}</h3><span className={`admin-status ${statusClass(job.status)}`}>{job.status || "active"}</span></div><p>{job.company || "Company"} · {job.location || "Location not specified"}</p><small>Posted by {job.recruiter?.name || "Recruiter"} · {formatDate(job.createdAt)} · {job.applicationsCount || 0} applications</small></div>
                      <div className="admin-job-actions"><select value={job.status || "active"} disabled={actionId === job._id} onChange={(e) => handleJobStatus(job._id, e.target.value)}><option value="active">Active</option><option value="draft">Draft</option><option value="closed">Closed</option></select><button className="admin-view-btn" onClick={() => navigate(`/jobs/${job._id}`)}><Eye size={14} /> View</button><button className="admin-icon-danger" disabled={actionId === job._id} onClick={() => handleDeleteJob(job._id)} title="Delete job"><Trash2 size={15} /></button></div>
                    </article>
                  ))}
                  {!filteredJobs.length && <div className="admin-empty">No jobs match your filters.</div>}
                </div>
              </section>
            )}

            {activeTab === "applications" && (
              <section className="admin-panel admin-table-panel">
                <div className="admin-section-heading">
                  <div><span>HIRING ACTIVITY</span><h2>Application monitoring</h2></div>
                  <span className="admin-count">{filteredApplications.length} shown</span>
                </div>
                <div className="admin-toolbar">
                  <label className="admin-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidate or job…" /></label>
                  <select value={applicationFilter} onChange={(e) => setApplicationFilter(e.target.value)}><option value="all">All statuses</option>{["Applied", "Under Review", "Shortlisted", "Interview Scheduled", "Interviewed", "Selected", "Rejected", "Withdrawn"].map((item) => <option key={item} value={item}>{item}</option>)}</select>
                </div>
                <div className="admin-table-scroll">
                  <table className="admin-table applications-table">
                    <thead><tr><th>Candidate</th><th>Position</th><th>Company</th><th>Status</th><th>Applied</th></tr></thead>
                    <tbody>
                      {filteredApplications.map((item) => (
                        <tr key={item._id}><td><div className="admin-user-cell"><div className="admin-avatar-md">{item.candidate?.name?.charAt(0)?.toUpperCase() || "C"}</div><div><strong>{item.candidate?.name || "Unknown candidate"}</strong><span>{item.candidate?.email || "—"}</span></div></div></td><td><strong>{item.job?.title || "Unknown position"}</strong></td><td>{item.job?.company || "—"}</td><td><span className={`admin-status application ${statusClass(item.status)}`}>{item.status || "Applied"}</span></td><td>{formatDate(item.createdAt)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  {!filteredApplications.length && <div className="admin-empty">No applications match your filters.</div>}
                </div>
              </section>
            )}
          </div>
        </section>

        <footer className="admin-footer-bar">
          <div><ShieldCheck size={16} /><span>Admin access is restricted to administrator accounts.</span></div>
          <span>TrackJobs Platform Control · {new Date().getFullYear()}</span>
        </footer>
      </div>
    </main>
  );
}
