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
    <p style="font-size:0.85rem;color:var(--muted)">Subject: ${r.subject} &nbsp;|&nbsp; Date: ${r.datetime}</p>
  `;

  const OPTS = ["A", "B", "C", "D"];
  let answersHtml = "<hr style='margin:16px 0'><h3 style='margin-bottom:12px'>Your Answer Sheet</h3>";

  r.answers.forEach(a => {
    const correctLabel = OPTS[parseInt(a.correct_answer)] || a.correct_answer;
    const studentLabel = a.student_answer !== null ? (OPTS[parseInt(a.student_answer)] || a.student_answer) : null;
    const statusClass = a.status === "correct" ? "correct-result" : a.status === "wrong" ? "wrong-result" : "skip-result";
    const statusIcon = a.status === "correct" ? "✅" : a.status === "wrong" ? "❌" : "—";

    answersHtml += `
      <div class="answer-item ${statusClass}">
        <div class="q-num">${statusIcon} Question ${a.question_no}</div>
        <div class="q-txt">${a.question_text}</div>
        <p class="q-opt">A) ${a.option_a} &nbsp; B) ${a.option_b} &nbsp; C) ${a.option_c} &nbsp; D) ${a.option_d}</p>
        <div class="ans-row" style="margin-top:8px">
          <span><strong>Correct:</strong> Option ${correctLabel}</span>
          <span><strong>Your Answer:</strong> ${a.status === "skipped" ? "Skipped" : `Option ${studentLabel}`}</span>
        </div>
      </div>`;
  });

  document.getElementById("student-detail-answers").innerHTML = answersHtml;
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