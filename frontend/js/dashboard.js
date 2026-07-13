const userSummary = document.getElementById("user-summary");
const welcomeTitle = document.getElementById("welcome-title");
const welcomeText = document.getElementById("welcome-text");
const profileEmail = document.getElementById("profile-email");
const profileRole = document.getElementById("profile-role");
const adminCard = document.getElementById("admin-card");
const usersTableBody = document.getElementById("users-table-body");
const logoutButton = document.getElementById("logout-button");

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Il server non ha restituito una risposta JSON valida.");
  }

  if (!response.ok) {
    const error = new Error(data.message ?? "Si è verificato un errore.");
    error.status = response.status;
    throw error;
  }

  return data;
}

async function loadCurrentUser() {
  try {
    const data = await apiRequest("me.php");
    const user = data.user;

    userSummary.textContent = `${user.name} · ${user.role}`;
    welcomeTitle.textContent = `Ciao, ${user.name}!`;
    welcomeText.textContent =
      user.role === "admin"
        ? "Hai effettuato l’accesso come amministratore."
        : "Hai effettuato l’accesso come utente normale.";

    profileEmail.textContent = user.email;
    profileRole.textContent = user.role;

    if (user.role === "admin") {
      adminCard.classList.remove("hidden");
      await loadUsers();
    }
  } catch (error) {
    if (error.status === 401) {
      window.location.href = "login.html";
      return;
    }

    welcomeText.textContent = error.message;
  }
}

async function loadUsers() {
  try {
    const data = await apiRequest("admin/users.php");

    usersTableBody.innerHTML = data.users
      .map(
        (user) => `
                    <tr>
                        <td>${escapeHtml(String(user.id))}</td>
                        <td>${escapeHtml(user.name)}</td>
                        <td>${escapeHtml(user.email)}</td>
                        <td>${escapeHtml(user.role)}</td>
                    </tr>
                `,
      )
      .join("");
  } catch (error) {
    usersTableBody.innerHTML = `
            <tr>
                <td colspan="4">${escapeHtml(error.message)}</td>
            </tr>
        `;
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

logoutButton.addEventListener("click", async () => {
  try {
    await apiRequest("logout.php", {
      method: "POST",
      body: JSON.stringify({}),
    });
  } finally {
    window.location.href = "index.html";
  }
});

loadCurrentUser();
