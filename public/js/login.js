// --- Gestion du formulaire de connexion ---
const loginForm = document.getElementById("loginForm");
loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault(); // Empêche le rechargement de la page

    // Récupère les données saisies dans le formulaire
    const fd = new FormData(loginForm);
    const payload = {
        email: fd.get("email"),
        password: fd.get("password"),
    };

    try {
        // Envoie une requête POST au serveur pour tenter la connexion
        const res = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            credentials: "same-origin",
        });
        const data = await res.json();

        // Si la connexion réussit, on sauvegarde le nom et on redirige
        if (data.ok) {
            localStorage.setItem("nom", data.user?.nom || "");
            window.location.assign(data.redirect || "/"); // Redirection après login
        } else {
            alert(data.message || "Erreur de connexion");
        }
    } catch {
        alert("Erreur réseau"); // Gestion d’une erreur de communication
    }
});

// --- Affichage / masquage du formulaire d’inscription ---
const toggle = document.getElementById("toggleRegister");
const registerForm = document.getElementById("registerForm");
toggle?.addEventListener("click", (e) => {
    e.preventDefault();

    // Bascule entre affiché / caché
    if (!registerForm) return;
    registerForm.style.display =
        (registerForm.style.display === "none" || registerForm.style.display === "")
            ? "block" : "none";

    // Si affiché, défile la page jusqu’au formulaire
    if (registerForm.style.display === "block")
        registerForm.scrollIntoView({ behavior: "smooth" });
});

// --- Gestion du formulaire d’inscription ---
registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault(); // Empêche le rechargement de la page

    // Récupère les champs du formulaire
    const fd = new FormData(registerForm);
    const payload = {
        nom: fd.get("nom"),
        email: fd.get("email"),
        password: fd.get("password"),
        confirmPassword: fd.get("confirmPassword"),
    };

    try {
        // Envoie la requête POST au serveur pour créer un compte
        const res = await fetch("/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = await res.json();

        // Si succès, redirige l’utilisateur ; sinon affiche l’erreur
        if (data.ok) {
            window.location.assign(data.redirect || "/home.ejs");
        } else {
            alert(data.message || "Erreur d'inscription");
            console.log(data.errors || data); // Log utile en dev
        }
    } catch {
        alert("Erreur réseau");
    }
});
