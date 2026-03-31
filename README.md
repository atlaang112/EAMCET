# EAMCET Practice Portal

A structured Flask web app for EAMCET practice tests, with a student portal and a protected admin panel.

---

## Project Structure

```
eamcet_app/
│
├── app.py                  # Entry point — Flask app + blueprint registration
│
├── config/
│   ├── db.py               # Database connection helper
│   └── admin_auth.py       # Admin credentials (change before deploying!)
│
├── routes/
│   ├── student.py          # All student-facing API routes
│   └── admin.py            # All admin routes (protected by session)
│
├── templates/
│   ├── student/
│   │   └── index.html      # Student portal (SPA — login, tests, results, history)
│   └── admin/
│       ├── login.html      # Admin login page (accessible at /admin)
│       ├── dashboard.html  # Admin dashboard with stats
│       ├── upload.html     # Upload question CSV
│       └── results.html    # View all student results
│
├── static/
│   ├── css/
│   │   ├── style.css       # Shared design system
│   │   └── exam.css        # Exam/student portal specific styles
│   └── js/
│       ├── app.js          # Page routing + initialization
│       ├── auth.js         # Login / register logic
│       ├── papers.js       # Papers listing + filtering
│       ├── exam.js         # Full exam engine (timer, navigation, submit)
│       └── history.js      # Student result history
│
├── schema.sql              # Full DB schema (run this first)
├── seed.sql                # Sample papers + questions
├── Students.sql            # Sample student data
└── requirements.txt
```

---

## Setup

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Setup database

```bash
mysql -u root -p < schema.sql
mysql -u root -p < seed.sql     # Optional: load sample papers
```

### 3. Configure DB credentials

Edit `config/db.py` or set environment variables:

```bash
export DB_HOST=localhost
export DB_USER=root
export DB_PASS=yourpassword
export DB_NAME=eamcet_portal
```

### 4. Run the app

```bash
python app.py
```

---

## Admin Panel

- **URL:** `http://localhost:5000/admin`
- **Username:** `admin`
- **Password:** `Admin@Eamcet2026`

> ⚠️ Change credentials in `config/admin_auth.py` before deploying!

### Admin Features
- Dashboard with live stats (students, papers, attempts, avg score)
- Upload question papers via CSV
- View all student results with answer-level detail
- Delete individual results

---

## CSV Upload Format

| Column | Description |
|--------|-------------|
| `qno` | Question number (1, 2, 3...) |
| `question_text` | The question |
| `option_a` | Option A |
| `option_b` | Option B |
| `option_c` | Option C |
| `option_d` | Option D |
| `correct_option` | 0=A, 1=B, 2=C, 3=D |
| `difficulty` | `vvery-easy` / `very-easy` / `medium` / `hard` |

---

## Student Portal

- Visit `http://localhost:5000/`
- Register or login with a username
- Browse available papers
- Take timed tests with question navigator
- Review answers after submission
- View full history of past attempts
