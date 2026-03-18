<?php
/**
 * Social Media Preview Proxy for IBRENE
 * 
 * Detects social media bots and injects post-specific meta tags server-side.
 * For regular users, it redirects to the normal React SPA.
 */

define('SUPABASE_URL', 'https://qgmligfworhykiybtgtc.supabase.co');
define('SUPABASE_KEY', 'sb_publishable_izDRo2TcsNqpFq1VvZg6Mw_A3Q11itP');
define('SITE_URL',    'https://ibrene.com.br');
define('SITE_NAME',   'IBRENE - Igreja Batista Regular Nacional em Eunápolis');
define('SITE_DESC',   'Bem-vindo à IBRENE. Acompanhe nossos eventos, avisos e cursos.');
define('SITE_IMAGE',  'https://ibrene.com.br/favicon.png');

// ── Bot detection ──────────────────────────────────────────────────────────────
function isBot(): bool {
    $ua = strtolower($_SERVER['HTTP_USER_AGENT'] ?? '');
    $bots = [
        'facebookexternalhit', 'facebot', 'twitterbot', 'whatsapp',
        'telegrambot', 'linkedinbot', 'slackbot', 'discordbot',
        'googlebot', 'bingbot', 'duckduckbot', 'ia_archiver',
        'applebot', 'semrushbot', 'ahrefsbot', 'rogerbot',
    ];
    foreach ($bots as $bot) {
        if (strpos($ua, $bot) !== false) return true;
    }
    return false;
}

// ── Fetch post from Supabase ───────────────────────────────────────────────────
function fetchPost(string $slug): ?array {
    // Slugs are built as title.toLowerCase().replace(/ /g, '-')
    // We query all visible posts and find the one that matches
    $url = SUPABASE_URL . '/rest/v1/site_posts?select=title,subtitle,image_url,banner_image_url&visible=eq.true';

    $ctx = stream_context_create([
        'http' => [
            'method'  => 'GET',
            'header'  => implode("\r\n", [
                'apikey: '        . SUPABASE_KEY,
                'Authorization: Bearer ' . SUPABASE_KEY,
                'Accept: application/json',
            ]),
            'timeout' => 5,
        ],
    ]);

    $raw = @file_get_contents($url, false, $ctx);
    if (!$raw) return null;

    $posts = json_decode($raw, true);
    if (!is_array($posts)) return null;

    foreach ($posts as $post) {
        $postSlug = strtolower(str_replace(' ', '-', $post['title'] ?? ''));
        if ($postSlug === $slug) return $post;
    }
    return null;
}

// ── Main logic ────────────────────────────────────────────────────────────────
$slug = $_GET['evento'] ?? '';

$title       = SITE_NAME;
$description = SITE_DESC;
$image       = SITE_IMAGE;
$pageUrl     = SITE_URL . (!empty($slug) ? '/?evento=' . urlencode($slug) : '/');

if ($slug && isBot()) {
    $post = fetchPost($slug);
    if ($post) {
        $title       = htmlspecialchars($post['title'], ENT_QUOTES) . ' | IBRENE';
        $description = htmlspecialchars($post['subtitle'] ?? SITE_DESC, ENT_QUOTES);
        $image       = $post['banner_image_url'] ?? $post['image_url'] ?? SITE_IMAGE;
    }
}

// For normal users with no slug, or non-bot traffic: output index.html directly
// For bots we still output the full page but with correct OG tags injected
$indexHtml = file_get_contents(__DIR__ . '/index.html');

// Inject meta tags right after <head>
$metaTags = <<<HTML

    <!-- Dynamic OG Tags injected by preview.php -->
    <title>{$title}</title>
    <meta property="og:title"       content="{$title}" />
    <meta property="og:description" content="{$description}" />
    <meta property="og:image"       content="{$image}" />
    <meta property="og:url"         content="{$pageUrl}" />
    <meta property="og:type"        content="website" />
    <meta name="twitter:card"        content="summary_large_image" />
    <meta name="twitter:title"       content="{$title}" />
    <meta name="twitter:description" content="{$description}" />
    <meta name="twitter:image"       content="{$image}" />
    <meta name="description"         content="{$description}" />
HTML;

// Inject after first <head> tag (remove the existing <title> first to avoid duplication)
$indexHtml = preg_replace('/<title>[^<]*<\/title>/', '', $indexHtml);
$indexHtml = str_replace('<head>', '<head>' . $metaTags, $indexHtml);

header('Content-Type: text/html; charset=utf-8');
echo $indexHtml;
