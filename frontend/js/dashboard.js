const state = {
  user: null,
  courses: [],
  employees: [],
  assignments: [],
  statistics: [],
};

const statusLabels = {
  assigned: "Assegnato",
  completed: "Completato",
  expired: "Scaduto",
  cancelled: "Annullato",
};

const messageBox = document.getElementById("global-message");

function showMessage(message, type = "success") {
  messageBox.textContent = message;
  messageBox.className = `message message-${type}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(() => messageBox.classList.add("hidden"), 4500);
}

function badge(status) {
  return `<span class="badge badge-${escapeHtml(status)}">${escapeHtml(statusLabels[status] || status)}</span>`;
}

function emptyRow(columns, message) {
  return `<tr><td colspan="${columns}" class="empty-state">${escapeHtml(message)}</td></tr>`;
}

function fillSelect(selectId, items, valueKey, labelBuilder, firstLabel) {
  const select = document.getElementById(selectId);
  const selected = select.value;
  select.innerHTML = firstLabel === null ? "" : `<option value="">${escapeHtml(firstLabel)}</option>`;
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item[valueKey];
    option.textContent = labelBuilder(item);
    select.appendChild(option);
  });
  if ([...select.options].some((option) => option.value === selected)) select.value = selected;
}

function uniqueCategories() {
  return [...new Set(state.courses.map((course) => course.category))].sort();
}

function setCategorySelects() {
  const categories = uniqueCategories().map((category) => ({ category }));
  ["my-category", "catalog-category", "filter-category", "stats-category"].forEach((id) => {
    fillSelect(id, categories, "category", (item) => item.category, "Tutte");
  });
}

async function loadAssignments(query = "") {
  const data = await apiRequest(`assignments.php${query ? `?${query}` : ""}`);
  state.assignments = data.assignments;
  return data.assignments;
}

async function loadAcademyData() {
  const [courseData, employeeData, assignmentData, statsData] = await Promise.all([
    apiRequest("courses.php"),
    apiRequest("employees.php"),
    apiRequest("assignments.php"),
    apiRequest("statistics.php"),
  ]);
  state.courses = courseData.courses;
  state.employees = employeeData.employees;
  state.assignments = assignmentData.assignments;
  state.statistics = statsData.statistics;
  setCategorySelects();
  fillAcademySelects();
  renderCatalog();
  renderAssignments();
  renderEmployees();
  renderStatistics();
}

function fillAcademySelects() {
  ["assignment-employee", "filter-employee", "stats-employee"].forEach((id) => {
    fillSelect(id, state.employees, "id", (item) => `${item.name} (${item.email})`, id === "assignment-employee" ? "Seleziona" : "Tutti");
  });
  fillSelect("assignment-course", state.courses.filter((course) => course.isActive), "id", (item) => `${item.title} - ${item.category}`, "Seleziona");
  fillSelect("filter-course", state.courses, "id", (item) => item.title, "Tutti");
}

function renderOverview() {
  const assignments = state.assignments;
  const assigned = assignments.filter((item) => item.status === "assigned").length;
  const completed = assignments.filter((item) => item.status === "completed").length;
  const expired = assignments.filter((item) => item.status === "expired").length;
  const cards = state.user.role === "academy"
    ? [
        ["Corsi in catalogo", state.courses.length],
        ["Dipendenti", state.employees.length],
        ["Assegnazioni attive", assigned],
        ["Completamenti", completed],
      ]
    : [
        ["Corsi assegnati", assignments.length],
        ["Da completare", assigned],
        ["Completati", completed],
        ["Scaduti", expired],
      ];
  document.getElementById("summary-cards").innerHTML = cards
    .map(([label, value], index) => `<article class="summary-card ${index === cards.length - 1 ? "highlight" : ""}"><span>${escapeHtml(label)}</span><strong>${value}</strong></article>`)
    .join("");

  const deadlines = assignments
    .filter((item) => item.status === "assigned" || item.status === "expired")
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn))
    .slice(0, 5);
  document.getElementById("deadline-list").innerHTML = deadlines.length
    ? deadlines.map((item) => `<div class="deadline-item"><div><strong>${escapeHtml(item.title)}</strong><br><small>${escapeHtml(item.employeeName || item.category)}</small></div><span>${formatDate(item.dueOn)}</span>${badge(item.status)}</div>`).join("")
    : '<p class="empty-state">Nessuna scadenza da mostrare.</p>';
}

function renderMyCourses(assignments = state.assignments) {
  const container = document.getElementById("my-course-list");
  const categories = [...new Set(assignments.map((item) => item.category))].sort().map((category) => ({ category }));
  fillSelect("my-category", categories, "category", (item) => item.category, "Tutte");
  container.innerHTML = assignments.length
    ? assignments.map((item) => `
      <article class="course-card">
        <div class="course-card-top"><span class="badge">${escapeHtml(item.category)}</span>${badge(item.status)}</div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description || "Nessuna descrizione.")}</p>
        <div class="course-meta"><span>${item.durationHours} ore</span><span>Scadenza: ${formatDate(item.dueOn)}</span>${item.isMandatory ? "<span>Obbligatorio</span>" : ""}</div>
        <div class="course-actions">
          <button class="button button-ghost button-small" data-action="details" data-id="${item.id}" type="button">Dettagli</button>
          ${["assigned", "expired"].includes(item.status) ? `<button class="button button-small" data-action="complete" data-id="${item.id}" type="button">Segna completato</button>` : ""}
        </div>
      </article>`).join("")
    : '<div class="panel empty-state">Nessun corso corrisponde ai filtri.</div>';
}

function renderCatalog(courses = state.courses) {
  document.getElementById("courses-table").innerHTML = courses.length
    ? courses.map((course) => `<tr>
      <td><strong>${escapeHtml(course.title)}</strong><br><small class="muted">${escapeHtml(course.description)}</small></td>
      <td>${escapeHtml(course.category)}</td><td>${course.durationHours} ore</td>
      <td>${course.isMandatory ? "Obbligatorio" : "Facoltativo"}</td>
      <td><span class="badge badge-${course.isActive ? "active" : "inactive"}">${course.isActive ? "Attivo" : "Non attivo"}</span></td>
      <td><div class="table-actions"><button class="button button-ghost button-small" data-course-action="edit" data-id="${course.id}" type="button">Modifica</button>${course.isActive ? `<button class="button button-warning button-small" data-course-action="deactivate" data-id="${course.id}" type="button">Disattiva</button>` : ""}<button class="button button-danger button-small" data-course-action="delete" data-id="${course.id}" type="button">Elimina</button></div></td>
    </tr>`).join("")
    : emptyRow(6, "Nessun corso trovato.");
}

function renderAssignments(assignments = state.assignments) {
  document.getElementById("assignments-table").innerHTML = assignments.length
    ? assignments.map((item) => `<tr>
      <td><strong>${escapeHtml(item.employeeName)}</strong><br><small class="muted">${escapeHtml(item.employeeEmail)}</small></td>
      <td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.category)}</td><td>${formatDate(item.assignedOn)}</td><td>${formatDate(item.dueOn)}</td><td>${badge(item.status)}</td>
      <td><div class="table-actions"><button class="button button-ghost button-small" data-assignment-action="edit" data-id="${item.id}" type="button">Modifica</button>${!["completed", "cancelled"].includes(item.status) ? `<button class="button button-danger button-small" data-assignment-action="cancel" data-id="${item.id}" type="button">Annulla</button>` : ""}</div></td>
    </tr>`).join("")
    : emptyRow(7, "Nessuna assegnazione trovata.");
}

function renderEmployees() {
  document.getElementById("employees-table").innerHTML = state.employees.length
    ? state.employees.map((employee) => {
        const assignments = state.assignments.filter((item) => item.employeeId === employee.id);
        return `<tr><td><strong>${escapeHtml(employee.name)}</strong></td><td>${escapeHtml(employee.email)}</td><td>${assignments.length}</td><td>${assignments.filter((item) => item.status === "completed").length}</td></tr>`;
      }).join("")
    : emptyRow(4, "Nessun dipendente registrato.");
}

function renderStatistics(statistics = state.statistics) {
  const totalAssigned = statistics.reduce((sum, row) => sum + row.assignedCount, 0);
  const totalCompleted = statistics.reduce((sum, row) => sum + row.completedCount, 0);
  const percentage = totalAssigned ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
  document.getElementById("stats-summary").innerHTML = `
    <article class="summary-card"><span>Assegnazioni</span><strong>${totalAssigned}</strong></article>
    <article class="summary-card"><span>Completamenti</span><strong>${totalCompleted}</strong></article>
    <article class="summary-card highlight"><span>Percentuale complessiva</span><strong>${percentage}%</strong></article>`;
  document.getElementById("statistics-table").innerHTML = statistics.length
    ? statistics.map((row) => `<tr><td>${escapeHtml(row.month)}</td><td>${escapeHtml(row.category)}</td><td>${row.assignedCount}</td><td>${row.completedCount}</td><td><strong>${row.completionPercentage}%</strong><div class="progress"><span style="width:${Math.min(row.completionPercentage, 100)}%"></span></div></td></tr>`).join("")
    : emptyRow(5, "Nessun dato disponibile per i filtri scelti.");
}

function openDetails(id) {
  const item = state.assignments.find((assignment) => assignment.id === Number(id));
  if (!item) return;
  document.getElementById("dialog-content").innerHTML = `
    <p class="eyebrow">${escapeHtml(item.category)}</p><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.description)}</p>
    <div class="detail-grid"><div><span>Durata</span><strong>${item.durationHours} ore</strong></div><div><span>Stato</span>${badge(item.status)}</div><div><span>Assegnato il</span><strong>${formatDate(item.assignedOn)}</strong></div><div><span>Scadenza</span><strong>${formatDate(item.dueOn)}</strong></div><div><span>Completato il</span><strong>${formatDate(item.completedOn)}</strong></div><div><span>Obbligatorietà</span><strong>${item.isMandatory ? "Obbligatorio" : "Facoltativo"}</strong></div></div>`;
  document.getElementById("course-dialog").showModal();
}

function showCourseForm(course = null) {
  document.getElementById("course-form").classList.remove("hidden");
  document.getElementById("course-form-title").textContent = course ? "Modifica corso" : "Nuovo corso";
  document.getElementById("course-id").value = course?.id || "";
  document.getElementById("course-title").value = course?.title || "";
  document.getElementById("course-description").value = course?.description || "";
  document.getElementById("course-category").value = course?.category || "";
  document.getElementById("course-duration").value = course?.durationHours || "";
  document.getElementById("course-mandatory").checked = course?.isMandatory || false;
  document.getElementById("course-active").checked = course ? course.isActive : true;
}

function showAssignmentForm(assignment = null) {
  const form = document.getElementById("assignment-form");
  form.classList.remove("hidden");
  document.getElementById("assignment-form-title").textContent = assignment ? "Modifica assegnazione" : "Nuova assegnazione";
  document.getElementById("assignment-id").value = assignment?.id || "";
  document.getElementById("assignment-employee").value = assignment?.employeeId || "";
  if (assignment && ![...document.getElementById("assignment-course").options].some((option) => Number(option.value) === assignment.courseId)) {
    const course = state.courses.find((item) => item.id === assignment.courseId);
    document.getElementById("assignment-course").add(new Option(`${course.title} (non attivo)`, course.id));
  }
  document.getElementById("assignment-course").value = assignment?.courseId || "";
  document.getElementById("assignment-date").value = assignment?.assignedOn || new Date().toISOString().slice(0, 10);
  document.getElementById("assignment-due").value = assignment?.dueOn || "";
  document.getElementById("assignment-status").value = assignment?.status === "expired" ? "assigned" : assignment?.status || "assigned";
  document.getElementById("assignment-completed").value = assignment?.completedOn || "";
  document.getElementById("edit-status-group").classList.toggle("hidden", !assignment);
}

async function refreshAcademyData(message) {
  await loadAcademyData();
  renderOverview();
  if (message) showMessage(message);
}

document.getElementById("main-nav").addEventListener("click", (event) => {
  const button = event.target.closest("[data-section]");
  if (!button) return;
  document.querySelectorAll(".nav-button").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  document.querySelectorAll(".page-section").forEach((section) => section.classList.add("hidden"));
  document.getElementById(`section-${button.dataset.section}`).classList.remove("hidden");
});

document.getElementById("logout-button").addEventListener("click", async () => {
  try { await apiRequest("logout.php", { method: "POST", body: {} }); } finally { window.location.href = "index.html"; }
});

document.getElementById("my-course-list").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  if (button.dataset.action === "details") openDetails(button.dataset.id);
  if (button.dataset.action === "complete" && confirm("Confermi di aver completato questo corso?")) {
    try {
      const data = await apiRequest("assignments.php", { method: "PUT", body: { id: Number(button.dataset.id), action: "complete" } });
      await loadAssignments(); renderMyCourses(); renderOverview(); showMessage(data.message);
    } catch (error) { showMessage(error.message, "error"); }
  }
});

document.getElementById("employee-filters").addEventListener("submit", async (event) => {
  event.preventDefault();
  const params = new URLSearchParams();
  if (document.getElementById("my-status").value) params.set("status", document.getElementById("my-status").value);
  if (document.getElementById("my-category").value) params.set("category", document.getElementById("my-category").value);
  if (document.getElementById("my-due-to").value) params.set("dueTo", document.getElementById("my-due-to").value);
  try { renderMyCourses(await loadAssignments(params.toString())); } catch (error) { showMessage(error.message, "error"); }
});
document.getElementById("reset-my-filters").addEventListener("click", async () => {
  document.getElementById("employee-filters").reset(); renderMyCourses(await loadAssignments());
});

document.getElementById("new-course-button").addEventListener("click", () => showCourseForm());
document.getElementById("cancel-course-form").addEventListener("click", () => document.getElementById("course-form").classList.add("hidden"));
document.getElementById("course-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = Number(document.getElementById("course-id").value);
  const body = { id, title: document.getElementById("course-title").value, description: document.getElementById("course-description").value, category: document.getElementById("course-category").value, durationHours: Number(document.getElementById("course-duration").value), isMandatory: document.getElementById("course-mandatory").checked, isActive: document.getElementById("course-active").checked };
  try {
    const data = await apiRequest("courses.php", { method: id ? "PUT" : "POST", body });
    document.getElementById("course-form").classList.add("hidden"); await refreshAcademyData(data.message);
  } catch (error) { showMessage(error.message, "error"); }
});

document.getElementById("courses-table").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-course-action]");
  if (!button) return;
  const course = state.courses.find((item) => item.id === Number(button.dataset.id));
  if (button.dataset.courseAction === "edit") { showCourseForm(course); return; }
  const prompts = { deactivate: "Disattivare questo corso?", delete: "Eliminare definitivamente questo corso?" };
  if (!confirm(prompts[button.dataset.courseAction])) return;
  try {
    const method = button.dataset.courseAction === "delete" ? "DELETE" : "PUT";
    const body = button.dataset.courseAction === "delete" ? { id: course.id } : { id: course.id, action: "deactivate" };
    const data = await apiRequest("courses.php", { method, body }); await refreshAcademyData(data.message);
  } catch (error) { showMessage(error.message, "error"); }
});

document.getElementById("catalog-filters").addEventListener("submit", async (event) => {
  event.preventDefault();
  const params = new URLSearchParams();
  const category = document.getElementById("catalog-category").value;
  const active = document.getElementById("catalog-active").value;
  if (category) params.set("category", category); if (active !== "") params.set("active", active);
  try { renderCatalog((await apiRequest(`courses.php?${params}`)).courses); } catch (error) { showMessage(error.message, "error"); }
});

document.getElementById("new-assignment-button").addEventListener("click", () => showAssignmentForm());
document.getElementById("cancel-assignment-form").addEventListener("click", () => document.getElementById("assignment-form").classList.add("hidden"));
document.getElementById("assignment-status").addEventListener("change", (event) => {
  document.getElementById("assignment-completed").required = event.target.value === "completed";
});
document.getElementById("assignment-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = Number(document.getElementById("assignment-id").value);
  const body = { id, courseId: Number(document.getElementById("assignment-course").value), employeeId: Number(document.getElementById("assignment-employee").value), assignedOn: document.getElementById("assignment-date").value, dueOn: document.getElementById("assignment-due").value, status: id ? document.getElementById("assignment-status").value : "assigned", completedOn: document.getElementById("assignment-completed").value || null };
  try {
    const data = await apiRequest("assignments.php", { method: id ? "PUT" : "POST", body });
    document.getElementById("assignment-form").classList.add("hidden"); await refreshAcademyData(data.message);
  } catch (error) { showMessage(error.message, "error"); }
});

document.getElementById("assignments-table").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-assignment-action]");
  if (!button) return;
  const assignment = state.assignments.find((item) => item.id === Number(button.dataset.id));
  if (button.dataset.assignmentAction === "edit") { showAssignmentForm(assignment); return; }
  if (!confirm("Annullare questa assegnazione?")) return;
  try {
    const data = await apiRequest("assignments.php", { method: "PUT", body: { id: assignment.id, action: "cancel" } });
    await refreshAcademyData(data.message);
  } catch (error) { showMessage(error.message, "error"); }
});

document.getElementById("assignment-filters").addEventListener("submit", async (event) => {
  event.preventDefault();
  const params = new URLSearchParams();
  [["filter-employee", "employeeId"], ["filter-course", "courseId"], ["filter-category", "category"], ["filter-status", "status"]].forEach(([id, key]) => { if (document.getElementById(id).value) params.set(key, document.getElementById(id).value); });
  try { renderAssignments((await apiRequest(`assignments.php?${params}`)).assignments); } catch (error) { showMessage(error.message, "error"); }
});

document.getElementById("statistics-filters").addEventListener("submit", async (event) => {
  event.preventDefault();
  const params = new URLSearchParams();
  [["stats-month", "month"], ["stats-category", "category"], ["stats-employee", "employeeId"]].forEach(([id, key]) => { if (document.getElementById(id).value) params.set(key, document.getElementById(id).value); });
  try { renderStatistics((await apiRequest(`statistics.php?${params}`)).statistics); } catch (error) { showMessage(error.message, "error"); }
});
document.getElementById("reset-stats").addEventListener("click", () => { document.getElementById("statistics-filters").reset(); renderStatistics(state.statistics); });
document.getElementById("close-dialog").addEventListener("click", () => document.getElementById("course-dialog").close());

(async function init() {
  try {
    state.user = (await apiRequest("me.php")).user;
    document.getElementById("user-name").textContent = state.user.name;
    document.getElementById("user-role").textContent = state.user.role === "academy" ? "Referente Academy" : "Dipendente";
    document.getElementById("welcome-title").textContent = `Bentornato, ${state.user.firstName}`;

    if (state.user.role === "academy") {
      document.querySelectorAll(".academy-only").forEach((item) => item.classList.remove("hidden"));
      document.querySelector('[data-section="my-courses"]').classList.add("hidden");
      await loadAcademyData();
    } else {
      await loadAssignments();
      renderMyCourses();
    }
    renderOverview();
  } catch (error) {
    if (error.status === 401) { window.location.href = "index.html"; return; }
    showMessage(error.message, "error");
  }
})();
