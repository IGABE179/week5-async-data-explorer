// main.js – holds the state, listens for events and calls render().
import "./style.css";
import { getAllRegions, getCountry } from "./api.js";
import { toCountry, debounce } from "./utils.js";
import { render, renderDetails } from "./render.js";

// The single source of truth for the page.
const state = {
  items: [],
  status: "loading", // "loading" | "success" | "error"
  error: null,
  failedRegions: [],
  query: "",
  filter: "all",
  sort: "name-asc",
  details: { status: "idle", item: null, error: null },
};

// Updates part of the state, then re-draws the page.
function setState(changes) {
  Object.assign(state, changes);
  render(state);
}

async function load() {
  setState({ status: "loading", error: null });
  try {
    const { countries, failedRegions, firstError } = await getAllRegions();
    if (countries.length === 0) throw firstError ?? new Error("The API returned no countries.");

    state.items = countries.map(toCountry);
    state.failedRegions = failedRegions;
    state.status = "success";
  } catch (error) {
    console.error(error);
    state.status = "error";
    state.error = error.message;
  } finally {
    render(state);
  }
}

// Opens the dialog, fetches the single country, and falls back to the list data if that fails.
async function showDetails(code) {
  const saved = state.items.find((country) => country.code === code);
  state.details = { status: "loading", item: null, error: null };
  renderDetails(state.details);

  try {
    const data = await getCountry(code);
    state.details = { status: "success", item: toCountry(data), error: null };
  } catch (error) {
    state.details = saved
      ? { status: "success", item: saved, error: null }
      : { status: "error", item: null, error: error.message };
  } finally {
    renderDetails(state.details);
  }
}

// --- Events: each one updates the state, then render() redraws ---
document.querySelector("#controls").addEventListener("submit", (event) => event.preventDefault());

document.querySelector("#search").addEventListener(
  "input",
  debounce((event) => setState({ query: event.target.value }), 300),
);

document.querySelector("#filter").addEventListener("change", (event) =>
  setState({ filter: event.target.value }),
);

document.querySelector("#sort").addEventListener("change", (event) =>
  setState({ sort: event.target.value }),
);

// One listener for every card (event delegation).
document.querySelector("#results").addEventListener("click", (event) => {
  const card = event.target.closest("[data-code]");
  if (card) showDetails(card.dataset.code);
});

document.querySelector("#details").addEventListener("close", () => {
  state.details = { status: "idle", item: null, error: null };
});

// Retry buttons in the error box and in the warning bar.
document.addEventListener("click", (event) => {
  if (event.target.closest(".retry-btn")) load();
});

load();