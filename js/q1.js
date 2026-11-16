(() => {
  const container = d3.select("#chart-q1");
  const tooltip = d3.select("#tooltip");
  const format = d3.format(",");
  let rows;

  function showTooltip(event, row) {
    tooltip.html(`<strong>${row.year}</strong><span>${format(row.hospitalisations)} hospitalisations</span>`)
      .attr("aria-hidden", "false")
      .classed("is-visible", true)
      .style("left", `${event.clientX + 14}px`)
      .style("top", `${event.clientY + 14}px`);
  }
  function hideTooltip() {
    tooltip.classed("is-visible", false).attr("aria-hidden", "true");
  }

  function render(rows) {
    container.selectAll("*").remove();
    const width = Math.max(300, container.node().getBoundingClientRect().width);
    const height = 300;
    const margin = { top: 18, right: 22, bottom: 38, left: 58 };
    const data = rows.map(d => ({ year: +d.year, hospitalisations: +d.hospitalisations }));
    const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.hospitalisations) * 1.12]).nice().range([height - margin.bottom, margin.top]);
    const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("role", "presentation");
    svg.append("g").attr("class", "grid").attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickSize(-(width - margin.left - margin.right)).tickFormat(""));
    svg.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(6).tickSizeOuter(0));
    svg.append("g").attr("class", "axis").attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format("~s")).tickSizeOuter(0));
    svg.append("path").datum(data).attr("fill", "none").attr("stroke", "#007f68").attr("stroke-width", 3)
      .attr("stroke-linecap", "round").attr("stroke-linejoin", "round")
      .attr("d", d3.line().x(d => x(d.year)).y(d => y(d.hospitalisations)).curve(d3.curveMonotoneX));
    svg.selectAll(".point").data(data).join("circle")
      .attr("cx", d => x(d.year)).attr("cy", d => y(d.hospitalisations)).attr("r", 4)
      .attr("fill", "#fff").attr("stroke", "#007f68").attr("stroke-width", 2)
      .attr("tabindex", 0).attr("aria-label", d => `${d.year}: ${format(d.hospitalisations)} hospitalisations`)
      .on("pointerenter pointermove", showTooltip).on("pointerleave", hideTooltip)
      .on("focus", function(event, d) { showTooltip(event, d); })
      .on("blur", hideTooltip);
  }

  d3.csv("data/q1_national_trend.csv").then(data => { rows = data; render(rows); }).catch(error => {
    console.error("Could not load the national trend data.", error);
    container.html('<p class="chart-error">The national trend could not be loaded. Please check that the project is served from its folder.</p>');
  });
  window.addEventListener("resize", () => { if (rows) render(rows); });
})();
