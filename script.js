const products = [
  {
    name: "Team Performance Tee",
    category: "Apparel",
    price: "$24",
    description: "Lightweight dry-fit shirt with a bold Piranhas chest mark.",
    color: "#087a8f",
    background: "#d9f1ef",
    shape: "shirt",
    link: "https://example.com/piranhas-yepp-performance-tee"
  },
  {
    name: "Deck Hoodie",
    category: "Apparel",
    price: "$48",
    description: "Warm pullover for early practices, travel meets, and cheering.",
    color: "#13202a",
    background: "#e9edf0",
    shape: "hoodie",
    link: "https://example.com/piranhas-yepp-deck-hoodie"
  },
  {
    name: "Silicone Swim Cap",
    category: "Swim Gear",
    price: "$16",
    description: "Competition-ready cap with team initials on both sides.",
    color: "#f3b33d",
    background: "#fff2cf",
    shape: "cap",
    link: "https://example.com/piranhas-yepp-swim-cap"
  },
  {
    name: "Racing Goggles",
    category: "Swim Gear",
    price: "$32",
    description: "Low-profile mirrored goggles for training and championship days.",
    color: "#e6584f",
    background: "#fde7e5",
    shape: "goggles",
    link: "https://example.com/piranhas-yepp-racing-goggles"
  },
  {
    name: "Meet Towel",
    category: "Accessories",
    price: "$28",
    description: "Oversized cotton towel with lane-line inspired striping.",
    color: "#055263",
    background: "#ddecf0",
    shape: "towel",
    link: "https://example.com/piranhas-yepp-meet-towel"
  },
  {
    name: "Team Backpack",
    category: "Accessories",
    price: "$58",
    description: "Roomy wet-dry swim bag with pockets for goggles and snacks.",
    color: "#087a8f",
    background: "#d9f1ef",
    shape: "bag",
    link: "https://example.com/piranhas-yepp-team-backpack"
  },
  {
    name: "Sideline Water Bottle",
    category: "Fan Favorites",
    price: "$18",
    description: "Insulated bottle for swimmers, parents, and coaches on deck.",
    color: "#e6584f",
    background: "#fde7e5",
    shape: "bottle",
    link: "https://example.com/piranhas-yepp-water-bottle"
  },
  {
    name: "Coach Parka",
    category: "Fan Favorites",
    price: "$72",
    description: "Longline parka for cold-morning meets and winter training.",
    color: "#13202a",
    background: "#e9edf0",
    shape: "parka",
    link: "https://example.com/piranhas-yepp-coach-parka"
  }
];

const categories = ["All", ...new Set(products.map((product) => product.category))];
const tabs = document.querySelector("#category-tabs");
const grid = document.querySelector("#product-grid");
const searchInput = document.querySelector("#product-search");
const resultCount = document.querySelector("#result-count");
const emptyState = document.querySelector("#empty-state");
const clearSearch = document.querySelector("#clear-search");

let activeCategory = "All";

function createTabs() {
  tabs.innerHTML = categories
    .map(
      (category) => `
        <button
          class="category-tab${category === activeCategory ? " active" : ""}"
          type="button"
          role="tab"
          aria-selected="${category === activeCategory}"
          data-category="${category}"
        >
          ${category}
        </button>
      `
    )
    .join("");
}

function getVisibleProducts() {
  const query = searchInput.value.trim().toLowerCase();

  return products.filter((product) => {
    const inCategory =
      activeCategory === "All" || product.category === activeCategory;
    const matchesQuery = [product.name, product.category, product.description]
      .join(" ")
      .toLowerCase()
      .includes(query);

    return inCategory && matchesQuery;
  });
}

function renderProducts() {
  const visibleProducts = getVisibleProducts();

  grid.innerHTML = visibleProducts
    .map(
      (product) => `
        <article class="product-card">
          <div
            class="product-art"
            style="--product-bg: ${product.background}; --product-color: ${product.color};"
            aria-hidden="true"
          >
            <div class="product-icon shape-${product.shape}">
              ${product.shape === "shirt" ? "PIRANHAS" : ""}
              ${product.shape === "hoodie" ? "PY" : ""}
              ${product.shape === "cap" ? "PY" : ""}
            </div>
          </div>
          <div class="product-body">
            <div class="product-meta">
              <span class="badge">${product.category}</span>
              <span class="price">${product.price}</span>
            </div>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <a
              class="buy-link"
              href="${product.link}"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Buy ${product.name} on external purchase page"
            >
              Buy now
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

createTabs();
renderProducts();
