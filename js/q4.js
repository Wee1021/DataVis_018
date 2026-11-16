(() => {
  const container = d3.select("#chart-q4");
  const tooltip = d3.select("#tooltip");
  const slider = d3.select("#q4-year");
  const output = d3.select("#q4-year-output");
  const format = d3.format(",");
  let rows;

  function render() {
    if (!rows) return;
    const year = +slider.property("value");
    output.text(year);
    const data = rows.filter(d => +d.year === year).map(d => ({ state: d.state, hospitalisations: +d.hospitalisations }))
      .sort((a, b) => b.hospitalisations - a.hospitalisations);
    container.selectAll("*").remove();
    const width = Math.max(300, container.node().getBoundingClientRect().width);
    const margin = { top: 10, right: 60, bottom: 30, left: 58 };
    const rowHeight = 31;
    const height = Math.max(250, margin.top + margin.bottom + data.length * rowHeight);
    const x = d3.scaleLinear().domain([0, d3.max(data, d => d.hospitalisations) * 1.12]).nice().range([margin.left, width - margin.right]);
    const y = d3.scaleBand().domain(data.map(d => d.state)).range([margin.top, height - margin.bottom]).padding(.32);
    const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("role", "presentation");
    svg.append("g").attr("class", "grid").attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickSize(-height + margin.top + margin.bottom).tickFormat(""));
    svg.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("~s")).tickSizeOuter(0));
    svg.append("g").attr("class", "axis").attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickSize(0).tickPadding(10));
    svg.selectAll(".state-bar").data(data).join("rect").attr("class", "state-bar")
      .attr("x", margin.left).attr("y", d => y(d.state)).attr("width", d => x(d.hospitalisations) - margin.left)
      .attr("height", y.bandwidth()).attr("rx", 3).attr("fill", "#4c78a8")
      .on("pointerenter pointermove", (event, d) => {
        tooltip.html(`<strong>${d.state} (${year})</strong><span>${format(d.hospitalisations)} hospitalisations</span>`)
          .attr("aria-hidden", "false").classed("is-visible", true)
          .style("left", `${event.clientX + 14}px`).style("top", `${event.clientY + 14}px`);
      }).on("pointerleave", () => tooltip.classed("is-visible", false).attr("aria-hidden", "true"));
    svg.selectAll(".bar-label").data(data).join("text").attr("class", "bar-label")
      .attr("x", d => x(d.hospitalisations) + 7).attr("y", d => y(d.state) + y.bandwidth() / 2 + 3)
      .attr("fill", "#65757a").attr("font-size", 9).text(d => format(d.hospitalisations));
  }

  slider.on("input", render);
  d3.csv("data/q4_states.csv").then(data => { rows = data; render(); }).catch(error => {
    console.error("Could not load state and territory data.", error);
    container.html('<p class="chart-error">State and territory data could not be loaded. Please check that the project is served from its folder.</p>');
  });
  window.addEventListener("resize", render);
})();
