// Cloudflare Pages redirects static HTML files to extensionless URLs.
export function pagePath(pathname) {
 const path = pathname.replace(/\/$/, '') || '/';
 return /^\/(dashboard|admin|reset|demo|privacy)$/.test(path) ? path + '.html' : path;
}
