loadProjectData()
  .then(data => {
    drawNationalTrend(data.national);
    drawRoadUsers(data.roadUsers);
    drawAgeHeatmap(data.ageGroups);
    drawStateCharts(data.states, data.stateChanges);
    drawFirstNations(data.firstNations);
  })
  .catch(error => {
    console.error("Could not initialise the BITRE data story:", error);
    ["#q1-chart", "#q2-chart", "#q3-chart", "#q4-chart", "#q5-chart"].forEach(selector => {
      setChartError(selector, "The data could not be loaded. Please run the project with a local server and check the CSV files in the data folder.");
    });
  });
