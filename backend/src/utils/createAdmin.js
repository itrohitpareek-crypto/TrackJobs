import "dotenv/config";

import bcrypt from "bcryptjs";

import { connectDB } from "../config/db.js";

import User from "../models/User.js";


const createAdmin = async () => {
  try {
    await connectDB();

    const email =
      "admin@jobtrackpro.com";

    const password =
      "Admin@12345";


    const existingAdmin =
      await User.findOne({
        email,
      });


    if (existingAdmin) {
      existingAdmin.role =
        "admin";

      await existingAdmin.save();

      console.log(
        "Admin account already exists."
      );

      console.log(
        "Email:",
        email
      );

      console.log(
        "Password:",
        password
      );

      process.exit(0);
    }


    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );


    await User.create({
      name: "JobTrack Pro Admin",

      email,

      password:
        hashedPassword,

      role: "admin",

      company:
        "JobTrack Pro",
    });


    console.log(
      "================================"
    );

    console.log(
      "ADMIN CREATED SUCCESSFULLY"
    );

    console.log(
      "================================"
    );

    console.log(
      "Email:",
      email
    );

    console.log(
      "Password:",
      password
    );

    console.log(
      "================================"
    );


    process.exit(0);
  } catch (error) {
    console.error(
      "Admin creation failed:",
      error
    );

    process.exit(1);
  }
};


createAdmin();