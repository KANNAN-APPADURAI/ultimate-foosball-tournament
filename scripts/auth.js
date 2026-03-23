// ═══════════════════════════════════════════
//  auth.js — Host login / logout
// ═══════════════════════════════════════════

let isHost = false;

function openLogin() {
  document.getElementById('loginModal').classList.add('open');
}

function closeLogin() {
  document.getElementById('loginModal').classList.remove('open');
}

function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;

  if (u === HOST_USER && p === HOST_PASS) {
    isHost = true;
    closeLogin();
    document.getElementById('modeBadge').textContent    = '🔧 HOST MODE';
    document.getElementById('modeBadge').className      = 'mode-badge host-mode';
    document.getElementById('hostLoginBtn').style.display  = 'none';
    document.getElementById('hostLogoutBtn').style.display = '';
    document.getElementById('hostEditHint').style.display  = '';
    renderAll();
    showToast('Welcome back, Host! 🔧');
  } else {
    document.getElementById('loginError').style.display = 'block';
    document.getElementById('loginPass').value = '';
  }
  document.querySelectorAll('.host-only').forEach(el => {
    el.style.display = '';
  });
}

function logout() {
  isHost = false;
  document.getElementById('modeBadge').textContent    = '👁 SPECTATOR MODE';
  document.getElementById('modeBadge').className      = 'mode-badge';
  document.getElementById('hostLoginBtn').style.display  = '';
  document.getElementById('hostLogoutBtn').style.display = 'none';
  document.getElementById('hostEditHint').style.display  = 'none';
  document.querySelectorAll('.host-only').forEach(el => {
    el.style.display = 'none';
  });
  renderAll();
  showToast('Logged out. Spectator mode.', true);
}