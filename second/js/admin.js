
document.addEventListener("DOMContentLoaded", () => {
  const M = window.SL_MARKET;
  const rows = document.getElementById("adminProductRows");
  const search = document.getElementById("adminSearch");
  const status = document.getElementById("adminStatus");

  const DELETED_KEY = "sl_admin_deleted_products";

  function getDeletedIds() {
    try {
      return JSON.parse(localStorage.getItem(DELETED_KEY) || "[]").map(String);
    } catch {
      return [];
    }
  }

  function getAllProducts() {
    const deleted = getDeletedIds();

    const baseProducts = M.getBaseProducts()
      .filter(p => !deleted.includes(String(p.id)))
      .map(p => ({ ...p, isUserListing: false }));

    const userProducts = M.getListings()
      .map(p => ({ ...p, isUserListing: true }));

    return [...baseProducts, ...userProducts];
  }

  function render() {
    const listings = M.getListings();
    const allProducts = getAllProducts();
    const query = search.value.trim().toLowerCase();

    document.getElementById("adminTotal").textContent = allProducts.length;
    document.getElementById("adminUserListings").textContent = listings.length;
    document.getElementById("adminOffers").textContent =
      M.read(M.KEYS.offers, []).length;
    document.getElementById("adminMessages").textContent =
      M.read(M.KEYS.messages, []).length;

    const filtered = allProducts.filter(product =>
      [
        product.name,
        product.title,
        product.category,
        product.location
      ].join(" ").toLowerCase().includes(query)
    );

    document.getElementById("adminEmpty").hidden = filtered.length > 0;

    rows.innerHTML = filtered.map(product => `
      <tr>
        <td>${M.escape(product.name || product.title || "Untitled")}</td>
        <td>${M.escape(product.category || "Other")}</td>
        <td>${M.money(product.price)}</td>
        <td>${product.isUserListing ? "User Listing" : "Demo Product"}</td>
        <td>
          <div class="admin-actions">
            <a class="btn btn-outline"
               href="product.html?id=${encodeURIComponent(product.id)}">
               View
            </a>
            <button
              type="button"
              class="btn btn-danger"
              data-delete="${M.escape(product.id)}"
              data-user-listing="${product.isUserListing}">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join("");

    rows.querySelectorAll("[data-delete]").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.delete;
        const isUserListing = button.dataset.userListing === "true";

        if (!confirm("Are you sure you want to delete this product?")) {
          return;
        }

        if (isUserListing) {
          const updated = M.getListings().filter(
            item => String(item.id) !== id
          );
          M.write(M.KEYS.listings, updated);
        } else {
          const deleted = getDeletedIds();

          if (!deleted.includes(id)) {
            deleted.push(id);
          }

          localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
        }

        status.textContent = "Product deleted from the Admin Panel.";
        status.className = "success";
        render();
      });
    });
  }

  search.addEventListener("input", render);
  render();
});
