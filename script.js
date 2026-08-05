const tabs = [...document.querySelectorAll("[data-tab]")];
const panels = [...document.querySelectorAll("[data-panel]")];
const validTabs = new Set(tabs.map((tab) => tab.dataset.tab));

function activateTab(name, updateHistory = true) {
  const nextTab = validTabs.has(name) ? name : "bio";

  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === nextTab;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });

  panels.forEach((panel) => {
    const isActive = panel.dataset.panel === nextTab;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });

  if (updateHistory && window.location.hash !== `#${nextTab}`) {
    window.history.pushState({ tab: nextTab }, "", `#${nextTab}`);
  }

  window.scrollTo({ top: 0, behavior: "instant" });
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateTab(tab.dataset.tab));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let targetIndex = index;
    if (event.key === "ArrowLeft") targetIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "ArrowRight") targetIndex = (index + 1) % tabs.length;
    if (event.key === "Home") targetIndex = 0;
    if (event.key === "End") targetIndex = tabs.length - 1;
    tabs[targetIndex].focus();
    activateTab(tabs[targetIndex].dataset.tab);
  });
});

document.querySelector(".wordmark").addEventListener("click", (event) => {
  event.preventDefault();
  activateTab("bio");
});

window.addEventListener("popstate", () => {
  activateTab(window.location.hash.slice(1), false);
});

const initialTab = window.location.hash.slice(1);
activateTab(validTabs.has(initialTab) ? initialTab : "bio", false);

const gallery = document.getElementById("marble-grid");
const galleryStatus = document.getElementById("gallery-status");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxClose = document.getElementById("lightbox-close");
const previousButton = document.getElementById("lightbox-previous");
const nextButton = document.getElementById("lightbox-next");
const imageExtensions = /\.(avif|gif|jpe?g|png|webp)$/i;
let marbleImages = [];
let activeImageIndex = 0;

function humanizeFilename(name) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeImages(images) {
  const seen = new Set();
  return images
    .filter((image) => image && image.src && imageExtensions.test(image.src))
    .filter((image) => {
      if (seen.has(image.src)) return false;
      seen.add(image.src);
      return true;
    })
    .map((image) => ({
      src: image.src,
      alt: image.alt || `${humanizeFilename(image.src.split("/").pop())} glass marble`
    }));
}

function renderGallery(images) {
  marbleImages = normalizeImages(images);
  gallery.replaceChildren();
  galleryStatus.hidden = marbleImages.length > 0;

  marbleImages.forEach((image, index) => {
    const button = document.createElement("button");
    button.className = "marble-tile";
    button.type = "button";
    button.setAttribute("aria-label", `Enlarge ${image.alt}`);

    const img = document.createElement("img");
    img.src = image.src;
    img.alt = image.alt;
    img.loading = index < 2 ? "eager" : "lazy";
    img.decoding = "async";

    button.append(img);
    button.addEventListener("click", () => openLightbox(index));
    gallery.append(button);
  });
}

function updateLightbox() {
  const image = marbleImages[activeImageIndex];
  if (!image) return;
  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;
  const multipleImages = marbleImages.length > 1;
  previousButton.hidden = !multipleImages;
  nextButton.hidden = !multipleImages;
}

function openLightbox(index) {
  activeImageIndex = index;
  updateLightbox();
  lightbox.hidden = false;
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.documentElement.classList.add("lightbox-open");
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.hidden = true;
  document.documentElement.classList.remove("lightbox-open");
}

function moveLightbox(direction) {
  activeImageIndex = (activeImageIndex + direction + marbleImages.length) % marbleImages.length;
  updateLightbox();
}

lightboxClose.addEventListener("click", closeLightbox);
previousButton.addEventListener("click", () => moveLightbox(-1));
nextButton.addEventListener("click", () => moveLightbox(1));
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
lightbox.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft" && marbleImages.length > 1) moveLightbox(-1);
  if (event.key === "ArrowRight" && marbleImages.length > 1) moveLightbox(1);
});

function getGitHubRepository() {
  const host = window.location.hostname.toLowerCase();
  if (!host.endsWith(".github.io")) return null;
  const owner = host.slice(0, -".github.io".length);
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const repository = pathParts.length ? pathParts[0] : `${owner}.github.io`;
  return { owner, repository };
}

async function readGitHubFolder(apiUrl) {
  const response = await fetch(apiUrl, {
    headers: { Accept: "application/vnd.github+json" }
  });
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
  const entries = await response.json();
  if (!Array.isArray(entries)) return [];

  const images = entries
    .filter((entry) => entry.type === "file" && imageExtensions.test(entry.name))
    .map((entry) => ({
      src: entry.download_url,
      alt: `${humanizeFilename(entry.name)} glass marble`
    }));

  const childFolders = entries.filter((entry) => entry.type === "dir");
  const nestedImages = await Promise.all(
    childFolders.map((folder) => readGitHubFolder(folder.url))
  );

  return images.concat(...nestedImages);
}

async function loadMarbles() {
  const localImages = normalizeImages(window.LOCAL_MARBLES || []);
  renderGallery(localImages);

  const repository = getGitHubRepository();
  if (!repository) return;

  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repository)}/contents/MARBLES`;

  try {
    const githubImages = await readGitHubFolder(apiUrl);
    if (githubImages.length) renderGallery(githubImages);
  } catch (error) {
    console.info("Using the local marble list.", error);
  }
}

loadMarbles();
