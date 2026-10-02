import { useEffect, useMemo, useState } from "react";

function localDateString() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

const EMPTY_FORM = {
  name: "",
  email: "",
  course: "",
  status: "Active",
  enrollmentDate: localDateString()
};

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "The request failed. Please try again.");
  }
  return data;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });
}

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function StudentForm({ student, onClose, onSave, onEdit, readOnly, saving, error }) {
  const [form, setForm] = useState(() =>
    student
      ? { ...student, enrollmentDate: student.enrollmentDate.slice(0, 10) }
      : EMPTY_FORM
  );

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function submitForm(event) {
    event.preventDefault();
    onSave(form);
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="form-modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">STUDENT DETAILS</p>
            <h2 id="form-title">{student ? "Edit student" : "Add a student"}</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Close form" onClick={onClose}>×</button>
        </div>
        <form className="student-form" onSubmit={submitForm}>
          <label>
            Full name
            <input name="name" value={form.name} onChange={updateField} placeholder="e.g. Alex Morgan" maxLength="100" required disabled={readOnly} />
          </label>
          <label>
            Email address
            <input name="email" type="email" value={form.email} onChange={updateField} placeholder="alex@college.edu" required disabled={readOnly} />
          </label>
          <label>
            Course
            <input name="course" value={form.course} onChange={updateField} placeholder="e.g. Computer Science" maxLength="100" required disabled={readOnly} />
          </label>
          <div className="form-row">
            <label>
              Status
              <select name="status" value={form.status} onChange={updateField} disabled={readOnly}>
                <option>Active</option>
                <option>On leave</option>
                <option>Graduated</option>
              </select>
            </label>
            <label>
              Enrollment date
              <input name="enrollmentDate" type="date" value={form.enrollmentDate} onChange={updateField} required disabled={readOnly} />
            </label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions">
            {readOnly ? (
              <>
                <button className="button button-secondary" type="button" onClick={onClose}>Close</button>
                <button className="button button-primary" type="button" onClick={onEdit}>Edit student</button>
              </>
            ) : (
              <>
                <button className="button button-secondary" type="button" onClick={onClose}>Cancel</button>
                <button className="button button-primary" type="submit" disabled={saving}>
                  {saving ? "Saving..." : student ? "Save changes" : "Add student"}
                </button>
              </>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

function App() {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [readOnly, setReadOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    request("/api/students", { signal: controller.signal })
      .then(setAllStudents)
      .catch((error) => {
        if (error.name !== "AbortError") setPageError(error.message);
      });
    return () => controller.abort();
  }, []);

  // Fetch the directory from the API whenever the search or status filter changes.
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setPageError("");
      const query = new URLSearchParams();
      if (search.trim()) query.set("search", search.trim());
      if (status !== "All statuses") query.set("status", status);

      try {
        const data = await request(`/api/students?${query}`, { signal: controller.signal });
        setStudents(data);
      } catch (error) {
        if (error.name !== "AbortError") setPageError(error.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search, status]);

  const totals = useMemo(
    () => ({
      total: allStudents.length,
      active: allStudents.filter((student) => student.status === "Active").length,
      onLeave: allStudents.filter((student) => student.status === "On leave").length,
      graduated: allStudents.filter((student) => student.status === "Graduated").length
    }),
    [allStudents]
  );

  function openAddForm() {
    setEditingStudent(null);
    setReadOnly(false);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(student) {
    setEditingStudent(student);
    setReadOnly(false);
    setFormError("");
    setShowForm(true);
  }

  function openViewForm(student) {
    setEditingStudent(student);
    setReadOnly(true);
    setFormError("");
    setShowForm(true);
  }

  async function saveStudent(form) {
    setSaving(true);
    setFormError("");
    try {
      await request(
        editingStudent ? `/api/students/${editingStudent._id}` : "/api/students",
        {
          method: editingStudent ? "PUT" : "POST",
          body: JSON.stringify(form)
        }
      );
    } catch (error) {
      setFormError(error.message);
      setSaving(false);
      return;
    }

    setShowForm(false);
    setEditingStudent(null);
    try {
      const query = new URLSearchParams();
      if (search.trim()) query.set("search", search.trim());
      if (status !== "All statuses") query.set("status", status);
      const [filteredStudents, updatedAllStudents] = await Promise.all([
        request(`/api/students?${query}`),
        request("/api/students")
      ]);
      setStudents(filteredStudents);
      setAllStudents(updatedAllStudents);
    } catch (error) {
      setPageError(`Student was saved, but the directory could not refresh: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function deleteStudent(student) {
    if (!window.confirm(`Delete ${student.name}'s record? This cannot be undone.`)) return;
    setDeletingId(student._id);
    setPageError("");
    try {
      await request(`/api/students/${student._id}`, { method: "DELETE" });
      setStudents((currentStudents) => currentStudents.filter((item) => item._id !== student._id));
      setAllStudents((currentStudents) => currentStudents.filter((item) => item._id !== student._id));
    } catch (error) {
      setPageError(error.message);
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="CampusDesk home">
          <span className="brand-mark">C</span>
          <span>campus<span className="brand-light">desk</span></span>
        </a>
        <div className="sidebar-label">WORKSPACE</div>
        <a className="nav-link active" href="#directory"><span className="nav-icon">▦</span> Students</a>
        <div className="sidebar-note">
          <span className="note-icon">✦</span>
          <strong>Keep your campus organized</strong>
          <p>Manage student records, courses, and enrollment at a glance.</p>
        </div>
        <div className="sidebar-footer"><span className="avatar small-avatar">CD</span><span><strong>Campus admin</strong><small>Student portal</small></span></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>Students</strong></div>
          <div className="topbar-right"><span className="today-label">{new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span><span className="avatar">A</span></div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">STUDENT OVERVIEW</p>
              <h1>Students <span className="title-count">{totals.total}</span></h1>
              <p className="page-subtitle">A clear view of your student community.</p>
            </div>
            <button className="button button-primary add-button" onClick={openAddForm}><span>＋</span> Add student</button>
          </div>

          <div className="stats-grid">
            <article className="stat-card">
              <div className="stat-top"><span>Total students</span><span className="stat-icon purple">♙</span></div>
              <div className="stat-number">{totals.total}</div><div className="stat-foot">In your directory</div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span>Active</span><span className="stat-icon green">✓</span></div>
              <div className="stat-number">{totals.active}</div><div className="stat-foot"><i className="dot green-dot" /> Currently enrolled</div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span>On leave</span><span className="stat-icon amber">◷</span></div>
              <div className="stat-number">{totals.onLeave}</div><div className="stat-foot"><i className="dot amber-dot" /> Taking a break</div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span>Graduated</span><span className="stat-icon blue">✧</span></div>
              <div className="stat-number">{totals.graduated}</div><div className="stat-foot"><i className="dot blue-dot" /> Completed their course</div>
            </article>
          </div>

          <section className="directory-card" id="directory">
            <div className="directory-heading">
              <div><h2>Student directory</h2><p>View and manage everyone in your student community.</p></div>
              <span className="record-count">{students.length} {students.length === 1 ? "student" : "students"}</span>
            </div>
            <div className="toolbar">
              <label className="search-box">
                <span aria-hidden="true">⌕</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or course..." aria-label="Search students" />
                {search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")}>×</button>}
              </label>
              <label className="filter-select"><span>Filter:</span>
                <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by student status">
                  <option>All statuses</option><option>Active</option><option>On leave</option><option>Graduated</option>
                </select>
              </label>
            </div>
            {pageError && <div className="alert-error" role="alert"><strong>Something went wrong.</strong> {pageError}</div>}
            <div className="table-wrap">
              <table>
                <thead><tr><th>STUDENT</th><th>COURSE</th><th>STATUS</th><th>ENROLLED</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td className="table-message" colSpan="5">Loading students...</td></tr>
                  ) : students.length === 0 ? (
                    <tr><td className="table-message" colSpan="5">
                      <span className="empty-icon">⌕</span>
                      <strong>{search || status !== "All statuses" ? "No students match those filters" : "Your directory is ready"}</strong>
                      <span>{search || status !== "All statuses" ? "Try another search or status." : "Add your first student to get started."}</span>
                    </td></tr>
                  ) : students.map((student) => (
                    <tr key={student._id}>
                      <td><div className="student-cell"><span className="avatar student-avatar">{initials(student.name)}</span><span><strong>{student.name}</strong><small>{student.email}</small></span></div></td>
                      <td className="course-cell">{student.course}</td>
                      <td><span className={`status-badge ${student.status.toLowerCase().replace(" ", "-")}`}><i />{student.status}</span></td>
                      <td className="date-cell">{formatDate(student.enrollmentDate)}</td>
                      <td><div className="row-actions"><button type="button" title="View student" aria-label={`View ${student.name}`} onClick={() => openViewForm(student)}>View</button><button type="button" title="Edit student" aria-label={`Edit ${student.name}`} onClick={() => openEditForm(student)}>Edit</button><button type="button" className="delete-action" title="Delete student" aria-label={`Delete ${student.name}`} disabled={deletingId === student._id} onClick={() => deleteStudent(student)}>Delete</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>Showing <strong>{students.length}</strong> {students.length === 1 ? "student" : "students"}</span><span>Student records are up to date</span></div>
          </section>
          <footer className="page-footer">CampusDesk <span>·</span> Student management made simple</footer>
        </section>
      </main>

      {showForm && <StudentForm student={editingStudent} onClose={() => setShowForm(false)} onSave={saveStudent} onEdit={() => setReadOnly(false)} readOnly={readOnly} saving={saving} error={formError} />}
    </div>
  );
}

export default App;
