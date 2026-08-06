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

  if (nextTab === "marbles") {
    window.requestAnimationFrame(projectSphere);
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
const marbleStage = document.getElementById("marble-stage");
const galleryStatus = document.getElementById("gallery-status");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxClose = document.getElementById("lightbox-close");
const previousButton = document.getElementById("lightbox-previous");
const nextButton = document.getElementById("lightbox-next");
const imageExtensions = /\.(avif|gif|jpe?g|png|webp)$/i;
let marbleImages = [];
let activeImageIndex = 0;
let sphereNodes = [];
let spherePoints = [];
let sphereRx = -0.18;
let sphereRy = 0.5;
let sphereRz = 0.08;
let sphereDragging = false;
let sphereMoved = false;
let sphereLastX = 0;
let sphereLastY = 0;
let sphereStartX = 0;
let sphereStartY = 0;
let sphereDownIndex = -1;
let sphereAutoSpin = true;
let sphereResumeTimer = 0;
let nextSpinChange = 0;
let spinX = 0.0012;
let spinY = 0.0042;
let spinZ = 0.0008;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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
    button.dataset.marbleIndex = String(index);
    button.setAttribute("aria-label", `Enlarge ${image.alt}`);

    const img = document.createElement("img");
    img.src = image.src;
    img.alt = image.alt;
    img.loading = index < 2 ? "eager" : "lazy";
    img.decoding = "async";

    button.append(img);
    button.addEventListener("click", (event) => {
      if (event.detail !== 0) return;
      pauseThenResumeSphere();
      openLightbox(index);
    });
    gallery.append(button);
  });

  sphereNodes = [...gallery.querySelectorAll(".marble-tile")];
  spherePoints = makeSpherePoints(sphereNodes.length);
  window.requestAnimationFrame(projectSphere);
}

function makeSpherePoints(count) {
  if (count <= 1) return [{ x: 0, y: 0, z: 0 }];

  if (count === 2) {
    return [
      { x: -0.72, y: 0.28, z: 0.55 },
      { x: 0.72, y: -0.28, z: -0.55 }
    ];
  }

  const points = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let index = 0; index < count; index += 1) {
    const y = 1 - ((index + 0.5) / count) * 2;
    const radius = Math.sqrt(1 - y * y);
    const angle = goldenAngle * index;
    points.push({
      x: Math.cos(angle) * radius,
      y,
      z: Math.sin(angle) * radius
    });
  }

  return points;
}

function randomSpin(minimum, maximum) {
  const speed = minimum + Math.random() * (maximum - minimum);
  return Math.random() < 0.5 ? -speed : speed;
}

function randomizeSphereSpin() {
  spinX = randomSpin(0.00045, 0.0014);
  spinY = randomSpin(0.0025, 0.0052);
  spinZ = randomSpin(0.00025, 0.0012);
}

function pauseThenResumeSphere() {
  sphereAutoSpin = false;
  window.clearTimeout(sphereResumeTimer);
  sphereResumeTimer = window.setTimeout(() => {
    randomizeSphereSpin();
    sphereAutoSpin = true;
  }, 4000);
}

function projectSphere() {
  if (!marbleStage || !sphereNodes.length) return;

  const width = marbleStage.clientWidth;
  const height = marbleStage.clientHeight;
  if (!width || !height) return;

  const centerX = width / 2;
  const centerY = height / 2;
  const shortestSide = Math.min(width, height);
  const orbitRadius = shortestSide * (sphereNodes.length === 1 ? 0 : 0.31);
  const baseSize = Math.max(76, Math.min(158, shortestSide * (sphereNodes.length < 4 ? 0.23 : 0.17)));
  const depth = 3.2;
  const yawCos = Math.cos(sphereRy);
  const yawSin = Math.sin(sphereRy);
  const pitchCos = Math.cos(sphereRx);
  const pitchSin = Math.sin(sphereRx);
  const rollCos = Math.cos(sphereRz);
  const rollSin = Math.sin(sphereRz);
  const projected = [];

  spherePoints.forEach((point, index) => {
    const yawX = point.x * yawCos - point.z * yawSin;
    const yawZ = point.x * yawSin + point.z * yawCos;
    const pitchY = point.y * pitchCos - yawZ * pitchSin;
    const pitchZ = point.y * pitchSin + yawZ * pitchCos;
    const rollX = yawX * rollCos - pitchY * rollSin;
    const rollY = yawX * rollSin + pitchY * rollCos;
    const perspective = depth / (depth - pitchZ);

    projected.push({
      index,
      x: centerX + rollX * orbitRadius * perspective,
      y: centerY + rollY * orbitRadius * perspective,
      z: pitchZ,
      perspective
    });
  });

  projected
    .sort((first, second) => first.z - second.z)
    .forEach((item, order) => {
      const node = sphereNodes[item.index];
      if (!node) return;
      const size = baseSize * (0.76 + item.perspective * 0.28);
      const depthBrightness = 0.76 + ((item.z + 1) / 2) * 0.28;
      node.style.width = `${size}px`;
      node.style.height = `${size}px`;
      node.style.opacity = String(0.54 + ((item.z + 1) / 2) * 0.46);
      node.style.filter = `brightness(${depthBrightness})`;
      node.style.zIndex = String(order + 10);
      node.style.transform = `translate3d(${item.x - size / 2}px, ${item.y - size / 2}px, 0)`;
    });
}

