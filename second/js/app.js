
"use strict";

(function () {
  const data = window.SL_DATA;
  if (!data) {
    console.error("SL_DATA not found. Check js/data.js loading.");
    return;
  }

  const categoryGrid = document.getElementById("categoryGrid");
  const productGrid = document.getElementById("productGrid");
  const searchForm = document.getElementById("heroSearch");
  const searchInput = document.getElementById("searchInput");

  // Complete homepage categories
  const homeCategories = [
    {
      name: "Electronics",
      icon: "💻",
      description: "Laptops, gadgets & devices"
    },
    {
      name: "Furniture",
      icon: "🪑",
      description: "Tables, chairs & storage"
    },
    {
      name: "Construction",
      icon: "🧱",
      description: "Building & surplus materials"
    },
    {
      name: "Tools & Machinery",
      icon: "🛠️",
      description: "Tools, equipment & machines"
    },
    {
      name: "Clothing",
      icon: "👕",
      description: "Reusable clothes & apparel"
    },
    {
      name: "Books",
      icon: "📚",
      description: "Books, guides & study material"
    },
    {
      name: "Sports & Bicycles",
      icon: "🚲",
      description: "Cycles & sports equipment"
    },
    {
      name: "Business Supplies",
      icon: "📦",
      description: "Packaging & office supplies"
    },
    {
      name: "Agriculture",
      icon: "🌱",
      description: "Farming & garden equipment"
    },
    {
      name: "Home Appliances",
      icon: "🏠",
      description: "Useful home appliances"
    },
    {
      name: "Automotive Parts",
      icon: "⚙️",
      description: "Vehicle parts & accessories"
    },
    {
      name: "Other",
      icon: "♻️",
      description: "Explore more reusable items"
    }
  ];

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function money(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(amount) || 0);
  }

  function readSaved() {
    try {
      return JSON.parse(localStorage.getItem("sl_saved") || "[]");
    } catch {
      return [];
    }
  }

  // Render all homepage categories
  function renderCategories() {
    if (!categoryGrid) return;

    categoryGrid.innerHTML = homeCategories.map(category => `
      <a class="category-card"
         href="browse.html?category=${encodeURIComponent(category.name)}"
         aria-label="Explore ${escapeHTML(category.name)}">

        <span class="category-icon" aria-hidden="true">
          ${category.icon}
        </span>

        <h3>${escapeHTML(category.name)}</h3>

        <p>${escapeHTML(category.description)}</p>

        <span class="category-link">
          Explore products <span aria-hidden="true">→</span>
        </span>
      </a>
    `).join("");
  }

  // Render latest products
  function renderProducts(products = data.products) {
    if (!productGrid) return;

    const saved = readSaved();
    const allProducts = Array.isArray(products) ? products : [];

    if (!allProducts.length) {
      productGrid.innerHTML = `
        <div class="empty-state">
          <h3>No products available yet</h3>
          <p>Explore the marketplace or add a new listing.</p>
          <a class="btn btn-outline" href="browse.html">
            Browse products
          </a>
        </div>`;
      return;
    }

    productGrid.innerHTML = allProducts.slice(0, 8).map(product => {
      const id = String(product.id ?? "");
      const title = product.title || product.name || "Untitled product";
      const image = product.image || "https://placehold.co/600x450?text=Product";
      const condition = product.condition || "Good";
      const category = product.category || "Other";
      const location = product.location || "Location not specified";
      const isSaved = saved.includes(id);

      return `
        <article class="product-card">
          <a class="product-image-link"
             href="product.html?id=${encodeURIComponent(id)}">

            <div class="product-image">
              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(title)}"
                loading="lazy"
                onerror="this.onerror=null;this.src='https://placehold.co/600x450?text=Product'">

              <span class="condition-badge">
                ${escapeHTML(condition)}
              </span>
            </div>
          </a>

          <div class="product-body">
            <span class="product-category">
              ${escapeHTML(category)}
            </span>

            <h3>
              <a href="product.html?id=${encodeURIComponent(id)}">
                ${escapeHTML(title)}
              </a>
            </h3>

            <p class="product-location">
              📍 ${escapeHTML(location)}
            </p>

            <div class="product-bottom">
              <strong class="product-price">
                ${money(product.price)}
              </strong>

              <button
                class="save-btn ${isSaved ? "saved" : ""}"
                type="button"
                data-save="${escapeHTML(id)}"
                aria-pressed="${isSaved}"
                aria-label="Save ${escapeHTML(title)}">

                ${isSaved ? "♥ Saved" : "♡ Save"}
              </button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  // Homepage rendering
  renderCategories();
  renderProducts();

  // Homepage search
  if (searchForm && searchInput) {
    searchForm.addEventListener("submit", event => {
      event.preventDefault();

      const query = searchInput.value.trim();
      window.location.href = "browse.html?q=" + encodeURIComponent(query);
    });
  }

  // Save / unsave products
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-save]");
    if (!button) return;

    const id = button.dataset.save;
    let saved = readSaved();

    if (saved.includes(id)) {
      saved = saved.filter(item => item !== id);
    } else {
      saved.push(id);
    }

    try {
      localStorage.setItem("sl_saved", JSON.stringify(saved));
      renderProducts();
    } catch (error) {
      console.error("Save failed:", error);
      alert("Could not save this product in your browser.");
    }
  });

  // Expose functions for other scripts if needed
  window.SL_APP = {
    escapeHTML,
    money,
    renderCategories,
    renderProducts
  };
})();
