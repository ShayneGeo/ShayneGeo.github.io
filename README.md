# Shayne Magstadt Portfolio

This site is ready for GitHub Pages. Open the `ShayneGeo.github.io` repository, switch to the `main` branch, and upload **everything inside this folder** to the top level of the repository. Commit the changes and GitHub Pages will update the site.

## Add marbles

Add image files anywhere inside the `marble` folder, either directly or in individual subfolders:

```text
marble/
  blue-galaxy.jpg
  another-marble/
    photo.webp
```

Supported formats are JPG, JPEG, PNG, WebP, AVIF, and GIF. Commit the images to the `main` branch and the Marbles page will find and display them automatically. You do not need to edit the HTML.

The automatic gallery is set up for the public repository `ShayneGeo/ShayneGeo.github.io` on the `main` branch.

## Replace the portrait

Replace `assets/portrait-placeholder.jpg` with your own JPG using the same filename. No code changes are needed.

## Main files

- `index.html` contains the bio, education, research paper list, and marble page.
- `styles.css` controls the design and animated marble background.
- `script.js` controls the tabs, automatic marble gallery, and image viewer.
- `papers/` contains the research PDFs.
- `files/` contains the downloadable CV.

There is no build step or framework. GitHub Pages can serve these files directly.
