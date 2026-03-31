let allPapers = [];

async function loadPapers() {
  const grid = document.getElementById("papers-grid");
  grid.innerHTML = '<div class="loader">⏳ Loading papers...</div>';

  const res = await fetch("/api/papers");
  allPapers = await res.json();

  renderPapers(allPapers);
}

function filterPapers() {
  const q = document.getElementById("paper-search").value.toLowerCase();
  const filtered = allPapers.filter(p =>
    p.name.toLowerCase().includes(q) || p.subject.toLowerCase().includes(q)
  );
  renderPapers(filtered);
}

function renderPapers(papers) {
  const grid = document.getElementById("papers-grid");

  if (papers.length === 0) {
    grid.innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>No papers found</p></div>';
    return;
  }

  const subjectClass = s => {
    const sl = s.toLowerCase();
    if (sl.includes("math")) return "maths";
    if (sl.includes("phys")) return "physics";
    if (sl.includes("chem")) return "chemistry";
    return "";
  };

  grid.innerHTML = papers.map(p => {
    const diffBadges = (p.difficulties || []).map(d =>
      `<span class="badge badge-blue">${d}</span>`
    ).join(" ");

    return `
      <div class="paper-card ${subjectClass(p.subject)}">
        <h3>${p.name}</h3>
        <p style="color:var(--muted);font-size:0.85rem">${p.subject}</p>
        <div class="paper-meta">${diffBadges}</div>
        <div class="paper-footer">
          <span style="font-size:0.85rem;color:var(--muted)">
            📝 ${p.question_count} Qs
          </span>
          <button class="start-btn" onclick="startExam('${p.id}')">Start Test →</button>
        </div>
      </div>
    `;
  }).join("");
}
