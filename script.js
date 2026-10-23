
const NPOINT_URL = "https://api.npoint.io/43fc4e3e9a803d3cbaef";
const ADMIN_PASSWORD = "Amexon13";

const postsElement = document.getElementById("posts");
const statusElement = document.getElementById("status");
const loginForm = document.getElementById("loginForm");
const postForm = document.getElementById("postForm");
const exportArea = document.getElementById("exportArea");
const jsonOutput = document.getElementById("jsonOutput");
const adminPosts = document.getElementById("adminPosts");

const adminPanel = document.getElementById("adminPanel");
const adminOverlay = document.getElementById("adminOverlay");
const articleOverlay = document.getElementById("articleOverlay");

let posts = [];
let loggedIn = false;
let articleHistoryOpen = false;

function renderPosts() {
  postsElement.replaceChildren();

  if (!posts.length) {
    statusElement.textContent = "Brak artykułów.";
    renderAdminPosts();
    return;
  }

  statusElement.textContent = `Liczba artykułów: ${posts.length}`;

  for (const post of posts) {
    const article = document.createElement("article");
    article.className = "post";
    article.tabIndex = 0;
    article.setAttribute("role", "button");
    article.setAttribute("aria-label", `Otwórz artykuł: ${post.title || ""}`);

    const image = document.createElement("img");
    image.src = post.image || "";
    image.alt = post.title || "Zdjęcie artykułu";
    image.loading = "lazy";
    image.addEventListener("error", () => image.remove());

    const body = document.createElement("div");
    body.className = "post-body";

    const date = document.createElement("span");
date.className = "post-date";

const parsedDate = post.date ? new Date(post.date) : null;

date.textContent =
  parsedDate && !Number.isNaN(parsedDate.getTime())
    ? parsedDate.toLocaleDateString("pl-PL")
    : "Aktualność";

const title = document.createElement("h3");
title.textContent = post.title || "Bez tytułu";

body.append(date, title);
    article.append(image, body);

    article.addEventListener("click", () => openArticle(post));
    article.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openArticle(post);
      }
    });

    postsElement.append(article);
  }

  renderAdminPosts();
}

async function loadPosts() {
  statusElement.textContent = "Ładowanie artykułów...";

  try {
    const response = await fetch(NPOINT_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Błąd HTTP ${response.status}`);
    }

    const data = await response.json();
    const loadedPosts = Array.isArray(data) ? data : data.posts;

    if (!Array.isArray(loadedPosts)) {
      throw new Error("JSON musi zawierać tablicę posts.");
    }

    posts = loadedPosts;
    renderPosts();
  } catch (error) {
    statusElement.textContent = `Nie udało się pobrać postów: ${error.message}`;
  }
}

function openArticle(post) {
  document.getElementById("articleCategory").textContent = post.category || "Inne";
  document.getElementById("articleTitle").textContent = post.title || "Bez tytułu";

  const image = document.getElementById("articleImage");
  image.src = post.image || "";
  image.alt = post.title || "Zdjęcie artykułu";
  image.hidden = !post.image;

  image.onerror = () => {
    image.hidden = true;
  };

  document.getElementById("articleContent").textContent = post.content || "";

  articleOverlay.classList.add("open");
  articleOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("article-open");

  if (!articleHistoryOpen) {
    history.pushState({ frontPogodyArticle: true }, "");
    articleHistoryOpen = true;
  }
}

function closeArticle() {
  articleOverlay.classList.remove("open");
  articleOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("article-open");
  articleHistoryOpen = false;
}

document.getElementById("closeArticle").addEventListener("click", () => {
  if (articleHistoryOpen) {
    history.back();
  } else {
    closeArticle();
  }
});

function openAdmin() {
  adminPanel.classList.add("open");
  adminOverlay.classList.add("open");
  adminPanel.setAttribute("aria-hidden", "false");
  document.body.classList.add("admin-open");
}

function closeAdmin() {
  adminPanel.classList.remove("open");
  adminOverlay.classList.remove("open");
  adminPanel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("admin-open");
}

function toggleAdmin() {
  if (adminPanel.classList.contains("open")) {
    closeAdmin();
  } else {
    openAdmin();
  }
}

document.addEventListener("keydown", event => {
  if (event.key === "F2") {
    event.preventDefault();
    toggleAdmin();
  }

  if (event.key === "Escape") {
    closeAdmin();

    if (articleOverlay.classList.contains("open")) {
      closeArticle();
    }
  }
});

document.getElementById("closeAdmin").addEventListener("click", closeAdmin);
adminOverlay.addEventListener("click", closeAdmin);
document.getElementById("refresh").addEventListener("click", loadPosts);

loginForm.addEventListener("submit", event => {
  event.preventDefault();

  if (document.getElementById("password").value !== ADMIN_PASSWORD) {
    alert("Nieprawidłowe hasło.");
    return;
  }

  loggedIn = true;
  loginForm.hidden = true;
  postForm.hidden = false;
  exportArea.hidden = false;
  updateExport();
  renderAdminPosts();
});

function updateExport() {
  jsonOutput.value = JSON.stringify({ posts }, null, 2);
}

postForm.addEventListener("submit", event => {
  event.preventDefault();

  if (!loggedIn) return;

  const post = {
    title: document.getElementById("title").value.trim(),
    image: document.getElementById("image").value.trim(),
    category: document.getElementById("category").value,
    content: document.getElementById("content").value.trim(),
    date: new Date().toISOString()
  };

  if (!post.title || !post.image || !post.content) {
    alert("Uzupełnij wszystkie pola.");
    return;
  }

  posts.unshift(post);
  updateExport();
  renderPosts();
  postForm.reset();

  alert("Wpis dodany do podglądu. Skopiuj JSON i zaktualizuj dokument na npoint.io, aby opublikować go dla wszystkich.");
});

function renderAdminPosts() {
  adminPosts.replaceChildren();

  if (!loggedIn) return;

  const heading = document.createElement("h3");
  heading.textContent = "Zarządzaj wpisami";
  adminPosts.append(heading);

  posts.forEach((post, index) => {
    const item = document.createElement("div");
    item.className = "admin-post";

    const title = document.createElement("h4");
    title.textContent = post.title || "Bez tytułu";

    const remove = document.createElement("button");
    remove.className = "secondary";
    remove.type = "button";
    remove.textContent = "Usuń wpis";

    remove.addEventListener("click", () => {
      if (!loggedIn) return;
      if (!confirm(`Usunąć wpis „${post.title}” z przygotowanego JSON-a?`)) return;

      posts.splice(index, 1);
      updateExport();
      renderPosts();
    });

    item.append(title, remove);
    adminPosts.append(item);
  });
}

document.getElementById("copyJson").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(jsonOutput.value);
    alert("JSON skopiowany.");
  } catch {
    jsonOutput.focus();
    jsonOutput.select();
    alert("Zaznaczony JSON skopiuj ręcznie.");
  }
});

document.getElementById("logout").addEventListener("click", () => {
  loggedIn = false;
  postForm.hidden = true;
  exportArea.hidden = true;
  loginForm.hidden = false;
  document.getElementById("password").value = "";
  adminPosts.replaceChildren();
});

window.addEventListener("popstate", () => {
  closeArticle();
});

loadPosts();
