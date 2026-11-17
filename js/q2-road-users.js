// ========================
// Q2 – Road user changes and long-term trends
// ========================
function drawRoadUsers(data) {
  const roadUsers = Array.from(new Set(data.map(d => d.road_user))).sort(d3.ascending);
  const colour = d3.scaleOrdinal().domain(roadUsers).range(CHART.roadColours);
  const trendOptions = ["Car driver", "Car passenger", "Motorcyclist", "Pedal cyclist", "Pedestrian", "Other or unknown"];
  const visibleGroups = new Set(["Car driver", "Motorcyclist", "Pedal cyclist", "Pedestrian"]);
  let view = "change";
  let metric = "count";
  let startYear = 2011;
  let endYear = 2021;

  const yearOptions = d3.select("#q2-start").selectAll("option").data(YEARS)
    .join("option").attr("value", d => d).text(d => d);
  d3.select("#q2-end").selectAll("option").data(YEARS)
    .join("option").attr("value", d => d).text(d => d);
  d3.select("#q2-start").property("value", startYear);
  d3.select("#q2-end").property("value", endYear);

  const legend = d3.select("#q2-legend");
  const legendButtons = legend.selectAll("button")
    .data(trendOptions).join("button")
    .attr("type", "button")
    .attr("class", "legend-button")
    .style("--swatch", d => colour(d))
    .html(d => `<span class="legend-swatch" aria-hidden="true"></span>${safeText(d)}`)
    .on("click", (event, name) => {
      if (visibleGroups.has(name)) visibleGroups.delete(name);
      else visibleGroups.add(name);
      render();
    });

  function renderChange() {
    const first = new Map(data.filter(d => d.year === startYear).map(d => [d.road_user, d]));
    const last = data.filter(d => d.year === endYear);
    const rows = last.map(d => ({
      road_user: d.road_user,
      first: first.get(d.road_user).hospitalisations,
      last: d.hospitalisations,
      change: d.hospitalisations - first.get(d.road_user).hospitalisations
    })).sort((a, b) => d3.descending(a.change, b.change));

    const width = 980;
    const height = 610;
    const margin = { top: 22, right: 76, bottom: 65, left: 275 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const svg = makeSVG("#q2-chart", width, height, `Road-user change in hospitalisations, ${startYear} versus ${endYear}`);
    const plot = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const maxChange = Math.max(100, d3.max(rows, d => Math.abs(d.change)));
    const xScale = d3.scaleLinear()
      .domain([-maxChange * 1.12, maxChange * 1.12])
      .range([0, innerWidth]);
    const yScale = d3.scaleBand()
      .domain(rows.map(d => d.road_user))
      .range([0, innerHeight]).padding(.26);

    plot.append("g").attr("class", "grid")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(7).tickSize(-innerHeight).tickFormat(""));
    plot.append("g").attr("class", "axis")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(7).tickFormat(d => signedCount(d)));
    plot.append("g").attr("class", "axis")
      .call(d3.axisLeft(yScale).tickSizeOuter(0).tickSize(0).tickPadding(10));
    plot.append("line").attr("x1", xScale(0)).attr("x2", xScale(0))
      .attr("y1", 0).attr("y2", innerHeight)
      .attr("stroke", CHART.dark).attr("stroke-width", 2);

    const bars = plot.selectAll(".change-bar")
      .data(rows).join("rect").attr("class", "change-bar")
      .attr("x", d => Math.min(xScale(0), xScale(d.change)))
      .attr("y", d => yScale(d.road_user))
      .attr("width", d => Math.max(1, Math.abs(xScale(d.change) - xScale(0))))
      .attr("height", yScale.bandwidth())
      .attr("fill", d => d.change >= 0 ? CHART.green : CHART.red);
    attachDetails(bars,
      d => d.road_user,
      d => [`${startYear}: ${formatCount(d.first)}`, `${endYear}: ${formatCount(d.last)}`, `Change: ${signedCount(d.change)}`]);

    plot.selectAll(".bar-value")
      .data(rows).join("text").attr("class", "chart-label")
      .attr("x", d => xScale(d.change) + (d.change >= 0 ? 8 : -8))
      .attr("y", d => yScale(d.road_user) + yScale.bandwidth() / 2 + 4)
      .attr("text-anchor", d => d.change >= 0 ? "start" : "end")
      .text(d => signedCount(d.change));

    svg.append("text").attr("class", "axis-label")
      .attr("x", margin.left + innerWidth / 2).attr("y", height - 12)
      .attr("text-anchor", "middle")
      .text(`Change in recorded hospitalisations (${endYear} minus ${startYear})`);
  }

  function renderTrend() {
    const shown = trendOptions.filter(group => visibleGroups.has(group));
    if (!shown.length) {
      d3.select("#q2-chart").html('<p class="chart-placeholder">Select at least one road user category in the legend to display its trend.</p>');
      return;
    }
    const width = 930;
    const height = 420;
    const margin = { top: 27, right: 35, bottom: 64, left: 76 };
    const iw = width - margin.left - margin.right;
    const ih = height - margin.top - margin.bottom;
    const svg = makeSVG("#q2-chart", width, height, "Road-user trends in hospitalisations or annual share, 2011 to 2021");
    const plot = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const value = d => metric === "share" ? d.share_pct : d.hospitalisations;
    const maxValue = d3.max(data.filter(d => trendOptions.includes(d.road_user)), value);
    const xScale = d3.scaleLinear().domain([2011, 2021]).range([0, iw]);
    const yScale = d3.scaleLinear().domain([0, maxValue * 1.08]).nice().range([ih, 0]);
    plot.append("g").attr("class", "grid")
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-iw).tickFormat(""));
    plot.append("g").attr("class", "axis")
      .attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(xScale).tickValues(YEARS).tickFormat(d3.format("d")));
    plot.append("g").attr("class", "axis")
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(metric === "share" ? d => `${d}%` : d3.format("~s")));
    const line = d3.line().x(d => xScale(d.year)).y(d => yScale(value(d)));
    shown.forEach(group => {
      const groupData = data.filter(d => d.road_user === group).sort((a, b) => a.year - b.year);
      plot.append("path").datum(groupData).attr("fill", "none")
        .attr("stroke", colour(group)).attr("stroke-width", 2.7).attr("d", line);
      const points = plot.selectAll(null).data(groupData).enter().append("circle")
        .attr("cx", d => xScale(d.year)).attr("cy", d => yScale(value(d)))
        .attr("r", 4).attr("fill", colour(group)).attr("stroke", "white");
      attachDetails(points,
        d => `${group} · ${d.year}`,
        d => [`${formatCount(d.hospitalisations)} hospitalisations`, `${formatPercent(d.share_pct)}% of annual national total`]);
    });
    svg.append("text").attr("class", "axis-label")
      .attr("x", width / 2).attr("y", height - 12).attr("text-anchor", "middle")
      .text("Year");
    svg.append("text").attr("class", "axis-label")
      .attr("transform", "rotate(-90)").attr("x", -(margin.top + ih / 2))
      .attr("y", 18).attr("text-anchor", "middle")
      .text(metric === "share" ? "Share of national total (%)" : "Hospitalisations");
  }

  function render() {
    setActiveButtons("[data-q2-view]", view, "data-q2-view");
    d3.select("#q2-change-controls").classed("is-hidden", view !== "change");
    d3.select("#q2-trend-controls").classed("is-hidden", view !== "trend");
    legend.classed("is-hidden", view !== "trend");
    legendButtons.attr("aria-pressed", d => String(visibleGroups.has(d)));
    d3.select("#q2-chart-heading").text(view === "change" ? "Change between two years" : "Road-user trends across time");
    d3.select("#q2-unit").text(view === "change" ? "Change in hospitalisations" : metric === "share" ? "Share of national total (%)" : "Hospitalisations");
    hideTooltip();
    if (view === "change") renderChange();
    else renderTrend();
  }

  d3.selectAll("[data-q2-view]").on("click", function () {
    view = this.dataset.q2View;
    render();
  });
  d3.select("#q2-start").on("change", function () { startYear = +this.value; render(); });
  d3.select("#q2-end").on("change", function () { endYear = +this.value; render(); });
  d3.select("#q2-metric").on("change", function () { metric = this.value; render(); });
  render();
}
