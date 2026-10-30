
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const form = $("profileForm");
  const nameInput = $("profileName");
  const emailInput = $("profileEmail");
  const locationInput = $("profileLocation");
  const bioInput = $("profileBio");
  const status = $("profileStatus");
  const photoInput = $("photoInput");
  const avatar = $("profileAvatar");
  const fallback = $("avatarFallback");
  const logoutButton = $("logoutButton");

  const PROFILE_KEY = "sl_profile";
  const PHOTO_KEY = "sl_profile_photo";

  function readJSON(key, fallbackValue = []) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallbackValue;
    } catch {
      return fallbackValue;
    }
  }

  function getCurrentUser() {
    try {
      if (
        window.firebase &&
        firebase.apps &&
        firebase.apps.length &&
        firebase.auth
      ) {
        return firebase.auth().currentUser;
      }
    } catch (error) {
      console.warn("Firebase user lookup unavailable.", error);
    }
    return null;
  }

  function showStatus(message, isError = false) {
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? "#dc2626" : "#047857";
  }

  function loadProfile() {
    const profile = readJSON(PROFILE_KEY, {});
    const user = getCurrentUser();

    const name = profile.name || user?.displayName || "";
    const email = user?.email || profile.email || "";

    nameInput.value = name;
    emailInput.value = email;
    locationInput.value = profile.location || "";
    bioInput.value = profile.bio || "";

    $("displayName").textContent = name || "Your Name";
    $("displayEmail").textContent = email || "Sign in to view your account";

    const photo = localStorage.getItem(PHOTO_KEY);
    if (photo) {
      showPhoto(photo);
    }

    updateCounts();
  }

  function showPhoto(src) {
    avatar.src = src;
    avatar.style.display = "block";
    fallback.style.display = "none";
  }

  function updateCounts() {
    const listings = readJSON("sl_listings", []);
    const saved = readJSON("sl_saved", []);

    const listingArray = Array.isArray(listings) ? listings : [];
    const savedArray = Array.isArray(saved) ? saved : [];

    const activeListings = listingArray.filter((item) => {
      const statusValue = String(item.status || "active").toLowerCase();
      return statusValue === "active";
    });

    $("listingCount").textContent = listingArray.length;
    $("savedCount").textContent = savedArray.length;
    $("activeCount").textContent = activeListings.length;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const user = getCurrentUser();
    const previous = readJSON(PROFILE_KEY, {});

    const profile = {
      ...previous,
      name: nameInput.value.trim(),
      email: user?.email || emailInput.value.trim(),
      location: locationInput.value.trim(),
      bio: bioInput.value.trim()
    };

    if (!profile.name) {
      showStatus("Please enter your full name.", true);
      nameInput.focus();
      return;
    }

    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

      $("displayName").textContent = profile.name;
      $("displayEmail").textContent =
        profile.email || "Email not available";

      showStatus("Profile saved successfully.");
    } catch (error) {
      console.error(error);
      showStatus("Could not save your profile in this browser.", true);
    }
  });

  photoInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      showStatus("Please select a JPG, PNG, or WebP image.", true);
      photoInput.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showStatus("Photo must be smaller than 2 MB.", true);
      photoInput.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDimension = 400;
        const scale = Math.min(
          1,
          maxDimension / image.width,
          maxDimension / image.height
        );

        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const compressedPhoto = canvas.toDataURL("image/jpeg", 0.82);

        try {
          localStorage.setItem(PHOTO_KEY, compressedPhoto);
          showPhoto(compressedPhoto);
          showStatus("Profile photo updated.");
        } catch (error) {
          console.error(error);
          showStatus(
            "Photo could not be saved. Try a smaller image.",
            true
          );
        }
      };

      image.onerror = () => {
        showStatus("Could not read that image. Try another photo.", true);
      };

      image.src = reader.result;
    };

    reader.onerror = () => {
      showStatus("Could not open the selected photo.", true);
    };

    reader.readAsDataURL(file);
  });

  logoutButton.addEventListener("click", async () => {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;

    try {
      if (
        window.firebase &&
        firebase.apps &&
        firebase.apps.length &&
        firebase.auth
      ) {
        await firebase.auth().signOut();
      }

      window.location.href = "login.html";
    } catch (error) {
      console.error("Logout error:", error);
      showStatus("Logout failed. Please try again.", true);
    }
  });

  loadProfile();
});
