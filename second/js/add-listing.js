
(() => {
  "use strict";

  const form = document.getElementById("addProductForm");
  if (!form) return;

  const message = document.getElementById("formMessage");
  const publishButton = document.getElementById("publishButton");
  const imageUrlInput = document.getElementById("imageUrl");
  const previewImage = document.getElementById("previewImage");
  const previewPlaceholder = document.querySelector(".preview-placeholder");

  let currentUser = null;
  let authReady = false;

  function showMessage(text, type = "error") {
    message.textContent = text;
    message.className = `form-message ${type}`;
  }

  function clearMessage() {
    message.textContent = "";
    message.className = "form-message";
  }

  function getFirebaseServices() {
    if (!window.firebase || !firebase.apps || firebase.apps.length === 0) {
      return null;
    }

    try {
      return {
        auth: firebase.auth(),
        db: firebase.firestore()
      };
    } catch (error) {
      console.error("Firebase initialization error:", error);
      return null;
    }
  }

  const services = getFirebaseServices();

  if (!services) {
    authReady = true;
    showMessage(
      "Firebase initialize nahi hua. js/firebase-config.js aur Firebase configuration check karo."
    );
  } else {
    services.auth.onAuthStateChanged(user => {
      currentUser = user || null;
      authReady = true;

      const authStatus = document.getElementById("authStatus");

      if (authStatus) {
        authStatus.textContent = user
          ? `Signed in: ${user.displayName || user.email || "Seller"}`
          : "Sign in to publish a product";
      }

      if (!user) {
        showMessage(
          "Product publish karne ke liye pehle login karo.",
          "error"
        );
      } else {
        clearMessage();
      }
    });
  }

  // Product image preview
  imageUrlInput.addEventListener("input", () => {
    const url = imageUrlInput.value.trim();

    previewImage.hidden = true;
    previewImage.removeAttribute("src");

    if (previewPlaceholder) {
      previewPlaceholder.hidden = false;
    }

    if (!url) return;

    try {
      const parsed = new URL(url);

      if (!["http:", "https:"].includes(parsed.protocol)) return;

      previewImage.onload = () => {
        previewImage.hidden = false;

        if (previewPlaceholder) {
          previewPlaceholder.hidden = true;
        }
      };

      previewImage.onerror = () => {
        previewImage.hidden = true;

        if (previewPlaceholder) {
          previewPlaceholder.textContent =
            "Image load nahi hui. Direct public image URL check karo.";
          previewPlaceholder.hidden = false;
        }
      };

      previewImage.src = parsed.href;
    } catch {
      // Invalid or incomplete URL; keep placeholder visible.
    }
  });

  function readValue(name) {
    const element = form.elements.namedItem(name);
    return element ? String(element.value || "").trim() : "";
  }

  function validHttpUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    clearMessage();

    if (!form.reportValidity()) return;

    if (!services) {
      showMessage(
        "Firebase setup nahi mila. Pehle Firebase configuration fix karo."
      );
      return;
    }

    if (!authReady) {
      showMessage("Login status check ho raha hai. Thodi der baad try karo.");
      return;
    }

    if (!currentUser) {
      showMessage(
        "Product publish karne ke liye login zaroori hai. Login page par jao."
      );

      window.setTimeout(() => {
        window.location.href =
          "login.html?redirect=" + encodeURIComponent("add-listing.html");
      }, 1200);

      return;
    }

    const name = readValue("name");
    const category = readValue("category");
    const condition = readValue("condition");
    const description = readValue("description");
    const price = Number(readValue("price"));
    const originalPriceValue = readValue("originalPrice");
    const originalPrice = originalPriceValue
      ? Number(originalPriceValue)
      : null;
    const quantity = Number(readValue("quantity"));
    const imageUrl = readValue("imageUrl");
    const sellerName = readValue("sellerName");
    const location = readValue("location");
    const contactMethod = readValue("contactMethod");
    const contact = readValue("contact");
    const delivery = readValue("delivery");

    if (!name || !category || !condition || !description ||
        !sellerName || !location || !contactMethod) {
      showMessage("Please saare required fields fill karo.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      showMessage("Selling price zero se zyada honi chahiye.");
      return;
    }

    if (originalPrice !== null &&
        (!Number.isFinite(originalPrice) || originalPrice < 0)) {
      showMessage("Original price valid honi chahiye.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
      showMessage("Quantity kam se kam 1 honi chahiye.");
      return;
    }

    if (!validHttpUrl(imageUrl)) {
      showMessage("Valid public product image URL enter karo.");
      return;
    }

    const product = {
      name,
      title: name,
      category,
      condition,
      description,
      price,
      originalPrice,
      quantity,
      imageUrl,
      image: imageUrl,
      sellerName,
      company: sellerName,
      location,
      contactMethod,
      contact,
      delivery,
      sellerId: currentUser.uid,
      ownerUid: currentUser.uid,
      sellerEmail: currentUser.email || "",
      status: "active",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    publishButton.disabled = true;
    publishButton.textContent = "Publishing...";

    try {
      const docRef = await services.db.collection("listings").add(product);

      showMessage(
        "Product successfully publish ho gaya! Listing ID: " + docRef.id,
        "success"
      );

      form.reset();

      previewImage.hidden = true;
      previewImage.removeAttribute("src");

      if (previewPlaceholder) {
        previewPlaceholder.textContent = "Image preview will appear here";
        previewPlaceholder.hidden = false;
      }

      // Keep the success message visible before navigating.
      window.setTimeout(() => {
        window.location.href = "browse.html";
      }, 1800);

    } catch (error) {
      console.error("Product publish error:", error);

      if (error.code === "permission-denied") {
        showMessage(
          "Firebase ne listing save karne ki permission deny ki. Firestore rules check karo."
        );
      } else {
        showMessage(
          "Product save nahi hua. Internet, Firebase configuration aur Firestore rules check karo."
        );
      }
    } finally {
      publishButton.disabled = false;
      publishButton.textContent = "Publish product →";
    }
  });
})();
