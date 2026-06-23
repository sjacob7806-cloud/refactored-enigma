const STORAGE_KEY = "piranhasMerchCms";
const SHEET_REFRESH_MS = 5 * 60 * 1000;

const defaultStore = {
  settings: {
    teamName: "Piranhas Swim Team YEPP",
    teamMark: "PY",
    contactEmail: "piranhas-merch@example.com",
    sheetUrl: "https://docs.google.com/spreadsheets/d/15Gdz4gREonbFo7hrEii8Y_-pmWF4dpYsuifKxmtA-z8/edit?usp=sharing"
  },
  products: [
    {
      id: "team-performance-tee",
      name: "Team Performance Tee",
      category: "Apparel",
      price: "$24",
      description: "Lightweight dry-fit shirt with a bold Piranhas chest mark.",
      color: "#087a8f",
      background: "#d9f1ef",
      shape: "shirt",
      image: "",
      link: "https://example.com/piranhas-yepp-performance-tee"
    },
    {
      id: "deck-hoodie",
      name: "Deck Hoodie",
      category: "Apparel",
      price: "$48",
      description: "Warm pullover for early practices, travel meets, and cheering.",
      color: "#13202a",
      background: "#e9edf0",
      shape: "hoodie",
      image: "",
      link: "https://example.com/piranhas-yepp-deck-hoodie"
    },
    {
      id: "silicone-swim-cap",
      name: "Silicone Swim Cap",
      category: "Swim Gear",
      price: "$16",
      description: "Competition-ready cap with team initials on both sides.",
      color: "#f3b33d",
      background: "#fff2cf",
      shape: "cap",
      image: "",
      link: "https://example.com/piranhas-yepp-swim-cap"
    },
    {
      id: "racing-goggles",
      name: "Racing Goggles",
      category: "Swim Gear",
      price: "$32",
      description: "Low-profile mirrored goggles for training and championship days.",
      color: "#e6584f",
      background: "#fde7e5",
      shape: "goggles",
      image: "",
      link: "https://example.com/piranhas-yepp-racing-goggles"
    },
    {
      id: "meet-towel",
      name: "Meet Towel",
      category: "Accessories",
      price: "$28",
      description: "Oversized cotton towel with lane-line inspired striping.",
      color: "#055263",
      background: "#ddecf0",
      shape: "towel",
      image: "",
      link: "https://example.com/piranhas-yepp-meet-towel"
    },
    {
      id: "team-backpack",
      name: "Team Backpack",
      category: "Accessories",
      price: "$58",
      description: "Roomy wet-dry swim bag with pockets for goggles and snacks.",
      color: "#087a8f",
      background: "#d9f1ef",
      shape: "bag",
      image: "",
      link: "https://example.com/piranhas-yepp-team-backpack"
    },
    {
      id: "sideline-water-bottle",
      name: "Sideline Water Bottle",
      category: "Fan Favorites",
      price: "$18",
      description: "Insulated bottle for swimmers, parents, and coaches on deck.",
      color: "#e6584f",
      background: "#fde7e5",
      shape: "bottle",
      image: "",
      link: "https://example.com/piranhas-yepp-water-bottle"
    },
    {
      id: "coach-parka",
      name: "Coach Parka",
      category: "Fan Favorites",
      price: "$72",
      description: "Longline parka for cold-morning meets and winter training.",
      color: "#13202a",
      background: "#e9edf0",
      shape: "parka",
      image: "",
      link: "https://example.com/piranhas-yepp-coach-parka"
    }
  ]
};

const tabs = document.querySelector("#category-tabs");
const grid = document.querySelector("#product-grid");
const searchInput = document.querySelector("#product-search");
const resultCount = document.querySelector("#result-count");
const emptyState = document.querySelector("#empty-state");
const clearSearch = document.querySelector("#clear-search");
const cmsStatus = document.querySelector("#cms-status");
const settingsForm = document.querySelector("#settings-form");
const productForm = document.querySelector("#product-form");
const productList = document.querySelector("#cms-product-list");
const cancelEdit = document.querySelector("#cancel-edit");
const exportProducts = document.querySelector("#export-products");
const importProducts = document.querySelector("#import-products");
const resetCms = document.querySelector("#reset-cms");
const refreshSheet = document.querySelector("#refresh-sheet");
const productFormTitle = document.querySelector("#product-form-title");

