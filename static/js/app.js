function showPage(name) {
  const pages = ["auth", "papers", "exam", "result", "history"];
  pages.forEach(p => {
    document.getElementById(`page-${p}`).style.display = p === name ? "" : "none";
  });

  if (name === "history") loadHistory();
}

window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("eamcet_user");
  if (saved) {
    currentUser = saved;
    updateNavbar();
    showPage("papers");
    loadPapers();
  } else {
    showPage("auth");
  }
});
