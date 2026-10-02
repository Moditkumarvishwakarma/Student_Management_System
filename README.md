# CampusDesk Student Management System

A beginner-friendly MERN app for managing student records. React and Vite provide the dashboard, Express exposes the REST API, and MongoDB stores student data through Mongoose.

## Prerequisites

- Node.js 18 or newer and npm
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

## Configure MongoDB

1. Copy `.env.example` to `server/.env`.
2. Set `MONGODB_URI` to your MongoDB connection string. The example connects to a local database:

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/student_management
   PORT=5000
   ```

   For Atlas, use the connection string from your cluster and replace its username, password, and database name. Keep real credentials in `server/.env`; never commit that file.

## Install and run

From the project root, install the root helper and both app dependencies:

```bash
npm install
npm run install:all
```

Start the backend and frontend together:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite development server forwards `/api` requests to Express on port 5000.

You can also run either part separately:

```bash
npm run dev --prefix server
npm run dev --prefix client
```

The API waits for a successful MongoDB connection before listening. If the database is unavailable or `server/.env` is missing, the server prints an error instead of silently starting without persistence.

## Features

- Dashboard totals for all students and each status
- Add, view, edit, and delete student records
- Search by student name, email, or course
- Filter by Active, On leave, or Graduated status
- Required-field, email-format, and unique-email validation
- Responsive directory and form layout

Each student has a name, unique email address, course, status, and enrollment date. Email addresses are stored lowercase so uniqueness is case-insensitive.

## REST API

Base URL: `http://localhost:5000/api`

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/students` | List students |
| `GET` | `/students/:id` | Get one student |
| `POST` | `/students` | Add a student |
| `PUT` | `/students/:id` | Update a student |
| `DELETE` | `/students/:id` | Delete a student |
| `GET` | `/health` | Check that the API is running |

`GET /students` accepts optional query parameters:

- `search`: matches part of a name, email, or course. Example: `/api/students?search=computer`
- `status`: `Active`, `On leave`, or `Graduated`. Example: `/api/students?status=Active`
- Both parameters can be used together.

Create and update requests use JSON. Example:

```json
{
  "name": "Alex Morgan",
  "email": "alex@college.edu",
  "course": "Computer Science",
  "status": "Active",
  "enrollmentDate": "2025-09-01"
}
```

The API returns JSON error messages and uses `400` for invalid data, `404` for unknown student IDs, and `409` when an email is already in use.
