// ═══════════════════════════════════════════
//  ui.js — Tabs, toast, particles
// ═══════════════════════════════════════════

// ── TABS ──
function showTab(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  event.target.classList.add('active');
}

// ── TOAST ──
let toastTimer;
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = 'toast' + (isError ? ' error' : '');
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ── PARTICLES ──
(function spawnParticles() {
  const container = document.getElementById('particles');
  const colors    = ['#FFD700','#FF2D55','#00F5FF','#00FF88','#FF6B00'];
  for (let i = 0; i < 25; i++) {
    const p    = document.createElement('div');
    p.className = 'particle';
    const size  = Math.random() * 4 + 2;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      left:${Math.random() * 100}%;
      animation-duration:${Math.random() * 15 + 8}s;
      animation-delay:-${Math.random() * 15}s;
      opacity:0.6;
      filter:blur(${Math.random()}px);
    `;
    container.appendChild(p);
  }
})();

async function freezeGroupStage() {
  if (!isHost) {
    showToast("❌ Not allowed", true);
    return;
  }

  const supabase = window.supabase;

  await supabase
    .from('tournament_state')
    .update({ group_locked: true })
    .eq('id', 1);

  tournamentState.group_locked = true;

  showToast("🔒 Group Stage Locked");
  renderAll();
}

async function freezeSuper8() {
  if (!isHost) {
    showToast("❌ Not allowed", true);
    return;
  }

  const supabase = window.supabase;

  await supabase
    .from('tournament_state')
    .update({ super8_locked: true })
    .eq('id', 1);

  tournamentState.super8_locked = true;

  showToast("🔒 Super 8 Locked");
  renderAll();
}

async function resetKnockout() {
  const supabase = window.supabase;

  await supabase
    .from('knockout')
    .update({
      sf1_score1: null,
      sf1_score2: null,
      sf2_score1: null,
      sf2_score2: null,
      final_score1: null,
      final_score2: null
    })
    .eq('id', 1);

  knockoutData = {
    sf1: { s1: null, s2: null },
    sf2: { s1: null, s2: null },
    final: { s1: null, s2: null }
  };

  console.log("🔄 Knockout reset");
}