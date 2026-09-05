import { useEffect, useMemo, useState } from "react";
import {
  User,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Link as LinkIcon,
  Github,
  Linkedin,
  Plus,
  Trash2,
  Save,
  FileText,
  Camera,
  Upload,
  Building2,
  Globe,
  Users,
} from "lucide-react";

import api, { getFileUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";

import "../styles/profile.css";

const emptyEducation = {
  degree: "",
  institution: "",
  fieldOfStudy: "",
  startYear: "",
  endYear: "",
  description: "",
};

const emptyExperience = {
  jobTitle: "",
  company: "",
  location: "",
  startDate: "",
  endDate: "",
  current: false,
  description: "",
};

export default function Profile() {
  const { updateUser } = useAuth();

  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    location: "",
    headline: "",
    bio: "",
    skills: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    preferredRole: "",
    preferredLocation: "",
    workModePreference: "",
    expectedSalaryMin: "",
    expectedSalaryMax: "",
    noticePeriod: "",
    profileVisibility: "public",
    company: "",
    industry: "",
    companySize: "",
    companyWebsite: "",
  });

  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get("/profile");

      const user = response.data?.profile || response.data;

      setProfile(user);

      setForm({
        name: user.name || "",
        phone: user.phone || "",
        location: user.location || "",
        headline: user.headline || "",
        bio: user.bio || "",
        skills: Array.isArray(user.skills)
          ? user.skills.join(", ")
          : "",
        linkedinUrl: user.linkedinUrl || "",
        githubUrl: user.githubUrl || "",
        portfolioUrl: user.portfolioUrl || "",
        preferredRole: user.preferredRole || "",
        preferredLocation: user.preferredLocation || "",
        workModePreference: user.workModePreference || "",
        expectedSalaryMin: user.expectedSalaryMin || "",
        expectedSalaryMax: user.expectedSalaryMax || "",
        noticePeriod: user.noticePeriod || "",
        profileVisibility: user.profileVisibility || "public",
        company: user.company || "",
        industry: user.industry || "",
        companySize: user.companySize || "",
        companyWebsite: user.companyWebsite || "",
      });

      setEducation(user.education || []);
      setExperience(user.experience || []);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to load profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleResumeChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setResumeFile(file);
  };

  const addEducation = () => {
    setEducation((prev) => [
      ...prev,
      { ...emptyEducation },
    ]);
  };

  const updateEducation = (index, field, value) => {
    setEducation((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const removeEducation = (index) => {
    setEducation((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const addExperience = () => {
    setExperience((prev) => [
      ...prev,
      { ...emptyExperience },
    ]);
  };

  const updateExperience = (index, field, value) => {
    setExperience((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const removeExperience = (index) => {
    setExperience((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const completion = useMemo(() => {
    const checks = [
      form.name,
      form.phone,
      form.location,
      form.headline,
      form.bio,
      form.skills,
      education.length > 0,
      experience.length > 0,
      profile?.resumeUrl,
      form.linkedinUrl,
      form.githubUrl,
      form.portfolioUrl,
    ];

    const completed = checks.filter(Boolean).length;

    return Math.round(
      (completed / checks.length) * 100
    );
  }, [form, education, experience, profile]);

  const saveProfile = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const isRecruiter = profile?.role === "recruiter";

      const skillsArray = form.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      let response;

      if (isRecruiter) {
        const recruiterPayload = {
          name: form.name,
          phone: form.phone,
          location: form.location,
          headline: form.headline,
          bio: form.bio,
          company: form.company,
          industry: form.industry,
          companySize: form.companySize,
          companyWebsite: form.companyWebsite,
          linkedinUrl: form.linkedinUrl,
        };

        if (avatarFile) {
          const formData = new FormData();

          Object.entries(recruiterPayload).forEach(
            ([key, value]) => {
              formData.append(key, value ?? "");
            }
          );

          formData.append("avatar", avatarFile);

          response = await api.put(
            "/profile",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
        } else {
          response = await api.put(
            "/profile",
            recruiterPayload
          );
        }
      } else {
        const {
          company,
          industry,
          companySize,
          companyWebsite,
          ...candidateForm
        } = form;

        const basePayload = {
          ...candidateForm,
          expectedSalaryMin: Number(
            form.expectedSalaryMin || 0
          ),
          expectedSalaryMax: Number(
            form.expectedSalaryMax || 0
          ),
        };

        if (avatarFile || resumeFile) {
        const formData = new FormData();

        const { skills, ...restPayload } = basePayload;

        Object.entries(restPayload).forEach(
          ([key, value]) => {
            formData.append(key, value ?? "");
          }
        );

        formData.append(
          "skills",
          JSON.stringify(skillsArray)
        );

        formData.append(
          "education",
          JSON.stringify(education)
        );

        formData.append(
          "experience",
          JSON.stringify(experience)
        );

        if (avatarFile) {
          formData.append("avatar", avatarFile);
        }

        if (resumeFile) {
          formData.append("resume", resumeFile);
        }

        response = await api.put(
          "/profile",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } else {

          response = await api.put(
            "/profile",
            {
              ...basePayload,
              skills: skillsArray,
              education,
              experience,
            }
          );
        }
      }

      const updated =
        response.data?.profile ||
        response.data;

      setProfile(updated);

      // Sync the global auth user immediately. This makes the new
      // avatar/name available everywhere (navbar, dashboards, etc.)
      // without requiring a logout/login or page refresh.
      updateUser(updated);

      setAvatarFile(null);
      setAvatarPreview("");
      setResumeFile(null);

      setMessage(
        "Profile updated successfully."
      );
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const isRecruiter = profile?.role === "recruiter";

  const recruiterCompletion = useMemo(() => {
    const checks = [
      form.name,
      form.phone,
      form.location,
      form.headline,
      form.bio,
      form.company,
      form.industry,
      form.companySize,
      form.companyWebsite,
      form.linkedinUrl,
    ];

    const completed = checks.filter(Boolean).length;

    return Math.round(
      (completed / checks.length) * 100
    );
  }, [form]);

  if (loading) {
    return (
      <main className="container">

        <div className="empty">
          Loading profile...
        </div>
      </main>
    );
  }

  if (isRecruiter) {
    return (
      <main className="container recruiter-profile-page">
        <div className="page-head">
          <div>
            <span className="eyebrow">
              Recruiter profile
            </span>

            <h1>Build your recruiter profile.</h1>

            <p>
              Help candidates understand who you are, where you recruit,
              and the company you represent.
            </p>
          </div>
        </div>

        <div className="recruiter-profile-progress-card">
          <div>
            <div className="recruiter-profile-progress-copy">
              <span className="recruiter-profile-progress-icon">
                <Briefcase size={18} />
              </span>

              <div>
                <strong>Profile readiness</strong>
                <span>
                  A complete recruiter profile builds trust with candidates.
                </span>
              </div>
            </div>

            <b>{recruiterCompletion}%</b>
          </div>

          <div className="profile-progress">
            <div
              style={{
                width: `${recruiterCompletion}%`,
              }}
            />
          </div>
        </div>

        <form onSubmit={saveProfile}>
          <section className="profile-section-card recruiter-profile-section">
            <div className="profile-section-heading">
              <div>
                <h2>Profile photo</h2>
                <p>Use a professional photo candidates can recognize.</p>
              </div>

              <Camera size={22} />
            </div>

            <div className="recruiter-photo-row">
              <label className="profile-avatar-upload-box recruiter-avatar-upload-box">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarChange}
                  hidden
                />

                {avatarPreview || profile?.avatar ? (
                  <img
                    className="profile-avatar-image"
                    src={
                      avatarPreview ||
                      getFileUrl(profile?.avatar)
                    }
                    alt="Recruiter profile avatar"
                  />
                ) : (
                  <span className="profile-avatar-placeholder">
                    {(profile?.name || "R")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}

                <span className="avatar-edit">
                  <Camera size={14} />
                </span>
              </label>

              <div className="recruiter-photo-copy">
                <strong>Professional profile image</strong>
                <p>
                  This photo appears next to your recruiter identity
                  throughout the hiring experience.
                </p>
                <span>JPG, PNG or WEBP · up to 5MB</span>
              </div>
            </div>
          </section>

          <section className="profile-section-card recruiter-profile-section">
            <div className="profile-section-heading">
              <div>
                <h2>Professional identity</h2>
                <p>Tell candidates who they are speaking with.</p>
              </div>

              <User size={22} />
            </div>

            <div className="profile-form-grid">
              <label>
                Full name
                <input
                  value={form.name}
                  onChange={(e) =>
                    updateField("name", e.target.value)
                  }
                  required
                />
              </label>

              <label>
                Email
                <input
                  value={profile?.email || ""}
                  disabled
                />
              </label>

              <label>
                Phone
                <input
                  value={form.phone}
                  onChange={(e) =>
                    updateField("phone", e.target.value)
                  }
                  placeholder="+91 98765 43210"
                />
              </label>

              <label>
                Location
                <input
                  value={form.location}
                  onChange={(e) =>
                    updateField("location", e.target.value)
                  }
                  placeholder="Gurugram, Haryana"
                />
              </label>

              <label className="full">
                Professional title
                <input
                  placeholder="Talent Acquisition Specialist"
                  value={form.headline}
                  onChange={(e) =>
                    updateField("headline", e.target.value)
                  }
                />
              </label>

              <label className="full">
                About you
                <textarea
                  rows="5"
                  placeholder="Introduce yourself, your hiring focus and the kind of candidates you work with..."
                  value={form.bio}
                  onChange={(e) =>
                    updateField("bio", e.target.value)
                  }
                />
              </label>
            </div>
          </section>

          <section className="profile-section-card recruiter-profile-section">
            <div className="profile-section-heading">
              <div>
                <h2>Company information</h2>
                <p>Give candidates useful context about the organization.</p>
              </div>

              <Building2 size={22} />
            </div>

            <div className="profile-form-grid">
              <label>
                Company name
                <input
                  value={form.company}
                  onChange={(e) =>
                    updateField("company", e.target.value)
                  }
                  placeholder="Acme Technologies"
                  required
                />
              </label>

              <label>
                Industry
                <input
                  value={form.industry}
                  onChange={(e) =>
                    updateField("industry", e.target.value)
                  }
                  placeholder="Information Technology"
                />
              </label>

              <label>
                Company size
                <select
                  value={form.companySize}
                  onChange={(e) =>
                    updateField("companySize", e.target.value)
                  }
                >
                  <option value="">Select company size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1,000 employees</option>
                  <option value="1001-5000">1,001-5,000 employees</option>
                  <option value="5001-10000">5,001-10,000 employees</option>
                  <option value="10000+">10,000+ employees</option>
                </select>
              </label>

              <label>
                Company website
                <div className="input-with-icon">
                  <Globe size={17} />
                  <input
                    type="url"
                    placeholder="https://company.com"
                    value={form.companyWebsite}
                    onChange={(e) =>
                      updateField("companyWebsite", e.target.value)
                    }
                  />
                </div>
              </label>

              <label className="full">
                Company LinkedIn
                <div className="input-with-icon">
                  <Linkedin size={17} />
                  <input
                    type="url"
                    placeholder="https://linkedin.com/company/..."
                    value={form.linkedinUrl}
                    onChange={(e) =>
                      updateField("linkedinUrl", e.target.value)
                    }
                  />
                </div>
              </label>
            </div>
          </section>

          <section className="profile-section-card recruiter-profile-section">
            <div className="profile-section-heading">
              <div>
                <h2>Hiring focus</h2>
                <p>Show candidates what your recruiting work is focused on.</p>
              </div>

              <Users size={22} />
            </div>

            <div className="recruiter-focus-card">
              <div className="recruiter-focus-icon">
                <Briefcase size={19} />
              </div>

              <div>
                <strong>Keep the hiring details in your jobs</strong>
                <p>
                  Role requirements, salary, experience, work mode and
                  application details belong to each job posting. Your profile
                  stays focused on your recruiter identity and company.
                </p>
              </div>
            </div>
          </section>

          <div className="profile-save-bar">
            {message && (
              <span
                className={
                  message.includes("successfully")
                    ? "success"
                    : "error"
                }
              >
                {message}
              </span>
            )}

            <button
              type="submit"
              className="btn"
              disabled={saving}
            >
              <Save size={17} />
              {saving ? "Saving..." : "Save recruiter profile"}
            </button>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main className="container candidate-profile-page">
      <div className="page-head">
        <div>
          <span className="eyebrow">
            Candidate profile
          </span>

          <h1>Build your professional profile.</h1>

          <p>
            Keep your profile complete so recruiters can
            understand your experience and skills.
          </p>
        </div>
      </div>

      <div className="profile-progress-card">
        <div>
          <strong>
            Profile completion
          </strong>

          <span>
            {completion}% complete
          </span>
        </div>

        <div className="profile-progress">
          <div
            style={{
              width: `${completion}%`,
            }}
          />
        </div>
      </div>

      <form onSubmit={saveProfile}>

        <section className="profile-section-card profile-photo-resume-card">
          <div className="profile-section-heading">
            <div>
              <h2>Photo &amp; resume</h2>
              <p>Recruiters see this on your application.</p>
            </div>

            <Camera size={22} />
          </div>

          <div className="profile-photo-resume-grid">

            <label className="profile-avatar-upload-box">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarChange}
                hidden
              />

              {avatarPreview || profile?.avatar ? (
                <img
                  className="profile-avatar-image"
                  src={
                    avatarPreview ||
                    getFileUrl(profile?.avatar)
                  }
                  alt="Profile avatar"
                />
              ) : (
                <span className="profile-avatar-placeholder">
                  {(profile?.name || "U")
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}

              <span className="avatar-edit">
                <Camera size={14} />
              </span>
            </label>

            <div className="profile-resume-upload-box">

              <input
                id="resume-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeChange}
                hidden
              />

              <label
                htmlFor="resume-upload"
                className="resume-upload-box"
              >
                <span className="resume-icon">
                  <Upload size={20} />
                </span>

                <div>
                  <strong>
                    {resumeFile
                      ? resumeFile.name
                      : "Upload resume"}
                  </strong>

                  <small>
                    PDF or Word, up to 5MB
                  </small>
                </div>
              </label>

              {profile?.resumeUrl && !resumeFile && (
                <div className="resume-existing">
                  <span>
                    <FileText size={14} />
                    Current resume on file
                  </span>

                  <a
                    href={getFileUrl(profile.resumeUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View
                  </a>
                </div>
              )}

            </div>

          </div>
        </section>

        <section className="profile-section-card">
          <div className="profile-section-heading">
            <div>
              <h2>Basic information</h2>
              <p>Your professional identity.</p>
            </div>

            <User size={22} />
          </div>

          <div className="profile-form-grid">
            <label>
              Full name
              <input
                value={form.name}
                onChange={(e) =>
                  updateField(
                    "name",
                    e.target.value
                  )
                }
                required
              />
            </label>

            <label>
              Email
              <input
                value={profile?.email || ""}
                disabled
              />
            </label>

            <label>
              Phone
              <input
                value={form.phone}
                onChange={(e) =>
                  updateField(
                    "phone",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Location
              <input
                value={form.location}
                onChange={(e) =>
                  updateField(
                    "location",
                    e.target.value
                  )
                }
              />
            </label>

            <label className="full">
              Professional headline
              <input
                placeholder="MERN Stack Developer | Node.js | MongoDB"
                value={form.headline}
                onChange={(e) =>
                  updateField(
                    "headline",
                    e.target.value
                  )
                }
              />
            </label>

            <label className="full">
              About
              <textarea
                rows="5"
                placeholder="Write a short professional summary..."
                value={form.bio}
                onChange={(e) =>
                  updateField(
                    "bio",
                    e.target.value
                  )
                }
              />
            </label>

            <label className="full">
              Skills
              <input
                placeholder="React, Node.js, MongoDB, Express, JavaScript"
                value={form.skills}
                onChange={(e) =>
                  updateField(
                    "skills",
                    e.target.value
                  )
                }
              />

              <small>
                Separate skills using commas.
              </small>
            </label>
          </div>
        </section>

        <section className="profile-section-card">
          <div className="profile-section-heading">
            <div>
              <h2>Experience</h2>
              <p>Add your work history.</p>
            </div>

            <Briefcase size={22} />
          </div>

          {experience.map((item, index) => (
            <div
              className="dynamic-profile-card"
              key={item._id || index}
            >
              <div className="dynamic-card-head">
                <strong>
                  Experience #{index + 1}
                </strong>

                <button
                  type="button"
                  className="danger-icon"
                  onClick={() =>
                    removeExperience(index)
                  }
                >
                  <Trash2 size={17} />
                </button>
              </div>

              <div className="profile-form-grid">
                <label>
                  Job title
                  <input
                    value={item.jobTitle || ""}
                    onChange={(e) =>
                      updateExperience(
                        index,
                        "jobTitle",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Company
                  <input
                    value={item.company || ""}
                    onChange={(e) =>
                      updateExperience(
                        index,
                        "company",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Location
                  <input
                    value={item.location || ""}
                    onChange={(e) =>
                      updateExperience(
                        index,
                        "location",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Start date
                  <input
                    type="date"
                    value={
                      item.startDate
                        ? String(
                            item.startDate
                          ).slice(0, 10)
                        : ""
                    }
                    onChange={(e) =>
                      updateExperience(
                        index,
                        "startDate",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  End date
                  <input
                    type="date"
                    disabled={item.current}
                    value={
                      item.endDate
                        ? String(
                            item.endDate
                          ).slice(0, 10)
                        : ""
                    }
                    onChange={(e) =>
                      updateExperience(
                        index,
                        "endDate",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={Boolean(
                      item.current
                    )}
                    onChange={(e) =>
                      updateExperience(
                        index,
                        "current",
                        e.target.checked
                      )
                    }
                  />
                  Currently working here
                </label>

                <label className="full">
                  Description
                  <textarea
                    rows="4"
                    value={
                      item.description || ""
                    }
                    onChange={(e) =>
                      updateExperience(
                        index,
                        "description",
                        e.target.value
                      )
                    }
                  />
                </label>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="outline"
            onClick={addExperience}
          >
            <Plus size={17} />
            Add experience
          </button>
        </section>

        <section className="profile-section-card">
          <div className="profile-section-heading">
            <div>
              <h2>Education</h2>
              <p>Add your academic background.</p>
            </div>

            <GraduationCap size={22} />
          </div>

          {education.map((item, index) => (
            <div
              className="dynamic-profile-card"
              key={item._id || index}
            >
              <div className="dynamic-card-head">
                <strong>
                  Education #{index + 1}
                </strong>

                <button
                  type="button"
                  className="danger-icon"
                  onClick={() =>
                    removeEducation(index)
                  }
                >
                  <Trash2 size={17} />
                </button>
              </div>

              <div className="profile-form-grid">
                <label>
                  Degree
                  <input
                    value={item.degree || ""}
                    onChange={(e) =>
                      updateEducation(
                        index,
                        "degree",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Institution
                  <input
                    value={
                      item.institution || ""
                    }
                    onChange={(e) =>
                      updateEducation(
                        index,
                        "institution",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Field of study
                  <input
                    value={
                      item.fieldOfStudy || ""
                    }
                    onChange={(e) =>
                      updateEducation(
                        index,
                        "fieldOfStudy",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Start year
                  <input
                    value={
                      item.startYear || ""
                    }
                    onChange={(e) =>
                      updateEducation(
                        index,
                        "startYear",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label>
                  End year
                  <input
                    value={
                      item.endYear || ""
                    }
                    onChange={(e) =>
                      updateEducation(
                        index,
                        "endYear",
                        e.target.value
                      )
                    }
                  />
                </label>

                <label className="full">
                  Description
                  <textarea
                    rows="3"
                    value={
                      item.description || ""
                    }
                    onChange={(e) =>
                      updateEducation(
                        index,
                        "description",
                        e.target.value
                      )
                    }
                  />
                </label>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="outline"
            onClick={addEducation}
          >
            <Plus size={17} />
            Add education
          </button>
        </section>

        <section className="profile-section-card">
          <div className="profile-section-heading">
            <div>
              <h2>Professional links</h2>
              <p>Let recruiters explore your work.</p>
            </div>

            <LinkIcon size={22} />
          </div>

          <div className="profile-form-grid">
            <label>
              LinkedIn
              <div className="input-with-icon">
                <Linkedin size={17} />
                <input
                  placeholder="https://linkedin.com/in/..."
                  value={form.linkedinUrl}
                  onChange={(e) =>
                    updateField(
                      "linkedinUrl",
                      e.target.value
                    )
                  }
                />
              </div>
            </label>

            <label>
              GitHub
              <div className="input-with-icon">
                <Github size={17} />
                <input
                  placeholder="https://github.com/..."
                  value={form.githubUrl}
                  onChange={(e) =>
                    updateField(
                      "githubUrl",
                      e.target.value
                    )
                  }
                />
              </div>
            </label>

            <label>
              Portfolio
              <div className="input-with-icon">
                <LinkIcon size={17} />
                <input
                  placeholder="https://yourportfolio.com"
                  value={form.portfolioUrl}
                  onChange={(e) =>
                    updateField(
                      "portfolioUrl",
                      e.target.value
                    )
                  }
                />
              </div>
            </label>
          </div>
        </section>

        <section className="profile-section-card">
          <div className="profile-section-heading">
            <div>
              <h2>Job preferences</h2>
              <p>
                Help us understand what opportunities you
                are looking for.
              </p>
            </div>
          </div>

          <div className="profile-form-grid">
            <label>
              Preferred role
              <input
                value={form.preferredRole}
                onChange={(e) =>
                  updateField(
                    "preferredRole",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Preferred location
              <input
                value={form.preferredLocation}
                onChange={(e) =>
                  updateField(
                    "preferredLocation",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Work mode
              <select
                value={form.workModePreference}
                onChange={(e) =>
                  updateField(
                    "workModePreference",
                    e.target.value
                  )
                }
              >
                <option value="">Select</option>
                <option value="On-site">On-site</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
              </select>
            </label>

            <label>
              Notice period
              <input
                value={form.noticePeriod}
                onChange={(e) =>
                  updateField(
                    "noticePeriod",
                    e.target.value
                  )
                }
                placeholder="15 days"
              />
            </label>

            <label>
              Expected salary - minimum
              <input
                type="number"
                min="0"
                value={form.expectedSalaryMin}
                onChange={(e) =>
                  updateField(
                    "expectedSalaryMin",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Expected salary - maximum
              <input
                type="number"
                min="0"
                value={form.expectedSalaryMax}
                onChange={(e) =>
                  updateField(
                    "expectedSalaryMax",
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Profile visibility
              <select
                value={form.profileVisibility}
                onChange={(e) =>
                  updateField(
                    "profileVisibility",
                    e.target.value
                  )
                }
              >
                <option value="public">
                  Public
                </option>
                <option value="private">
                  Private
                </option>
              </select>
            </label>
          </div>
        </section>

        <div className="profile-save-bar">
          {message && (
            <span
              className={
                message.includes("successfully")
                  ? "success"
                  : "error"
              }
            >
              {message}
            </span>
          )}

          <button
            type="submit"
            className="btn"
            disabled={saving}
          >
            <Save size={17} />
            {saving
              ? "Saving..."
              : "Save profile"}
          </button>
        </div>
      </form>
    </main>
  );
}