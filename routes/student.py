from flask import Blueprint, jsonify, request, render_template
from config.db import get_db, dict_cursor

student_bp = Blueprint("student", __name__)


@student_bp.route("/")
def home():
    return render_template("student/index.html")


@student_bp.route("/api/register", methods=["POST"])
def api_register():
    data = request.json
    username = data.get("username", "").strip()

    if not username:
        return jsonify({"ok": False, "error": "Username required"}), 400

    db = get_db()
    cur = db.cursor()

    try:
        cur.execute("INSERT INTO students (username) VALUES (%s)", (username,))
        db.commit()
    except Exception:
        db.rollback()
        cur.close()
        db.close()
        return jsonify({"ok": False, "error": "Username already exists"}), 400
    finally:
        cur.close()
        db.close()

    return jsonify({"ok": True, "message": "Account created"})


@student_bp.route("/api/login", methods=["POST"])
def api_login():
    data = request.json
    username = data.get("username", "").strip()

    if not username:
        return jsonify({"ok": False, "error": "Username required"}), 400

    db = get_db()
    cur = dict_cursor(db)
    cur.execute("SELECT id, username FROM students WHERE username=%s", (username,))
    student = cur.fetchone()
    cur.close()
    db.close()

    if not student:
        return jsonify({"ok": False, "error": "User not found. Please register first."}), 404

    return jsonify({"ok": True, "username": student["username"]})


@student_bp.route("/api/papers")
def api_papers():
    db = get_db()
    cur = dict_cursor(db)
    cur.execute("SELECT id, name, subject, created_at FROM papers ORDER BY created_at DESC")
    papers = [dict(p) for p in cur.fetchall()]

    for p in papers:
        cur.execute("SELECT COUNT(*) AS c FROM questions WHERE paper_id=%s", (p["id"],))
        p["question_count"] = cur.fetchone()["c"]
        cur.execute("SELECT DISTINCT difficulty FROM questions WHERE paper_id=%s", (p["id"],))
        p["difficulties"] = [r["difficulty"] for r in cur.fetchall()]

    cur.close()
    db.close()
    return jsonify(papers)


@student_bp.route("/api/paper/<paper_id>")
def api_paper(paper_id):
    db = get_db()
    cur = dict_cursor(db)

    cur.execute("SELECT id, name, subject, duration_minutes FROM papers WHERE id=%s", (paper_id,))
    paper = cur.fetchone()
    if not paper:
        cur.close()
        db.close()
        return jsonify({"error": "Paper not found"}), 404

    paper = dict(paper)

    cur.execute("""
        SELECT qno, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, solution
        FROM questions
        WHERE paper_id=%s
        ORDER BY qno ASC
    """, (paper_id,))
    qs = cur.fetchall()

    paper["questions"] = [
        {
            "text": q["question_text"],
            "opts": [q["option_a"], q["option_b"], q["option_c"], q["option_d"]],
            "ans": q["correct_option"],
            "diff": q["difficulty"],
            "solution": q["solution"] or ""
        }
        for q in qs
    ]

    cur.close()
    db.close()
    return jsonify(paper)


@student_bp.route("/api/save_result", methods=["POST"])
def api_save_result():
    from datetime import datetime
    data = request.json

    required = ["username", "paper_id", "correct", "wrong", "skipped", "total", "percentage", "answers"]
    for k in required:
        if k not in data:
            return jsonify({"ok": False, "error": f"Missing {k}"}), 400

    db = get_db()
    cur = db.cursor()
    dt = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cur.execute("""
        INSERT INTO results (username, paper_id, correct, wrong, skipped, total, percentage, datetime)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        RETURNING id
    """, (
        data["username"].strip(),
        data["paper_id"],
        data["correct"],
        data["wrong"],
        data["skipped"],
        data["total"],
        float(data["percentage"]),
        dt
    ))

    result_id = cur.fetchone()[0]

    for row in data["answers"]:
        cur.execute("""
            INSERT INTO result_answers (result_id, question_no, correct_answer, student_answer, status)
            VALUES (%s,%s,%s,%s,%s)
        """, (
            result_id,
            row.get("q"),
            str(row.get("correct")),
            str(row.get("yours")) if row.get("yours") is not None else None,
            row.get("status")
        ))

    db.commit()
    cur.close()
    db.close()
    return jsonify({"ok": True, "result_id": result_id})


@student_bp.route("/api/results/<username>")
def api_results(username):
    db = get_db()
    cur = dict_cursor(db)
    cur.execute("""
        SELECT r.id, r.paper_id, p.name AS paper_name, p.subject,
               r.correct, r.wrong, r.skipped, r.total, r.percentage, r.datetime
        FROM results r
        JOIN papers p ON r.paper_id = p.id
        WHERE r.username=%s
        ORDER BY r.datetime DESC
    """, (username,))
    results = [dict(r) for r in cur.fetchall()]
    cur.close()
    db.close()
    return jsonify({"ok": True, "results": results})


@student_bp.route("/api/result/<int:result_id>")
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
