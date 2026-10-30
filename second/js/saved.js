
document.addEventListener("DOMContentLoaded", () => {
  const M = window.SL_MARKET;
  const grid = document.getElementById("savedProducts");
  const empty = document.getElementById("savedEmpty");

  function render() {
    const ids = M.getSaved().map(String);
    const products = M.getProducts().filter(p => ids.includes(String(p.id)));

    empty.hidden = products.length > 0;

    grid.innerHTML = products.map(p => `
      <article class="product-card">
        <img class="product-image" src="${M.escape(p.image || "")}" alt="${M.escape(p.name || p.title || "Product")}">
        <div class="product-card-body">
          <span class="product-category">${M.escape(p.category || "Other")}</span>
          <h3>${M.escape(p.name || p.title || "Untitled product")}</h3>
          <p class="product-price">${M.money(p.price)}</p>
          <div class="product-card-actions">
            <a class="btn btn-primary" href="product.html?id=${encodeURIComponent(p.id)}">View</a>
            <button class="btn btn-outline" data-remove="${M.escape(p.id)}">Remove</button>
          </div>
        </div>
      </article>
    `).join("");

    grid.querySelectorAll("[data-remove]").forEach(button => {
      button.addEventListener("click", () => {
        const remaining = M.getSaved().filter(id => String(id) !== button.dataset.remove);
        M.write(M.KEYS.saved, remaining);
        render();
      });
    });
  }

  render();
});