let store = loadStore();
let activeCategory = "All";
let sheetProducts = [];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `product-${Date.now()}`;
}

function getConfiguredProducts() {
  return sheetProducts.length ? sheetProducts : store.products;
}

function getSheetCsvUrl(sheetUrl) {
  const trimmedUrl = sheetUrl.trim();

  if (!trimmedUrl) {
    return "";
  }

  try {
    const url = new URL(trimmedUrl);

    if (url.hostname.includes("docs.google.com")) {
      if (url.pathname.includes("/pubhtml")) {
        url.pathname = url.pathname.replace("/pubhtml", "/pub");
        url.searchParams.set("output", "csv");
        return url.toString();
      }

      if (url.pathname.includes("/edit")) {
        url.pathname = url.pathname.replace(/\/edit.*$/, "/export");
        url.search = "";
        url.searchParams.set("format", "csv");
        const gid = new URL(trimmedUrl).hash.match(/gid=(\d+)/)?.[1];

        if (gid) {
          url.searchParams.set("gid", gid);
        }

        return url.toString();
      }
    }

    return trimmedUrl;
  } catch {
    return trimmedUrl;
  }
}

function parseCsv(csvText) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      inQuotes = !inQuotes;
    } else if (character === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows.filter((csvRow) => csvRow.some((value) => value.trim()));
}

function getCell(row, headers, name) {
  const index = headers.findIndex(
    (header) => header.trim().toLowerCase() === name.toLowerCase()
  );

  return index >= 0 ? row[index]?.trim() || "" : "";
}

function sheetRowsToProducts(rows) {
  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0];

  return rows
    .slice(1)
    .map((row, index) => {
      const name = getCell(row, headers, "Name");

      if (!name) {
        return null;
      }

      return normalizeProduct({
        id: `${slugify(name)}-${index + 1}`,
        name,
        price: getCell(row, headers, "Price"),
        image: getCell(row, headers, "Image"),
        link: getCell(row, headers, "Link"),
        category: getCell(row, headers, "Category") || "Sheet Products",
        description: getCell(row, headers, "Description") || "Team merchandise from the live product sheet.",
        color: "#087a8f",
        background: "#d9f1ef",
        shape: "shirt"
      });
    })
    .filter(Boolean);
}

async function loadSheetProducts({ showStatus = false } = {}) {
  const csvUrl = getSheetCsvUrl(store.settings.sheetUrl || "");

  if (!csvUrl) {
    sheetProducts = [];
    if (showStatus) {
      setStatus("Add a published Google Sheets URL first.");
    }
    return;
  }

  if (showStatus) {
    setStatus("Refreshing Google Sheet products...");
  }

  try {
    const response = await fetch(`${csvUrl}${csvUrl.includes("?") ? "&" : "?"}_=${Date.now()}`);

    if (!response.ok) {
      throw new Error(`Sheet request failed with ${response.status}`);
    }

    const products = sheetRowsToProducts(parseCsv(await response.text()));

    if (!products.length) {
      throw new Error("No products found in sheet");
    }

    sheetProducts = products;
    renderAll();
    setStatus(`Loaded ${products.length} products from Google Sheets.`);
  } catch {
    sheetProducts = [];
    renderAll();
    setStatus("Could not load the sheet. Showing local catalog instead.");
  }
}

function loadStore() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return clone(defaultStore);
  }

  try {
    const parsed = JSON.parse(saved);
    return normalizeStore(parsed);
  } catch {
    return clone(defaultStore);
  }
}

function normalizeStore(nextStore) {
  const settings = {
    ...defaultStore.settings,
    ...(nextStore.settings || {})
  };

  if (!settings.sheetUrl) {
    settings.sheetUrl = defaultStore.settings.sheetUrl;
  }

  const products = Array.isArray(nextStore.products)
    ? nextStore.products.map(normalizeProduct)
    : clone(defaultStore.products);

  return { settings, products };
}

function normalizeProduct(product) {
  return {
    id: product.id || slugify(product.name || "product"),
    name: product.name || "Untitled Product",
    category: product.category || "Apparel",
    price: product.price || "$0",
    description: product.description || "Add a product description.",
    color: product.color || "#087a8f",
    background: product.background || "#d9f1ef",
    shape: product.shape || "shirt",
    image: product.image || "",
    link: product.link || "https://example.com"
  };
}