function animateSphere(time) {
  const marblePanel = document.getElementById("panel-marbles");
  const canSpin = sphereAutoSpin && !sphereDragging && !reduceMotion.matches && marblePanel && !marblePanel.hidden;

  if (canSpin) {
    if (!nextSpinChange || time > nextSpinChange) {
      randomizeSphereSpin();
      nextSpinChange = time + 3200 + Math.random() * 2200;
    }
    sphereRx = Math.max(-1.35, Math.min(1.35, sphereRx + spinX));
    sphereRy += spinY;
    sphereRz += spinZ;
  }

  projectSphere();
  window.requestAnimationFrame(animateSphere);
}

marbleStage.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  sphereDragging = true;
  sphereMoved = false;
  sphereLastX = event.clientX;
  sphereLastY = event.clientY;
  sphereStartX = event.clientX;
  sphereStartY = event.clientY;
  const pressedMarble = event.target.closest?.(".marble-tile");
  sphereDownIndex = pressedMarble
    ? Number.parseInt(pressedMarble.dataset.marbleIndex, 10)
    : -1;
  sphereAutoSpin = false;
  window.clearTimeout(sphereResumeTimer);
  try {
    marbleStage.setPointerCapture(event.pointerId);
  } catch (error) {
    console.info("Pointer capture is not available.", error);
  }
});

marbleStage.addEventListener("pointermove", (event) => {
  if (!sphereDragging) return;
  const deltaX = event.clientX - sphereLastX;
  const deltaY = event.clientY - sphereLastY;
  if (Math.abs(event.clientX - sphereStartX) + Math.abs(event.clientY - sphereStartY) > 5) {
    sphereMoved = true;
  }
  sphereRy += deltaX * 0.008;
  sphereRx = Math.max(-1.35, Math.min(1.35, sphereRx - deltaY * 0.008));
  sphereRz += (deltaX - deltaY) * 0.0017;
  sphereLastX = event.clientX;
  sphereLastY = event.clientY;
  projectSphere();
});

function finishSphereDrag(event, cancelled = false) {
  if (!sphereDragging) return;
  const tappedIndex = !cancelled && !sphereMoved ? sphereDownIndex : -1;
  sphereDragging = false;
  sphereDownIndex = -1;
  try {
    marbleStage.releasePointerCapture(event.pointerId);
  } catch (error) {
    console.info("Pointer capture was already released.", error);
  }
  pauseThenResumeSphere();
  if (Number.isInteger(tappedIndex) && tappedIndex >= 0 && tappedIndex < marbleImages.length) {
    openLightbox(tappedIndex);
  }
  window.setTimeout(() => {
    sphereMoved = false;
  }, 0);
}

marbleStage.addEventListener("pointerup", (event) => finishSphereDrag(event));
marbleStage.addEventListener("pointercancel", (event) => finishSphereDrag(event, true));
window.addEventListener("resize", projectSphere);
randomizeSphereSpin();
window.requestAnimationFrame(animateSphere);

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

  const branch = "B13";
  const apiUrl =
    `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/` +
    `${encodeURIComponent(repository.repository)}/contents/MARBLES?ref=${encodeURIComponent(branch)}`;

  try {
    const githubImages = await readGitHubFolder(apiUrl);
    if (githubImages.length) renderGallery(githubImages);
  } catch (error) {
    console.info("Using the local marble list.", error);
  }
}

loadMarbles();
