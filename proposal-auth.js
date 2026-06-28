(function () {
  var authKey = "smithDevProposalAccess";
  var activityKey = "smithDevProposalLastActivity";
  var accessCode = "Disney";
  var inactivityLimit = 24 * 60 * 60 * 1000;
  var page = window.location.pathname.split("/").pop() || "index.html";
  var isLoginPage = page === "login.html";
  var activityEvents = ["click", "keydown", "scroll", "touchstart", "mousemove"];

  function now() {
    return Date.now();
  }

  function clearAccess() {
    localStorage.removeItem(authKey);
    localStorage.removeItem(activityKey);
  }

  function grantAccess() {
    localStorage.setItem(authKey, "granted");
    localStorage.setItem(activityKey, String(now()));
  }

  function hasValidAccess() {
    var hasAccess = localStorage.getItem(authKey) === "granted";
    var lastActivity = Number(localStorage.getItem(activityKey) || "0");

    if (!hasAccess || !lastActivity || now() - lastActivity > inactivityLimit) {
      clearAccess();
      return false;
    }

    return true;
  }

  function updateActivity() {
    if (localStorage.getItem(authKey) === "granted") {
      localStorage.setItem(activityKey, String(now()));
    }
  }

  function sanitizeAccessCode(value) {
    return String(value || "")
      .normalize("NFKC")
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim()
      .slice(0, 32);
  }

  if (!isLoginPage && !hasValidAccess()) {
    var currentPage = page + window.location.search + window.location.hash;
    window.location.replace("login.html?next=" + encodeURIComponent(currentPage));
    return;
  }

  if (!isLoginPage) {
    window.addEventListener("DOMContentLoaded", function () {
      updateActivity();

      activityEvents.forEach(function (eventName) {
        window.addEventListener(eventName, updateActivity, { passive: true });
      });

      document.querySelectorAll("[data-logout]").forEach(function (link) {
        link.addEventListener("click", function (event) {
          event.preventDefault();
          clearAccess();
          window.location.href = "login.html";
        });
      });
    });
    return;
  }

  window.addEventListener("DOMContentLoaded", function () {
    var form = document.querySelector("[data-login-form]");
    var input = document.querySelector("[data-access-code]");
    var toggle = document.querySelector("[data-password-toggle]");
    var message = document.querySelector("[data-login-message]");

    if (!form || !input || !message) {
      return;
    }

    input.addEventListener("input", function () {
      var sanitizedValue = sanitizeAccessCode(input.value);

      if (input.value !== sanitizedValue) {
        input.value = sanitizedValue;
      }
    });

    if (toggle) {
      toggle.addEventListener("click", function () {
        var isHidden = input.type === "password";
        input.type = isHidden ? "text" : "password";
        toggle.setAttribute("aria-label", isHidden ? "Hide access code" : "Show access code");
        toggle.innerHTML = isHidden
          ? '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i>'
          : '<i class="fa-solid fa-eye" aria-hidden="true"></i>';
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var sanitizedValue = sanitizeAccessCode(input.value);

      input.value = sanitizedValue;

      if (sanitizedValue === accessCode) {
        var params = new URLSearchParams(window.location.search);
        var nextPage = params.get("next") || "index.html";
        grantAccess();
        window.location.href = nextPage;
        return;
      }

      message.textContent = "Incorrect access code. Please try again.";
      input.value = "";
      input.focus();
    });
  });
})();
