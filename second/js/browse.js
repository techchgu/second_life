"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector) => document.querySelector(selector);

  const categoryFilters = $("#categoryFilters");
  const browseProducts = $("#browseProducts");
  const resultsCount = $("#resultsCount");
  const activeCategoryTitle = $("#activeCategoryTitle");
  const activeCategorySubtitle = $("#activeCategorySubtitle");
  const emptyState = $("#emptyState");
  const loadError = $("#loadError");
  const allCategoryCount = $("#allCategoryCount");

  const searchForm = $("#searchForm");
  const searchInput = $("#searchInput");
  const filterForm = $("#filterForm");
  const filterSearch = $("#filterSearch");
  const maxPriceInput = $("#maxPrice");
  const conditionFilter = $("#conditionFilter");
  const sortProducts = $("#sortProducts");
  const clearFilters = $("#clearFilters");
  const emptyClearFilters = $("#emptyClearFilters");
  const retryProducts = $("#retryProducts");

  const DEFAULT_CATEGORIES = [
    "Electronics",
    "Furniture",
    "Books",
    "Clothing",
    "Sports & Bicycles",
    "Tools & Machinery",
    "Business Supplies",
    "Agriculture",
    "Home Appliances",
    "Automotive Parts",
    "Other"
  ];

  let products = [];
  let selectedCategory = "all";
  let appliedSearch = "";
  let appliedMaxPrice = "";
  let appliedCondition = "all";

  function normalize(value) {
    return String(value ?? "").trim();
  }

  function getProductName(product) {
    return normalize(
      product.title ||
      product.name ||
      product.productName ||
      product.product_name ||
      "Untitled Product"
    );
  }

  function getCategory(product) {
    return normalize(
      product.category ||
      product.categoryName ||
      product.category_name ||
      "Other"
    );
  }

  function getPrice(product) {
    const raw = product.price ?? product.sellingPrice ?? product.selling_price;
    if (raw === "" || raw === null || raw === undefined) {
      return null;
    }

    const number = Number(String(raw).replace(/[₹,\s]/g, ""));
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function getCondition(product) {
    return normalize(
      product.condition ||
      product.productCondition ||
      product.product_condition ||
      "Not specified"
    );
  }

  function getLocation(product) {
    return normalize(
      product.location ||
      product.city ||
      product.address ||
      ""
    );
  }

  function getImage(product) {
    const images = Array.isArray(product.images) ? product.images : [];

    const firstImage = images[0];

    return normalize(
      product.image ||
      product.imageUrl ||
      product.imageURL ||
      product.image_url ||
      product.photoURL ||
      product.photoUrl ||
      product.thumbnail ||
      (typeof firstImage === "string"
        ? firstImage
        : firstImage?.url || firstImage?.src) ||
      ""
    );
  }

  function getProductId(product, index) {
    return normalize(product.id ?? product.productId ?? product.product_id) ||
      `item-${index}`;
  }

  function getSavedIds() {
    try {
      const saved = JSON.parse(localStorage.getItem("sl_saved") || "[]");
      return Array.isArray(saved) ? saved.map(String) : [];
    } catch {
      return [];
    }
  }

  function isSaved(product, index) {
    return getSavedIds().includes(getProductId(product, index));
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
      const replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return replacements[character];
    });
  }

  function formatPrice(price) {
    if (price === null) return "Price on request";

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(price);
  }

  function getAvailableCategories() {
    const categorySet = new Set(DEFAULT_CATEGORIES);

    // Include additional categories already present in product data.
    products.forEach((product) => {
      const category = getCategory(product);
      if (category) categorySet.add(category);
    });

    // Also support category names supplied by data.js.
    const sourceCategories = window.SL_DATA?.categories;

    if (Array.isArray(sourceCategories)) {
      sourceCategories.forEach((item) => {
        const name = typeof item === "string"
          ? item
          : item?.name || item?.title || item?.category;

        if (normalize(name)) categorySet.add(normalize(name));
      });
    }

    return [...categorySet].sort((a, b) => {
      const ai = DEFAULT_CATEGORIES.indexOf(a);
      const bi = DEFAULT_CATEGORIES.indexOf(b);

      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;

      return a.localeCompare(b);
    });
  }

  function renderCategories() {
    if (!categoryFilters) return;

    const categories = getAvailableCategories();

    const counts = {};
    products.forEach((product) => {
      const category = getCategory(product);
      counts[category] = (counts[category] || 0) + 1;
    });

    if (allCategoryCount) {
      allCategoryCount.textContent = products.length;
    }

    categoryFilters.innerHTML = `
      <label class="category-option ${selectedCategory === "all" ? "selected" : ""}">
        <input type="radio" name="category" value="all"
          ${selectedCategory === "all" ? "checked" : ""}>
        <span>All Products</span>
        <span class="category-count">${products.length}</span>
      </label>
      ${categories.map((category) => `
        <label class="category-option ${
          selectedCategory === category ? "selected" : ""
        }">
          <input type="radio" name="category"
            value="${escapeHTML(category)}"
            ${selectedCategory === category ? "checked" : ""}>
          <span>${escapeHTML(category)}</span>
          <span class="category-count">${counts[category] || 0}</span>
        </label>
      `).join("")}
    `;
  }

  function getFilteredProducts() {
    let filtered = products.filter((product) => {
      const category = getCategory(product);

      if (
        selectedCategory !== "all" &&
        category.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }

      const searchableText = [
        getProductName(product),
        category,
        getLocation(product),
        getCondition(product),
        product.description || "",
        product.brand || ""
      ].join(" ").toLowerCase();

      if (
        appliedSearch &&
        !searchableText.includes(appliedSearch.toLowerCase())
      ) {
        return false;
      }

      if (appliedMaxPrice !== "") {
        const maxPrice = Number(appliedMaxPrice);
        const price = getPrice(product);

        if (!Number.isFinite(maxPrice) || price === null || price > maxPrice) {
          return false;
        }
      }

      if (appliedCondition !== "all") {
        const condition = getCondition(product).toLowerCase();

        if (!condition.includes(appliedCondition.toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    const sortMode = sortProducts?.value || "recommended";

    if (sortMode === "price-low") {
      filtered.sort((a, b) =>
        (getPrice(a) ?? Infinity) - (getPrice(b) ?? Infinity)
      );
    } else if (sortMode === "price-high") {
      filtered.sort((a, b) =>
        (getPrice(b) ?? -Infinity) - (getPrice(a) ?? -Infinity)
      );
    } else if (sortMode === "name") {
      filtered.sort((a, b) =>
        getProductName(a).localeCompare(getProductName(b))
      );
    } else if (sortMode === "newest") {
      filtered.sort((a, b) => {
        const dateA = new Date(
          a.createdAt || a.created_at || a.date || 0
        ).getTime();

        const dateB = new Date(
          b.createdAt || b.created_at || b.date || 0
        ).getTime();

        return (Number.isFinite(dateB) ? dateB : 0) -
          (Number.isFinite(dateA) ? dateA : 0);
      });
    }

    return filtered;
  }

  function renderProducts() {
    if (!browseProducts) return;

    const filtered = getFilteredProducts();

    if (resultsCount) {
      resultsCount.textContent =
        `${filtered.length} product${filtered.length === 1 ? "" : "s"} found`;
    }

    if (activeCategoryTitle) {
      activeCategoryTitle.textContent =
        selectedCategory === "all" ? "All Products" : selectedCategory;
    }

    if (activeCategorySubtitle) {
      activeCategorySubtitle.textContent = appliedSearch
        ? `Search results for "${appliedSearch}"`
        : "Discover items from the community";
    }

    browseProducts.innerHTML = "";

    if (filtered.length === 0) {
      if (emptyState) emptyState.hidden = false;
      return;
    }

    if (emptyState) emptyState.hidden = true;

    const fragment = document.createDocumentFragment();

    filtered.forEach((product) => {
      const originalIndex = products.indexOf(product);
      const id = getProductId(product, originalIndex);
      const name = getProductName(product);
      const category = getCategory(product);
      const price = getPrice(product);
      const condition = getCondition(product);
      const location = getLocation(product);
      const image = getImage(product);
      const saved = isSaved(product, originalIndex);

      const card = document.createElement("article");
      card.className = "product-card";

      const imageWrap = document.createElement("div");
      imageWrap.className = "product-image-wrap";

      if (image) {
        const img = document.createElement("img");
        img.className = "product-image";
        img.src = image;
        img.alt = name;
        img.loading = "lazy";

        img.addEventListener("error", () => {
          img.remove();

          if (!imageWrap.querySelector(".product-image-placeholder")) {
            const placeholder = document.createElement("div");
            placeholder.className = "product-image-placeholder";
            placeholder.textContent = "♻";
            imageWrap.prepend(placeholder);
          }
        }, { once: true });

        imageWrap.appendChild(img);
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "product-image-placeholder";
        placeholder.textContent = "♻";
        imageWrap.appendChild(placeholder);
      }

      const conditionBadge = document.createElement("span");
      conditionBadge.className = "product-condition";
      conditionBadge.textContent = condition;

      const saveButton = document.createElement("button");
      saveButton.type = "button";
      saveButton.className = `save-btn ${saved ? "saved" : ""}`;
      saveButton.textContent = saved ? "♥" : "♡";
      saveButton.title = saved ? "Remove from saved items" : "Save item";
      saveButton.setAttribute("aria-label", saveButton.title);
      saveButton.setAttribute("aria-pressed", String(saved));
      saveButton.addEventListener("click", () => toggleSaved(id));

      imageWrap.append(conditionBadge, saveButton);

      const info = document.createElement("div");
      info.className = "product-info";

      const categoryBadge = document.createElement("span");
      categoryBadge.className = "product-category";
      categoryBadge.textContent = category;

      const title = document.createElement("h3");
      title.className = "product-title";
      title.textContent = name;

      const priceElement = document.createElement("p");
      priceElement.className = "product-price";
      priceElement.textContent = formatPrice(price);

      const meta = document.createElement("div");
      meta.className = "product-meta";

      if (location) {
        const locationElement = document.createElement("span");
        locationElement.textContent = `⌖ ${location}`;
        meta.appendChild(locationElement);
      }

      const actions = document.createElement("div");
      actions.className = "product-actions";

      const detailsLink = document.createElement("a");
      detailsLink.className = "details-btn";
      detailsLink.href = `product.html?id=${encodeURIComponent(id)}`;
      detailsLink.textContent = "View Details";

      const offerLink = document.createElement("a");
      offerLink.className = "offer-btn";
      offerLink.href = `offers.html?productId=${encodeURIComponent(id)}`;
      offerLink.textContent = "Make Offer";

      actions.append(detailsLink, offerLink);
      info.append(categoryBadge, title, priceElement, meta, actions);
      card.append(imageWrap, info);
      fragment.appendChild(card);
    });

    browseProducts.appendChild(fragment);
  }

  function toggleSaved(id) {
    try {
      const saved = getSavedIds();
      const idString = String(id);
      const index = saved.indexOf(idString);

      if (index >= 0) {
        saved.splice(index, 1);
      } else {
        saved.push(idString);
      }

      localStorage.setItem("sl_saved", JSON.stringify(saved));
      renderProducts();
    } catch (error) {
      console.error("Could not save product:", error);
      alert("Could not update saved items. Please check your browser storage.");
    }
  }

  function applyFilters(event) {
    if (event) event.preventDefault();

    appliedSearch = normalize(filterSearch?.value);
    appliedMaxPrice = normalize(maxPriceInput?.value);
    appliedCondition = conditionFilter?.value || "all";

    if (searchInput) searchInput.value = appliedSearch;

    renderProducts();
  }

  function resetFilters() {
    selectedCategory = "all";
    appliedSearch = "";
    appliedMaxPrice = "";
    appliedCondition = "all";

    if (searchInput) searchInput.value = "";
    if (filterSearch) filterSearch.value = "";
    if (maxPriceInput) maxPriceInput.value = "";
    if (conditionFilter) conditionFilter.value = "all";
    if (sortProducts) sortProducts.value = "recommended";

    renderCategories();
    renderProducts();
  }

  function loadProducts() {
    if (loadError) loadError.hidden = true;

    const data = window.SL_DATA;

    if (!data || !Array.isArray(data.products)) {
      if (loadError) loadError.hidden = false;
      if (resultsCount) resultsCount.textContent = "Product data unavailable";
      if (browseProducts) browseProducts.innerHTML = "";
      console.error(
        "Second Life AI: window.SL_DATA.products is unavailable. Check js/data.js."
      );
      return;
    }

    products = data.products.filter((product) => product && typeof product === "object");

    renderCategories();
    renderProducts();
  }

  if (categoryFilters) {
    categoryFilters.addEventListener("change", (event) => {
      if (event.target.matches('input[name="category"]')) {
        selectedCategory = event.target.value;
        renderCategories();
        renderProducts();
      }
    });
  }

  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const query = normalize(searchInput?.value);
      if (filterSearch) filterSearch.value = query;

      appliedSearch = query;
      renderProducts();
    });
  }

  if (filterForm) {
    filterForm.addEventListener("submit", applyFilters);
  }

  if (sortProducts) {
    sortProducts.addEventListener("change", renderProducts);
  }

  if (clearFilters) {
    clearFilters.addEventListener("click", resetFilters);
  }

  if (emptyClearFilters) {
    emptyClearFilters.addEventListener("click", resetFilters);
  }

  if (retryProducts) {
    retryProducts.addEventListener("click", loadProducts);
  }

  // Allow homepage links such as browse.html?category=Electronics or ?q=laptop.
  const params = new URLSearchParams(window.location.search);
  const urlCategory = params.get("category");
  const urlSearch = params.get("q") || params.get("search") || "";

  loadProducts();

  if (urlCategory) {
    const matchingCategory = getAvailableCategories().find(
      (category) => category.toLowerCase() === urlCategory.toLowerCase()
    );

    if (matchingCategory) selectedCategory = matchingCategory;
  }

  if (urlSearch) {
    appliedSearch = urlSearch;
    if (searchInput) searchInput.value = urlSearch;
    if (filterSearch) filterSearch.value = urlSearch;
  }

  renderCategories();
  renderProducts();
});