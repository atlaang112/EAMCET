async function loadHistory() {
  const container = document.getElementById("history-container");
  container.innerHTML = '<div class="loader">⏳ Loading...</div>';

  const res = await fetch(`/api/results/${currentUser}`);
  const data = await res.json();

  if (!data.ok || data.results.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">📭</div>
        <p>No test history yet. Start a test to see your results here!</p>
        <button class="btn btn-primary" style="margin-top:16px" onclick="showPage('papers')">Browse Tests</button>
      </div>`;
    return;
  }

  let html = `<div class="table-wrapper"><table>
    <thead>
      <tr>
        <th>Paper</th>
        <th>Subject</th>
        <th>✅</th>
        <th>❌</th>
        <th>—</th>
        <th>Score</th>
        <th>Date</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>`;

  data.results.forEach(r => {
    const pctClass = r.percentage >= 70 ? "pct-high" : r.percentage >= 40 ? "pct-mid" : "pct-low";
    html += `
      <tr>
        <td><strong>${r.paper_name}</strong></td>
        <td><span class="badge badge-blue">${r.subject}</span></td>
        <td style="text-align:center">${r.correct}</td>
        <td style="text-align:center">${r.wrong}</td>
        <td style="text-align:center">${r.skipped}</td>
        <td class="${pctClass}" style="text-align:center">${r.percentage}%</td>
        <td style="font-size:0.8rem;white-space:nowrap">${r.datetime}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="openStudentDetail(${r.id})">View</button>
        </td>
      </tr>`;
  });

  html += "</tbody></table></div>";
  container.innerHTML = html;
}

async function openStudentDetail(resultId) {
  const modal = document.getElementById("student-detail-modal");
  modal.classList.add("open");
  document.getElementById("student-detail-summary").innerHTML = '<div class="loader">⏳ Loading...</div>';
  document.getElementById("student-detail-answers").innerHTML = "";

  const res = await fetch(`/api/result/${resultId}`);
  const data = await res.json();

  if (!data.ok) {
    document.getElementById("student-detail-summary").innerHTML =
      '<div class="alert alert-error">❌ Failed to load detail</div>';
    return;
  }

  const r = data.result;
  document.getElementById("student-modal-title").textContent = r.paper_name;

  const pctClass = r.percentage >= 70 ? "pct-high" : r.percentage >= 40 ? "pct-mid" : "pct-low";
  document.getElementById("student-detail-summary").innerHTML = `
    <div class="stat-grid">
      <div class="stat-card green"><div class="stat-num">${r.correct}</div><div class="stat-label">Correct</div></div>
      <div class="stat-card red"><div class="stat-num">${r.wrong}</div><div class="stat-label">Wrong</div></div>
      <div class="stat-card orange"><div class="stat-num">${r.skipped}</div><div class="stat-label">Skipped</div></div>
      <div class="stat-card"><div class="stat-num ${pctClass}">${r.percentage}%</div><div class="stat-label">Score</div></div>
    </div>
    <p style="font-size:0.85rem;color:var(--muted);margin-top:10px">Subject: ${r.subject} &nbsp;|&nbsp; Date: ${r.datetime}</p>
  `;

  buildHistoryAnswerSheet(r.answers, resultId);
}

function buildHistoryAnswerSheet(answers, resultId) {
  const OPTS = ["A", "B", "C", "D"];
  const el = document.getElementById("student-detail-answers");

  let html = "<hr style='margin:16px 0'><h3 style='margin-bottom:16px'>📄 Answer Sheet</h3>";

  html += answers.map((a, i) => {
    const correctIdx = parseInt(a.correct_answer);
    const studentIdx = a.student_answer !== null ? parseInt(a.student_answer) : null;
    const isCorrect = a.status === "correct";
    const isWrong   = a.status === "wrong";

    const statusClass = isCorrect ? "correct-result" : isWrong ? "wrong-result" : "skip-result";
    const statusIcon  = isCorrect ? "✅" : isWrong ? "❌" : "—";
    const statusLabel = isCorrect ? "Correct" : isWrong ? "Wrong" : "Skipped";
    const marksLabel  = isCorrect ? "2/2" : "0/2";
    const diff        = a.difficulty || "";

    const opts = [a.option_a, a.option_b, a.option_c, a.option_d].map((opt, oi) => {
      let cls = "rv-option";
      let icon = "";
      if (oi === correctIdx) {
        cls += " rv-correct";
        icon = `<span class="rv-tick">✓</span>`;
      } else if (studentIdx === oi && !isCorrect) {
        cls += " rv-wrong";
        icon = `<span class="rv-cross">✗</span>`;
      }
      return `<div class="${cls}">
        <span class="rv-opt-label">${OPTS[oi]}</span>
        <span class="rv-opt-text">${decodeHTML(opt)}</span>
        ${icon}
      </div>`;
    }).join("");

    const hasSolution = a.solution && a.solution.trim().length > 0;
    const uid = `h${resultId}_${i}`;
    const solutionBlock = hasSolution ? `
      <div class="solution-wrap">
        <button class="solution-toggle-btn" id="solution-btn-${uid}" onclick="toggleHistorySolution('${uid}')">💡 View Solution</button>
        <div class="solution-body" id="solution-body-${uid}" style="display:none">
          <div class="solution-content">${decodeHTML(a.solution)}</div>
        </div>
      </div>` : "";

    const metaRow = `
      <div class="rv-meta">
        <span>Status <strong>${statusLabel}</strong></span>
        <span>Mark obtained <strong>${marksLabel}</strong></span>
        ${diff ? `<span>Level <strong>${diff}</strong></span>` : ""}
        ${studentIdx !== null ? `<span>Your answer <strong>${OPTS[studentIdx]}</strong></span>` : ""}
        <span>Correct answer <strong>${OPTS[correctIdx]}</strong></span>
      </div>`;

    return `
      <div class="answer-item ${statusClass}">
        <div class="rv-header">
          <span class="rv-qnum">${statusIcon} Question ${a.question_no}</span>
          <span class="rv-status-badge ${statusClass}-badge">${statusLabel}</span>
        </div>
        <div class="q-txt">${decodeHTML(a.question_text)}</div>
        <div class="rv-options">${opts}</div>
        ${metaRow}
        ${solutionBlock}
      </div>`;
  }).join("");

  el.innerHTML = html;
  if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise([el]).catch(err => console.warn("MathJax:", err));
  }
}

function toggleHistorySolution(uid) {
  const el = document.getElementById(`solution-body-${uid}`);
  const btn = document.getElementById(`solution-btn-${uid}`);
  if (!el) return;
  const isOpen = el.style.display !== "none";
  el.style.display = isOpen ? "none" : "block";
  btn.textContent = isOpen ? "💡 View Solution" : "🔼 Hide Solution";
  if (!isOpen && window.MathJax) {
    MathJax.typesetPromise([el]).catch(e => console.warn(e));
  }
}

function decodeHTML(str) {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function closeStudentModal() {
  document.getElementById("student-detail-modal").classList.remove("open");
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("student-detail-modal");
  if (modal) {
    modal.addEventListener("click", function(e) {
      if (e.target === this) closeStudentModal();
    });
  }
});
