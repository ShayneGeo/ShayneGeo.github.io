# Shayne Magstadt website

This folder is ready for GitHub Pages. Upload the contents of this folder to the root of the `ShayneGeo.github.io` repository.

## Publish the update

Upload **everything inside this folder** to the root of the branch selected under **Settings → Pages → Deploy from a branch**. The `index.html`, `papers`, `MARBLES`, and `assets` items must all be at the top level of that branch. GitHub Pages may take a few minutes to refresh; use `Ctrl+F5` for a hard refresh.

## Update the bio

Open `index.html`, find the `<div class="bio-text">` section, and edit the two paragraphs inside it.

To replace the placeholder photo, overwrite `assets/profile-placeholder.webp` with a new image using the same filename. If the new file is a JPG or PNG instead, also update the photo filename in `index.html`.

## Add marble photographs

Create one folder per marble inside `MARBLES` and add the photograph or photographs to that folder. For example:

`MARBLES/Blue Galaxy/blue-galaxy.jpg`

Once the public GitHub Pages site is live, the gallery reads the public `MARBLES` folder and displays supported JPG, JPEG, PNG, WebP, GIF, and AVIF files automatically. The photographs rotate in a 3D sphere; visitors can drag or swipe to rotate it and tap a marble to enlarge the photograph.

For local offline testing, also add the image path to `marbles.js` by following the included example.

## Update a paper

The PDFs are inside `papers`. Replace a PDF while keeping the same filename to update the corresponding “View full paper” link. Edit the matching research card in `index.html` if its title or summary also changes.

The filenames and links are case-sensitive. This package uses the exact filenames already referenced by the live site (`AerialFirefighting_2020.pdf`, `DraftingAI_8_4_2026.pdf`, `NIROPS.pdf`, `HFT.pdf`, `DeepLearningDrops.pdf`, `retention.pdf`, `BlackBearBark.pdf`, and `Dunes.pdf`). Do not rename them unless the matching links in `index.html` are updated at the same time.
