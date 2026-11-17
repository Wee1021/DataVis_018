// ========================
// Tooltip and keyboard interactions
// ========================
const globalTooltip = d3.select("#tooltip");

function displayTooltip(event, heading, lines) {
  const html = `<strong>${safeText(heading)}</strong>` +
    lines.map(line => `<span>${safeText(line)}</span>`).join("");
  globalTooltip.html(html).classed("visible", true).attr("aria-hidden", "false");

  let x = event && Number.isFinite(event.clientX) ? event.clientX : null;
  let y = event && Number.isFinite(event.clientY) ? event.clientY : null;
  if (x === null || y === null || (x === 0 && y === 0)) {
    const rect = event.currentTarget.getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
  }
  const box = globalTooltip.node().getBoundingClientRect();
  x = Math.max(8, Math.min(x + 14, window.innerWidth - box.width - 8));
  y = Math.max(8, Math.min(y + 14, window.innerHeight - box.height - 8));
  globalTooltip.style("left", `${x}px`).style("top", `${y}px`);
}

function hideTooltip() {
  globalTooltip.classed("visible", false).attr("aria-hidden", "true");
}

function attachDetails(selection, title, lines, clicked) {
  selection
    .attr("tabindex", 0)
    .on("pointerenter pointermove", (event, d) => displayTooltip(event, title(d), lines(d)))
    .on("pointerleave", hideTooltip)
    .on("focus", (event, d) => displayTooltip(event, title(d), lines(d)))
    .on("blur", hideTooltip);

  if (clicked) {
    selection.attr("role", "button")
      .on("click", (event, d) => clicked(d))
      .on("keydown", (event, d) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          clicked(d);
        }
      });
  }
  return selection;
}
