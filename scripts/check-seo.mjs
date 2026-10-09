import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === 'assets' ? [] : htmlFiles(p);
    return p.endsWith('.html') ? [p] : [];
  });
}

const problems = [];
for (const file of htmlFiles('dist')) {
  const html = readFileSync(file, 'utf8');

  if (html.includes('Unexpected Application Error')) {
    const msg = html.match(/<h3[^>]*>([^<]*)<\/h3>/)?.[1] ?? 'невідома помилка';
    problems.push(`${file}: замість сторінки зібрано екран помилки: ${msg}`);
    continue;
  }

  const titles = (html.match(/<title[\s>]/g) || []).length;
  if (titles !== 1) problems.push(`${file}: <title> x${titles}`);
}

if (problems.length) {
  console.error('SEO check failed:\n' + problems.join('\n'));
  process.exit(1);
}
console.log('SEO check passed');
