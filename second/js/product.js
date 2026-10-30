
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("productDetails");
  const data = window.SL_DATA || {};
  const products = Array.isArray(data.products) ? data.products : [];
  const id = new URLSearchParams(location.search).get("id");

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

  const product = products.find(item => String(item.id) === String(id));

  if (!product) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>Product not found</h2>
        <p>This product may have been removed or the link may be incorrect.</p>
        <a class="btn btn-primary" href="browse.html">Browse Products</a>
      </div>
    `;
    return;
  }

  const name = product.name || product.title || "Untitled product";
  const image = product.image || "https://placehold.co/800x600?text=Product";
  const description = product.description || "No description is available yet.";
  const savedKey = "sl_saved";

  function getSaved() {
    try {
      return JSON.parse(localStorage.getItem(savedKey) || "[]");
    } catch {
      return [];
    }
  }

  function render() {
    const saved = getSaved().includes(product.id);

    container.innerHTML = `
      <div class="product-detail-image">
        <img src="${escapeHTML(image)}" alt="${escapeHTML(name)}"
          onerror="this.onerror=null;this.src='https://placehold.co/800x600?text=Product'">
      </div>

      <div class="product-detail-info">
        <span class="product-category">${escapeHTML(product.category || "Other")}</span>
        <h1>${escapeHTML(name)}</h1>
        <p class="product-price product-detail-price">${money(product.price)}</p>
        <p class="muted">Location: ${escapeHTML(product.location || "Not specified")}</p>
        <hr>
        <h3>Product description</h3>
        <p>${escapeHTML(description)}</p>
        <p><strong>Condition:</strong> ${escapeHTML(product.condition || "Not specified")}</p>
        <p><strong>Availability:</strong> ${escapeHTML(product.stock || "Contact seller")}</p>

        <div class="detail-actions">
          <button class="btn btn-primary" id="contactSeller" type="button">Contact Seller</button>
          <button class="btn btn-outline" id="saveProduct" type="button">
            ${saved ? "♥ Saved" : "♡ Save Product"}
          </button>
        </div>
        <p class="muted" id="productMessage" role="status"></p>
      </div>
    `;

    document.getElementById("saveProduct").addEventListener("click", () => {
      let ids = getSaved();

      if (ids.includes(product.id)) {
        ids = ids.filter(savedId => savedId !== product.id);
      } else {
        ids.push(product.id);
      }

      localStorage.setItem(savedKey, JSON.stringify(ids));
      render();
    });

    document.getElementById("contactSeller").addEventListener("click", () => {
      const currentUser = localStorage.getItem("sl_current_user");
      const message = document.getElementById("productMessage");

      if (!currentUser) {
        message.textContent = "Please log in to contact the seller.";
        setTimeout(() => {
          location.href = "login.html?next=" +
            encodeURIComponent("product.html?id=" + product.id);
        }, 900);
        return;
      }

      const messages = JSON.parse(localStorage.getItem("sl_messages") || "[]");
      messages.push({
        id: Date.now(),
        productId: product.id,
        productName: name,
        from: currentUser,
        message: "I am interested in this product.",
        createdAt: new Date().toISOString()
      });

      localStorage.setItem("sl_messages", JSON.stringify(messages));
      message.textContent = "Demo enquiry saved on this browser.";
    });
  }

  render();
});
