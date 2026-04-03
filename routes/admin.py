import csv
from flask import Blueprint, jsonify, request, render_template, session, redirect, url_for
from functools import wraps
from werkzeug.utils import secure_filename
from config.db import get_db, dict_cursor
from config.admin_auth import ADMIN_USERNAME, ADMIN_PASSWORD

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("is_admin"):
            return redirect(url_for("admin.login_page"))
        return f(*args, **kwargs)
    return decorated


@admin_bp.route("/")
def login_page():
    if session.get("is_admin"):
        return redirect(url_for("admin.dashboard"))
    return render_template("admin/login.html")


@admin_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        session["is_admin"] = True
        return jsonify({"ok": True})
    return jsonify({"ok": False, "error": "Invalid credentials"}), 401


@admin_bp.route("/logout")
def logout():
    session.pop("is_admin", None)
    return redirect(url_for("admin.login_page"))


@admin_bp.route("/dashboard")
@admin_required
def dashboard():
    return render_template("admin/dashboard.html")


@admin_bp.route("/upload")
@admin_required
def upload_page():
    return render_template("admin/upload.html")


@admin_bp.route("/results")
@admin_required
def results_page():
    return render_template("admin/results.html")


@admin_bp.route("/api/upload_csv", methods=["POST"])
@admin_required
def upload_csv():
    if "file" not in request.files:
        return jsonify({"ok": False, "error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"ok": False, "error": "Empty filename"}), 400

    filename = secure_filename(file.filename)
    if not filename.endswith(".csv"):
        return jsonify({"ok": False, "error": "Only CSV files allowed"}), 400

    paper_id = request.form.get("paper_id", "").strip()
    paper_name = request.form.get("paper_name", "").strip()
    subject = request.form.get("subject", "").strip()
    duration_minutes = request.form.get("duration_minutes", "").strip()

    if not all([paper_id, paper_name, subject, duration_minutes]):
        return jsonify({"ok": False, "error": "All fields are required"}), 400

    try:
        duration_minutes = int(duration_minutes)
        if duration_minutes <= 0:
            raise ValueError
    except ValueError:
        return jsonify({"ok": False, "error": "Duration must be a positive integer"}), 400

    stream = file.stream.read().decode("utf-8").splitlines()
    reader = csv.DictReader(stream)
    question_rows = list(reader)

    if not question_rows:
        return jsonify({"ok": False, "error": "CSV has no questions"}), 400

    total_questions = len(question_rows)

    db = get_db()
    cur = db.cursor()

    cur.execute("""
        INSERT INTO papers (id, name, subject, created_at, total_questions, duration_minutes)
        VALUES (%s, %s, %s, CURRENT_DATE, %s, %s)
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            subject = EXCLUDED.subject,
            total_questions = EXCLUDED.total_questions,
            duration_minutes = EXCLUDED.duration_minutes
    """, (paper_id, paper_name, subject, total_questions, duration_minutes))

    cur.execute("DELETE FROM questions WHERE paper_id=%s", (paper_id,))

    for row in question_rows:
        solution = row.get("solution", "").strip() if row.get("solution") else None
        cur.execute("""
            INSERT INTO questions
            (paper_id, qno, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, solution)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            paper_id,
            int(row["qno"]),
            row["question_text"].strip(),
            row["option_a"].strip(),
            row["option_b"].strip(),
            row["option_c"].strip(),
            row["option_d"].strip(),
            int(row["correct_option"]),
            row["difficulty"].strip(),
            solution
        ))

    db.commit()
    cur.close()
    db.close()

    return jsonify({
        "ok": True,
        "paper_id": paper_id,
        "paper_name": paper_name,
        "subject": subject,
        "total_questions": total_questions,
        "duration_minutes": duration_minutes,
        "questions_added": total_questions
    })


@admin_bp.route("/api/results")
@admin_required
def api_admin_results():
    db = get_db()
    cur = dict_cursor(db)
    cur.execute("""
        SELECT r.id, r.username, r.paper_id, p.name AS paper_name, p.subject,
               r.correct, r.wrong, r.skipped, r.total, r.percentage, r.datetime
        FROM results r
        JOIN papers p ON r.paper_id = p.id
        ORDER BY r.datetime DESC
    """)
    results = [dict(row) for row in cur.fetchall()]
    cur.close()
    db.close()
    return jsonify({"ok": True, "results": results})


@admin_bp.route("/api/result/<int:result_id>")
@admin_required
def api_result_detail(result_id):
    db = get_db()
    cur = dict_cursor(db)

    cur.execute("""
        SELECT r.id, r.username, r.paper_id, p.name AS paper_name, p.subject,
               r.correct, r.wrong, r.skipped, r.total, r.percentage, r.datetime
        FROM results r
        JOIN papers p ON r.paper_id = p.id
        WHERE r.id=%s
    """, (result_id,))
    result = cur.fetchone()

    if not result:
        cur.close()
        db.close()
        return jsonify({"ok": False, "error": "Result not found"}), 404

    result = dict(result)

    cur.execute("""
        SELECT ra.question_no, ra.correct_answer, ra.student_answer, ra.status,
               q.question_text, q.option_a, q.option_b, q.option_c, q.option_d
        FROM result_answers ra
        JOIN questions q ON q.qno = ra.question_no
        WHERE ra.result_id=%s AND q.paper_id=%s
        ORDER BY ra.question_no ASC
    """, (result_id, result["paper_id"]))

    result["answers"] = [dict(r) for r in cur.fetchall()]
    cur.close()
    db.close()
    return jsonify({"ok": True, "result": result})


@admin_bp.route("/api/delete_result/<int:result_id>", methods=["DELETE"])
@admin_required
def api_delete_result(result_id):
    db = get_db()
    cur = db.cursor()
    cur.execute("DELETE FROM result_answers WHERE result_id=%s", (result_id,))
    cur.execute("DELETE FROM results WHERE id=%s", (result_id,))
    db.commit()
    cur.close()
    db.close()
    return jsonify({"ok": True})


@admin_bp.route("/api/stats")
@admin_required
def api_stats():
    db = get_db()
    cur = dict_cursor(db)

    cur.execute("SELECT COUNT(*) AS c FROM students")
    total_students = cur.fetchone()["c"]

    cur.execute("SELECT COUNT(*) AS c FROM papers")
    total_papers = cur.fetchone()["c"]

    cur.execute("SELECT COUNT(*) AS c FROM results")
    total_attempts = cur.fetchone()["c"]

    cur.execute("SELECT AVG(percentage) AS avg FROM results")
    avg_score = round(cur.fetchone()["avg"] or 0, 1)

    cur.close()
    db.close()

    return jsonify({
        "ok": True,
        "total_students": total_students,
        "total_papers": total_papers,
        "total_attempts": total_attempts,
        "avg_score": avg_score
    })


@admin_bp.route("/papers")
@admin_required
def papers_page():
    return render_template("admin/papers.html")


@admin_bp.route("/api/papers")
@admin_required
def api_papers():
    db = get_db()
    cur = dict_cursor(db)
    cur.execute("""
        SELECT p.id, p.name, p.subject, p.created_at, p.duration_minutes,
               COUNT(q.id) AS question_count
        FROM papers p
        LEFT JOIN questions q ON q.paper_id = p.id
        GROUP BY p.id
        ORDER BY p.created_at DESC
    """)
    papers = [dict(r) for r in cur.fetchall()]
    cur.close()
    db.close()
    return jsonify({"ok": True, "papers": papers})


@admin_bp.route("/api/paper/<paper_id>", methods=["GET"])
@admin_required
def api_get_paper(paper_id):
    db = get_db()
    cur = dict_cursor(db)
    cur.execute("SELECT * FROM papers WHERE id=%s", (paper_id,))
    paper = cur.fetchone()
    if not paper:
        cur.close()
        db.close()
        return jsonify({"ok": False, "error": "Paper not found"}), 404
    paper = dict(paper)
    cur.execute("SELECT * FROM questions WHERE paper_id=%s ORDER BY qno ASC", (paper_id,))
    paper["questions"] = [dict(r) for r in cur.fetchall()]
    cur.close()
    db.close()
    return jsonify({"ok": True, "paper": paper})


@admin_bp.route("/api/paper/<paper_id>", methods=["PATCH"])
@admin_required
def api_update_paper(paper_id):
    data = request.json or {}
    name = data.get("name", "").strip()
    subject = data.get("subject", "").strip()
    duration = data.get("duration_minutes")
    if not name or not subject or not duration:
        return jsonify({"ok": False, "error": "All fields required"}), 400
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute("""
            UPDATE papers SET name=%s, subject=%s, duration_minutes=%s WHERE id=%s
        """, (name, subject, int(duration), paper_id))
        db.commit()
    except Exception as e:
        db.rollback()
        cur.close()
        db.close()
        return jsonify({"ok": False, "error": str(e)}), 500
    cur.close()
    db.close()
    return jsonify({"ok": True})


@admin_bp.route("/api/paper/<paper_id>", methods=["DELETE"])
@admin_required
def api_delete_paper(paper_id):
    db = get_db()
    cur = db.cursor()
    try:
        # Delete in dependency order to avoid FK constraint issues
        cur.execute("""
            DELETE FROM result_answers WHERE result_id IN (
                SELECT id FROM results WHERE paper_id=%s
            )
        """, (paper_id,))
        cur.execute("DELETE FROM results WHERE paper_id=%s", (paper_id,))
        cur.execute("DELETE FROM questions WHERE paper_id=%s", (paper_id,))
        cur.execute("DELETE FROM papers WHERE id=%s", (paper_id,))
        db.commit()
    except Exception as e:
        db.rollback()
        cur.close()
        db.close()
        return jsonify({"ok": False, "error": str(e)}), 500
    cur.close()
    db.close()
    return jsonify({"ok": True})
