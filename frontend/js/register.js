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

  if (password.startsWith(" ")) {
    showMessage("La password non può iniziare con uno spazio.");
    return;
  }

  if (password !== confirmPassword) {
    showMessage("Le due password non coincidono.");
    return;
  }

  const userData = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    password: password,
    confirmPassword: confirmPassword,
    isAdmin: document.getElementById("is-admin").checked,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/register.php`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Errore durante la registrazione.");
    }

    showMessage(data.message, "success");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);
  } catch (error) {
    showMessage(error.message);
  }
});
