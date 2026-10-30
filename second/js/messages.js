
document.addEventListener("DOMContentLoaded", () => {
  const M = window.SL_MARKET;
  const user = M.getUser();
  const container = document.getElementById("messagesList");

  const messages = M.read(M.KEYS.messages, []).filter(message =>
    !user || message.from === user.email || message.to === user.email
  );

  container.innerHTML = messages.length ? messages.map(message => `
    <article class="content-card">
      <h3>${M.escape(message.productName || "Marketplace enquiry")}</h3>
      <p>${M.escape(message.message || "")}</p>
      <p class="muted">From: ${M.escape(message.from || "Unknown user")}</p>
      <p class="muted">${M.escape(new Date(message.createdAt || Date.now()).toLocaleString())}</p>
      <a class="btn btn-outline" href="product.html?id=${encodeURIComponent(message.productId || "")}">View Product</a>
    </article>
  `).join("") : `<p class="empty-state">No messages yet. Open a product and select Contact Seller to create a demo enquiry.</p>`;
});
