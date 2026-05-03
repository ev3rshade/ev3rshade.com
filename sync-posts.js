import { readdir, readFile, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const postsDir = resolve(__dirname, 'vfs/blog/posts');
const postsJson = resolve(__dirname, 'vfs/blog/posts.json');

const files = await readdir(postsDir);
const diskSlugs = files
    .filter(f => f.endsWith('.md'))
    .map(f => f.slice(0, -3));

const posts = JSON.parse(await readFile(postsJson, 'utf-8'));
const jsonSlugs = new Set(posts.map(p => p.slug));

const updated = posts.filter(post => diskSlugs.includes(post.slug));
const removed = posts.length - updated.length;

const datePattern = /^\d{4}-\d{2}-\d{2}/;
const added = [];
for (const slug of diskSlugs) {
    if (!jsonSlugs.has(slug)) {
        const dateMatch = slug.match(datePattern);
        updated.push({
            slug,
            title: slug,
            date: dateMatch ? dateMatch[0] : '',
            description: '',
        });
        added.push(slug);
    }
}

updated.sort((a, b) => b.date.localeCompare(a.date));

await writeFile(postsJson, JSON.stringify(updated, null, 4) + '\n');

if (removed > 0) console.log(`Removed ${removed} post(s) with no matching .md file.`);
if (added.length > 0) console.log(`Added ${added.length} new post(s): ${added.join(', ')}`);
if (removed === 0 && added.length === 0) console.log('posts.json is already in sync.');
