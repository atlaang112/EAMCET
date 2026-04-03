let examState = {
  paper: null,
  currentIndex: 0,
  answers: [],
  timerInterval: null,
  timeLeft: 0,
};

function decodeHTML(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function renderMath(el) {
  if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise([el]).catch(err => console.warn("MathJax error:", err));
  }
}

const OPTS = ["A", "B", "C", "D"];

async function startExam(paperId) {
  const res = await fetch(`/api/paper/${paperId}`);
  const paper = await res.json();

  if (paper.error) {
    alert("Failed to load paper: " + paper.error);
    return;
  }

  examState.paper = paper;
  examState.currentIndex = 0;
  examState.answers = paper.questions.map(() => ({ selected: null, status: "unattempted" }));
  examState.timeLeft = (paper.duration_minutes || 60) * 60;

  document.getElementById("exam-paper-name").textContent = paper.name;
  document.getElementById("exam-subject").textContent = paper.subject;

  buildNavGrid();
  showQuestion(0);
  startTimer();
  showPage("exam");
}

function buildNavGrid() {
  const grid = document.getElementById("q-nav-grid");
  grid.innerHTML = examState.answers.map((_, i) =>
    `<button class="q-nav-btn unattempted" id="nav-btn-${i}" onclick="goToQ(${i})">${i + 1}</button>`
  ).join("");
}

function showQuestion(idx) {
  examState.currentIndex = idx;
  const q = examState.paper.questions[idx];
  const ans = examState.answers[idx];
  const total = examState.paper.questions.length;

  document.getElementById("btn-prev").disabled = idx === 0;
  document.getElementById("btn-next").textContent = idx === total - 1 ? "Finish ▶" : "Next ▶";

  const diffColor = {
    "vvery-easy": "badge-green",
    "very-easy": "badge-blue",
    "medium": "badge-orange",
    "hard": "badge-red"
  }[q.diff] || "badge-blue";

  const qArea = document.getElementById("exam-question-area");
  qArea.innerHTML = `
    <div class="question-card">
      <div class="question-number">Question ${idx + 1} of ${total}</div>
      <div class="difficulty-badge"><span class="badge ${diffColor}">${q.diff}</span></div>
      <div class="question-text">${decodeHTML(q.text)}</div>
      <div class="options-list">
        ${q.opts.map((opt, i) => `
          <div class="option-item ${ans.selected === i ? "selected" : ""}"
               id="opt-${i}"
               onclick="selectOption(${i})">
            <div class="option-label">${OPTS[i]}</div>
            <div class="option-text">${decodeHTML(opt)}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  renderMath(qArea);
  updateNavGrid();
}

function selectOption(optIdx) {
  examState.answers[examState.currentIndex].selected = optIdx;
  examState.answers[examState.currentIndex].status = "answered";

  document.querySelectorAll(".option-item").forEach((el, i) => {
    el.classList.toggle("selected", i === optIdx);
  });

  updateNavGrid();
}

function markSkip() {
  const ans = examState.answers[examState.currentIndex];
  ans.selected = null;
  ans.status = "skipped";
  updateNavGrid();
  nextQ();
}

function nextQ() {
  const total = examState.paper.questions.length;
  if (examState.currentIndex < total - 1) {
    showQuestion(examState.currentIndex + 1);
  } else {
    confirmSubmit();
  }
}

function prevQ() {
  if (examState.currentIndex > 0) {
    showQuestion(examState.currentIndex - 1);
  }
}

function goToQ(idx) {
  showQuestion(idx);
}

function updateNavGrid() {
  examState.answers.forEach((ans, i) => {
    const btn = document.getElementById(`nav-btn-${i}`);
    if (!btn) return;
    btn.className = `q-nav-btn ${ans.status}`;
    if (i === examState.currentIndex) btn.classList.add("current");
  });
}

