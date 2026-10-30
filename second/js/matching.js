
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("matchingForm");
  const queryInput = document.getElementById("matchQuery");
  const categoryInput = document.getElementById("matchCategory");
  const budgetInput = document.getElementById("matchBudget");
  const results = document.getElementById("matchingResults");
  const summary = document.getElementById("matchSummary");
  const empty = document.getElementById("matchingEmpty");
  const resetButton = document.getElementById("resetMatching");

  if (!form || !results || !summary) return;

  const data = window.SL_DATA || {};
  const products = Array.isArray(data.products) ? data.products : [];

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function money(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN");
  }

  function getSavedIds() {
    try {
      const value = JSON.parse(localStorage.getItem("sl_saved") || "[]");
      return Array.isArray(value) ? value.map(String) : [];
    } catch {
      return [];
    }
  }

  function saveProduct(id) {
    const saved = getSavedIds();
    const key = String(id);

    const updated = saved.includes(key)
      ? saved.filter(item => item !== key)
      : [...saved, key];

    localStorage.setItem("sl_saved", JSON.stringify(updated));
  }

  function getProductName(product) {
    return product.name || product.title || "Untitled product";
  }

  function getProductImage(product) {
    return product.image || product.imageUrl || product.imageURL || "";
  }

  function getMatches(query, category, budget) {
    const term = query.toLowerCase().trim();

    return products
      .map(product => {
        const name = getProductName(product);
        const productCategory = String(product.category || "Other");
        const description = String(product.description || "");
        const searchable = `${name} ${productCategory} ${description} ${product.location || ""}`.toLowerCase();

        const words = term.split(/\s+/).filter(Boolean);
        const matchedWords = words.filter(word => searchable.includes(word));
        const exactName = name.toLowerCase().includes(term);
        const categoryMatch = category === "All" ||
          productCategory.toLowerCase() === category.toLowerCase();

        const price = Number(product.price || 0);
        const budgetMatch = budget === null || price <= budget;

        let score = words.length
          ? Math.round((matchedWords.length / words.length) * 100)
          : 0;

        if (exactName) score = Math.min(100, score + 25);
        if (categoryMatch && category !== "All") score = Math.min(100, score + 15);

        return {
          product,
          score,
          categoryMatch,
          budgetMatch,
          queryMatch: !term || matchedWords.length > 0 || exactName
        };
      })
      .filter(item => item.categoryMatch && item.budgetMatch && item.queryMatch)
      .sort((a, b) => b.score - a.score);
  }

  function renderMatches(query, category, budget) {
    const matches = getMatches(query, category, budget);
    const savedIds = getSavedIds();

    summary.textContent = matches.length
      ? `${matches.length} matching product${matches.length === 1 ? "" : "s"} found. Suggestions are ranked using your search, category and budget.`
      : "No products matched your search. Try a different keyword or increase your budget.";

    empty.hidden = matches.length > 0;
    results.hidden = matches.length === 0;

    results.innerHTML = matches.map(({ product, score }) => {
      const id = String(product.id ?? "");
      const name = getProductName(product);
      const categoryName = product.category || "Other";
      const image = getProductImage(product);
      const saved = savedIds.includes(id);
      const safeId = encodeURIComponent(id);

      const fallbackImage =
        "https://placehold.co/600x400/f0f7f2/176b4d?text=Product";

      const imageMarkup = image
        ? escapeHTML(image)
        : fallbackImage;

      return `
        <article class="matching-product-card">
          <div class="match-product-image-wrap">
            <img
              class="match-product-image"
              src="${imageMarkup}"
              alt="${escapeHTML(name)}"
              loading="lazy"
              onerror="this.onerror=null;this.src='${fallbackImage}'"
            >

            <button
              class="match-save-btn ${saved ? "is-saved" : ""}"
              type="button"
              data-save-id="${escapeHTML(id)}"
              aria-label="${saved ? "Remove saved product" : "Save product"}"
              aria-pressed="${saved}"
            >${saved ? "♥" : "♡"}</button>
          </div>

          <div class="match-product-body">
            <span class="match-product-category">
              ${escapeHTML(categoryName)}
            </span>

            <h3 class="match-product-title">
              ${escapeHTML(name)}
            </h3>

            <p class="match-product-location">
              ⌖ ${escapeHTML(product.location || "Location not specified")}
            </p>

            <p class="match-product-price">${money(product.price)}</p>

            <div class="match-score">
              ${score ? `${score}% keyword relevance` : "Category and budget match"}
            </div>

            <a
              class="match-view-btn"
              href="product.html?id=${safeId}"
            >View Details →</a>
          </div>
        </article>
      `;
    }).join("");
  }

  form.addEventListener("submit", event => {
    event.preventDefault();

    const query = queryInput.value.trim();
    const category = categoryInput.value;
    const budgetValue = budgetInput.value.trim();
    const budget = budgetValue === "" ? null : Number(budgetValue);

    if (!query) {
      queryInput.focus();
      summary.textContent = "Please enter the product you are looking for.";
      return;
    }

    if (budget !== null && (!Number.isFinite(budget) || budget < 0)) {
      summary.textContent = "Please enter a valid budget.";
      budgetInput.focus();
      return;
    }

    renderMatches(query, category, budget);
  });

  results.addEventListener("click", event => {
    const button = event.target.closest("[data-save-id]");
    if (!button) return;

    saveProduct(button.dataset.saveId);

    const query = queryInput.value.trim();
    if (!query) return;

    const budgetValue = budgetInput.value.trim();
    renderMatches(
      query,
      categoryInput.value,
      budgetValue === "" ? null : Number(budgetValue)
    );
  });

  resetButton.addEventListener("click", () => {
    form.reset();
    results.innerHTML = "";
    results.hidden = false;
    empty.hidden = true;
    summary.textContent = "Enter your needs to find products.";
    queryInput.focus();
  });
});
