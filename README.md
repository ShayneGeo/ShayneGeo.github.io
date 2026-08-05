# Shayne Magstadt website

This folder is ready for GitHub Pages. Upload the contents of this folder to the root of the `ShayneGeo.github.io` repository.

## Publish the update

Your public website is served from the `main` branch. If you upload this version to another branch such as `B10`, merge that branch into `main` before checking the public website. GitHub Pages may take a few minutes to refresh after the merge; use `Ctrl+F5` to perform a hard refresh.

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

The filenames and links are case-sensitive. Do not rename the PDF files unless the matching links in `index.html` are updated at the same time.