function startTimer() {
  clearInterval(examState.timerInterval);
  updateTimerDisplay();
  examState.timerInterval = setInterval(() => {
    examState.timeLeft--;
    updateTimerDisplay();
    if (examState.timeLeft <= 0) {
      clearInterval(examState.timerInterval);
      alert("⏰ Time's up! Submitting your test.");
      submitExam();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const el = document.getElementById("exam-timer");
  const m = Math.floor(examState.timeLeft / 60).toString().padStart(2, "0");
  const s = (examState.timeLeft % 60).toString().padStart(2, "0");
  el.textContent = `${m}:${s}`;

  el.classList.remove("warning", "danger");
  if (examState.timeLeft <= 60) el.classList.add("danger");
  else if (examState.timeLeft <= 300) el.classList.add("warning");
}

function confirmSubmit() {
  const answered = examState.answers.filter(a => a.status === "answered").length;
  const total = examState.paper.questions.length;
  const unattempted = examState.answers.filter(a => a.status === "unattempted").length;

  const ok = confirm(
    `Submit Test?\n\nAnswered: ${answered}/${total}\nUnattempted: ${unattempted}\n\nYou cannot change answers after submitting.`
  );
  if (ok) submitExam();
}

async function submitExam() {
  clearInterval(examState.timerInterval);

  const questions = examState.paper.questions;
  let correct = 0, wrong = 0, skipped = 0;
  const answerLog = [];

  examState.answers.forEach((ans, i) => {
    const q = questions[i];
    const status = ans.status === "answered"
      ? (ans.selected === q.ans ? "correct" : "wrong")
      : "skipped";

    if (status === "correct") correct++;
    else if (status === "wrong") wrong++;
    else skipped++;

    answerLog.push({
      q: i + 1,
      correct: q.ans,
      yours: ans.selected,
      status
    });
  });

  const total = questions.length;
  const percentage = parseFloat(((correct / total) * 100).toFixed(1));

  const payload = {
    username: currentUser,
    paper_id: examState.paper.id,
    correct, wrong, skipped, total, percentage,
    answers: answerLog
  };

  await fetch("/api/save_result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  showResultPage({ correct, wrong, skipped, total, percentage, answers: answerLog });
}

function showResultPage({ correct, wrong, skipped, total, percentage, answers }) {
  const emoji = percentage >= 70 ? "🎉" : percentage >= 40 ? "👍" : "📚";
  const title = percentage >= 70 ? "Excellent Work!" : percentage >= 40 ? "Good Effort!" : "Keep Practicing!";

  document.getElementById("result-emoji").textContent = emoji;
  document.getElementById("result-title").textContent = title;
  document.getElementById("result-subtitle").textContent =
    `${examState.paper.name} — ${examState.paper.subject}`;

  document.getElementById("result-stats").innerHTML = `
    <div class="stat-card green"><div class="stat-num">${correct}</div><div class="stat-label">Correct</div></div>
    <div class="stat-card red"><div class="stat-num">${wrong}</div><div class="stat-label">Wrong</div></div>
    <div class="stat-card orange"><div class="stat-num">${skipped}</div><div class="stat-label">Skipped</div></div>
    <div class="stat-card"><div class="stat-num">${total}</div><div class="stat-label">Total</div></div>
  `;

  document.getElementById("result-score-bar").style.width = `${percentage}%`;
  document.getElementById("result-pct").textContent = `${percentage}%`;

  buildAnswerSheet(answers);
  showPage("result");

  const sheet = document.getElementById("answer-sheet");
  sheet.style.display = "block";
}

function showAnswerSheet() {
  const sheet = document.getElementById("answer-sheet");
  sheet.style.display = sheet.style.display === "none" ? "block" : "none";
}

function toggleSolution(idx) {
  const el = document.getElementById(`solution-body-${idx}`);
  const btn = document.getElementById(`solution-btn-${idx}`);
  if (!el) return;
  const isOpen = el.style.display !== "none";
  el.style.display = isOpen ? "none" : "block";
  btn.textContent = isOpen ? "💡 View Solution" : "🔼 Hide Solution";
  if (!isOpen) renderMath(el);
}

function buildAnswerSheet(answers) {
  const questions = examState.paper.questions;
  const el = document.getElementById("answer-sheet-content");

  el.innerHTML = answers.map((a, i) => {
    const q = questions[i];
    const isCorrect = a.status === "correct";
    const isWrong = a.status === "wrong";
    const isSkipped = a.status === "skipped";

    const statusClass = isCorrect ? "correct-result" : isWrong ? "wrong-result" : "skip-result";
    const statusIcon = isCorrect ? "✅" : isWrong ? "❌" : "—";
    const statusLabel = isCorrect ? "Correct" : isWrong ? "Wrong" : "Skipped";
    const marksLabel = isCorrect ? "2/2" : isWrong ? "0/2" : "0/2";

    const opts = q.opts.map((opt, oi) => {
      let cls = "rv-option";
      let icon = "";
      if (oi === q.ans) {
        cls += " rv-correct";
        icon = `<span class="rv-tick">✓</span>`;
      } else if (a.yours === oi && !isCorrect) {
        cls += " rv-wrong";
        icon = `<span class="rv-cross">✗</span>`;
      }
      return `<div class="${cls}">
        <span class="rv-opt-label">${OPTS[oi]}</span>
        <span class="rv-opt-text">${decodeHTML(opt)}</span>
        ${icon}
      </div>`;
    }).join("");

    const hasSolution = q.solution && q.solution.trim().length > 0;
    const solutionBlock = hasSolution ? `
      <div class="solution-wrap">
        <button class="solution-toggle-btn" id="solution-btn-${i}" onclick="toggleSolution(${i})">💡 View Solution</button>
        <div class="solution-body" id="solution-body-${i}" style="display:none">
          <div class="solution-content">${decodeHTML(q.solution)}</div>
        </div>
      </div>` : "";

    const metaRow = `
      <div class="rv-meta">
        <span>Status <strong>${statusLabel}</strong></span>
        <span>Mark obtained <strong>${marksLabel}</strong></span>
        <span>Level <strong>${q.diff}</strong></span>
        ${a.yours !== null ? `<span>Your answer <strong>${OPTS[a.yours]}</strong></span>` : ""}
        <span>Correct answer <strong>${OPTS[q.ans]}</strong></span>
      </div>`;

    return `
      <div class="answer-item ${statusClass}">
        <div class="rv-header">
          <span class="rv-qnum">${statusIcon} Question ${i + 1}</span>
          <span class="rv-status-badge ${statusClass}-badge">${statusLabel}</span>
        </div>
        <div class="q-txt">${decodeHTML(q.text)}</div>
        <div class="rv-options">${opts}</div>
        ${metaRow}
        ${solutionBlock}
      </div>
    `;
  }).join("");

  renderMath(el);
}
