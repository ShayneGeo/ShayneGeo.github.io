# Shayne Magstadt website

This folder is ready for GitHub Pages. Upload the contents of this folder to the root of the `ShayneGeo.github.io` repository.

## Update the bio

Open `index.html`, search for `FILL THIS SECTION OUT`, and replace that line with the bio text.

To replace the placeholder photo, overwrite `assets/profile-placeholder.webp` with a new image using the same filename. If the new file is a JPG or PNG instead, also update the photo filename in `index.html`.

## Add marble photographs

Create one folder per marble inside `MARBLES` and add the photograph or photographs to that folder. For example:

`MARBLES/Blue Galaxy/blue-galaxy.jpg`

Once the public GitHub Pages site is live, the gallery reads the public `MARBLES` folder and displays supported JPG, JPEG, PNG, WebP, GIF, and AVIF files automatically.

For local offline testing, also add the image path to `marbles.js` by following the included example.

## Update a paper

The PDFs are inside `papers`. Replace a PDF while keeping the same filename to update the corresponding “View full paper” link. Edit the matching research card in `index.html` if its title or summary also changes.
