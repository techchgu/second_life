
/* =========================================
   SECOND LIFE AI - OFFERS JAVASCRIPT
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  const offerForm = document.getElementById("offerForm");
  const productSelect = document.getElementById("offerProduct");
  const amountInput = document.getElementById("offerAmount");
  const messageInput = document.getElementById("offerMessage");
  const statusElement = document.getElementById("offerStatus");
  const offersContainer = document.getElementById("myOffers");
  const offersCount = document.getElementById("myOffersCount");

  if (
    !offerForm ||
    !productSelect ||
    !amountInput ||
    !messageInput ||
    !statusElement ||
    !offersContainer
  ) {
    console.error("Offers page: required HTML elements are missing.");
    return;
  }

  const STORAGE_KEY = "second_life_ai_offers_v1";

  // Read products from the existing project data.
  function getProducts() {
    const data = window.SL_DATA;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.products)) return data.products;
    if (Array.isArray(window.products)) return window.products;

    return [];
  }

  function getProductId(product) {
    return String(
      product.id ??
      product.productId ??
      product.slug ??
      product._id ??
      ""
    );
  }

  function getProductName(product) {
    return String(
      product.name ??
      product.title ??
      product.productName ??
      "Untitled product"
    );
  }

  function getProductPrice(product) {
    const value = Number(
      product.price ??
      product.amount ??
      product.sellingPrice ??
      0
    );

    return Number.isFinite(value) ? value : 0;
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return entities[character];
    });
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(value) || 0);
  }

  function setStatus(message, type = "") {
    statusElement.textContent = message;
    statusElement.className = "offers-status";

    if (type) {
      statusElement.classList.add(type);
    }
  }

  function readOffers() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      console.error("Could not read saved offers:", error);
      return [];
    }
  }

  function saveOffers(offers) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
      return true;
    } catch (error) {
      console.error("Could not save offers:", error);
      setStatus(
        "Offers could not be saved in this browser. Check storage settings.",
        "error"
      );
      return false;
    }
  }

  // Populate the product dropdown.
  function populateProducts() {
    const products = getProducts();

    productSelect.innerHTML =
      '<option value="">Choose a product</option>';

    const validProducts = products.filter(product => {
      return product && getProductId(product) !== "";
    });

    validProducts.forEach(product => {
      const option = document.createElement("option");
      option.value = getProductId(product);
      option.textContent =
        `${getProductName(product)} — ${formatCurrency(getProductPrice(product))}`;

      productSelect.appendChild(option);
    });

    if (validProducts.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No products available";
      option.disabled = true;
      productSelect.appendChild(option);

      setStatus(
        "No products were found in your project data. Check js/data.js and its product structure.",
        "error"
      );
    }
  }

  // Display submitted offers.
  function renderOffers() {
    const offers = readOffers();

    if (offersCount) {
      offersCount.textContent =
        `${offers.length} ${offers.length === 1 ? "offer" : "offers"}`;
    }

    if (offers.length === 0) {
      offersContainer.innerHTML = `
        <div class="offers-empty-state">
          <strong>No offers submitted yet.</strong>
          <p>Your submitted offers will appear here.</p>
        </div>
      `;
      return;
    }

    offersContainer.innerHTML = offers
      .slice()
      .reverse()
      .map(offer => {
        const date = offer.createdAt
          ? new Date(offer.createdAt).toLocaleDateString("en-IN")
          : "";

        return `
          <article class="offer-item">
            <div>
              <h3>${escapeHTML(offer.productName)}</h3>
              <p>Offer date: ${escapeHTML(date)}</p>
              ${
                offer.message
                  ? `<p>Message: ${escapeHTML(offer.message)}</p>`
                  : ""
              }
              <span class="offer-item-status">
                ${escapeHTML(offer.status || "Pending")}
              </span>
            </div>

            <div class="offer-item-price">
              ${escapeHTML(formatCurrency(offer.amount))}
            </div>
          </article>
        `;
      })
      .join("");
  }

  // Submit an offer.
  offerForm.addEventListener("submit", event => {
    event.preventDefault();
    setStatus("");

    const productId = productSelect.value;
    const amount = Number(amountInput.value);
    const message = messageInput.value.trim();

    const products = getProducts();

    const product = products.find(item => {
      return getProductId(item) === productId;
    });

    if (!product) {
      setStatus("Please select a valid product.", "error");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setStatus("Enter a valid offer amount greater than zero.", "error");
      amountInput.focus();
      return;
    }

    if (message.length > 500) {
      setStatus("Your message must be 500 characters or less.", "error");
      return;
    }

    const offers = readOffers();

    const newOffer = {
      id: `offer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      productId,
      productName: getProductName(product),
      productPrice: getProductPrice(product),
      amount,
      message,
      status: "Pending",
      createdAt: new Date().toISOString()
    };

    offers.push(newOffer);

    if (!saveOffers(offers)) {
      return;
    }

    renderOffers();
    offerForm.reset();

    setStatus(
      "Offer saved successfully in this browser!",
      "success"
    );
  });

  // Navbar search submits to browse.html?q=...
  const navSearch = document.querySelector(".offers-nav-search");

  if (navSearch) {
    navSearch.addEventListener("submit", event => {
      const searchInput = navSearch.querySelector('input[name="q"]');

      if (!searchInput || !searchInput.value.trim()) {
        event.preventDefault();

        if (searchInput) {
          searchInput.focus();
        }
      }
    });
  }

  populateProducts();
  renderOffers();
});
