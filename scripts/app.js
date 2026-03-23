// ═══════════════════════════════════════════
//  app.js — Entry point, renderAll
// ═══════════════════════════════════════════

function renderAll() {
  // updateS8Teams();
  renderGroupStage();
  renderSuper8();
  renderKnockout();
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadAllData();
  renderAll();
});
