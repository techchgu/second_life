
document.addEventListener("DOMContentLoaded", () => {
  const M = window.SL_MARKET;
  const container = document.getElementById("notificationList");

  function render() {
    const items = M.read(M.KEYS.notifications, []);

    container.innerHTML = items.length ? items.map(item => `
      <article class="content-card ${item.read ? "notification-read" : "notification-unread"}">
        <div class="notification-heading">
          <h3>${M.escape(item.title)}</h3>
          <span class="status-pill">${item.read ? "Read" : "New"}</span>
        </div>
        <p>${M.escape(item.message)}</p>
        <p class="muted">${M.escape(new Date(item.createdAt || Date.now()).toLocaleString())}</p>
        ${item.read ? "" : `<button class="btn btn-outline" data-read="${item.id}">Mark Read</button>`}
      </article>
    `).join("") : `<p class="empty-state">You have no notifications yet.</p>`;

    container.querySelectorAll("[data-read]").forEach(button => {
      button.addEventListener("click", () => {
        const updated = M.read(M.KEYS.notifications, []).map(item =>
          String(item.id) === button.dataset.read ? { ...item, read: true } : item
        );
        M.write(M.KEYS.notifications, updated);
        render();
      });
    });
  }

  document.getElementById("markAllRead").addEventListener("click", () => {
    const updated = M.read(M.KEYS.notifications, []).map(item => ({ ...item, read: true }));
    M.write(M.KEYS.notifications, updated);
    render();
  });

  render();
});
