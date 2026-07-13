const loginForm = document.getElementById("login-form");
const messageBox = document.getElementById("message");

function showMessage(message) {
  messageBox.textContent = message;
  messageBox.className = "message message-error";
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const loginData = {
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/login.php`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Email o password non corrette.");
    }

    window.location.href = "dashboard.html";
  } catch (error) {
    showMessage(error.message);
  }
});