function saveStore(message = "Changes saved.") {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  setStatus(message);
}

function setStatus(message) {
  cmsStatus.textContent = message;
}

function getCategories() {
  return ["All", ...new Set(getConfiguredProducts().map((product) => product.category))];
}

function renderSettings() {
  const { teamName, teamMark, contactEmail, sheetUrl } = store.settings;
  document.title = `${teamName} Shop`;
  document.querySelector(".brand").setAttribute("aria-label", `${teamName} home`);
  document.querySelector(".brand-mark").textContent = teamMark;
  document.querySelector(".brand strong").textContent = teamName;
  document.querySelector("#hero-title").textContent = `${teamName} Shop`;
  document.querySelector(".mockup-shirt span").textContent =
    teamName.split(" ")[0]?.toUpperCase() || "TEAM";
  document.querySelector(".mockup-cap span").textContent = teamMark;
  document.querySelector("#footer-team-name").textContent = `${teamName} Shop`;
  document.querySelector("#footer-contact").textContent =
    `Questions? Contact ${contactEmail}`;
  document.querySelector("#setting-team-name").value = teamName;
  document.querySelector("#setting-team-mark").value = teamMark;
  document.querySelector("#setting-contact-email").value = contactEmail;
  document.querySelector("#setting-sheet-url").value = sheetUrl;
}

function createTabs() {
  tabs.innerHTML = getCategories()
    .map(
      (category) => `
        <button
          class="category-tab${category === activeCategory ? " active" : ""}"
          type="button"
          role="tab"
          aria-selected="${category === activeCategory}"
          data-category="${escapeHtml(category)}"
        >
          ${escapeHtml(category)}
        </button>
      `
    )
    .join("");
}

function getVisibleProducts() {
  const query = searchInput.value.trim().toLowerCase();

  return getConfiguredProducts().filter((product) => {
    const inCategory =
      activeCategory === "All" || product.category === activeCategory;
    const matchesQuery = [product.name, product.category, product.description]
      .join(" ")
      .toLowerCase()
      .includes(query);

    return inCategory && matchesQuery;
  });
}

function getProductLabel(product) {
  if (product.shape === "shirt") {
    return store.settings.teamName.split(" ")[0]?.toUpperCase() || "TEAM";
  }

  if (["hoodie", "cap"].includes(product.shape)) {
    return store.settings.teamMark;
  }

  return "";
}

