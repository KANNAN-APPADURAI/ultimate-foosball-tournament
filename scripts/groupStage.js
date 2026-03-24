// ═══════════════════════════════════════════
//  groupStage.js — Group stage rendering & updates
// ═══════════════════════════════════════════

function getSortedTeams(groupIdx) {
  return [...groupData[groupIdx].teams]
    .map((t, i) => ({ ...t, origIdx: i }))
    .sort((a, b) => b.pts - a.pts || (b.nrr || 0) - (a.nrr || 0));
}

function renderGroupStage() {
  const grid = document.getElementById('groupsGrid');
  grid.innerHTML = '';

  groupData.forEach((group, gi) => {
    const sorted = getSortedTeams(gi);
    const card   = document.createElement('div');
    card.className = 'group-card';

    const rowsHtml = sorted.map((team, rank) => {
      const isQ1    = rank === 0, isQ2 = rank === 1;
      const rowClass = isQ1 ? 'qualify-row' : isQ2 ? 'qualify2-row' : '';
      const indicator = (isQ1 || isQ2) ? `<span class="qualify-indicator"></span>` : '';
      const rankBadge = `<span class="rank-badge rank-${rank + 1}">${rank + 1}</span>`;

      const wCell   = isHost && !tournamentState.group_locked
        ? `<input class="score-input" type="number" min="0" value="${team.w}" onchange="updateGroupField(${gi},${team.origIdx},'w',this.value)">`
        : team.w;
      const lCell   = isHost && !tournamentState.group_locked
        ? `<input class="score-input" type="number" min="0" value="${team.l}" onchange="updateGroupField(${gi},${team.origIdx},'l',this.value)">`
        : team.l;
      const pts = (team.w * 2) - (team.l * 2);
      const ptsCell = `<span class="pts-val">${pts}</span>`;
      const nrrCell = isHost  && !tournamentState.group_locked
        ? `<input class="score-input" type="number" value="${team.nrr || 0}" onchange="updateGroupField(${gi},${team.origIdx},'nrr',this.value)">`
        : `${team.nrr >= 0 ? '+' : ''}${team.nrr || 0}`;

      return `
        <tr class="${rowClass}">
          <td>
            <div style="display:flex;align-items:center">
              ${indicator}${rankBadge}<span class="team-name">${team.name}</span>
            </div>
          </td>
          <td>${wCell}</td>
          <td>${lCell}</td>
          <td>${ptsCell}</td>
          <td>${nrrCell}</td>
        </tr>`;
    }).join('');

    card.innerHTML = `
      <div class="group-title">
        <div class="gnum">${gi + 1}</div>
        ${group.name}
        ${isHost  && !tournamentState.group_locked
          ? '<span style="margin-left:auto;font-size:11px;background:rgba(255,215,0,0.1);padding:3px 10px;border-radius:4px;color:var(--gold);letter-spacing:1px">EDITABLE</span>'
          : ''}
      </div>
      <table class="points-table">
        <thead>
          <tr><th>Team</th><th>W</th><th>L</th><th>PTS</th><th>NRR</th></tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>`;

    grid.appendChild(card);
  });

  // updateS8Teams();
}

async function updateGroupField(groupIdx, teamIdx, field, val) {
  const team = groupData[groupIdx].teams[teamIdx];

  team[field] = parseInt(val) || 0;

  // auto points
  team.pts = (team.w * 2);

  await updateGroup(team);
  await loadAllData();

  console.log("CALLING AUTO FILL");   // 🔥 DEBUG

  await updateS8Teams();   // 🔥 THIS WAS MISSING / NOT FIRING

  renderGroupStage();
  renderSuper8();
  renderKnockout();

  showToast(`Saved ${field.toUpperCase()} ✅`);
}
