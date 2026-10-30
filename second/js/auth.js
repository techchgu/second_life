
/* ==========================================
   SECOND LIFE AI - DEMO AUTHENTICATION
   Browser localStorage only; not production-safe.
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const messageElement = document.getElementById("authMessage");
  const loginButton = document.getElementById("loginButton");
  const togglePassword = document.getElementById("togglePassword");

  if (!loginForm) return;

  function showMessage(message, type = "error") {
    if (!messageElement) return;

    messageElement.textContent = message;
    messageElement.className = `auth-message ${type}`;
  }

  function readUsers() {
    /*
      Demo signup compatibility:
      This expects signup.js to save an array under "secondLifeUsers".
      If your signup.js uses a different key or data format, match it here.
    */
    const possibleKeys = [
      "secondLifeUsers",
      "second_life_users",
      "sl_users"
    ];

    for (const key of possibleKeys) {
      try {
        const value = localStorage.getItem(key);

        if (!value) continue;

        const parsed = JSON.parse(value);

        if (Array.isArray(parsed)) return parsed;

        if (Array.isArray(parsed.users)) return parsed.users;
      } catch (error) {
        console.warn(`Could not read demo user storage "${key}".`, error);
      }
    }

    return [];
  }

  // Show/hide password.
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const showing = passwordInput.type === "text";

      passwordInput.type = showing ? "password" : "text";
      togglePassword.textContent = showing ? "Show" : "Hide";
      togglePassword.setAttribute("aria-pressed", String(!showing));
      togglePassword.setAttribute(
        "aria-label",
        showing ? "Show password" : "Hide password"
      );
    });
  }

  // Login submission.
  loginForm.addEventListener("submit", event => {
    event.preventDefault();

    showMessage("");

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!email || !password) {
      showMessage("Please enter your email and password.");
      return;
    }

    if (!emailInput.checkValidity()) {
      showMessage("Please enter a valid email address.");
      emailInput.focus();
      return;
    }

    const users = readUsers();

    /*
      Common demo user field names are supported.
      Password comparison is only for local demo accounts.
    */
    const user = users.find(item => {
      const savedEmail = String(
        item.email ?? item.userEmail ?? ""
      ).trim().toLowerCase();

      return savedEmail === email;
    });

    if (!user) {
      showMessage(
        "Account not found in this browser. Please sign up first."
      );
      return;
    }

    const savedPassword = user.password ?? user.userPassword;

    if (typeof savedPassword !== "string" || savedPassword !== password) {
      showMessage("Incorrect email or password.");
      passwordInput.focus();
      return;
    }

    const session = {
      id: user.id ?? user.uid ?? "",
      name: user.name ?? user.fullName ?? user.username ?? "User",
      email: String(user.email ?? user.userEmail ?? email),
      loggedInAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(
        "secondLifeCurrentUser",
        JSON.stringify(session)
      );
    } catch (error) {
      showMessage("Unable to save the demo login session in this browser.");
      return;
    }

    showMessage("Login successful! Opening your dashboard...", "success");

    if (loginButton) {
      loginButton.disabled = true;
      loginButton.textContent = "Logging in...";
    }

    window.location.href = "dashboard.html";
  });

  // Navbar search validation.
  const searchForm = document.querySelector(".auth-nav-search");

  if (searchForm) {
    searchForm.addEventListener("submit", event => {
      const searchInput = searchForm.querySelector('input[name="q"]');

      if (!searchInput || !searchInput.value.trim()) {
        event.preventDefault();
        searchInput?.focus();
      }
    });
  }
});

