(() => {
  const container = d3.select("#chart-q2");
  const tooltip = d3.select("#tooltip");
  const controls = d3.select("#q2-controls");
  const format = d3.format(",");
  const groups = [
    "Car driver",
    "Motorcyclist",
    "Pedal cyclist",
    "Car passenger",
    "Pedestrian",
    "Other / Heavy / Unknown"
  ];
  const primaryGroups = new Set(groups.slice(0, 5));
  const hiddenGroups = new Set();
  const color = d3.scaleOrdinal()
    .domain(groups)
    .range(["#007f68", "#e69f00", "#56b4e9", "#cc79a7", "#d55e00", "#8b8b8b"]);
  const shortLabels = new Map([
    ["Car unknown position", "Car (unknown)"],
    ["Heavy transport unknown position", "Heavy transport (unknown)"],
    ["Other or unknown", "Other / unknown"],
    ["Pick-up truck or van occupant", "Pick-up / van occupant"]
  ]);
  let mode = "count";
  let rows;
  let changeRows;

  function showTooltip(event, content) {
    tooltip.html(content)
      .attr("aria-hidden", "false")
      .classed("is-visible", true)
      .style("left", `${event.clientX + 14}px`)
      .style("top", `${event.clientY + 14}px`);
  }

  function hideTooltip() {
    tooltip.classed("is-visible", false).attr("aria-hidden", "true");
  }

  function renderLines() {
    if (!rows) return;
    container.selectAll("*").remove();
    hideTooltip();

    const width = Math.max(300, container.node().getBoundingClientRect().width);
    const margin = { top: 16, right: width < 760 ? 10 : 205, bottom: 56, left: 58 };
    const plotHeight = 286;
    const compactLegend = width < 760;
    const legendSpace = compactLegend ? groups.length * 19 + 12 : 0;
    const height = margin.top + plotHeight + margin.bottom + legendSpace;
    const years = Array.from(new Set(rows.map(d => +d.year))).sort((a, b) => a - b);
    const annual = years.map(year => {
      const values = { year };
      groups.forEach(group => { values[group] = 0; });
      rows.filter(d => +d.year === year).forEach(d => {
        const group = primaryGroups.has(d.road_user) ? d.road_user : "Other / Heavy / Unknown";
        const value = mode === "share" ? +d.share_pct : +d.hospitalisations;
        values[group] += value;
      });
      return values;
    });
    const plotWidth = width - margin.left - margin.right;
    const x = d3.scaleLinear()
      .domain(d3.extent(years))
      .range([margin.left + 6, margin.left + plotWidth - 6]);
    const y = d3.scaleLinear()
      .domain(mode === "share" ? [0, 40] : [0, 15000])
      .range([margin.top + plotHeight, margin.top]);
    const yTicks = mode === "share" ? [0, 10, 20, 30, 40] : [0, 3000, 6000, 9000, 12000, 15000];
    const svg = container.append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "presentation");

    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y)
        .tickValues(yTicks)
        .tickSize(-plotWidth)
        .tickFormat(""));
    svg.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${margin.top + plotHeight})`)
      .call(d3.axisBottom(x).tickValues(years).tickFormat(d3.format("d")).tickSizeOuter(0))
      .selectAll("text")
      .style("font-size", "8px");
    svg.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y)
        .tickValues(yTicks)
        .tickFormat(mode === "share" ? d => `${d}%` : d3.format("~s"))
        .tickSizeOuter(0));
    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);
    const series = svg.append("g")
      .selectAll("g")
      .data(groups)
      .join("g")
      .attr("class", "q2-series");

    series.append("path")
      .attr("fill", "none")
      .attr("stroke", group => color(group))
      .attr("stroke-width", 2)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("d", group => line(annual.map(d => ({ year: d.year, value: d[group] }))));
    series.each(function(group) {
      const points = annual.map(d => ({ year: d.year, value: d[group], category: group }));
      d3.select(this)
        .selectAll("circle")
        .data(points)
        .join("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.value))
        .attr("r", 3)
        .attr("fill", color(group))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .on("pointerenter pointermove", (event, d) => {
          const value = mode === "share"
            ? `${d3.format(".1f")(d.value)}% of annual total`
            : `${format(d.value)} hospitalisations`;
          showTooltip(event, `<strong>${d.year}</strong><span>${d.category}: ${value}</span>`);
        })
        .on("pointerleave", hideTooltip);
    });

    const legend = svg.append("g").attr("transform", compactLegend
      ? `translate(${margin.left},${margin.top + plotHeight + 34})`
      : `translate(${width - margin.right + 15},${margin.top})`);
    const legendItems = legend.selectAll("g")
      .data(groups)
      .join("g")
      .attr("class", "q2-legend-item")
      .attr("transform", (group, index) => `translate(0,${index * 19})`)
      .attr("role", "button")
      .attr("tabindex", 0)
      .style("cursor", "pointer")
      .on("click", toggleGroup)
      .on("keydown", function(event, group) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleGroup(event, group);
        }
      });
    legendItems.append("line")
      .attr("x1", 0)
      .attr("x2", 12)
      .attr("y1", 9)
      .attr("y2", 9)
      .attr("stroke", group => color(group))
      .attr("stroke-width", 2);
    legendItems.append("circle")
      .attr("cx", 6)
      .attr("cy", 9)
      .attr("r", 3)
      .attr("fill", group => color(group));
    legendItems.append("text")
      .attr("x", 18)
      .attr("y", 12)
      .attr("fill", "#52636a")
      .attr("font-size", 9)
      .text(group => group);
    const emptyMessage = svg.append("text")
      .attr("x", margin.left + plotWidth / 2)
      .attr("y", margin.top + plotHeight / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#748289")
      .attr("font-size", 11)
      .attr("pointer-events", "none")
      .text("Select a road-user group in the legend to show its line.");

    function updateVisibility(animate) {
      const visibleCount = groups.filter(group => !hiddenGroups.has(group)).length;
      series.each(function(group) {
        const visible = !hiddenGroups.has(group);
        const seriesGroup = d3.select(this).attr("pointer-events", visible ? null : "none");
        const path = seriesGroup.select("path");
        const points = seriesGroup.selectAll("circle");
        if (animate) {
          path.transition().duration(180).style("opacity", visible ? 1 : 0);
          points.transition().duration(180).style("opacity", visible ? 1 : 0);
        } else {
          path.style("opacity", visible ? 1 : 0);
          points.style("opacity", visible ? 1 : 0);
        }
      });
      legendItems
        .attr("aria-pressed", group => String(!hiddenGroups.has(group)))
        .attr("aria-label", group => `${group}: ${hiddenGroups.has(group) ? "hidden" : "shown"}`);
      emptyMessage.attr("aria-hidden", visibleCount ? "true" : "false");
      if (animate) {
        legendItems.transition().duration(180).style("opacity", group => hiddenGroups.has(group) ? .35 : 1);
        emptyMessage.transition().duration(180).style("opacity", visibleCount ? 0 : 1);
      } else {
        legendItems.style("opacity", group => hiddenGroups.has(group) ? .35 : 1);
        emptyMessage.style("opacity", visibleCount ? 0 : 1);
      }
    }

    function toggleGroup(event, group) {
      if (hiddenGroups.has(group)) hiddenGroups.delete(group);
      else hiddenGroups.add(group);
      hideTooltip();
      updateVisibility(true);
    }

    updateVisibility(false);
  }

  function renderChange() {
    if (!changeRows) return;
    container.selectAll("*").remove();
    hideTooltip();

    const data = changeRows.map(d => ({
      roadUser: d["Road user"],
      cases2011: +d.cases_2011,
      cases2021: +d.cases_2021,
      change: +d.change
    })).sort((a, b) => b.change - a.change);
    const width = Math.max(300, container.node().getBoundingClientRect().width);
    const compact = width < 560;
    const margin = { top: 14, right: 52, bottom: 43, left: compact ? 132 : 188 };
    const rowHeight = 27;
    const plotHeight = data.length * rowHeight;
    const height = margin.top + plotHeight + margin.bottom;
    const maxChange = d3.max(data, d => Math.abs(d.change));
    const x = d3.scaleLinear()
      .domain([-maxChange * 1.35, maxChange * 1.35])
      .range([margin.left, width - margin.right]);
    const y = d3.scaleBand()
      .domain(data.map(d => d.roadUser))
      .range([margin.top, margin.top + plotHeight])
      .padding(.28);
    const svg = container.append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "presentation");
    const xAxisPosition = margin.top + plotHeight;

    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${xAxisPosition})`)
      .call(d3.axisBottom(x).ticks(5).tickSize(-plotHeight).tickFormat(""));
    svg.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${xAxisPosition})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => d === 0 ? "0" : d3.format("+,d")(d)).tickSizeOuter(0));
    svg.append("line")
      .attr("x1", x(0))
      .attr("x2", x(0))
      .attr("y1", margin.top)
      .attr("y2", xAxisPosition)
      .attr("stroke", "#65757a")
      .attr("stroke-width", 1.5);

    const chartRows = svg.append("g")
      .selectAll("g")
      .data(data)
      .join("g")
      .attr("transform", d => `translate(0,${y(d.roadUser) + y.bandwidth() / 2})`)
      .on("pointerenter pointermove", (event, d) => {
        const signedChange = `${d.change > 0 ? "+" : ""}${format(d.change)}`;
        showTooltip(event, `<strong>${d.roadUser}</strong><span>2011: ${format(d.cases2011)} | 2021: ${format(d.cases2021)}<br>Net change: ${signedChange} hospitalisations</span>`);
      })
      .on("pointerleave", hideTooltip);

    chartRows.append("rect")
      .attr("x", margin.left)
      .attr("y", -rowHeight / 2)
      .attr("width", width - margin.left - margin.right)
      .attr("height", rowHeight)
      .attr("fill", "transparent")
      .attr("pointer-events", "all");
    chartRows.append("rect")
      .attr("x", d => Math.min(x(0), x(d.change)))
      .attr("y", -y.bandwidth() / 2)
      .attr("width", d => Math.max(1, Math.abs(x(d.change) - x(0))))
      .attr("height", y.bandwidth())
      .attr("rx", 3)
      .attr("fill", d => d.change >= 0 ? "#16856f" : "#c94f57");
    chartRows.append("text")
      .attr("x", margin.left - 9)
      .attr("y", 3)
      .attr("text-anchor", "end")
      .attr("fill", "#52636a")
      .attr("font-size", compact ? 8 : 9)
      .text(d => shortLabels.get(d.roadUser) || d.roadUser);
    chartRows.append("text")
      .attr("x", d => x(d.change) + (d.change >= 0 ? 6 : -6))
      .attr("y", 3)
      .attr("text-anchor", d => d.change >= 0 ? "start" : "end")
      .attr("fill", "#344952")
      .attr("font-size", 9)
      .attr("font-weight", 700)
      .text(d => `${d.change > 0 ? "+" : ""}${format(d.change)}`);
  }

  function render() {
    if (mode === "change") {
      renderChange();
      return;
    }
    renderLines();
  }

  controls.selectAll("button").on("click", function() {
    mode = this.dataset.mode;
    controls.selectAll("button").classed("is-selected", false).attr("aria-pressed", "false");
    d3.select(this).classed("is-selected", true).attr("aria-pressed", "true");

    const chartTitle = mode === "change"
      ? "Net change in hospitalisations (2011 vs 2021)"
      : mode === "share"
        ? "Share of annual hospitalisations by road-user group"
        : "Hospitalisations by road-user group";
    d3.select("#q2-chart-title").text(chartTitle);
    d3.select("#q2-unit").text(mode === "share"
      ? "Share of annual total"
      : mode === "change" ? "Net change in hospitalisations" : "People");
    container.attr("aria-label", mode === "change"
      ? "Diverging bar chart of net hospitalisation changes by road-user group from 2011 to 2021"
      : mode === "share"
        ? "Multi-series line chart of road-user groups' share of annual hospitalisations from 2011 to 2021"
        : "Multi-series line chart of hospitalisations by road-user group from 2011 to 2021");
    render();
  });

  Promise.all([
    d3.csv("data/q2_road_users_share.csv"),
    d3.csv("data/q2_road_users_change.csv")
  ]).then(([shareData, changes]) => {
    rows = shareData;
    changeRows = changes;
    render();
  }).catch(error => {
    console.error("Could not load road-user data.", error);
    container.html('<p class="chart-error">Road-user data could not be loaded. Please check that the project is served from its folder.</p>');
  });

  window.addEventListener("resize", render);
})();
