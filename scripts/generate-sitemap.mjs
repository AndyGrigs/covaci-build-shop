import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DIST = 'dist';
// Приватні сторінки закриті через X-Robots-Tag, у sitemap їх не буде
const PRIVATE = new Set(['/korzina', '/kabinet', '/vkhod', '/registraciya', '/admin']);

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      return name === 'assets' || name.startsWith('.') ? [] : htmlFiles(p);
    }
    return p.endsWith('.html') ? [p] : [];
  });
}

const escapeXml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const urls = [];
for (const file of htmlFiles(DIST)) {
  const rel = relative(DIST, file).split(sep).join('/');
  const path = '/' + rel.replace(/\.html$/, '');
  const route = path === '/index' ? '/' : path;

  const html = readFileSync(file, 'utf8');
  const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];

  if (canonical) {
    urls.push(canonical);
  } else if (!PRIVATE.has(route)) {
    console.warn(`Sitemap: ${route} пропущено, бо немає canonical (немає <Seo>?)`);
  }
}

urls.sort();

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) => `  <url><loc>${escapeXml(u)}</loc></url>`).join('\n') +
  '\n</urlset>\n';

writeFileSync(join(DIST, 'sitemap.xml'), xml);
console.log(`Sitemap: ${urls.length} URL`);
