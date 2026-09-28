# UC Davis Research Group Website

Static website for the Digital System Design-Test-Verification and Fault Tolerance Research Group at UC Davis.

## Local Development

Install dependencies:

```sh
npm install
```

Start the local server:

```sh
npm start
```

The site is served by `serve`. If the default port is unavailable, run:

```sh
npm start -- -l tcp://127.0.0.1:5000
```

## Pages

- `index.html` - homepage
- `people.html` - lab members
- `projects.html` - current and past projects
- `publication.html` - publications
- `404.html` - not found page

## Deployment Notes

This repository is ready for static hosting, including GitHub Pages. The included
GitHub Actions workflow publishes the static files from `main`.

Current SEO defaults assume the GitHub Pages URL:

```txt
https://uranuskh27.github.io/research-group-website/
```

If the site moves to a custom domain, update the URLs in:

- `robots.txt`
- `sitemap.xml`
- canonical and Open Graph meta tags in each HTML page
