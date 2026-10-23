// render.js – turns the state into DOM. It never fetches data or changes the state.
import { getVisibleItems, getRegionOptions, getStats, formatNumber } from "./utils.js";

const statusEl = document.querySelector("#status");
const resultsEl = document.querySelector("#results");
const statsEl = document.querySelector("#stats");
const warningEl = document.querySelector("#warning");
const filterEl = document.querySelector("#filter");
const cardTemplate = document.querySelector("#card-template");
const dialog = document.querySelector("#details");

let itemsWithOptions = null; // the items the filter options were last built from

// Re-draws the whole page from the state.
export function render(state) {
  const { status, items, error, failedRegions, query } = state;

  if (items !== itemsWithOptions) renderFilterOptions(state);
  warningEl.hidden = status !== "success" || failedRegions.length === 0;

  if (status === "loading") {
    statsEl.hidden = true;
    statusEl.textContent = "Loading countries…";
    resultsEl.replaceChildren(...Array.from({ length: 8 }, createSkeletonCard));
    return;
  }

  if (status === "error") {
    statsEl.hidden = true;
    resultsEl.replaceChildren();
    statusEl.replaceChildren(createErrorBox(error));
    return;
  }

  const visible = getVisibleItems(state);
  renderStats(getStats(visible));
  warningEl.querySelector("p").textContent =
    `Some data is missing: ${failedRegions.join(", ")} could not be loaded. Showing the other regions.`;

  if (visible.length === 0) {
    resultsEl.replaceChildren();
    statusEl.textContent = query.trim()
      ? `No countries match "${query.trim()}". Try another name or region.`
      : "No countries match this filter.";
    return;
  }

  statusEl.textContent = `Showing ${visible.length} of ${items.length} countries.`;
  resultsEl.replaceChildren(...visible.map(createCard));
}

function renderFilterOptions({ items, filter }) {
  const options = getRegionOptions(items).map(
    ([region, count]) => new Option(`${region} (${count})`, region),
  );
  filterEl.replaceChildren(new Option("All regions", "all"), ...options);
  filterEl.value = filter;
  itemsWithOptions = items;
}

function renderStats({ shown, population, averagePopulation, area }) {
  const stats = [
    ["Countries shown", formatNumber(shown)],
    ["Total population", formatNumber(population)],
    ["Average population", formatNumber(averagePopulation)],
    ["Total area", `${formatNumber(area)} km²`],
  ];

  statsEl.replaceChildren(
    ...stats.map(([label, value]) => {
      const box = document.createElement("div");
      box.className = "stat";
      const labelEl = document.createElement("p");
      labelEl.className = "text-sm text-slate-500";
      labelEl.textContent = label;
      const valueEl = document.createElement("p");
      valueEl.className = "text-xl font-bold text-navy sm:text-2xl";
      valueEl.textContent = value;
      box.append(labelEl, valueEl);
      return box;
    }),
  );
  statsEl.hidden = false;
}

function createCard({ code, name, capital, population, region, flag, flagAlt }) {
  const card = cardTemplate.content.cloneNode(true);
  const img = card.querySelector("img");
  img.src = flag;
  img.alt = flagAlt;
  card.querySelector("button").dataset.code = code;
  card.querySelector(".card-name").textContent = name;
  card.querySelector(".card-capital").textContent = capital;
  card.querySelector(".card-population").textContent = formatNumber(population);
  card.querySelector(".card-region").textContent = region;
  return card;
}

function createSkeletonCard() {
  const li = document.createElement("li");
  li.className = "animate-pulse overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200";
  li.setAttribute("aria-hidden", "true");
  li.innerHTML = `
    <div class="h-36 bg-mist/50"></div>
    <div class="space-y-3 p-4">
      <div class="h-5 w-2/3 rounded bg-slate-200"></div>
      <div class="h-4 w-1/2 rounded bg-slate-200"></div>
      <div class="h-4 w-3/5 rounded bg-slate-200"></div>
    </div>`;
  return li;
}

function createErrorBox(message) {
  const box = document.createElement("div");
  box.className = "mx-auto max-w-md rounded-2xl border-l-4 border-red-600 bg-red-50 p-6 text-left text-red-900";
  box.innerHTML = `
    <h2 class="font-bold">Could not load the countries</h2>
    <p class="mt-1 text-sm"></p>
    <button type="button" class="btn-primary retry-btn mt-4">Try again</button>`;
  // The message goes in with textContent so it is never read as HTML.
  box.querySelector("p").textContent = message;
  return box;
}

// Fills the details dialog from state.details and opens it if needed.
export function renderDetails({ status, item, error }) {
  const body = dialog.querySelector("#details-body");
  const flag = dialog.querySelector("#details-flag");

  if (status === "idle") return;

  if (status === "loading") {
    flag.hidden = true;
    body.innerHTML = `<p class="animate-pulse py-10 text-center font-semibold text-navy">Loading details…</p>`;
  } else if (status === "error") {
    flag.hidden = true;
    body.innerHTML = `<p class="py-10 text-center text-red-700"></p>`;
    body.querySelector("p").textContent = error;
  } else {
    fillDetails(item, flag, body);
  }

  if (!dialog.open) dialog.showModal();
}

function fillDetails(country, flag, body) {
  const { name, officialName, flag: flagUrl, flagAlt, capital, region, subregion, population, area, languages, currencies } = country;

  flag.hidden = false;
  flag.src = flagUrl;
  flag.alt = flagAlt;

  const title = document.createElement("h2");
  title.id = "details-name";
  title.className = "text-2xl font-bold text-navy";
  title.textContent = name;

  const subtitle = document.createElement("p");
  subtitle.className = "text-sm text-slate-500";
  subtitle.textContent = officialName;

  const rows = [
    ["Capital", capital],
    ["Region", `${region} · ${subregion}`],
    ["Population", formatNumber(population)],
    ["Area", `${formatNumber(Math.round(area))} km²`],
    ["Languages", languages.join(", ") || "Not listed"],
    ["Currencies", currencies.join(", ") || "Not listed"],
  ];

  const list = document.createElement("dl");
  list.className = "mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm";
  list.append(
    ...rows.flatMap(([term, value]) => {
      const dt = document.createElement("dt");
      dt.className = "font-semibold text-navy";
      dt.textContent = term;
      const dd = document.createElement("dd");
      dd.className = "text-slate-700";
      dd.textContent = value;
      return [dt, dd];
    }),
  );

  body.replaceChildren(title, subtitle, list);
}