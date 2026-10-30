
document.addEventListener("DOMContentLoaded", () => {
  const M = window.SL_MARKET;
  const user = M.getUser();

  document.getElementById("welcomeTitle").textContent =
    user ? `Welcome, ${user.name}` : "My Dashboard";

  const listings = M.getListings().filter(item =>
    !user || item.sellerEmail === user.email
  );
  const messages = M.read(M.KEYS.messages, []);
  const notifications = M.read(M.KEYS.notifications, []);

  document.getElementById("statListings").textContent = listings.length;
  document.getElementById("statSaved").textContent = M.getSaved().length;
  document.getElementById("statMessages").textContent = messages.length;
  document.getElementById("statNotifications").textContent =
    notifications.filter(item => !item.read).length;

  const grid = document.getElementById("dashboardListings");
  document.getElementById("dashboardEmpty").hidden = listings.length > 0;

  grid.innerHTML = listings.map(item => `
    <article class="product-card">
      <img class="product-image" src="${M.escape(item.image)}" alt="${M.escape(item.name)}">
      <div class="product-card-body">
        <h3>${M.escape(item.name)}</h3>
        <p class="product-price">${M.money(item.price)}</p>
        <a class="btn btn-outline" href="product.html?id=${encodeURIComponent(item.id)}">View Listing</a>
      </div>
    </article>
  `).join("");
});
