const registerForm = document.getElementById("register-form");
const messageBox = document.getElementById("message");

function showMessage(message, type = "error") {
  messageBox.textContent = message;
  messageBox.className = `message message-${type}`;
}

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  if (password !== confirmPassword) {
    showMessage("Le due password non coincidono.");
    return;
  }

  const button = registerForm.querySelector("button[type=submit]");
  button.disabled = true;
  try {
    const response = await fetch(`${API_BASE_URL}/register.php`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: document.getElementById("first-name").value.trim(),
        lastName: document.getElementById("last-name").value.trim(),
        email: document.getElementById("email").value.trim(),
        password,
        confirmPassword,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Registrazione non riuscita.");
    showMessage(data.message, "success");
    registerForm.reset();
    setTimeout(() => { window.location.href = "index.html"; }, 1200);
  } catch (error) {
    showMessage(error.message);
    button.disabled = false;
  }
});
