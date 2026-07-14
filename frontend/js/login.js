const loginForm = document.getElementById("login-form");
const messageBox = document.getElementById("message");

function showMessage(message) {
  messageBox.textContent = message;
  messageBox.className = "message message-error";
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = loginForm.querySelector("button[type=submit]");
  submitButton.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}/login.php`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Email o password non corrette.");
    window.location.href = "dashboard.html";
  } catch (error) {
    showMessage(error.message);
    submitButton.disabled = false;
  }
});

(async function redirectLoggedUser() {
  try {
    const response = await fetch(`${API_BASE_URL}/me.php`, { credentials: "include" });
    if (response.ok) window.location.href = "dashboard.html";
  } catch {
    // Il backend può non essere ancora avviato.
  }
})();