/* ==========================================
   SECOND LIFE AI - DEMO AUTH
   Local browser storage only.
   Not secure for production use.
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  const USERS_KEY = "secondLifeUsers";
  const SESSION_KEY = "secondLifeCurrentUser";

  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");

  const message = document.getElementById("authMessage");

  function showMessage(text, type = "error") {
    if (!message) return;

    message.textContent = text;
    message.className = `auth-message ${type}`;
  }

  function readUsers() {
    try {
      const stored = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
      return Array.isArray(stored) ? stored : [];
    } catch (error) {
      console.error("Unable to read demo accounts:", error);
      return [];
    }
  }

  function saveUsers(users) {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return true;
    } catch (error) {
      console.error("Unable to save demo accounts:", error);
      showMessage("Could not save account. Check browser storage.");
      return false;
    }
  }

  function saveSession(user) {
    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      loggedInAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return true;
    } catch (error) {
      showMessage("Could not create a demo session in this browser.");
      return false;
    }
  }

  // Show/hide passwords on login and signup pages.
  document.querySelectorAll("[data-toggle-password]").forEach(button => {
    button.addEventListener("click", () => {
      const inputId = button.dataset.togglePassword;
      const input = document.getElementById(inputId);

      if (!input) return;

      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.textContent = show ? "Hide" : "Show";
      button.setAttribute("aria-pressed", String(show));
      button.setAttribute(
        "aria-label",
        show ? "Hide password" : "Show password"
      );
    });
  });

  // SIGNUP
  if (signupForm) {
    signupForm.addEventListener("submit", event => {
      event.preventDefault();
      showMessage("");

      const nameInput = document.getElementById("signupName");
      const emailInput = document.getElementById("signupEmail");
      const passwordInput = document.getElementById("signupPassword");
      const confirmInput = document.getElementById("signupConfirm");
      const termsInput = document.getElementById("acceptTerms");
      const button = document.getElementById("signupButton");

      const name = nameInput.value.trim();
      const email = emailInput.value.trim().toLowerCase();
      const password = passwordInput.value;
      const confirmPassword = confirmInput.value;

      if (!signupForm.checkValidity()) {
        signupForm.reportValidity();
        return;
      }

      if (name.length < 2) {
        showMessage("Please enter your full name.");
        nameInput.focus();
        return;
      }

      if (password.length < 8) {
        showMessage("Password must contain at least 8 characters.");
        passwordInput.focus();
        return;
      }

      if (password !== confirmPassword) {
        showMessage("Passwords do not match.");
        confirmInput.focus();
        return;
      }

      if (!termsInput.checked) {
        showMessage("Please agree to the marketplace terms.");
        termsInput.focus();
        return;
      }

      const users = readUsers();

      const existingUser = users.some(user =>
        String(user.email || "").trim().toLowerCase() === email
      );

      if (existingUser) {
        showMessage("This email is already registered. Please log in.");
        emailInput.focus();
        return;
      }

      /*
       * DEMO ONLY:
       * This stores the password in local browser storage.
       * Never use this approach for a real public website.
       */
      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name,
        email,
        password,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);

      if (!saveUsers(users)) return;

      if (button) {
        button.disabled = true;
        button.textContent = "Account Created!";
      }

      showMessage(
        "Account created! Redirecting to login...",
        "success"
      );

      signupForm.reset();

      window.setTimeout(() => {
        window.location.href = "login.html";
      }, 1000);
    });
  }

  // LOGIN
  if (loginForm) {
    loginForm.addEventListener("submit", event => {
      event.preventDefault();
      showMessage("");

      const emailInput = document.getElementById("loginEmail");
      const passwordInput = document.getElementById("loginPassword");
      const button = document.getElementById("loginButton");

      const email = emailInput.value.trim().toLowerCase();
      const password = passwordInput.value;

      if (!loginForm.checkValidity()) {
        loginForm.reportValidity();
        return;
      }

      const users = readUsers();

      const user = users.find(item =>
        String(item.email || "").trim().toLowerCase() === email
      );

      if (!user || user.password !== password) {
        showMessage("Incorrect email or password.");
        return;
      }

      if (!saveSession(user)) return;

      showMessage("Login successful! Opening dashboard...", "success");

      if (button) {
        button.disabled = true;
        button.textContent = "Logging in...";
      }

      window.setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 500);
    });
  }

  // Navbar search validation.
  document.querySelectorAll(".auth-nav-search").forEach(form => {
    form.addEventListener("submit", event => {
      const input = form.querySelector('input[name="q"]');

      if (!input || !input.value.trim()) {
        event.preventDefault();
        input?.focus();
      }
    });
  });
});
