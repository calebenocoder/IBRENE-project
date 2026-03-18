/**
 * IBRENE Social Preview Pre-renderer
 * 
 * Runs after `vite build`. Fetches all visible posts from Supabase and
 * generates a static HTML file per post at dist/evento/[slug]/index.html
 * with the correct OG / Twitter meta tags already embedded.
 *
 * Because Apache will serve dist/evento/[slug]/index.html when a browser or
 * social-media bot requests /evento/[slug], the correct meta-data is visible
 * to bots without any JavaScript execution required.
 */

import fs   from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUB_KEY;
const SITE_URL     = 'https://ibrene.com.br';
const FALLBACK_IMG = `${SITE_URL}/favicon.png`;

function slugify(title) {
    return title.toLowerCase().replace(/\s+/g, '-');
}

function escapeAttr(str = '') {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');
}

async function fetchPosts() {
    const url = `${SUPABASE_URL}/rest/v1/site_posts?select=title,subtitle,image_url,banner_image_url&visible=eq.true`;
    const res  = await fetch(url, {
        headers: {
            'apikey':        SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
    });
    if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status} ${res.statusText}`);
    return res.json();
}

async function main() {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('❌  VITE_SUPABASE_URL / VITE_SUPABASE_PUB_KEY env vars are missing.');
        process.exit(1);
    }

    const distDir   = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distDir, 'index.html');

    if (!fs.existsSync(indexPath)) {
        console.error('❌  dist/index.html not found. Run `npm run build` first.');
        process.exit(1);
    }

    // Strip any existing <title> so we can inject per-post ones
    const baseHtml = fs.readFileSync(indexPath, 'utf-8')
        .replace(/<title>[^<]*<\/title>/g, '');

    console.log('\n🔍  Fetching posts from Supabase…');
    const posts = await fetchPosts();
    console.log(`📄  ${posts.length} posts found.\n`);

    for (const post of posts) {
        const slug        = slugify(post.title);
        const title       = escapeAttr(`${post.title} | IBRENE`);
        const description = escapeAttr(post.subtitle || 'Confira este evento na IBRENE');
        const image       = post.banner_image_url || post.image_url || FALLBACK_IMG;
        const pageUrl     = `${SITE_URL}/evento/${encodeURIComponent(slug)}`;

        const metaTags = `
    <title>${title}</title>
    <meta name="description"        content="${description}" />
    <meta property="og:type"        content="website" />
    <meta property="og:title"       content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image"       content="${image}" />
    <meta property="og:url"         content="${pageUrl}" />
    <meta name="twitter:card"        content="summary_large_image" />
    <meta name="twitter:title"       content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image"       content="${image}" />`;

        const html = baseHtml.replace('<head>', `<head>${metaTags}`);

        const outDir = path.join(distDir, 'evento', slug);
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, 'index.html'), html);

        console.log(`  ✓  /evento/${slug}`);
    }

    console.log('\n✅  Pre-rendering complete.\n');
}

main().catch(err => {
    console.error('❌  Pre-render failed:', err.message);
    process.exit(1);
});
