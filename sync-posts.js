import { readdir, readFile, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const postsDir = resolve(__dirname, 'blog/posts');
const postsJson = resolve(__dirname, 'blog/posts.json');

const files = await readdir(postsDir);
const existingSlugs = new Set(files
    .filter(f => f.endsWith('.md'))
    .map(f => f.slice(0, -3))
);

const posts = JSON.parse(await readFile(postsJson, 'utf-8'));
const updated = posts.filter(post => existingSlugs.has(post.slug));
const removed = posts.length - updated.length;

await writeFile(postsJson, JSON.stringify(updated, null, 4) + '\n');

if (removed > 0) {
    console.log(`Removed ${removed} post(s) with no matching .md file.`);
} else {
    console.log('posts.json is already in sync.');
}
