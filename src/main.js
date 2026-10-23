// main.js – holds the state, listens for events and calls render().
import "./style.css";
import { getCatalogue, getProduct } from "./api.js";
import { toProduct, toCategoryNames, debounce } from "./utils.js";
import { render, renderDetails } from "./render.js";

// The single source of truth for the page.
const state = {
  items: [],
  categoryNames: {},
  status: "loading", // "loading" | "success" | "error"
  error: null,
  query: "",
  filter: "all",
  sort: "default",
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
    const { products, categories } = await getCatalogue();
    state.categoryNames = toCategoryNames(categories);
    state.items = products.map((product) => toProduct(product, state.categoryNames));
    state.status = "success";
  } catch (error) {
    console.error(error);
    state.status = "error";
    state.error = error.message;
  } finally {
    render(state);
  }
}

// Opens the dialog, fetches the single product, and falls back to the list data if that fails.
async function showDetails(id) {
  const saved = state.items.find((product) => product.id === id);
  state.details = { status: "loading", item: null, error: null };
  renderDetails(state.details);

  try {
    const data = await getProduct(id);
    state.details = { status: "success", item: toProduct(data, state.categoryNames), error: null };
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
  const card = event.target.closest("[data-id]");
  if (card) showDetails(Number(card.dataset.id));
});

document.querySelector("#details").addEventListener("close", () => {
  state.details = { status: "idle", item: null, error: null };
});

// The Retry button in the error box re-runs the request.
document.querySelector("#status").addEventListener("click", (event) => {
  if (event.target.closest(".retry-btn")) load();
});

load();