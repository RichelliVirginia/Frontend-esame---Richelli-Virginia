const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const messageBox = document.getElementById('message');
const passwordInput = document.getElementById('register-password');
const confirmPasswordInput = document.getElementById('register-confirm-password');
const passwordHelp = document.getElementById('password-help');

function showMessage(message, type = 'error') {
    messageBox.textContent = message;
    messageBox.className = `message message-${type}`;
}

function clearMessage() {
    messageBox.textContent = '';
    messageBox.className = 'message hidden';
}

function validateMatchingPasswords() {
    if (confirmPasswordInput.value === '') {
        passwordHelp.textContent = '';
        confirmPasswordInput.setCustomValidity('');
        return true;
    }

    const passwordsMatch = passwordInput.value === confirmPasswordInput.value;

    passwordHelp.textContent = passwordsMatch
        ? 'Le password coincidono.'
        : 'Le password non coincidono.';
    passwordHelp.className = passwordsMatch ? 'valid-text' : 'invalid-text';
    confirmPasswordInput.setCustomValidity(
        passwordsMatch ? '' : 'Le password non coincidono.'
    );

    return passwordsMatch;
}

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers ?? {})
        },
        ...options
    });

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error('Il server non ha restituito una risposta JSON valida.');
    }

    if (!response.ok) {
        throw new Error(data.message ?? 'Si è verificato un errore.');
    }

    return data;
}

passwordInput.addEventListener('input', validateMatchingPasswords);
confirmPasswordInput.addEventListener('input', validateMatchingPasswords);

registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage();

    if (!validateMatchingPasswords() || !registerForm.reportValidity()) {
        return;
    }

    const payload = {
        name: document.getElementById('register-name').value.trim(),
        email: document.getElementById('register-email').value.trim(),
        password: passwordInput.value,
        confirmPassword: confirmPasswordInput.value,
        isAdmin: document.getElementById('register-admin').checked
    };

    try {
        const data = await apiRequest('register.php', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        showMessage(data.message, 'success');
        registerForm.reset();
        passwordHelp.textContent = '';
    } catch (error) {
        showMessage(error.message);
    }
});

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage();

    const payload = {
        email: document.getElementById('login-email').value.trim(),
        password: document.getElementById('login-password').value
    };

    try {
        await apiRequest('login.php', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        window.location.href = 'dashboard.html';
    } catch (error) {
        showMessage(error.message);
    }
});

(async function redirectIfAlreadyLoggedIn() {
    try {
        const response = await fetch(`${API_BASE_URL}/me.php`, {
            credentials: 'include'
        });

        if (response.ok) {
            window.location.href = 'dashboard.html';
        }
    } catch {
        // Il backend potrebbe non essere ancora avviato.
    }
})();
