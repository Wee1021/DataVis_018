(() => {
  const container = d3.select("#chart-q5");
  const tooltip = d3.select("#tooltip");
  const format = d3.format(",");
  const hiddenGroups = new Set();
  let rows;

  function render(data) {
    container.selectAll("*").remove();
    tooltip.classed("is-visible", false).attr("aria-hidden", "true");

    const width = Math.max(300, container.node().getBoundingClientRect().width);
    const chartData = data.map(d => ({
      year: +d.year,
      road_user: d.road_user,
      hospitalisations: +d.hospitalisations
    }));
    const keys = Array.from(new Set(chartData.map(d => d.road_user)));
    const years = Array.from(new Set(chartData.map(d => d.year))).sort((a, b) => a - b);
    const compactLegend = width < 760;
    const plotHeight = 276;
    const margin = { top: 16, right: compactLegend ? 10 : 260, bottom: 56, left: 58 };
    const legendSpace = compactLegend ? keys.length * 22 + 12 : 0;
    const height = margin.top + plotHeight + margin.bottom + legendSpace;
    const grouped = d3.group(chartData, d => d.road_user);
    const plotWidth = width - margin.left - margin.right;
    const x = d3.scaleLinear()
      .domain(d3.extent(years))
      .range([margin.left + 6, margin.left + plotWidth - 6]);
    const y = d3.scaleLinear().range([margin.top + plotHeight, margin.top]);
    const color = d3.scaleOrdinal()
      .domain(keys)
      .range(["#007f68", "#e69f00", "#56b4e9", "#d55e00"]);
    const svg = container.append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "presentation");
    const grid = svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left},0)`);
    const yAxis = svg.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${margin.left},0)`);
    const xAxis = svg.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${margin.top + plotHeight})`);
    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.hospitalisations))
      .curve(d3.curveMonotoneX);
    const series = svg.append("g")
      .selectAll("g")
      .data(keys)
      .join("g")
      .attr("class", "q5-series");

    series.append("path")
      .attr("fill", "none")
      .attr("stroke", key => color(key))
      .attr("stroke-width", 2.5)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("d", key => line(grouped.get(key)));
    series.each(function(key) {
      d3.select(this)
        .selectAll("circle")
        .data(grouped.get(key))
        .join("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.hospitalisations))
        .attr("r", 4)
        .attr("fill", color(key))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .on("pointerenter pointermove", (event, d) => {
          tooltip.html(`<strong>Year: ${d.year}</strong><span>Road user group: ${d.road_user}<br>Hospitalisations: ${format(d.hospitalisations)}</span>`)
            .attr("aria-hidden", "false")
            .classed("is-visible", true)
            .style("left", `${event.clientX + 14}px`)
            .style("top", `${event.clientY + 14}px`);
        })
        .on("pointerleave", () => tooltip.classed("is-visible", false).attr("aria-hidden", "true"));
    });

    const legend = svg.append("g")
      .attr("transform", compactLegend
        ? `translate(${margin.left},${margin.top + plotHeight + 34})`
        : `translate(${width - margin.right + 16},${margin.top})`);
    const legendItems = legend.selectAll("g")
      .data(keys)
      .join("g")
      .attr("class", "q5-legend-item")
      .attr("transform", (key, index) => `translate(0,${index * 22})`)
      .attr("role", "button")
      .attr("tabindex", 0)
      .style("cursor", "pointer")
      .on("click", toggleGroup)
      .on("keydown", function(event, key) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleGroup(event, key);
        }
      });
    legendItems.append("line")
      .attr("x1", 0)
      .attr("x2", 12)
      .attr("y1", 9)
      .attr("y2", 9)
      .attr("stroke", key => color(key))
      .attr("stroke-width", 2.5);
    legendItems.append("circle")
      .attr("cx", 6)
      .attr("cy", 9)
      .attr("r", 3)
      .attr("fill", key => color(key));
    legendItems.append("text")
      .attr("x", 18)
      .attr("y", 12)
      .attr("fill", "#52636a")
      .attr("font-size", 9)
      .text(key => key);
    const emptyMessage = svg.append("text")
      .attr("x", margin.left + plotWidth / 2)
      .attr("y", margin.top + plotHeight / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#748289")
      .attr("font-size", 11)
      .attr("pointer-events", "none")
      .text("Select a road-user group in the legend to show its line.");

    function updateChart(animate) {
      const visibleData = chartData.filter(d => !hiddenGroups.has(d.road_user));
      const maxValue = d3.max(visibleData, d => d.hospitalisations) || 0;
      y.domain(maxValue ? [0, maxValue * 1.08] : [0, 1]).nice();

      const gridAxis = d3.axisLeft(y).ticks(5).tickSize(-plotWidth).tickFormat("");
      const verticalAxis = d3.axisLeft(y).ticks(5).tickFormat(d3.format("~s")).tickSizeOuter(0);
      if (animate) {
        grid.transition().duration(450).call(gridAxis);
        yAxis.transition().duration(450).call(verticalAxis);
      } else {
        grid.call(gridAxis);
        yAxis.call(verticalAxis);
      }

      series.each(function(key) {
        const group = d3.select(this);
        const visible = !hiddenGroups.has(key);
        group.attr("pointer-events", visible ? null : "none");
        const path = group.select("path");
        const points = group.selectAll("circle");
        if (animate) {
          path.transition().duration(450).attr("d", line(grouped.get(key))).style("opacity", visible ? 1 : 0);
          points.transition().duration(450)
            .attr("cy", d => y(d.hospitalisations))
            .style("opacity", visible ? 1 : 0);
        } else {
          path.attr("d", line(grouped.get(key))).style("opacity", visible ? 1 : 0);
          points.attr("cy", d => y(d.hospitalisations)).style("opacity", visible ? 1 : 0);
        }
      });

      legendItems
        .attr("aria-pressed", key => String(!hiddenGroups.has(key)))
        .attr("aria-label", key => `${key}: ${hiddenGroups.has(key) ? "hidden" : "shown"}`);
      emptyMessage.attr("aria-hidden", visibleData.length ? "true" : "false");
      if (animate) {
        legendItems.transition().duration(200).style("opacity", key => hiddenGroups.has(key) ? .35 : 1);
        emptyMessage.transition().duration(200).style("opacity", visibleData.length ? 0 : 1);
      } else {
        legendItems.style("opacity", key => hiddenGroups.has(key) ? .35 : 1);
        emptyMessage.style("opacity", visibleData.length ? 0 : 1);
      }
    }

    function toggleGroup(event, key) {
      if (hiddenGroups.has(key)) hiddenGroups.delete(key);
      else hiddenGroups.add(key);
      updateChart(true);
    }

    xAxis.call(d3.axisBottom(x).tickValues(years).tickFormat(d3.format("d")).tickSizeOuter(0))
      .selectAll("text")
      .style("font-size", "8px");
    updateChart(false);
  }

  d3.csv("data/q5_first_nations.csv").then(data => {
    rows = data;
    render(rows);
  }).catch(error => {
    console.error("Could not load First Nations road-user data.", error);
    container.html('<p class="chart-error">First Nations road-user data could not be loaded. Please check that the project is served from its folder.</p>');
  });
  window.addEventListener("resize", () => { if (rows) render(rows); });
})();
