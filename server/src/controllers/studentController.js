const Student = require("../models/Student");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getStudentFields(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const error = new Error("Submit student details as a JSON object.");
    error.status = 400;
    throw error;
  }

  const fields = {};
  for (const field of ["name", "email", "course", "status", "enrollmentDate"]) {
    if (Object.hasOwn(body, field)) fields[field] = body[field];
  }
  return fields;
}

function sendError(res, error) {
  if (error.code === 11000) {
    return res.status(409).json({ message: "That email address is already in use." });
  }
  if (error.name === "ValidationError" || error.name === "CastError") {
    const message =
      error.name === "ValidationError"
        ? Object.values(error.errors).map((item) => item.message).join(" ")
        : "The student ID or one of the submitted values is invalid.";
    return res.status(400).json({ message });
  }
  console.error(error);
  return res.status(error.status || 500).json({
    message: error.status ? error.message : "Unable to complete the request. Please try again."
  });
}

// GET /api/students supports an optional text search and status filter.
async function listStudents(req, res) {
  const { search = "", status } = req.query;
  const filter = {};

  if (typeof search !== "string" || (status !== undefined && typeof status !== "string")) {
    return res.status(400).json({ message: "Search and status filters must be single values." });
  }
  if (search.trim()) {
    const pattern = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ name: pattern }, { email: pattern }, { course: pattern }];
  }
  if (status && status !== "All statuses") {
    if (!["Active", "On leave", "Graduated"].includes(status)) {
      return res.status(400).json({ message: "Choose a valid student status." });
    }
    filter.status = status;
  }

  try {
    const students = await Student.find(filter).sort({ createdAt: -1 });
    return res.json(students);
  } catch (error) {
    return sendError(res, error);
  }
}

async function getStudent(req, res) {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }
    return res.json(student);
  } catch (error) {
    return sendError(res, error);
  }
}

async function createStudent(req, res) {
  try {
    const student = await Student.create(getStudentFields(req.body));
    return res.status(201).json(student);
  } catch (error) {
    return sendError(res, error);
  }
}

async function updateStudent(req, res) {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }
    Object.assign(student, getStudentFields(req.body));
    await student.save();
    return res.json(student);
  } catch (error) {
    return sendError(res, error);
  }
}

async function deleteStudent(req, res) {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }
    return res.json({ message: "Student deleted successfully." });
  } catch (error) {
    return sendError(res, error);
  }
}

module.exports = { listStudents, getStudent, createStudent, updateStudent, deleteStudent };
