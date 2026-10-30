
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("listingForm");
  const message = document.getElementById("listingMessage");

  form.addEventListener("submit", event => {
    event.preventDefault();
    const M = window.SL_MARKET;
    const user = M.getUser();

    if (!user) {
      message.textContent = "Please log in before publishing a listing.";
      setTimeout(() => location.href = "login.html?next=add-listing.html", 700);
      return;
    }

    const name = document.getElementById("listingName").value.trim();
    const price = Number(document.getElementById("listingPrice").value);
    const locationName = document.getElementById("listingLocation").value.trim();

    if (!name || !locationName || !Number.isFinite(price) || price < 0) {
      message.textContent = "Please check your product details.";
      return;
    }

    const listing = {
      id: "user-" + Date.now(),
      name,
      title: name,
      category: document.getElementById("listingCategory").value,
      price,
      condition: document.getElementById("listingCondition").value,
      location: locationName,
      image: document.getElementById("listingImage").value.trim() ||
        "https://placehold.co/600x400?text=Second+Life+Product",
      description: document.getElementById("listingDescription").value.trim(),
      sellerEmail: user.email,
      createdAt: new Date().toISOString()
    };

    const listings = M.getListings();
    listings.unshift(listing);
    M.write(M.KEYS.listings, listings);
    M.notify("Listing created", `Your listing "${name}" has been saved on this browser.`);

    message.textContent = "Listing published in this browser demo!";
    message.className = "success";
    form.reset();

    setTimeout(() => location.href = "dashboard.html", 800);
  });
});
