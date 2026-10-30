
/* ==========================================
   SECOND LIFE AI - MARKETPLACE MANAGER
   File: js/marketplace.js
   ========================================== */

(function () {
  "use strict";

  const KEYS = {
    listings: "sl_user_listings",
    saved: "sl_saved",
    messages: "sl_messages",
    offers: "sl_offers",
    notifications: "sl_notifications",
    profile: "sl_profile",
    deletedProducts: "sl_admin_deleted_products"
  };

  // Read safely from localStorage
  function read(key, fallback = []) {
    try {
      const value = localStorage.getItem(key);

      if (value === null) {
        return fallback;
      }

      return JSON.parse(value);
    } catch (error) {
      console.error("Storage read error:", key, error);
      return fallback;
    }
  }

  // Write safely to localStorage
  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Storage write error:", key, error);
      alert("Data save nahi hua. Browser storage check karein.");
      return false;
    }
  }

  // Get deleted demo product IDs
  function getDeletedIds() {
    return read(KEYS.deletedProducts, []).map(String);
  }

  // Get original demo products, excluding deleted products
  function getBaseProducts() {
    const products = window.SL_DATA?.products || [];
    const deletedIds = getDeletedIds();

    return products.filter(function (product) {
      return !deletedIds.includes(String(product.id));
    });
  }

  // Get seller-added listings
  function getListings() {
    const listings = read(KEYS.listings, []);
    return Array.isArray(listings) ? listings : [];
  }

  // Get all visible products
  function getProducts() {
    const baseProducts = getBaseProducts();
    const userListings = getListings();
    const deletedIds = getDeletedIds();

    const visibleListings = userListings.filter(function (product) {
      return !deletedIds.includes(String(product.id));
    });

    return [...baseProducts, ...visibleListings];
  }

  // Find one product by ID
  function getProductById(productId) {
    const id = String(productId);

    return getProducts().find(function (product) {
      return String(product.id) === id;
    }) || null;
  }

  // Delete a product from the marketplace
  function deleteProduct(productId) {
    const id = String(productId);

    if (!id || id === "undefined" || id === "null") {
      return false;
    }

    const listings = getListings();

    const isUserListing = listings.some(function (product) {
      return String(product.id) === id;
    });

    if (isUserListing) {
      const updatedListings = listings.filter(function (product) {
        return String(product.id) !== id;
      });

      return write(KEYS.listings, updatedListings);
    }

    const deletedIds = getDeletedIds();

    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
    }

    return write(KEYS.deletedProducts, deletedIds);
  }

  // Restore a deleted demo product
  function restoreProduct(productId) {
    const id = String(productId);

    const deletedIds = getDeletedIds().filter(function (deletedId) {
      return deletedId !== id;
    });

    return write(KEYS.deletedProducts, deletedIds);
  }

  // Saved products
  function getSaved() {
    return read(KEYS.saved, []);
  }

  function isSaved(productId) {
    return getSaved().map(String).includes(String(productId));
  }

  function toggleSaved(productId) {
    const id = String(productId);
    let saved = getSaved().map(String);

    if (saved.includes(id)) {
      saved = saved.filter(function (savedId) {
        return savedId !== id;
      });
    } else {
      saved.push(id);
    }

    write(KEYS.saved, saved);
    return saved.includes(id);
  }

  // Current demo user
  function getUser() {
    return {
      email: localStorage.getItem("sl_current_user") || "",
      name: localStorage.getItem("sl_current_name") || "User"
    };
  }

  function isLoggedIn() {
    return Boolean(getUser().email);
  }

  // Notifications
  function getNotifications() {
    return read(KEYS.notifications, []);
  }

  function notify(message, type = "info") {
    const notifications = getNotifications();

    notifications.unshift({
      id: "notification-" + Date.now(),
      message: String(message),
      type: type,
      read: false,
      createdAt: new Date().toISOString()
    });

    return write(KEYS.notifications, notifications);
  }

  // Messages
  function getMessages() {
    return read(KEYS.messages, []);
  }

  function addMessage(message) {
    const messages = getMessages();

    messages.unshift({
      id: "message-" + Date.now(),
      ...message,
      createdAt: message.createdAt || new Date().toISOString()
    });

    return write(KEYS.messages, messages);
  }

  // Offers
  function getOffers() {
    return read(KEYS.offers, []);
  }

  function addOffer(offer) {
    const offers = getOffers();

    offers.unshift({
      id: "offer-" + Date.now(),
      ...offer,
      createdAt: new Date().toISOString()
    });

    return write(KEYS.offers, offers);
  }

  // Profile
  function getProfile() {
    return read(KEYS.profile, {});
  }

  function saveProfile(profile) {
    return write(KEYS.profile, profile);
  }

  // Helpers
  function money(amount) {
    const value = Number(amount) || 0;

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(value);
  }

  function escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
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

  // Public API
  window.SL_MARKET = {
    KEYS,
    read,
    write,
    getBaseProducts,
    getListings,
    getProducts,
    getProductById,
    deleteProduct,
    restoreProduct,
    getDeletedIds,
    getSaved,
    isSaved,
    toggleSaved,
    getUser,
    isLoggedIn,
    getNotifications,
    notify,
    getMessages,
    addMessage,
    getOffers,
    addOffer,
    getProfile,
    saveProfile,
    money,
    escape
  };

  console.log("Second Life AI Marketplace loaded successfully.");
})();
