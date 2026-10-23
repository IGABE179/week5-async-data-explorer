# World Explorer – Async Data Explorer

**Live app:** https://igabe179.github.io/week5-async-data-explorer/

A single-page app that loads every country from the [REST Countries API](https://restcountries.com) and lets you search, filter, sort and open details for each one. Built with HTML, Tailwind CSS v4 (Vite) and vanilla JavaScript ES modules, using the built-in `fetch`.

**Author:** Olga Igabe
**API used:** REST Countries v3.1 – docs: https://restcountries.com

## Features

1. **Fetch on load** – all 5 regions load automatically with `async`/`await` when the page opens.
2. **Reusable helper** – `getJSON(url)` in `src/api.js` checks `response.ok` and throws `Request failed (status)`.
3. **Loading state** – 8 skeleton cards with `animate-pulse` and a "Loading countries…" message.
4. **Error state** – a friendly message with a **Try again** button that re-runs the request.
5. **Empty state** – a message when the search or filter matches nothing.
6. **Responsive card grid** – 1 → 2 → 3 → 4 columns, built with `map` and destructuring.
7. **Live search** – by country or capital, case-insensitive.
8. **Region filter** – the options are built from the data (unique regions with their counts).
9. **Sort** – name A–Z / Z–A, population high/low, and largest area, all with `toSorted` (no mutation).
10. **Details dialog** – clicking a card fetches that single country from `/alpha/{code}`; if that request fails, the dialog falls back to the data already loaded.
11. **Stats bar** – countries shown, total population, average population and total area, computed with `reduce`.
12. **Parallel requests** – the 5 regions are loaded at the same time with `Promise.allSettled`. If one region fails, the other regions still show and a warning names the missing region, with a Retry button.

**Bonus – debounced search:** the search waits 300 ms after the user stops typing before it filters (`debounce` in `src/utils.js`).

## State and the state → render flow

```js
const state = {
  items: [],              // all countries, transformed once after loading
  status: "loading",      // "loading" | "success" | "error"
  error: null,            // error message shown in the error state
  failedRegions: [],      // regions that failed in Promise.allSettled
  query: "",              // search text
  filter: "all",          // selected region
  sort: "name-asc",       // selected sort option
  details: { status: "idle", item: null, error: null }, // the details dialog
};
```

Every event (typing, choosing a region or sort, clicking Retry) only updates the state through `setState()`, and `setState()` then calls `render(state)`. `render` reads the state and redraws the page: skeletons while `status` is `"loading"`, the error box when it is `"error"`, and otherwise the stats bar and the cards returned by the pure function `getVisibleItems(state)`. Searching, filtering and sorting never re-fetch; they only filter the countries already in `state.items`.

## API data and how I transformed it

Raw JSON for one country (shortened):

```json
{
  "name": { "common": "Rwanda", "official": "Republic of Rwanda" },
  "cca3": "RWA",
  "capital": ["Kigali"],
  "region": "Africa",
  "subregion": "Eastern Africa",
  "population": 13246394,
  "area": 26338,
  "flags": { "svg": "https://flagcdn.com/rw.svg", "alt": "The flag of Rwanda..." },
  "languages": { "eng": "English", "fra": "French", "kin": "Kinyarwanda" },
  "currencies": { "RWF": { "name": "Rwandan franc", "symbol": "Fr" } }
}
```

`toCountry()` in `src/utils.js` destructures this object and returns a flat object that is easier to search, sort and display. Optional chaining and `??` give safe defaults when a field is missing (for example, countries without a capital):

```js
{
  code: "RWA",
  name: "Rwanda",
  officialName: "Republic of Rwanda",
  capital: "Kigali",
  region: "Africa",
  subregion: "Eastern Africa",
  population: 13246394,
  area: 26338,
  flag: "https://flagcdn.com/rw.svg",
  flagAlt: "The flag of Rwanda...",
  languages: ["English", "French", "Kinyarwanda"],
  currencies: ["Rwandan franc (Fr)"]
}
```

## Screenshots

| Loading | Success |
|---|---|
| ![Loading state](screenshots/loading.png) | ![Success state](screenshots/success.png) |

| Empty | Error |
|---|---|
| ![Empty state](screenshots/empty.png) | ![Error state](screenshots/error.png) |

## What I learned about async JavaScript

`fetch` returns a promise, and `await` lets me write the code that waits for it from top to bottom, like normal code, inside an `async` function. A request can fail in two different ways: the network can fail completely, which makes `fetch` throw, or the server can answer with an error status like 404, which does not throw on its own, so I have to check `response.ok` myself. Putting that check in one `getJSON` helper means every request in the app handles errors the same way. `try`/`catch`/`finally` let me show the error state instead of letting the app crash, and `finally` makes sure the page is redrawn whether the request worked or not. Requests that do not depend on each other should run at the same time: `Promise.allSettled` started all 5 region requests at once and still gave me the results of the ones that succeeded when one failed. Keeping everything in one state object and redrawing with `render()` made the loading, error and empty states much easier to manage than changing the page in many places.

## Project structure

```
index.html              page layout, card template and details dialog
src/api.js              getJSON, region and single-country requests, Promise.allSettled
src/utils.js            pure helpers: toCountry, getVisibleItems, getStats, debounce
src/render.js           render(state) and renderDetails() – all DOM code
src/main.js             the state object, setState, load() and event listeners
src/style.css           Tailwind import, theme colours and @apply component classes
```

## Run locally

    npm install
    npm run dev

Then open the address Vite prints (usually http://localhost:5173).

*Completed with AI assistance.*