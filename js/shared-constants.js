// ========================
// Shared D3 chart settings
// ========================
const CHART = {
  width: 900,
  height: 380,
  margin: { top: 38, right: 32, bottom: 57, left: 77 },
  blue: "#4C78A8",
  orange: "#E69F00",
  green: "#007F68",
  purple: "#CC79A7",
  red: "#C94F57",
  dark: "#19313D",
  roadColours: ["#294453", "#007F68", "#CC79A7", "#91C9B8", "#445963", "#649E91", "#B7C8C8", "#E69F00", "#8B8B8B", "#56B4E9", "#D55E00", "#4C78A8"]
};

const YEARS = d3.range(2011, 2022);
const AGE_GROUPS = ["0-7", "8-16", "17-25", "26-39", "40-64", "65-74", "75+"];
const STATES = ["NSW", "Vic", "Qld", "WA", "SA", "Tas", "ACT", "NT"];
const Q5_GROUPS = ["Car driver, passenger or unknown position", "Motorcyclist", "Pedal cyclist", "Pedestrian"];
const formatCount = d3.format(",");
const formatPercent = d3.format(".2f");
const signedCount = n => `${n > 0 ? "+" : ""}${formatCount(n)}`;
const signedPercent = n => `${n > 0 ? "+" : ""}${formatPercent(n)}%`;

function makeSVG(selector, width, height, accessibleTitle) {
  const target = d3.select(selector);
  target.selectAll("*").remove();
  const svg = target.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "group")
    .attr("aria-label", accessibleTitle);
  return svg;
}

function setChartError(selector, message) {
  d3.select(selector).html(`<p class="chart-error">${message}</p>`);
}

function setActiveButtons(selector, value, attribute) {
  d3.selectAll(selector).each(function () {
    const active = this.getAttribute(attribute) === value;
    d3.select(this).classed("active", active).attr("aria-pressed", String(active));
  });
}

function safeText(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
