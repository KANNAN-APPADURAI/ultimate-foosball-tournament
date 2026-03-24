// ═══════════════════════════════════════════
//  super8.js — DB-driven Super 8
// ═══════════════════════════════════════════

function renderSuper8() {
  const grid = document.getElementById('super8Grid');
  grid.innerHTML = '';

  const groupNames = ['A', 'B'];

  groupNames.forEach((gName, gi) => {
    const matches = s8Matches[gi] || [];

    const card = document.createElement('div');
    card.className = 's8-group-card';

    // ── Fixtures UI ──
    const fixtureHtml = matches.map((m, idx) => `
      <div class="fixture-row">
        <div class="fixture-num">#${m.match_number}</div>

        <div class="fixture-teams">
          <span>${m.t1 || 'TBD'}</span>

          ${
            isHost && !tournamentState.group_locked
              ? `<input class="score-input" type="number" min="0"
                   value="${m.s1 ?? ''}"
                   onchange="updateMatch(${gi}, ${idx}, 1, this.value)">
                 
                 -
                 
                 <input class="score-input" type="number" min="0"
                   value="${m.s2 ?? ''}"
                   onchange="updateMatch(${gi}, ${idx}, 2, this.value)">`
              : `<span class="vs-badge">VS</span>`
          }

          <span>${m.t2 || 'TBD'}</span>
        </div>
      </div>
    `).join('');

    // ── Compute standings ──
    const stats = computeStandings(gi);

    const rows = Object.keys(stats)
      .map(name => ({ name, ...stats[name] }))
      .sort((a, b) => b.pts - a.pts || b.nrr - a.nrr);

    const tableRows = rows.map((r, rank) => `
      <tr class="${rank === 0 ? 'qualify-row' : rank === 1 ? 'qualify2-row' : ''}">
        <td>${r.name}</td>
        <td>${r.w}</td>
        <td>${r.l}</td>
        <td>${r.pts}</td>
        <td>${r.nrr >= 0 ? '+' : ''}${r.nrr}</td>
      </tr>
    `).join('');

    card.innerHTML = `
      <div class="s8-group-title">
        ⚡ Super 8 Group ${gName}
      </div>

      <div style="padding:16px 16px 0">
        <div class="section-title">📋 Fixtures</div>
        ${fixtureHtml}
      </div>

      <div class="s8-points">
        <div class="section-title">📊 Standings</div>
        <table class="points-table">
          <thead>
            <tr><th>Team</th><th>W</th><th>L</th><th>PTS</th><th>NRR</th></tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    `;

    grid.appendChild(card);
  });
}

function computeStandings(groupIdx) {
  const matches = s8Matches[groupIdx] || [];
  const stats = {};

  matches.forEach(m => {
    if (!m.t1 || !m.t2 || m.t1 === 'TBD' || m.t2 === 'TBD') return;

    if (!stats[m.t1]) stats[m.t1] = { w:0, l:0, pts:0, nrr:0 };
    if (!stats[m.t2]) stats[m.t2] = { w:0, l:0, pts:0, nrr:0 };
    
    
    if (m.s1 == null || m.s2 == null) return;

    stats[m.t1].nrr += (m.s1 - m.s2);
    stats[m.t2].nrr += (m.s2 - m.s1);
    
    if (m.s1 > m.s2) {
      stats[m.t1].w++; 
      stats[m.t2].l++;

      stats[m.t1].pts += 2;

    } else if (m.s1 < m.s2) {
      stats[m.t2].w++; 
      stats[m.t1].l++;

      stats[m.t2].pts += 2;
    }
    
  });

  return stats;
}

async function updateMatch(groupIdx, matchIdx, team, value) {
  const match = s8Matches[groupIdx][matchIdx];

  // Update local state
  if (team === 1) {
    match.s1 = parseInt(value) || 0;
  } else {
    match.s2 = parseInt(value) || 0;
  }

  // Save to Supabase
  const supabase = window.supabase;

  const groupName = groupIdx === 0 ? 'A' : 'B';

  const { error } = await supabase
    .from('super8_matches')
    .update({
      score1: match.s1,
      score2: match.s2,
      played: true
    })
    .eq('group_name', groupName)
    .eq('match_number', match.match_number);

  if (error) {
    console.error(error);
    showToast("❌ Failed to save", true);
    return;
  }
  if (match.s1 != null && match.s2 != null) {
    await resetKnockout();
  }
  // Re-render UI
  renderSuper8();
  renderKnockout();
  showToast("✅ Match updated");
}

async function updateS8Teams() {
  if (tournamentState.group_locked) {
    console.log("Group stage locked — no auto update");
    return;
  }
  console.log("AUTO FILL RUNNING");
  console.log("GROUP DATA:", groupData);
  if (!groupData || groupData.length === 0) return;

  // Get top 2 from each group
  const qualified = groupData.map(group => {
    return [...group.teams]
      .sort((a, b) => b.pts - a.pts || (b.nrr || 0) - (a.nrr || 0))
      .slice(0, 2);
  });

  const g1 = qualified[0];
  const g2 = qualified[1];
  const g3 = qualified[2];
  const g4 = qualified[3];

  // Assign to Super 8
  s8Data = [
    {
      name: 'Super 8 Group A',
      teams: [
        g1[0]?.name,
        g2[1]?.name,
        g3[0]?.name,
        g4[1]?.name
      ]
    },
    {
      name: 'Super 8 Group B',
      teams: [
        g2[0]?.name,
        g1[1]?.name,
        g4[0]?.name,
        g3[1]?.name
      ]
    }
  ];

  // 🔥 Now update matches table (replace TBD)
  await fillS8Matches();

  renderSuper8();
}


async function fillS8Matches() {
  const supabase = window.supabase;

  const fixtures = [
    [0,1],
    [2,3],
    [0,2],
    [1,3],
    [0,3],
    [1,2]
  ];

  for (let gi = 0; gi < 2; gi++) {
    const groupMatches = s8Matches[gi];
    const teams = s8Data[gi].teams;
    const groupName = gi === 0 ? 'A' : 'B';

    for (let idx = 0; idx < groupMatches.length; idx++) {
      const m = groupMatches[idx];
      const [i, j] = fixtures[idx];

      const t1 = teams[i] || 'TBD';
      const t2 = teams[j] || 'TBD';

      // update local
      m.t1 = t1;
      m.t2 = t2;

      // 🔥 update DB
      await supabase
        .from('super8_matches')
        .update({
          team1: t1,
          team2: t2
        })
        .eq('group_name', groupName)
        .eq('match_number', m.match_number);
    }
  }

  console.log("✅ Super 8 persisted to DB");
}

function getMatchesPlayed(groupIdx) {
  return s8Matches[groupIdx].filter(m => 
    m.s1 != null && m.s2 != null
  ).length;
}