let currentUser = null;

function switchAuthTab(tab) {
  const isLogin = tab === "login";
  document.getElementById("auth-login").style.display = isLogin ? "block" : "none";
  document.getElementById("auth-register").style.display = isLogin ? "none" : "block";
  document.getElementById("tab-login-btn").className = isLogin ? "btn btn-primary" : "btn btn-outline";
  document.getElementById("tab-reg-btn").className = isLogin ? "btn btn-outline" : "btn btn-primary";
  document.getElementById("auth-msg").innerHTML = "";
}

async function doLogin() {
  const username = document.getElementById("login-username").value.trim();
  const msg = document.getElementById("auth-msg");

  if (!username) {
    msg.innerHTML = '<div class="alert alert-error">Please enter your username.</div>';
    return;
  }

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  });
  const data = await res.json();

  if (data.ok) {
    currentUser = data.username;
    localStorage.setItem("eamcet_user", currentUser);
    onLoginSuccess();
  } else {
    msg.innerHTML = `<div class="alert alert-error">❌ ${data.error}</div>`;
  }
}

async function doRegister() {
  const username = document.getElementById("reg-username").value.trim();
  const msg = document.getElementById("auth-msg");

  if (!username) {
    msg.innerHTML = '<div class="alert alert-error">Please enter a username.</div>';
    return;
  }

  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  });
  const data = await res.json();

  if (data.ok) {
    msg.innerHTML = '<div class="alert alert-success">✅ Account created! Please login.</div>';
    switchAuthTab("login");
    document.getElementById("login-username").value = username;
  } else {
    msg.innerHTML = `<div class="alert alert-error">❌ ${data.error}</div>`;
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("eamcet_user");
  showPage("auth");
  updateNavbar();
}

function updateNavbar() {
  const navUser = document.getElementById("nav-username");
  const navHistory = document.getElementById("nav-history");
  const navLogout = document.getElementById("nav-logout");
  if (currentUser) {
    navUser.textContent = `👤 ${currentUser}`;
    navHistory.style.display = "inline";
    navLogout.style.display = "inline";
  } else {
    navUser.textContent = "";
    navHistory.style.display = "none";
    navLogout.style.display = "none";
  }
}

function onLoginSuccess() {
  updateNavbar();
  showPage("papers");
  loadPapers();
}

document.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const loginVisible = document.getElementById("auth-login").style.display !== "none";
    if (document.getElementById("page-auth").style.display !== "none") {
      loginVisible ? doLogin() : doRegister();
    }
  }
});
