import User from "../models/User.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";

const safeDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN") : "—";

export const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCandidates,
      totalRecruiters,
      totalAdmins,
      totalJobs,
      activeJobs,
      draftJobs,
      closedJobs,
      totalApplications,
      recentUsers,
      recentJobs,
      recentApplications,
      applicationStatus,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "candidate" }),
      User.countDocuments({ role: "recruiter" }),
      User.countDocuments({ role: "admin" }),
      Job.countDocuments(),
      Job.countDocuments({ status: "active" }),
      Job.countDocuments({ status: "draft" }),
      Job.countDocuments({ status: "closed" }),
      Application.countDocuments(),

      User.find()
        .select("name email role avatar company createdAt")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),

      Job.find()
        .populate("recruiter", "name email company")
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),

      Application.find()
        .populate("candidate", "name email")
        .populate("job", "title company")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),

      Application.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]),
    ]);

    const statusMap = applicationStatus.reduce((acc, item) => {
      acc[item._id || "Unknown"] = item.count;
      return acc;
    }, {});

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCandidates,
        totalRecruiters,
        totalAdmins,
        totalJobs,
        activeJobs,
        draftJobs,
        closedJobs,
        totalApplications,
        statusMap,
        recentUsers,
        recentJobs,
        recentApplications,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load admin statistics",
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load users",
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    const allowedRoles = [
      "candidate",
      "recruiter",
      "admin",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      user._id.toString() ===
      req.user._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot change your own role",
      });
    }

    user.role = role;

    await user.save();

    res.json({
      success: true,
      message: "User role updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update role error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update user role",
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      user._id.toString() ===
      req.user._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot delete your own account",
      });
    }

    await Application.deleteMany({
      candidate: user._id,
    });

    await Job.deleteMany({
      recruiter: user._id,
    });

    await User.findByIdAndDelete(user._id);

    res.json({
      success: true,
      message:
        "User and related platform data deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate(
        "recruiter",
        "name email company"
      )
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error("Get jobs error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load jobs",
    });
  }
};

export const updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (
      ![
        "draft",
        "active",
        "closed",
      ].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid job status",
      });
    }

    const job =
      await Job.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      ).populate(
        "recruiter",
        "name email company"
      );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.json({
      success: true,
      message:
        "Job status updated successfully",
      job,
    });
  } catch (error) {
    console.error(
      "Update job status error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update job status",
    });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(
      req.params.id
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    await Application.deleteMany({
      job: job._id,
    });

    await Job.findByIdAndDelete(job._id);

    res.json({
      success: true,
      message:
        "Job and related applications deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete job error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete job",
    });
  }
};

export const getAllApplications = async (
  req,
  res
) => {
  try {
    const applications =
      await Application.find()
        .populate(
          "candidate",
          "name email skills"
        )
        .populate(
          "job",
          "title company status"
        )
        .sort({ createdAt: -1 })
        .lean();

    res.json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error(
      "Get applications error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load applications",
    });
  }
};