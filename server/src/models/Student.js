const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      maxlength: [100, "Name must be 100 characters or fewer."]
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address."]
    },
    course: {
      type: String,
      required: [true, "Course is required."],
      trim: true,
      maxlength: [100, "Course must be 100 characters or fewer."]
    },
    status: {
      type: String,
      enum: ["Active", "On leave", "Graduated"],
      default: "Active",
      required: [true, "Status is required."]
    },
    enrollmentDate: {
      type: Date,
      required: [true, "Enrollment date is required."]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
