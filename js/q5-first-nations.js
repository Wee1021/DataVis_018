// ========================
// Q5 – First Nations road user trends
// ========================
function drawFirstNations(data) {
  const colours = d3.scaleOrdinal()
    .domain(Q5_GROUPS)
    .range([CHART.green, CHART.orange, "#56B4E9", "#D55E00"]);
  const shownGroups = new Set(Q5_GROUPS);
  const maxAll = d3.max(data, d => d.hospitalisations);
  const legend = d3.select("#q5-legend");

  const legendButtons = legend.selectAll("button").data(Q5_GROUPS).join("button")
    .attr("type", "button")
    .attr("class", "legend-button")
    .style("--swatch", group => colours(group))
    .html(group => `<span class="legend-swatch" aria-hidden="true"></span>${safeText(group === Q5_GROUPS[0] ? "Car occupants" : group)}`)
    .on("click", (event, group) => {
      if (shownGroups.has(group)) shownGroups.delete(group);
      else shownGroups.add(group);
      render();
    });

  function render() {
    hideTooltip();
    legendButtons.attr("aria-pressed", d => String(shownGroups.has(d)));
    const width = 930;
    const height = 425;
    const margin = { top: 24, right: 40, bottom: 63, left: 77 };
    const iw = width - margin.left - margin.right;
    const ih = height - margin.top - margin.bottom;
    const svg = makeSVG("#q5-chart", width, height, "First Nations hospitalisations for four selected road user groups, 2011–2021");
    const plot = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const xScale = d3.scaleLinear().domain([2011,2021]).range([0,iw]);
    const yScale = d3.scaleLinear().domain([0,maxAll * 1.1]).nice().range([ih,0]);
    plot.append("g").attr("class", "grid")
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-iw).tickFormat(""));
    plot.append("g").attr("class", "axis")
      .attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(xScale).tickValues(YEARS).tickFormat(d3.format("d")));
    plot.append("g").attr("class", "axis")
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format("~s")));
    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.hospitalisations));

    Q5_GROUPS.filter(group => shownGroups.has(group)).forEach(group => {
      const rows = data.filter(d => d.road_user === group).sort((a,b) => a.year - b.year);
      plot.append("path").datum(rows)
        .attr("d", line).attr("fill", "none")
        .attr("stroke", colours(group)).attr("stroke-width", 3);
      const points = plot.selectAll(null).data(rows).enter().append("circle")
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.hospitalisations))
        .attr("r", 4).attr("fill", colours(group)).attr("stroke", "white");
      attachDetails(points,
        d => `${group === Q5_GROUPS[0] ? "Car occupants" : group} · ${d.year}`,
        d => [`${formatCount(d.hospitalisations)} recorded hospitalisations`]);
    });
    if (!shownGroups.size) {
      plot.append("text").attr("x", iw/2).attr("y", ih/2)
        .attr("text-anchor", "middle").attr("class", "chart-label")
        .text("Select a road user group in the legend.");
    }
    svg.append("text").attr("class", "axis-label")
      .attr("x", width / 2).attr("y", height - 10).attr("text-anchor", "middle")
      .text("Year");
    svg.append("text").attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -(margin.top + ih/2)).attr("y", 18).attr("text-anchor", "middle")
      .text("Hospitalisations");
  }

  d3.select("#q5-summary").selectAll("div")
    .data(Q5_GROUPS).join("div")
    .html(group => {
      const first = data.find(d => d.year === 2011 && d.road_user === group);
      const last = data.find(d => d.year === 2021 && d.road_user === group);
      const delta = last.hospitalisations - first.hospitalisations;
      const pct = delta / first.hospitalisations * 100;
      const label = group === Q5_GROUPS[0] ? "Car occupants" : group;
      return `<strong>${safeText(label)}</strong>` +
        `<span>2011: ${formatCount(first.hospitalisations)}</span>` +
        `<span>2021: ${formatCount(last.hospitalisations)}</span>` +
        `<span>Change: ${signedCount(delta)} (${signedPercent(pct)})</span>`;
    });
  render();
}
