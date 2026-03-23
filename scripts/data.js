// ═══════════════════════════════════════════
//  data.js — Supabase-powered data layer
// ═══════════════════════════════════════════

const HOST_USER = 'host';
const HOST_PASS = 'ufc2025';

let tournamentState = {
  group_locked: false,
  super8_locked: false
};


// fallback (only used if DB empty)
const GROUPS_DEFAULT = [
  {
    name: 'Group 1',
    teams: [
      { name: 'Naga & Shivang', w:0, l:0, pts:0, nrr:0 },
      { name: 'Rahul Kaddi & Shaik', w:0, l:0, pts:0, nrr:0 },
      { name: 'Thiyanesh & Uday', w:0, l:0, pts:0, nrr:0 },
      { name: 'Dhanush & Afzal', w:0, l:0, pts:0, nrr:0 },
      { name: 'Riya & Tharun', w:0, l:0, pts:0, nrr:0 },
    ]
  },
  {
    name: 'Group 2',
    teams: [
      { name: 'Om & Smritish', w:0, l:0, pts:0, nrr:0 },
      { name: 'John & Puneet', w:0, l:0, pts:0, nrr:0 },
      { name: 'Gary & Ebenezer', w:0, l:0, pts:0, nrr:0 },
      { name: 'Ashish & Srujan', w:0, l:0, pts:0, nrr:0 },
      { name: 'Akil & Harshavardhan', w:0, l:0, pts:0, nrr:0 },
    ]
  },
  {
    name: 'Group 3',
    teams: [
      { name: 'Melvin & Nirvindha', w:0, l:0, pts:0, nrr:0 },
      { name: 'Kannan & Graeson', w:0, l:0, pts:0, nrr:0 },
      { name: 'Priya & Gaayatri', w:0, l:0, pts:0, nrr:0 },
      { name: 'Isha & Prateek', w:0, l:0, pts:0, nrr:0 },
      { name: 'Jaswanthini & Manoj', w:0, l:0, pts:0, nrr:0 },
    ]
  },
  {
    name: 'Group 4',
    teams: [
      { name: 'Ganesh & Jaswanth', w:0, l:0, pts:0, nrr:0 },
      { name: 'Rahul & Kaja', w:0, l:0, pts:0, nrr:0 },
      { name: 'Girish & Himanshu', w:0, l:0, pts:0, nrr:0 },
      { name: 'Vibhuti & Sanjeevi', w:0, l:0, pts:0, nrr:0 },
      { name: 'Fakruddin & Murugan', w:0, l:0, pts:0, nrr:0 },
    ]
  }
];

// ── Live state ──
let groupData = [];
let knockoutData = {};

// ── Load from Supabase ──
async function loadAllData() {
  const supabase = window.supabase;

  // GROUPS
  const { data: groups, error } = await supabase
    .from('group_standings')
    .select('*');

  if (error) {
    console.error("Group load error:", error);
    groupData = GROUPS_DEFAULT;
    return;
  }
  groupData = mapGroups(groups);

  // ───────── SUPER 8 MATCHES ─────────
  const { data: matches, error: mErr } = await supabase
    .from('super8_matches')
    .select('*')
    .order('match_number', { ascending: true });

  if (mErr) console.error(mErr);

  s8Matches = mapMatches(matches || []);

  const { data: state } = await supabase
  .from('tournament_state')
  .select('*')
  .eq('id', 1)
  .single();

  if (state) tournamentState = state;

  const { data: ko, error: koErr } = await supabase
    .from('knockout')
    .select('*')
    .limit(1)
    .single();

  if (koErr) {
    console.error("Knockout load error:", koErr);
  } else if (ko) {
    knockoutData = {
      sf1: { s1: ko.sf1_score1, s2: ko.sf1_score2 },
      sf2: { s1: ko.sf2_score1, s2: ko.sf2_score2 },
      final: { s1: ko.final_score1, s2: ko.final_score2 }
    };
  }

}

// ── Map DB → UI format ──
function mapMatches(rows) {
  const groups = { A: [], B: [] };

  rows.forEach(r => {
    groups[r.group_name].push({
      match_number: r.match_number,
      t1: r.team1,
      t2: r.team2,
      s1: r.score1,
      s2: r.score2
    });
  });

  return [groups.A, groups.B];
}

// ── Update group row ──
async function updateGroup(team) {
  const supabase = window.supabase;

  const { error } = await supabase
    .from('group_standings')
    .update({
      wins: team.w,
      losses: team.l,
      points: team.pts,
      nrr: team.nrr
    })
    .eq('team_name', team.name);

  if (error) console.error("Update error:", error);
}
let s8Data = [
  {
    name: 'Super 8 Group A',
    teams: ['TBD','TBD','TBD','TBD']
  },
  {
    name: 'Super 8 Group B',
    teams: ['TBD','TBD','TBD','TBD']
  }
];
function mapGroups(rows) {
  const colors = {
    'Group 1': '#FFD700',
    'Group 2': '#FF2D55',
    'Group 3': '#00F5FF',
    'Group 4': '#00FF88'
  };

  const grouped = {};

  rows.forEach(r => {
    if (!grouped[r.group_name]) {
      grouped[r.group_name] = {
        name: r.group_name,
        color: colors[r.group_name], // ✅ FIX
        teams: []
      };
    }

    grouped[r.group_name].teams.push({
      name: r.team_name,
      w: r.wins,
      l: r.losses,
      pts: (r.wins * 2) - (r.losses * 2),
      nrr: r.nrr || 0
    });
  });

  return Object.values(grouped);
}