async function apiRequest(endpoint, options = {}) {
  const settings = {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  };

  if (settings.body && typeof settings.body !== "string") {
    settings.body = JSON.stringify(settings.body);
  }

  const response = await fetch(`${API_BASE_URL}/${endpoint}`, settings);
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Il server non ha restituito una risposta valida.");
  }

  if (!response.ok) {
    const error = new Error(data.message || "Si è verificato un errore.");
    error.status = response.status;
    throw error;
  }
  return data;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("it-IT").format(new Date(`${value}T00:00:00`));
}