function renderProducts() {
  const visibleProducts = getVisibleProducts();

  grid.innerHTML = visibleProducts
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-art" style="--product-bg: ${escapeHtml(product.background)}; --product-color: ${escapeHtml(product.color)};">
            ${
              product.image
                ? `<img class="product-image" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" />`
                : `<div class="product-icon shape-${escapeHtml(product.shape)}" aria-hidden="true">
                    ${escapeHtml(getProductLabel(product))}
                  </div>`
            }
            </div>
          <div class="product-body">
            <div class="product-meta">
              <span class="badge">${escapeHtml(product.category)}</span>
              <span class="price">${escapeHtml(product.price)}</span>
            </div>
            <h3>${escapeHtml(product.name)}</h3>
            <p>${escapeHtml(product.description)}</p>
            <a
              class="buy-link"
              href="${escapeHtml(product.link)}"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Buy ${escapeHtml(product.name)} on external purchase page"
            >
              View product
            </a>
          </div>
        </article>
      `
    )
    .join("");

  const productWord = visibleProducts.length === 1 ? "product" : "products";
  resultCount.textContent = `${visibleProducts.length} ${productWord} shown`;
  emptyState.hidden = visibleProducts.length > 0;
}

function renderCmsProducts() {
  productList.innerHTML = store.products
    .map(
      (product) => `
        <tr>
          <td>
            <strong>${escapeHtml(product.name)}</strong>
            <small>${escapeHtml(product.description)}</small>
          </td>
          <td>${escapeHtml(product.category)}</td>
          <td>${escapeHtml(product.price)}</td>
          <td>
            <div class="row-actions">
              <button class="ghost-button" type="button" data-action="edit" data-id="${escapeHtml(product.id)}">
                Edit
              </button>
              <button class="ghost-button danger-button" type="button" data-action="delete" data-id="${escapeHtml(product.id)}">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderAll() {
  if (!getCategories().includes(activeCategory)) {
    activeCategory = "All";
  }

  renderSettings();
  createTabs();
  renderProducts();
  renderCmsProducts();
}

function readProductForm() {
  const formData = new FormData(productForm);
  const name = formData.get("name").trim();
  const existingId = formData.get("id").trim();
  const id = existingId || `${slugify(name)}-${Date.now()}`;

  return normalizeProduct({
    id,
    name,
    category: formData.get("category").trim(),
    price: formData.get("price").trim(),
    description: formData.get("description").trim(),
    color: formData.get("color"),
    background: formData.get("background"),
    shape: formData.get("shape"),
    image: formData.get("image").trim(),
    link: formData.get("link").trim()
  });
}

function fillProductForm(product) {
  productForm.elements.id.value = product.id;
  productForm.elements.name.value = product.name;
  productForm.elements.category.value = product.category;
  productForm.elements.price.value = product.price;
  productForm.elements.description.value = product.description;
  productForm.elements.color.value = product.color;
  productForm.elements.background.value = product.background;
  productForm.elements.shape.value = product.shape;
  productForm.elements.link.value = product.link;
  productForm.elements.image.value = product.image;
  productFormTitle.textContent = "Edit product";
  cancelEdit.hidden = false;
  productForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetProductForm() {
  productForm.reset();
  productForm.elements.id.value = "";
  productForm.elements.color.value = "#087a8f";
  productForm.elements.background.value = "#d9f1ef";
  productFormTitle.textContent = "Add product";
  cancelEdit.hidden = true;
}

tabs.addEventListener("click", (event) => {
  const tab = event.target.closest(".category-tab");

  if (!tab) {
    return;
  }

  activeCategory = tab.dataset.category;
  createTabs();
  renderProducts();
});

searchInput.addEventListener("input", renderProducts);

clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  activeCategory = "All";
  createTabs();
  renderProducts();
  searchInput.focus();
});

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(settingsForm);

  store.settings = {
    teamName: formData.get("teamName").trim() || defaultStore.settings.teamName,
    teamMark: formData.get("teamMark").trim().toUpperCase() || "PY",
    contactEmail:
      formData.get("contactEmail").trim() || defaultStore.settings.contactEmail,
    sheetUrl: formData.get("sheetUrl").trim()
  };
  saveStore("Site settings saved.");
  renderAll();
  loadSheetProducts({ showStatus: true });
});

productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const product = readProductForm();
  const existingIndex = store.products.findIndex((item) => item.id === product.id);

  if (existingIndex >= 0) {
    store.products[existingIndex] = product;
    saveStore("Product updated.");
  } else {
    store.products.unshift(product);
    saveStore("Product added.");
  }

  resetProductForm();
  renderAll();
});

cancelEdit.addEventListener("click", resetProductForm);

productList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const product = store.products.find((item) => item.id === button.dataset.id);

  if (!product) {
    return;
  }

  if (button.dataset.action === "edit") {
    fillProductForm(product);
    return;
  }

  store.products = store.products.filter((item) => item.id !== product.id);
  saveStore("Product deleted.");
  renderAll();
});

exportProducts.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(store, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "piranhas-swim-team-cms.json";
  link.click();
  URL.revokeObjectURL(url);
  setStatus("CMS data exported.");
});

importProducts.addEventListener("change", async (event) => {
  const [file] = event.target.files;

  if (!file) {
    return;
  }

  try {
    store = normalizeStore(JSON.parse(await file.text()));
    saveStore("CMS data imported.");
    resetProductForm();
    renderAll();
  } catch {
    setStatus("Import failed. Choose a valid CMS JSON file.");
  } finally {
    importProducts.value = "";
  }
});

resetCms.addEventListener("click", () => {
  store = clone(defaultStore);
  sheetProducts = [];
  saveStore("Catalog reset to starter products.");
  resetProductForm();
  renderAll();
});

refreshSheet.addEventListener("click", () => {
  loadSheetProducts({ showStatus: true });
});

renderAll();
loadSheetProducts();
setInterval(loadSheetProducts, SHEET_REFRESH_MS);
