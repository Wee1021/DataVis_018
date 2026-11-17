// ========================
// Load KNIME-processed data
// ========================
function loadProjectData() {
  return Promise.all([
    d3.csv("data/q1_national_trend.csv", d => ({
      year: +d.year,
      hospitalisations: +d.hospitalisations
    })),
    d3.csv("data/q2_road_users_share.csv", d => ({
      year: +d.year,
      road_user: d.road_user,
      hospitalisations: +d.hospitalisations,
      annual_total: +d.annual_total,
      share_pct: +d.share_pct
    })),
    d3.csv("data/q3_age_groups_share.csv", d => ({
      year: +d.year,
      age_group: d.age_group,
      hospitalisations: +d.hospitalisations,
      annual_total: +d.annual_total,
      share_pct: +d.share_pct
    })),
    d3.csv("data/q4_states.csv", d => ({
      year: +d.year,
      state: d.state,
      hospitalisations: +d.hospitalisations
    })),
    d3.csv("data/q4_states_change.csv", d => ({
      state: d.state,
      cases_2018: +d.cases_2018,
      cases_2021: +d.cases_2021,
      change: +d.change,
      change_pct: +d.change_pct
    })),
    d3.csv("data/q5_first_nations.csv", d => ({
      year: +d.year,
      road_user: d.road_user,
      hospitalisations: +d.hospitalisations
    }))
  ]).then(([national, roadUsers, ageGroups, states, stateChanges, firstNations]) => {
    const lengths = [national.length, roadUsers.length, ageGroups.length, states.length, stateChanges.length, firstNations.length];
    const expected = [11, 132, 78, 88, 8, 44];
    if (lengths.some((length, i) => length !== expected[i])) {
      throw new Error(`Unexpected CSV row counts. Expected ${expected}; received ${lengths}.`);
    }
    for (const [name, data] of Object.entries({national, roadUsers, ageGroups, states, stateChanges, firstNations})) {
      if (data.some(row => Object.values(row).some(value => typeof value === "number" && !Number.isFinite(value)))) {
        throw new Error(`${name} contains an invalid numerical value.`);
      }
    }

    console.log("COS30045 BITRE CSVs loaded:", {national: national.length, roadUsers: roadUsers.length,
      ageGroups: ageGroups.length, states: states.length, stateChanges: stateChanges.length, firstNations: firstNations.length});
    return { national, roadUsers, ageGroups, states, stateChanges, firstNations };
  });
}
