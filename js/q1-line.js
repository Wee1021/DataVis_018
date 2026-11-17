// ========================
// Q1 – Annotated national line chart
// ========================
function drawNationalTrend(data) {
  const width = 920;
  const height = 405;
  const margin = { top: 70, right: 50, bottom: 65, left: 80 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const svg = makeSVG("#q1-chart", width, height, "National hospitalisations, 2011 to 2021, with reporting-change annotations");
  const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const rows = data.slice().sort((a, b) => a.year - b.year);

  const xScale = d3.scaleLinear()
    .domain([2011, 2021])
    .range([0, innerWidth]);
  const yScale = d3.scaleLinear()
    .domain([0, 45000])
    .range([innerHeight, 0]);

  chart.append("g").attr("class", "grid")
    .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(""));
  chart.append("g").attr("class", "axis")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(xScale).tickValues(YEARS).tickFormat(d3.format("d")));
  chart.append("g").attr("class", "axis")
    .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format("~s")));

  const reportingNotes = [
    { year: 2012, note: "Victoria: reporting change", offset: 0 },
    { year: 2017, note: "NSW: reporting change", offset: 0 }
  ];
  chart.selectAll(".report-marker")
    .data(reportingNotes).join("line")
    .attr("class", "report-marker")
    .attr("x1", d => xScale(d.year)).attr("x2", d => xScale(d.year))
    .attr("y1", 0).attr("y2", innerHeight)
    .attr("stroke", "#E69F00").attr("stroke-width", 1.4)
    .attr("stroke-dasharray", "5 5");
  chart.selectAll(".report-label")
    .data(reportingNotes).join("text")
    .attr("class", "chart-note")
    .attr("x", d => xScale(d.year) + 5)
    .attr("y", -14)
    .text(d => `${d.year} ${d.note}`);

  const lineGenerator = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.hospitalisations));
  chart.append("path")
    .datum(rows)
    .attr("d", lineGenerator)
    .attr("fill", "none")
    .attr("stroke", CHART.green)
    .attr("stroke-width", 3);

  const dots = chart.selectAll(".national-point")
    .data(rows).join("circle")
    .attr("class", "national-point")
    .attr("cx", d => xScale(d.year))
    .attr("cy", d => yScale(d.hospitalisations))
    .attr("r", d => d.year === 2019 ? 6 : 4.5)
    .attr("fill", d => d.year === 2019 ? CHART.orange : CHART.green)
    .attr("stroke", "white")
    .attr("stroke-width", 1.5);
  attachDetails(dots,
    d => `Australia, ${d.year}`,
    d => [`${formatCount(d.hospitalisations)} recorded hospitalisations`]);

  chart.selectAll(".key-point-label")
    .data(rows.filter(d => [2019, 2021].includes(d.year)))
    .join("text")
    .attr("class", "chart-label")
    .attr("x", d => xScale(d.year))
    .attr("y", d => yScale(d.hospitalisations) - 14)
    .attr("text-anchor", "middle")
    .attr("font-weight", 700)
    .text(d => `${d.year}: ${formatCount(d.hospitalisations)}`);

  svg.append("text").attr("class", "axis-label")
    .attr("x", width / 2).attr("y", height - 10)
    .attr("text-anchor", "middle").text("Year");
  svg.append("text").attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + innerHeight / 2))
    .attr("y", 18).attr("text-anchor", "middle")
    .text("Hospitalisations");
}
