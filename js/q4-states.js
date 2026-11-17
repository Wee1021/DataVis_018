// ========================
// Q4 – State small multiples and 2018–2021 percentage changes
// ========================
function drawStateCharts(data, changes) {
  let view = "trend";
  let metric = "count";
  const sortedData = data.slice().sort((a, b) => a.year - b.year);

  function drawSmallMultiples() {
    const width = 960;
    const height = 920;
    const svg = makeSVG("#q4-chart", width, height, "Eight state and territory trend charts with a shared vertical scale");
    const panelWidth = 450;
    const panelHeight = 208;
    const maxCount = d3.max(data, d => d.hospitalisations);
    const allIndexed = STATES.flatMap(state => {
      const rows = data.filter(d => d.state === state);
      const base = rows.find(d => d.year === 2011).hospitalisations;
      return rows.map(d => d.hospitalisations / base * 100);
    });
    const maxIndex = d3.max(allIndexed);
    const yTop = metric === "count" ? maxCount * 1.12 : Math.max(160, maxIndex * 1.08);

    STATES.forEach((state, idx) => {
      const column = idx % 2;
      const row = Math.floor(idx / 2);
      const gx = 15 + column * 473;
      const gy = 12 + row * 227;
      const panel = svg.append("g").attr("transform", `translate(${gx},${gy})`);
      panel.append("rect")
        .attr("width", panelWidth).attr("height", panelHeight)
        .attr("fill", "#F5F6F2").attr("stroke", "#E6E9E5").attr("rx", 6);
      panel.append("text").attr("x", 15).attr("y", 21)
        .attr("class", "axis-label").text(state);
      const inner = panel.append("g").attr("transform", "translate(58,37)");
      const iw = panelWidth - 75;
      const ih = panelHeight - 74;
      const original = sortedData.filter(d => d.state === state);
      const base = original.find(d => d.year === 2011).hospitalisations;
      const rows = original.map(d => ({
        ...d,
        index: d.hospitalisations / base * 100
      }));
      const x = d3.scaleLinear().domain([2011, 2021]).range([0, iw]);
      const y = d3.scaleLinear().domain([0, yTop]).range([ih, 0]);
      const value = d => metric === "indexed" ? d.index : d.hospitalisations;
      inner.append("g").attr("class", "grid")
        .call(d3.axisLeft(y).ticks(3).tickSize(-iw).tickFormat(""));
      inner.append("g").attr("class", "axis")
        .attr("transform", `translate(0,${ih})`)
        .call(d3.axisBottom(x).tickValues([2011,2016,2021]).tickFormat(d3.format("d")));
      inner.append("g").attr("class", "axis")
        .call(d3.axisLeft(y).ticks(3).tickFormat(metric === "indexed" ? d => d : d3.format("~s")));
      if (metric === "indexed") {
        inner.append("line").attr("x1", 0).attr("x2", iw)
          .attr("y1", y(100)).attr("y2", y(100))
          .attr("stroke", "#E69F00").attr("stroke-dasharray", "4 4");
      }
      if ((state === "Vic" || state === "NSW")) {
        const changeYear = state === "Vic" ? 2012 : 2017;
        inner.append("line")
          .attr("x1", x(changeYear)).attr("x2", x(changeYear))
          .attr("y1", 0).attr("y2", ih)
          .attr("stroke", "#E69F00").attr("stroke-dasharray", "3 4");
      }
      const line = d3.line().x(d => x(d.year)).y(d => y(value(d)));
      inner.append("path").datum(rows).attr("d", line)
        .attr("fill", "none").attr("stroke", CHART.blue).attr("stroke-width", 2.5);
      const dots = inner.selectAll(".state-point").data(rows).join("circle")
        .attr("cx", d => x(d.year)).attr("cy", d => y(value(d)))
        .attr("r", 3.8).attr("fill", CHART.blue);
      attachDetails(dots,
        d => `${state} · ${d.year}`,
        d => [`${formatCount(d.hospitalisations)} hospitalisations`, `Index: ${formatPercent(d.index)} (2011 = 100)`]);
    });
    svg.append("text").attr("class", "axis-label")
      .attr("x", width / 2).attr("y", height - 2)
      .attr("text-anchor", "middle")
      .text(metric === "indexed" ? "Shared scale: 2011 index = 100" : "Shared scale: recorded hospitalisations");
  }

  function drawChangeChart() {
    const rows = changes.slice().sort((a, b) => d3.descending(a.change_pct, b.change_pct));
    const width = 900;
    const height = 490;
    const margin = { top: 20, right: 115, bottom: 66, left: 100 };
    const iw = width - margin.left - margin.right;
    const ih = height - margin.top - margin.bottom;
    const svg = makeSVG("#q4-chart", width, height, "Percentage change in state and territory hospitalisations, 2018 to 2021");
    const plot = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const range = d3.max(rows, d => Math.abs(d.change_pct)) * 1.35;
    const x = d3.scaleLinear().domain([-range, range]).range([0, iw]);
    const y = d3.scaleBand().domain(rows.map(d => d.state)).range([0, ih]).padding(.33);
    plot.append("g").attr("class", "grid")
      .attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(7).tickSize(-ih).tickFormat(""));
    plot.append("g").attr("class", "axis")
      .attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(7).tickFormat(d => `${d}%`));
    plot.append("g").attr("class", "axis")
      .call(d3.axisLeft(y).tickSize(0).tickPadding(14));
    plot.append("line").attr("x1", x(0)).attr("x2", x(0))
      .attr("y1", 0).attr("y2", ih).attr("stroke", CHART.dark).attr("stroke-width", 2);
    const bars = plot.selectAll(".state-change-bar").data(rows).join("rect")
      .attr("x", d => Math.min(x(0),x(d.change_pct)))
      .attr("y", d => y(d.state))
      .attr("width", d => Math.abs(x(d.change_pct) - x(0)))
      .attr("height", y.bandwidth())
      .attr("fill", d => d.change_pct >= 0 ? CHART.green : CHART.red);
    attachDetails(bars,
      d => d.state,
      d => [`2018: ${formatCount(d.cases_2018)}`, `2021: ${formatCount(d.cases_2021)}`, `Change: ${signedCount(d.change)} (${signedPercent(d.change_pct)})`]);
    plot.selectAll(".change-value").data(rows).join("text")
      .attr("class", "chart-label")
      .attr("x", d => x(d.change_pct) + (d.change_pct >= 0 ? 8 : -8))
      .attr("y", d => y(d.state) + y.bandwidth() / 2 + 4)
      .attr("text-anchor", d => d.change_pct >= 0 ? "start" : "end")
      .text(d => signedPercent(d.change_pct));
    svg.append("text").attr("class", "axis-label")
      .attr("x", width / 2).attr("y", height - 9)
      .attr("text-anchor", "middle")
      .text("Change in hospitalisations (%) · 2018–2021");
  }

  function render() {
    hideTooltip();
    setActiveButtons("[data-q4-view]", view, "data-q4-view");
    d3.select("#q4-metric-wrap").classed("is-hidden", view === "change");
    d3.select("#q4-chart-heading").text(view === "trend" ? "State and territory trends" : "Change from 2018 to 2021");
    d3.select("#q4-unit").text(view === "change" ? "Percentage change" : metric === "indexed" ? "2011 = 100" : "Number of hospitalisations");
    if (view === "trend") drawSmallMultiples();
    else drawChangeChart();
  }
  d3.selectAll("[data-q4-view]").on("click", function () {
    view = this.dataset.q4View;
    render();
  });
  d3.select("#q4-metric").on("change", function () {
    metric = this.value;
    render();
  });
  render();
}