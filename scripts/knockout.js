// ═══════════════════════════════════════════
//  knockout.js — Knockout bracket rendering & updates
// ═══════════════════════════════════════════

function getWinner(t1, t2, s1, s2) {
  if (s1 == null || s2 == null) return null;
  if (s1 === s2) return null; // 🔥 critical fix

  return s1 > s2 ? t1 : t2;
}

function getS8Qualified() {
  return [0, 1].map(groupIdx => {
    const stats = computeStandings(groupIdx);

    const rows = Object.keys(stats)
      .map(name => ({ name, ...stats[name] }))
      .sort((a, b) => b.pts - a.pts || (b.nrr || 0) - (a.nrr || 0));

    return {
      winner: rows[0]?.name || 'TBD',
      runner: rows[1]?.name || 'TBD'
    };
  });
}

function renderKnockout() {
  const q = getS8Qualified();
  if (!knockoutData.sf1) {
      knockoutData = {
        sf1: { s1: null, s2: null },
        sf2: { s1: null, s2: null },
        final: { s1: null, s2: null }
      };
    }
  // Auto-derive semi matchups
  const sf1 = { 
    t1: q[0]?.winner || 'TBD', 
    t2: q[1]?.runner || 'TBD',
    s1: knockoutData.sf1.s1, 
    s2: knockoutData.sf1.s2 
  };

  const sf2 = { 
    t1: q[1]?.winner || 'TBD', 
    t2: q[0]?.runner || 'TBD',
    s1: knockoutData.sf2.s1, 
    s2: knockoutData.sf2.s2 
  };

  const sf1Winner = getWinner(sf1.t1, sf1.t2, sf1.s1, sf1.s2);
  const sf2Winner = getWinner(sf2.t1, sf2.t2, sf2.s1, sf2.s2);

  const finT1 = sf1Winner || 'SF1 Winner';
  const finT2 = sf2Winner || 'SF2 Winner';

  const fin = {
    t1: finT1,
    t2: finT2,
    s1: knockoutData.final.s1,
    s2: knockoutData.final.s2
  };

  const champion = getWinner(fin.t1, fin.t2, fin.s1, fin.s2);

  const scoreCell = (s) => s !== null ? `<span class="team-score">${s}</span>` : '';

  const matchCard = (match, id) => `
    <div class="match-card ${id === 'final' ? 'final-card' : ''}">
      <div class="match-team ${(match.t1 || '').includes('Winner') || match.t1 === 'TBD' ? 'tbd' : ''}">
        <span>${match.t1}</span>
        ${scoreCell(match.s1)}
        ${isHost && !(match.t1 || '').includes('Winner') && match.t1 !== 'TBD'
          ? `<input class="score-input" type="number" min="0" placeholder="0" value="${match.s1 ?? ''}"
               onchange="updateKO('${id}','s1',this.value)" style="margin-left:8px;width:36px">`
          : ''}
      </div>
      <div class="match-team ${match.t2.includes('Winner') || match.t2 === 'TBD' ? 'tbd' : ''}">
        <span>${match.t2}</span>
        ${scoreCell(match.s2)}
        ${isHost && !match.t2.includes('Winner') && match.t2 !== 'TBD'
          ? `<input class="score-input" type="number" min="0" placeholder="0" value="${match.s2 ?? ''}"
               onchange="updateKO('${id}','s2',this.value)" style="margin-left:8px;width:36px">`
          : ''}
      </div>
    </div>`;

  document.getElementById('bracketContainer').innerHTML = `
    <div class="bracket">

      <!-- Semifinals -->
      <div>
        <div class="round-label">Semifinals</div>
        <div style="display:flex;flex-direction:column;gap:40px">

          <div>
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:11px;letter-spacing:2px;
                        color:var(--red);margin-bottom:8px;text-transform:uppercase">
              Semifinal 1 — S8A Winner vs S8B Runner-up
            </div>
            ${matchCard(sf1, 'sf1')}
          </div>

          <div>
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:11px;letter-spacing:2px;
                        color:var(--red);margin-bottom:8px;text-transform:uppercase">
              Semifinal 2 — S8B Winner vs S8A Runner-up
            </div>
            ${matchCard(sf2, 'sf2')}
          </div>

        </div>
      </div>

      <!-- Connector -->
      <div style="display:flex;flex-direction:column;gap:20px;align-items:center;justify-content:center">
        <div style="width:3px;height:120px;background:linear-gradient(180deg,var(--gold),transparent)"></div>
        <div style="width:60px;height:2px;background:var(--gold)"></div>
        <div style="width:3px;height:120px;background:linear-gradient(0deg,var(--gold),transparent)"></div>
      </div>

      <!-- Grand Final -->
      <div>
        <div class="round-label" style="color:var(--gold)">🏆 Grand Final</div>
        ${matchCard(fin, 'final')}
      </div>

    </div>`;

  // Champion reveal
  const champ = document.getElementById('championSection');
  if (champion) {
    champ.style.display = '';
    document.getElementById('championName').textContent = '🎉 ' + champion + ' 🎉';
  } else {
    champ.style.display = 'none';
  }
}

async function updateKO(match, side, val) {
  knockoutData[match][side] = parseInt(val) || 0;

  const supabase = window.supabase;

  let updatePayload = {};

  if (match === 'sf1') {
    updatePayload = {
      sf1_score1: knockoutData.sf1.s1,
      sf1_score2: knockoutData.sf1.s2
    };
  }

  if (match === 'sf2') {
    updatePayload = {
      sf2_score1: knockoutData.sf2.s1,
      sf2_score2: knockoutData.sf2.s2
    };
  }

  if (match === 'final') {
    updatePayload = {
      final_score1: knockoutData.final.s1,
      final_score2: knockoutData.final.s2
    };
  }

  const { error } = await supabase
    .from('knockout')
    .update(updatePayload)
    .eq('id', 1);

  if (error) {
    console.error(error);
    showToast("❌ Failed to save", true);
    return;
  }

  renderKnockout();
  showToast("✅ Score saved");
}