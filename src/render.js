// render.js – turns the state into DOM. It never fetches data or changes the state.
import { getVisibleItems, getCategoryOptions, getStats, formatPrice, formatNumber } from "./utils.js";

const statusEl = document.querySelector("#status");
const resultsEl = document.querySelector("#results");
const statsEl = document.querySelector("#stats");
const filterEl = document.querySelector("#filter");
const cardTemplate = document.querySelector("#card-template");
const dialog = document.querySelector("#details");

let itemsWithOptions = null; // the items the filter options were last built from

// Re-draws the whole page from the state.
export function render(state) {
  const { status, items, error, query } = state;

  if (items !== itemsWithOptions) renderFilterOptions(state);

  if (status === "loading") {
    statsEl.hidden = true;
    statusEl.textContent = "Loading products…";
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

  if (visible.length === 0) {
    resultsEl.replaceChildren();
    statusEl.textContent = query.trim()
      ? `No products match "${query.trim()}". Try another word or category.`
      : "No products match this category.";
    return;
  }

  statusEl.textContent = `Showing ${visible.length} of ${items.length} products.`;
  resultsEl.replaceChildren(...visible.map(createCard));
}

function renderFilterOptions({ items, filter }) {
  const options = getCategoryOptions(items).map(
    ([slug, { name, count }]) => new Option(`${name} (${count})`, slug),
  );
  filterEl.replaceChildren(new Option("All categories", "all"), ...options);
  filterEl.value = filter;
  itemsWithOptions = items;
}

function renderStats({ shown, averagePrice, averageRating, stock }) {
  const stats = [
    ["Products shown", formatNumber(shown)],
    ["Average price", formatPrice(averagePrice)],
    ["Average rating", `${averageRating.toFixed(1)} / 5`],
    ["Items in stock", formatNumber(stock)],
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

function createCard({ id, title, brand, price, rating, categoryName, image }) {
  const card = cardTemplate.content.cloneNode(true);
  const img = card.querySelector("img");
  img.src = image;
  img.alt = title;
  card.querySelector("button").dataset.id = id;
  card.querySelector(".card-title").textContent = title;
  card.querySelector(".card-brand").textContent = brand;
  card.querySelector(".card-price").textContent = formatPrice(price);
  card.querySelector(".card-rating").textContent = `★ ${rating.toFixed(1)}`;
  card.querySelector(".card-category").textContent = categoryName;
  return card;
}

function createSkeletonCard() {
  const li = document.createElement("li");
  li.className = "animate-pulse overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200";
  li.setAttribute("aria-hidden", "true");
  li.innerHTML = `
    <div class="h-40 bg-mist/50"></div>
    <div class="space-y-3 p-4">
      <div class="h-5 w-2/3 rounded bg-slate-200"></div>
      <div class="h-4 w-1/2 rounded bg-slate-200"></div>
      <div class="h-4 w-1/3 rounded bg-slate-200"></div>
    </div>`;
  return li;
}

function createErrorBox(message) {
  const box = document.createElement("div");
  box.className = "mx-auto max-w-md rounded-2xl border-l-4 border-red-600 bg-red-50 p-6 text-left text-red-900";
  box.innerHTML = `
    <h2 class="font-bold">Could not load the products</h2>
    <p class="mt-1 text-sm"></p>
    <button type="button" class="btn-primary retry-btn mt-4">Try again</button>`;
  // The message goes in with textContent so it is never read as HTML.
  box.querySelector("p").textContent = message;
  return box;
}

// Fills the details dialog from state.details and opens it if needed.
export function renderDetails({ status, item, error }) {
  const body = dialog.querySelector("#details-body");
  const image = dialog.querySelector("#details-image");

  if (status === "idle") return;

  if (status === "loading") {
    image.hidden = true;
    body.innerHTML = `<p class="animate-pulse py-10 text-center font-semibold text-navy">Loading details…</p>`;
  } else if (status === "error") {
    image.hidden = true;
    body.innerHTML = `<p class="py-10 text-center text-red-700"></p>`;
    body.querySelector("p").textContent = error;
  } else {
    fillDetails(item, image, body);
  }

  if (!dialog.open) dialog.showModal();
}

function fillDetails(product, image, body) {
  const { title, description, image: imageUrl, brand, categoryName, price, discount, rating, reviewCount, stock, availability, warranty, shipping } = product;

  image.hidden = false;
  image.src = imageUrl;
  image.alt = title;

  const heading = document.createElement("h2");
  heading.className = "text-2xl font-bold text-navy";
  heading.textContent = title;

  const text = document.createElement("p");
  text.className = "mt-1 text-sm text-slate-600";
  text.textContent = description;

  const rows = [
    ["Brand", brand],
    ["Category", categoryName],
    ["Price", `${formatPrice(price)} (${discount}% off)`],
    ["Rating", `★ ${rating.toFixed(1)} from ${reviewCount} reviews`],
    ["Stock", `${formatNumber(stock)} · ${availability}`],
    ["Warranty", warranty],
    ["Shipping", shipping],
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

  body.replaceChildren(heading, text, list);
}