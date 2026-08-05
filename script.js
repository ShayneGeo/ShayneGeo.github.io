(() => {
  const pages = [...document.querySelectorAll('[data-page]')];
  const tabLinks = [...document.querySelectorAll('.tab-link')];
  const validPages = new Set(pages.map(page => page.dataset.page));

  function showPage(name, updateHash = true) {
    const next = validPages.has(name) ? name : 'bio';
    pages.forEach(page => {
      const active = page.dataset.page === next;
      page.hidden = !active;
      page.classList.toggle('active', active);
    });
    tabLinks.forEach(link => {
      const active = link.dataset.tab === next;
      link.classList.toggle('active', active);
      if (link.closest('nav')) {
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      }
    });
    document.body.classList.toggle('marble-mode', next === 'marbles');
    if (updateHash && location.hash !== `#${next}`) history.pushState(null, '', `#${next}`);
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    document.title = next === 'bio'
      ? 'Shayne Magstadt | Geospatial AI and Wildfire Research'
      : `${next === 'research' ? 'Research' : 'Marbles'} | Shayne Magstadt`;
  }

  tabLinks.forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    showPage(link.dataset.tab);
  }));
  addEventListener('popstate', () => showPage(location.hash.slice(1), false));
  showPage(location.hash.slice(1) || 'bio', false);

  const galleryElement = document.getElementById('marbleGallery');
  const statusElement = document.getElementById('galleryStatus');
  const imagePattern = /\.(avif|gif|jpe?g|png|webp)$/i;
  const localFallback = [
    { src: 'marble/blue-galaxy/blue-galaxy.webp', alt: 'Blue galaxy marble' },
    { src: 'marble/studio-spiral/studio-spiral.jpg', alt: 'Studio spiral marble' }
  ];
  let galleryImages = [];

  function imageLabel(path) {
    const filename = path.split('/').pop().replace(/\.[^.]+$/, '');
    return filename.replace(/[-_]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
  }

  async function loadImagesFromGitHub() {
    const branch = 'main';
    const response = await fetch(`https://api.github.com/repos/ShayneGeo/ShayneGeo.github.io/git/trees/${branch}?recursive=1`, {
      headers: { Accept: 'application/vnd.github+json' }
    });
    if (!response.ok) throw new Error('Could not read the marble folder');
    const data = await response.json();
    return data.tree
      .filter(item => item.type === 'blob' && item.path.startsWith('marble/') && imagePattern.test(item.path))
      .sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }))
      .map(item => ({
        src: `https://raw.githubusercontent.com/ShayneGeo/ShayneGeo.github.io/${branch}/${item.path.split('/').map(encodeURIComponent).join('/')}`,
        alt: imageLabel(item.path)
      }));
  }

  function renderGallery(images) {
    galleryImages = images;
    galleryElement.replaceChildren();
    images.forEach((image, index) => {
      const button = document.createElement('button');
      button.className = 'marble-item';
      button.type = 'button';
      button.setAttribute('aria-label', `Enlarge ${image.alt}`);
      const img = document.createElement('img');
      img.src = image.src;
      img.alt = image.alt;
      img.loading = index > 2 ? 'lazy' : 'eager';
      button.append(img);
      button.addEventListener('click', () => openLightbox(index, button));
      galleryElement.append(button);
    });
    statusElement.hidden = images.length > 0;
    if (!images.length) statusElement.textContent = 'Add JPG, PNG, or WebP images to the marble folder.';
  }

  async function initializeGallery() {
    try {
      const remoteImages = await loadImagesFromGitHub();
      renderGallery(remoteImages.length ? remoteImages : localFallback);
    } catch {
      renderGallery(localFallback);
    }
  }

  const lightbox = document.getElementById('lightbox');
  const lightboxImage = lightbox.querySelector('img');
  const closeButton = lightbox.querySelector('.lightbox-close');
  const previousButton = lightbox.querySelector('.previous');
  const nextButton = lightbox.querySelector('.next');
  let currentIndex = 0;
  let lastTrigger = null;

  function showLightboxImage(index) {
    currentIndex = (index + galleryImages.length) % galleryImages.length;
    const image = galleryImages[currentIndex];
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    const multiple = galleryImages.length > 1;
    previousButton.hidden = !multiple;
    nextButton.hidden = !multiple;
  }

  function openLightbox(index, trigger) {
    if (!galleryImages.length) return;
    lastTrigger = trigger;
    showLightboxImage(index);
    lightbox.hidden = false;
    document.body.classList.add('locked');
    closeButton.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.classList.remove('locked');
    lastTrigger?.focus();
  }

  closeButton.addEventListener('click', closeLightbox);
  previousButton.addEventListener('click', () => showLightboxImage(currentIndex - 1));
  nextButton.addEventListener('click', () => showLightboxImage(currentIndex + 1));
  lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
  addEventListener('keydown', event => {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') showLightboxImage(currentIndex - 1);
    if (event.key === 'ArrowRight') showLightboxImage(currentIndex + 1);
  });

  initializeGallery();
})();
