# GitHub Social Preview Asset

This folder contains the social preview / LinkedIn preview cover image for this repository.

## Purpose

`social-preview.png` is a portfolio-style cover image summarizing the project (Laravel 12 API +
React SPA, Sanctum auth, Admin Dashboard, Storefront, Cart, Checkout, Orders, Stock Management,
Coupons, Reports, Audit Logs) for use when this repository link is shared on GitHub, LinkedIn, or
other platforms that render Open Graph-style link previews.

It does not represent a live deployment, a demo environment, or any credentials, and it is not
part of the running application.

## Files

| File | Purpose |
| --- | --- |
| `social-preview.svg` | Editable vector source. Open/edit in any SVG-capable editor or text editor. |
| `render.html` | Minimal local HTML wrapper (inlines the SVG at a fixed 1280x640 viewport) used only to export the PNG. Not served by the app. |
| `social-preview.png` | Final raster export, 1280x640, PNG — the file to upload to GitHub. |

## How the PNG was generated

The PNG was exported locally with an already-installed Chrome browser in headless mode, so no new
build dependency was added to the project:

```
chrome --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1280,640 --screenshot="social-preview.png" "file:///<path-to>/render.html"
```

To update the design later: edit `social-preview.svg`, then re-run the command above (pointing at
this folder) to regenerate `social-preview.png`.

## How to upload it to GitHub

1. Go to the repository on GitHub: **Settings → General → Social preview**.
2. Click **Edit** and upload `docs/assets/social-preview/social-preview.png`.

GitHub recommends 1280x640; this image matches that exactly.
