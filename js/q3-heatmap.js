// ========================
// Q3 – Interactive age group heatmap
// ========================
function drawAgeHeatmap(data) {
  const rows = data.filter(d => AGE_GROUPS.includes(d.age_group));
  if (rows.length !== 77) {
    setChartError("#q3-chart", "Expected seven age groups for each year from 2011 to 2021.");
    return;
  }
  let metric = "share";
  let selectedAge = "40-64";

  function updateDetail() {
    const first = rows.find(d => d.age_group === selectedAge && d.year === 2011);
    const last = rows.find(d => d.age_group === selectedAge && d.year === 2021);
    if (!first || !last) return;
    const countChange = last.hospitalisations - first.hospitalisations;
    const shareChange = last.share_pct - first.share_pct;
    d3.select("#q3-detail").html(
      `<strong>${safeText(selectedAge)} years: 2011 versus 2021</strong>` +
      `<span>2011: ${formatCount(first.hospitalisations)} hospitalisations (${formatPercent(first.share_pct)}%)</span><br>` +
      `<span>2021: ${formatCount(last.hospitalisations)} hospitalisations (${formatPercent(last.share_pct)}%)</span><br>` +
      `<span>Change: ${signedCount(countChange)} hospitalisations; ${shareChange >= 0 ? "+" : ""}${formatPercent(shareChange)} percentage points.</span>`
    );
  }

  function render() {
    hideTooltip();
    const width = 930;
    const height = 405;
    const margin = { top: 70, right: 22, bottom: 27, left: 96 };
    const svg = makeSVG("#q3-chart", width, height, "Age group heatmap: seven age groups across eleven years");
    const xScale = d3.scaleBand().domain(YEARS).range([margin.left, width - margin.right]).padding(.09);
    const yScale = d3.scaleBand().domain(AGE_GROUPS).range([margin.top, height - margin.bottom]).padding(.11);
    const key = metric === "share" ? "share_pct" : "hospitalisations";
    const maxValue = d3.max(rows, d => d[key]);
    const colourScale = d3.scaleSequential(d3.interpolateRgb("#EDF7F2", "#006B55")).domain([0, maxValue]);

    svg.append("text").attr("class", "axis-label").attr("x", margin.left).attr("y", 20).text("YEAR");
    svg.append("text").attr("class", "axis-label").attr("x", 8).attr("y", 48).text("AGE GROUP");
    svg.selectAll(".year-label").data(YEARS).join("text")
      .attr("class", "chart-label")
      .attr("x", year => xScale(year) + xScale.bandwidth() / 2)
      .attr("y", margin.top - 15)
      .attr("text-anchor", "middle")
      .text(d => d);
    svg.selectAll(".age-label").data(AGE_GROUPS).join("text")
      .attr("class", "chart-label")
      .attr("x", margin.left - 14)
      .attr("y", d => yScale(d) + yScale.bandwidth() / 2 + 5)
      .attr("text-anchor", "end")
      .attr("font-weight", d => d === selectedAge ? 700 : 400)
      .text(d => `${d} yrs`);

    const cells = svg.selectAll(".chart-cell")
      .data(rows, d => `${d.year}-${d.age_group}`)
      .join("rect")
      .attr("class", "chart-cell")
      .attr("x", d => xScale(d.year))
      .attr("y", d => yScale(d.age_group))
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("rx", 3)
      .attr("fill", d => colourScale(d[key]))
      .attr("stroke", d => d.age_group === selectedAge ? "#19313D" : "white")
      .attr("stroke-width", d => d.age_group === selectedAge ? 2 : 1)
      .attr("aria-label", d => `${d.age_group} years, ${d.year}: ${formatCount(d.hospitalisations)} hospitalisations, ${formatPercent(d.share_pct)} percent of national total`);

    svg.selectAll(".cell-value")
      .data(rows).join("text")
      .attr("class", "cell-value")
      .attr("x", d => xScale(d.year) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.age_group) + yScale.bandwidth() / 2 + 4)
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("font-weight", 600)
      .attr("pointer-events", "none")
      .attr("fill", d => d[key] / maxValue > .61 ? "white" : CHART.dark)
      .text(d => metric === "share" ? `${d.share_pct.toFixed(1)}%` : d3.format(".2s")(d.hospitalisations));

    attachDetails(cells,
      d => `${d.age_group} years · ${d.year}`,
      d => [`${formatCount(d.hospitalisations)} hospitalisations`, `${formatPercent(d.share_pct)}% of the national total`],
      d => {
        selectedAge = d.age_group;
        cells.attr("stroke", row => row.age_group === selectedAge ? CHART.dark : "white")
          .attr("stroke-width", row => row.age_group === selectedAge ? 2 : 1);
        svg.selectAll(".age-label").attr("font-weight", a => a === selectedAge ? 700 : 400);
        cells.attr("aria-pressed", row => String(row.age_group === selectedAge));
        updateDetail();
      });
    cells.attr("aria-pressed", d => String(d.age_group === selectedAge));
    setActiveButtons("[data-q3-metric]", metric, "data-q3-metric");
    d3.select("#q3-unit").text(metric === "share" ? "Share of national total (%)" : "Hospitalisations");
    d3.select("#q3-scale").html(
      `<span>0${metric === "share" ? "%" : ""}</span>` +
      `<span class="heatmap-gradient" aria-hidden="true"></span>` +
      `<span>${metric === "share" ? `${maxValue.toFixed(1)}%` : formatCount(maxValue)}</span>`
    );
    updateDetail();
  }

  d3.selectAll("[data-q3-metric]").on("click", function () {
    metric = this.dataset.q3Metric;
    render();
  });
  render();
}