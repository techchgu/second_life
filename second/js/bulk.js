
/* =========================================================
   SECOND LIFE AI — BULK RAW MATERIAL MARKETPLACE
   File: js/bulk.js
   Requires Firebase Compat: Auth + Firestore
========================================================= */

(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const page = document.body.dataset.page || "marketplace";

  let db = null;
  let auth = null;
  let currentUser = null;

  let listings = [];
  let requirements = [];
  let activeTab = "listings";
  let unsubscribeListings = null;
  let unsubscribeRequirements = null;

  const CATEGORIES = [
    "Metals",
    "Plastics",
    "Paper",
    "Electronics",
    "Textiles",
    "Wood",
    "Industrial Components",
    "Other"
  ];

  const DEMO_LISTINGS = [
    {
      id: "demo-pet",
      demo: true,
      name: "Recycled PET Plastic Granules",
      category: "Plastics",
      condition: "Recycled",
      quantity: 5000,
      unit: "kg",
      price: 65,
      minOrder: 500,
      negotiable: true,
      company: "GreenCycle Materials",
      location: "Indore, Madhya Pradesh",
      description: "Bulk recycled PET granules for industrial manufacturing.",
      status: "active"
    },
    {
      id: "demo-aluminium",
      demo: true,
      name: "Aluminium Scrap",
      category: "Metals",
      condition: "Used",
      quantity: 2000,
      unit: "kg",
      price: 145,
      minOrder: 100,
      negotiable: true,
      company: "Central Metal Traders",
      location: "Jabalpur, Madhya Pradesh",
      description: "Bulk aluminium scrap for recycling and metal processing.",
      status: "active"
    },
    {
      id: "demo-cardboard",
      demo: true,
      name: "Corrugated Cardboard Waste",
      category: "Paper",
      condition: "Recycled",
      quantity: 10000,
      unit: "kg",
      price: 18,
      minOrder: 500,
      negotiable: true,
      company: "EcoPaper Supplies",
      location: "Bhopal, Madhya Pradesh",
      description: "Sorted cardboard waste for paper recycling.",
      status: "active"
    },
    {
      id: "demo-copper",
      demo: true,
      name: "Copper Wire Scrap",
      category: "Metals",
      condition: "Used",
      quantity: 800,
      unit: "kg",
      price: 620,
      minOrder: 50,
      negotiable: true,
      company: "Prime Copper Recyclers",
      location: "Nagpur, Maharashtra",
      description: "Copper wire scrap available for bulk purchase.",
      status: "active"
    },
    {
      id: "demo-fabric",
      demo: true,
      name: "Reusable Cotton Fabric Rolls",
      category: "Textiles",
      condition: "Reusable",
      quantity: 1200,
      unit: "kg",
      price: 90,
      minOrder: 100,
      negotiable: false,
      company: "FabricLoop Industries",
      location: "Surat, Gujarat",
      description: "Reusable cotton fabric rolls for textile businesses.",
      status: "active"
    },
    {
      id: "demo-wood",
      demo: true,
      name: "Reusable Wooden Pallets",
      category: "Wood",
      condition: "Reusable",
      quantity: 300,
      unit: "pieces",
      price: 250,
      minOrder: 10,
      negotiable: true,
      company: "Reuse Logistics Hub",
      location: "Pune, Maharashtra",
      description: "Reusable wooden pallets for warehouse and logistics use.",
      status: "active"
    },
    {
      id: "demo-electronics",
      demo: true,
      name: "Used Electronic Components",
      category: "Electronics",
      condition: "Used",
      quantity: 500,
      unit: "kg",
      price: 180,
      minOrder: 25,
      negotiable: true,
      company: "Circuit Recovery Works",
      location: "Noida, Uttar Pradesh",
      description: "Used electronic components for recovery and reuse.",
      status: "active"
    },
    {
      id: "demo-rubber",
      demo: true,
      name: "Industrial Rubber Offcuts",
      category: "Other",
      condition: "Recycled",
      quantity: 2500,
      unit: "kg",
      price: 35,
      minOrder: 100,
      negotiable: true,
      company: "RubberCycle Supply",
      location: "Raipur, Chhattisgarh",
      description: "Rubber offcuts suitable for recycling applications.",
      status: "active"
    }
  ];

  const DEMO_REQUIREMENTS = [
    {
      id: "demo-req-pet",
      demo: true,
      name: "PET Granules Required",
      category: "Plastics",
      condition: "Recycled",
      quantity: 3000,
      unit: "kg",
      budget: 70,
      company: "Sample Packaging Company",
      location: "Indore, Madhya Pradesh",
      specifications: "Clean recycled PET granules for packaging.",
      status: "open"
    },
    {
      id: "demo-req-aluminium",
      demo: true,
      name: "Bulk Aluminium Scrap Needed",
      category: "Metals",
      condition: "Used",
      quantity: 1500,
      unit: "kg",
      budget: 155,
      company: "Sample Metal Works",
      location: "Jabalpur, Madhya Pradesh",
      specifications: "Sorted scrap; regular bulk requirement.",
      status: "open"
    },
    {
      id: "demo-req-paper",
      demo: true,
      name: "Corrugated Cardboard Waste Needed",
      category: "Paper",
      condition: "Recycled",
      quantity: 5000,
      unit: "kg",
      budget: 20,
      company: "Sample Paper Products",
      location: "Bhopal, Madhya Pradesh",
      specifications: "Dry and sorted cardboard waste.",
      status: "open"
    }
  ];

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function money(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "Price on request";
    return "₹" + number.toLocaleString("en-IN");
  }

  function formatQuantity(value, unit = "kg") {
    const number = Number(value);
    return `${Number.isFinite(number) ? number.toLocaleString("en-IN") : "—"} ${escapeHTML(unit)}`;
  }

  function showMessage(element, message, type = "info") {
    if (!element) return;
    element.textContent = message;
    element.className = `bulk-message ${type}`;
    element.hidden = false;
  }

  function clearMessage(element) {
    if (!element) return;
    element.textContent = "";
    element.hidden = true;
  }

  function getDemoData() {
    return {
      listings: DEMO_LISTINGS.map(item => ({ ...item })),
      requirements: DEMO_REQUIREMENTS.map(item => ({ ...item }))
    };
  }

  function getFirebaseServices() {
    if (window.db && window.auth) {
      db = window.db;
      auth = window.auth;
    } else if (window.firebase?.apps?.length) {
      try {
        db = window.firebase.firestore();
        auth = window.firebase.auth();
      } catch (error) {
        console.error("Firebase initialization issue:", error);
      }
    }

    if (auth) {
      auth.onAuthStateChanged(user => {
        currentUser = user || null;
        updateAuthStatus();
        if (page === "marketplace") renderMarketplace();
      });
      currentUser = auth.currentUser || null;
    }
  }

  function updateAuthStatus() {
    const element = $("#authStatus");
    if (!element) return;

    element.textContent = currentUser
      ? `Signed in: ${currentUser.email || "User"}`
      : "Sign in to contact sellers or publish listings.";
  }

  function loadMarketplaceData() {
    if (!db) {
      const demo = getDemoData();
      listings = demo.listings;
      requirements = demo.requirements;
      renderMarketplace();
      showMessage(
        $("#bulkMessage"),
        "Demo preview: connect Firebase to load real listings and publish data.",
        "info"
      );
      return;
    }

    unsubscribeListings = db.collection("bulkListings")
      .where("status", "==", "active")
      .onSnapshot(snapshot => {
        const firebaseListings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          demo: false
        }));

        // Demo cards appear only when there are no real active listings.
        listings = firebaseListings.length
          ? firebaseListings
          : getDemoData().listings;

        renderMarketplace();
      }, error => {
        console.error("Could not load bulk listings:", error);
        listings = getDemoData().listings;
        renderMarketplace();
        showMessage(
          $("#bulkMessage"),
          "Could not load live listings. Showing demo preview. Check Firebase permissions.",
          "error"
        );
      });

    unsubscribeRequirements = db.collection("bulkRequirements")
      .where("status", "==", "open")
      .onSnapshot(snapshot => {
        const firebaseRequirements = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          demo: false
        }));

        requirements = firebaseRequirements.length
          ? firebaseRequirements
          : getDemoData().requirements;

        renderMarketplace();
      }, error => {
        console.error("Could not load bulk requirements:", error);
        requirements = getDemoData().requirements;
        renderMarketplace();
      });
  }

  function getFilters() {
    return {
      search: ($("#bulkSearch")?.value || "").trim().toLowerCase(),
      category: $("#bulkCategory")?.value || "all",
      location: ($("#bulkLocation")?.value || "").trim().toLowerCase(),
      maxPrice: Number($("#bulkMaxPrice")?.value || 0),
      condition: $("#bulkCondition")?.value || "all",
      sort: $("#bulkSort")?.value || "newest"
    };
  }

  function getFilteredItems() {
    const filters = getFilters();
    const source = activeTab === "listings" ? listings : requirements;

    let result = source.filter(item => {
      const searchable = [
        item.name,
        item.category,
        item.company,
        item.location,
        item.description,
        item.specifications
      ].join(" ").toLowerCase();

      if (filters.search && !searchable.includes(filters.search)) return false;

      if (
        filters.category !== "all" &&
        String(item.category || "").toLowerCase() !== filters.category.toLowerCase()
      ) return false;

      if (
        filters.location &&
        !String(item.location || "").toLowerCase().includes(filters.location)
      ) return false;

      if (
        filters.condition !== "all" &&
        String(item.condition || "").toLowerCase() !== filters.condition.toLowerCase()
      ) return false;

      const price = Number(item.price ?? item.budget ?? 0);
      if (filters.maxPrice > 0 && price > filters.maxPrice) return false;

      return true;
    });

    if (filters.sort === "price-low") {
      result.sort((a, b) => Number(a.price ?? a.budget ?? 0) - Number(b.price ?? b.budget ?? 0));
    } else if (filters.sort === "price-high") {
      result.sort((a, b) => Number(b.price ?? b.budget ?? 0) - Number(a.price ?? a.budget ?? 0));
    } else if (filters.sort === "quantity-high") {
      result.sort((a, b) => Number(b.quantity || 0) - Number(a.quantity || 0));
    } else {
      result.sort((a, b) => timestampValue(b.createdAt) - timestampValue(a.createdAt));
    }

    return result;
  }

  function timestampValue(value) {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.seconds === "number") return value.seconds * 1000;
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function conditionLabel(condition) {
    return escapeHTML(condition || "Not specified");
  }

  function getMatchExplanation(item) {
    const filters = getFilters();
    const matches = [];

    if (filters.category !== "all" &&
        String(item.category || "").toLowerCase() === filters.category.toLowerCase()) {
      matches.push("category matches");
    }

    if (filters.location &&
        String(item.location || "").toLowerCase().includes(filters.location)) {
      matches.push("location matches");
    }

    return matches.length
      ? `Match signals: ${matches.join(" · ")}`
      : "Review category, quantity, location and price to check suitability.";
  }

  function listingCard(item) {
    const demo = Boolean(item.demo);
    const company = escapeHTML(item.company || item.ownerEmail || "Business seller");
    const name = escapeHTML(item.name || "Untitled material");
    const location = escapeHTML(item.location || "Location not provided");
    const category = escapeHTML(item.category || "Other");
    const price = money(item.price);
    const imageUrl = safeImageUrl(item.imageUrl);
    const image = imageUrl
      ? `<img class="bulk-card-image" src="${escapeHTML(imageUrl)}" alt="${name}" loading="lazy">`
      : `<div class="bulk-card-placeholder"><span>♻</span><small>Raw Material</small></div>`;

    const ownerActions = !demo && currentUser && item.ownerUid === currentUser.uid
      ? `<div class="bulk-owner-actions">
           <button type="button" class="bulk-small-btn" data-action="toggle-status"
             data-id="${escapeHTML(item.id)}" data-status="inactive">Mark unavailable</button>
           <button type="button" class="bulk-small-btn danger" data-action="delete-listing"
             data-id="${escapeHTML(item.id)}">Delete</button>
         </div>`
      : "";

    const contactButton = demo
      ? `<button type="button" class="bulk-btn secondary" disabled title="Demo listing only">Demo preview</button>`
      : `<button type="button" class="bulk-btn primary" data-action="inquire"
           data-id="${escapeHTML(item.id)}" data-type="listing"
           data-name="${escapeHTML(item.name || "")}" data-owner="${escapeHTML(item.ownerUid || "")}">
           Contact seller
         </button>`;

    return `
      <article class="bulk-card">
        ${image}
        <div class="bulk-card-body">
          <div class="bulk-card-top">
            <span class="bulk-tag">${category}</span>
            ${demo ? '<span class="bulk-demo-tag">Demo</span>' : ""}
          </div>
          <h3>${name}</h3>
          <p class="bulk-company">${company}</p>
          <p class="bulk-location"><span aria-hidden="true">📍</span> ${location}</p>
          <div class="bulk-stats">
            <div><small>Available quantity</small><strong>${formatQuantity(item.quantity, item.unit)}</strong></div>
            <div><small>Unit price</small><strong>${escapeHTML(price)}${item.price != null ? `<small class="per-unit"> / ${escapeHTML(item.unit || "unit")}</small>` : ""}</strong></div>
          </div>
          <div class="bulk-pills">
            <span>${conditionLabel(item.condition)}</span>
            ${item.negotiable ? "<span>Price negotiable</span>" : ""}
            ${item.minOrder ? `<span>Min. order: ${formatQuantity(item.minOrder, item.unit)}</span>` : ""}
          </div>
          <p class="bulk-description">${escapeHTML(item.description || "Contact the seller for more details.")}</p>
          <p class="bulk-match-note">${escapeHTML(getMatchExplanation(item))}</p>
          <div class="bulk-card-actions">${contactButton}</div>
          ${ownerActions}
        </div>
      </article>`;
  }

  function requirementCard(item) {
    const demo = Boolean(item.demo);
    const name = escapeHTML(item.name || "Material required");
    const company = escapeHTML(item.company || item.ownerEmail || "Buyer");
    const location = escapeHTML(item.location || "Location not provided");
    const category = escapeHTML(item.category || "Other");
    const budget = item.budget == null || item.budget === ""
      ? "Open to offers"
      : `${money(item.budget)} / ${escapeHTML(item.unit || "unit")}`;

    const contactButton = demo
      ? `<button type="button" class="bulk-btn secondary" disabled>Demo preview</button>`
      : `<button type="button" class="bulk-btn primary" data-action="inquire"
          data-id="${escapeHTML(item.id)}" data-type="requirement"
          data-name="${escapeHTML(item.name || "")}" data-owner="${escapeHTML(item.ownerUid || "")}">
          Send offer
        </button>`;

    const ownerActions = !demo && currentUser && item.ownerUid === currentUser.uid
      ? `<div class="bulk-owner-actions">
           <button type="button" class="bulk-small-btn" data-action="close-requirement"
             data-id="${escapeHTML(item.id)}">Close requirement</button>
           <button type="button" class="bulk-small-btn danger" data-action="delete-requirement"
             data-id="${escapeHTML(item.id)}">Delete</button>
         </div>`
      : "";

    return `
      <article class="bulk-card requirement-card">
        <div class="bulk-card-body">
          <div class="bulk-card-top">
            <span class="bulk-tag requirement-tag">${category}</span>
            ${demo ? '<span class="bulk-demo-tag">Demo</span>' : ""}
          </div>
          <h3>${name}</h3>
          <p class="bulk-company">${company}</p>
          <p class="bulk-location"><span aria-hidden="true">📍</span> ${location}</p>
          <div class="bulk-stats">
            <div><small>Required quantity</small><strong>${formatQuantity(item.quantity, item.unit)}</strong></div>
            <div><small>Target budget</small><strong>${escapeHTML(budget)}</strong></div>
          </div>
          <div class="bulk-pills"><span>${conditionLabel(item.condition)}</span></div>
          <p class="bulk-description">${escapeHTML(item.specifications || item.additional || "Contact the buyer for specifications.")}</p>
          <div class="bulk-card-actions">${contactButton}</div>
          ${ownerActions}
        </div>
      </article>`;
  }

  function safeImageUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }

  function renderMarketplace() {
    if (page !== "marketplace") return;

    const container = $("#bulkCards");
    if (!container) return;

    const items = getFilteredItems();
    const empty = $("#bulkEmpty");
    const count = $("#bulkCount");
    const title = $("#resultsTitle");

    if (title) {
      title.textContent = activeTab === "listings"
        ? "Available raw materials"
        : "Buyer requirements";
    }

    if (count) count.textContent = `${items.length} result${items.length === 1 ? "" : "s"}`;

    container.innerHTML = items.map(item =>
      activeTab === "listings" ? listingCard(item) : requirementCard(item)
    ).join("");

    if (empty) empty.hidden = items.length > 0;
    container.hidden = items.length === 0;

    $$(".tab").forEach(tab => {
      const selected = tab.dataset.mode === activeTab;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-selected", String(selected));
    });
  }

  function setupFilters() {
    $("#applyBulkFilters")?.addEventListener("click", renderMarketplace);

    $("#clearBulkFilters")?.addEventListener("click", () => {
      ["bulkSearch", "bulkLocation", "bulkMaxPrice"].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = "";
      });

      if ($("#bulkCategory")) $("#bulkCategory").value = "all";
      if ($("#bulkCondition")) $("#bulkCondition").value = "all";
      if ($("#bulkSort")) $("#bulkSort").value = "newest";

      $$(".category-chip").forEach(chip => {
        chip.classList.toggle("active", chip.dataset.category === "all");
      });

      renderMarketplace();
    });

    $("#bulkSearch")?.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        renderMarketplace();
      }
    });

    $$(".category-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const category = chip.dataset.category || "all";
        if ($("#bulkCategory")) $("#bulkCategory").value = category;
        $$(".category-chip").forEach(item =>
          item.classList.toggle("active", item === chip)
        );
        renderMarketplace();
      });
    });

    $$(".tab").forEach(tab => {
      tab.addEventListener("click", () => {
        activeTab = tab.dataset.mode === "requirements" ? "requirements" : "listings";
        renderMarketplace();
      });
    });
  }

  async function handleInquiry(button) {
    if (!currentUser) {
      alert("Please sign in before contacting a seller or buyer.");
      window.location.href = "login.html";
      return;
    }

    if (!db) {
      alert("Firebase is not connected. Configure Firebase to send inquiries.");
      return;
    }

    const itemId = button.dataset.id;
    const itemType = button.dataset.type;
    const itemName = button.dataset.name || "Bulk material";
    const item = (itemType === "listing" ? listings : requirements)
      .find(entry => entry.id === itemId);

    if (!item || item.demo || !item.ownerUid) {
      alert("This is a demo listing, not a real seller or buyer.");
      return;
    }

    if (item.ownerUid === currentUser.uid) {
      alert("You cannot send an inquiry to your own listing.");
      return;
    }

    const quantity = prompt("How much quantity do you need / offer?");
    if (quantity === null || !quantity.trim()) return;

    const message = prompt("Add a message or specifications (optional):") || "";
    const proposedPrice = prompt("Your proposed price per unit (optional):") || "";

    try {
      await db.collection("bulkInquiries").add({
        fromUid: currentUser.uid,
        fromEmail: currentUser.email || "",
        toUid: item.ownerUid,
        itemId,
        itemType,
        itemName,
        quantity: quantity.trim(),
        proposedPrice: proposedPrice.trim() || null,
        message: message.trim(),
        status: "Pending",
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });

      alert("Inquiry sent successfully.");
    } catch (error) {
      console.error("Inquiry failed:", error);
      alert("Inquiry could not be sent. Check your Firestore security rules.");
    }
  }

  async function deleteOwnedDocument(collectionName, id, successMessage) {
    if (!currentUser || !db) {
      alert("Sign in and connect Firebase first.");
      return;
    }

    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const ref = db.collection(collectionName).doc(id);
      const snap = await ref.get();

      if (!snap.exists || snap.data().ownerUid !== currentUser.uid) {
        alert("You can delete only your own item.");
        return;
      }

      await ref.delete();
      alert(successMessage);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Delete failed. Check Firebase permissions.");
    }
  }

  async function updateOwnedStatus(collectionName, id, status) {
    if (!currentUser || !db) {
      alert("Sign in and connect Firebase first.");
      return;
    }

    try {
      const ref = db.collection(collectionName).doc(id);
      const snap = await ref.get();

      if (!snap.exists || snap.data().ownerUid !== currentUser.uid) {
        alert("You can update only your own item.");
        return;
      }

      await ref.update({
        status,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error("Status update failed:", error);
      alert("Could not update status. Check Firebase permissions.");
    }
  }

  document.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const { action, id } = button.dataset;

    if (action === "inquire") handleInquiry(button);

    if (action === "delete-listing") {
      deleteOwnedDocument("bulkListings", id, "Listing deleted.");
    }

    if (action === "delete-requirement") {
      deleteOwnedDocument("bulkRequirements", id, "Requirement deleted.");
    }

    if (action === "toggle-status") {
      updateOwnedStatus("bulkListings", id, "inactive");
    }

    if (action === "close-requirement") {
      updateOwnedStatus("bulkRequirements", id, "closed");
    }
  });

  async function handleListingSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const feedback = $("#listingFormMessage");

    clearMessage(feedback);

    if (!currentUser) {
      showMessage(feedback, "Please sign in before publishing a listing.", "error");
      return;
    }

    if (!db) {
      showMessage(feedback, "Firebase is not connected. Check firebase-config.js.", "error");
      return;
    }

    const formData = new FormData(form);
    const quantity = Number(formData.get("quantity"));
    const price = Number(formData.get("price"));
    const minOrder = Number(formData.get("minOrder") || 0);
    const imageUrl = safeImageUrl(formData.get("imageUrl"));

    if (quantity <= 0 || price < 0 || minOrder < 0) {
      showMessage(feedback, "Enter a valid quantity, price and minimum order.", "error");
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      await db.collection("bulkListings").add({
        ownerUid: currentUser.uid,
        ownerEmail: currentUser.email || "",
        name: String(formData.get("name") || "").trim(),
        category: String(formData.get("category") || "Other"),
        condition: String(formData.get("condition") || "New"),
        quantity,
        unit: String(formData.get("unit") || "kg"),
        price,
        minOrder,
        negotiable: formData.get("negotiable") === "on",
        description: String(formData.get("description") || "").trim(),
        company: String(formData.get("company") || "").trim(),
        location: String(formData.get("location") || "").trim(),
        delivery: String(formData.get("delivery") || "").trim(),
        imageUrl,
        contactMethod: String(formData.get("contactMethod") || "Platform"),
        status: "active",
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });

      form.reset();
      showMessage(feedback, "Your bulk listing has been published!", "success");
    } catch (error) {
      console.error("Listing submission failed:", error);
      showMessage(feedback, "Could not publish listing. Check Firestore rules and field values.", "error");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  }

  async function handleRequirementSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const feedback = $("#requirementFormMessage");

    clearMessage(feedback);

    if (!currentUser) {
      showMessage(feedback, "Please sign in before publishing a requirement.", "error");
      return;
    }

    if (!db) {
      showMessage(feedback, "Firebase is not connected. Check firebase-config.js.", "error");
      return;
    }

    const formData = new FormData(form);
    const quantity = Number(formData.get("quantity"));
    const budgetValue = String(formData.get("budget") || "").trim();
    const budget = budgetValue === "" ? null : Number(budgetValue);
    const priceValue = String(formData.get("price") || "").trim();
    const price = priceValue === "" ? null : Number(priceValue);

    if (quantity <= 0 || (budget !== null && budget < 0) || (price !== null && price < 0)) {
      showMessage(feedback, "Enter a valid quantity, target budget and price.", "error");
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      await db.collection("bulkRequirements").add({
        ownerUid: currentUser.uid,
        ownerEmail: currentUser.email || "",
        name: String(formData.get("name") || "").trim(),
        category: String(formData.get("category") || "Other"),
        condition: String(formData.get("condition") || "Any"),
        quantity,
        unit: String(formData.get("unit") || "kg"),
        price,
        budget,
        specifications: String(formData.get("specifications") || "").trim(),
        location: String(formData.get("location") || "").trim(),
        deliveryDate: String(formData.get("deliveryDate") || "").trim(),
        company: String(formData.get("company") || "").trim(),
        contactMethod: String(formData.get("contactMethod") || "Platform"),
        additional: String(formData.get("additional") || "").trim(),
        status: "open",
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });

      form.reset();
      showMessage(feedback, "Your bulk requirement has been published!", "success");
    } catch (error) {
      console.error("Requirement submission failed:", error);
      showMessage(feedback, "Could not publish requirement. Check Firestore rules and field values.", "error");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  }

  function setupForms() {
    $("#bulkListingForm")?.addEventListener("submit", handleListingSubmit);
    $("#bulkRequirementForm")?.addEventListener("submit", handleRequirementSubmit);
  }

  function cleanup() {
    if (typeof unsubscribeListings === "function") unsubscribeListings();
    if (typeof unsubscribeRequirements === "function") unsubscribeRequirements();
  }

  function init() {
    getFirebaseServices();
    updateAuthStatus();

    if (page === "marketplace") {
      setupFilters();
      loadMarketplaceData();
    }

    if (page === "listing-form" || page === "requirement-form") {
      setupForms();
    }

    window.addEventListener("beforeunload", cleanup);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
