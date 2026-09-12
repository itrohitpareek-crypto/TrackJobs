import nodemailer from "nodemailer";

const FRONTEND_URL =
  process.env.CLIENT_URL ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173";


// =====================================================
// HTML ESCAPE
// =====================================================

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");


// =====================================================
// SMTP TRANSPORTER
// =====================================================

const createTransporter = () => {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    throw new Error(
      "SMTP email configuration is missing. Set SMTP_HOST, SMTP_USER and SMTP_PASS."
    );
  }

  return nodemailer.createTransport({
    host:
      process.env.SMTP_HOST,

    port:
      Number(
        process.env.SMTP_PORT ||
          587
      ),

    secure:
      String(
        process.env.SMTP_PORT ||
          587
      ) === "465",

    auth: {
      user:
        process.env.SMTP_USER,

      pass:
        process.env.SMTP_PASS,
    },
  });
};


// =====================================================
// GENERIC SEND
// =====================================================

const send = async ({
  to,
  subject,
  text,
  html,
}) => {
  if (!to) {
    return null;
  }

  const transporter =
    createTransporter();

  return transporter.sendMail({
    from:
      process.env.SMTP_FROM ||
      `TrackJobs <${process.env.SMTP_USER}>`,

    to,

    subject,

    text,

    html,
  });
};


// =====================================================
// COMMON EMAIL LAYOUT
// =====================================================

const layout = (content) => `
  <div
    style="
      margin:0;
      padding:32px 16px;
      background:#f6f7fb;
      font-family:Arial,Helvetica,sans-serif;
      color:#172033;
    "
  >
    <div
      style="
        max-width:620px;
        margin:0 auto;
        background:#ffffff;
        border:1px solid #e5e7eb;
        border-radius:18px;
        overflow:hidden;
      "
    >
      <div
        style="
          padding:22px 26px;
          background:linear-gradient(
            135deg,
            #4f46e5,
            #6366f1
          );
          color:#fff;
        "
      >
        <div
          style="
            font-size:20px;
            font-weight:800;
            letter-spacing:-.02em;
          "
        >
          TrackJobs
        </div>

        <div
          style="
            font-size:12px;
            opacity:.9;
            margin-top:4px;
          "
        >
          Professional hiring & career platform
        </div>
      </div>

      <div
        style="
          padding:28px 26px;
          line-height:1.65;
          font-size:14px;
        "
      >
        ${content}
      </div>

      <div
        style="
          padding:18px 26px;
          background:#f8fafc;
          color:#64748b;
          font-size:11px;
        "
      >
        This is an automated email from TrackJobs.
        Please do not reply if you do not recognize this activity.
      </div>
    </div>
  </div>
`;


// =====================================================
// WELCOME EMAIL
// =====================================================

export const sendWelcomeEmail =
  async (user) => {
    const name =
      escapeHtml(
        user?.name ||
          "there"
      );

    return send({
      to: user?.email,

      subject:
        "Welcome to TrackJobs 👋",

      text:
        `Hi ${
          user?.name ||
          "there"
        }, welcome to TrackJobs. Your account has been created successfully. Visit ${FRONTEND_URL} to continue.`,

      html: layout(`
        <h2
          style="
            margin:0 0 10px;
            color:#0f172a;
          "
        >
          Welcome to TrackJobs, ${name}!
        </h2>

        <p>
          Your account has been created successfully.
        </p>

        <p>
          You can now search jobs, manage applications,
          connect with recruiters and receive important
          hiring updates.
        </p>

        <p style="margin-top:24px">
          <a
            href="${escapeHtml(
              FRONTEND_URL
            )}"
            style="
              display:inline-block;
              padding:12px 18px;
              border-radius:9px;
              background:#4f46e5;
              color:#fff;
              text-decoration:none;
              font-weight:700;
            "
          >
            Open TrackJobs
          </a>
        </p>
      `),
    });
  };


// =====================================================
// PASSWORD RESET EMAIL
// =====================================================

export const sendPasswordResetEmail =
  async (
    user,
    rawToken
  ) => {
    const resetUrl =
      `${FRONTEND_URL}/reset-password/${rawToken}`;

    const name =
      escapeHtml(
        user?.name ||
          "there"
      );

    return send({
      to: user?.email,

      subject:
        "Reset your TrackJobs password",

      text:
        `Hi ${
          user?.name ||
          "there"
        }, reset your TrackJobs password here: ${resetUrl}. This link expires in 15 minutes and can be used once.`,

      html: layout(`
        <h2
          style="
            margin:0 0 10px;
            color:#0f172a;
          "
        >
          Reset your password
        </h2>

        <p>
          Hi ${name}, we received a request
          to reset your TrackJobs password.
        </p>

        <p>
          This secure link expires in
          <strong>15 minutes</strong>
          and can be used only once.
        </p>

        <p style="margin:24px 0">
          <a
            href="${escapeHtml(
              resetUrl
            )}"
            style="
              display:inline-block;
              padding:12px 18px;
              border-radius:9px;
              background:#4f46e5;
              color:#fff;
              text-decoration:none;
              font-weight:700;
            "
          >
            Reset password
          </a>
        </p>

        <p
          style="
            font-size:12px;
            color:#64748b;
          "
        >
          If you did not request this,
          you can safely ignore this email.
        </p>
      `),
    });
  };


// =====================================================
// NOTIFICATION EMAIL
// =====================================================

export const sendNotificationEmail =
  async ({
    user,
    title,
    message,
    link,
  }) => {
    const safeTitle =
      escapeHtml(
        title ||
          "TrackJobs notification"
      );

    const safeMessage =
      escapeHtml(
        message ||
          "You have a new TrackJobs update."
      );

    const absoluteLink =
      link
        ? String(
            link
          ).startsWith(
            "http"
          )
          ? String(link)
          : `${FRONTEND_URL}${
              String(
                link
              ).startsWith(
                "/"
              )
                ? ""
                : "/"
            }${link}`
        : FRONTEND_URL;

    return send({
      to: user?.email,

      subject:
        `TrackJobs: ${
          title ||
          "New notification"
        }`,

      text:
        `${
          title ||
          "TrackJobs notification"
        }\n\n${
          message ||
          "You have a new TrackJobs update."
        }\n\nOpen TrackJobs: ${absoluteLink}`,

      html: layout(`
        <h2
          style="
            margin:0 0 10px;
            color:#0f172a;
          "
        >
          ${safeTitle}
        </h2>

        <p>
          ${safeMessage}
        </p>

        <p style="margin-top:24px">
          <a
            href="${escapeHtml(
              absoluteLink
            )}"
            style="
              display:inline-block;
              padding:12px 18px;
              border-radius:9px;
              background:#4f46e5;
              color:#fff;
              text-decoration:none;
              font-weight:700;
            "
          >
            View in TrackJobs
          </a>
        </p>
      `),
    });
  };


// =====================================================
// EXPORTS
// =====================================================

export {
  escapeHtml,
  FRONTEND_URL,
};