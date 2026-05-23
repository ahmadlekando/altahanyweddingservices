import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/#services', priority: '0.8', changefreq: 'weekly' },
  { path: '/#packages', priority: '0.8', changefreq: 'weekly' },
  { path: '/#gallery', priority: '0.7', changefreq: 'weekly' },
  { path: '/#about', priority: '0.7', changefreq: 'monthly' },
  { path: '/#contact', priority: '0.6', changefreq: 'monthly' },
  { path: '/#booking', priority: '0.9', changefreq: 'weekly' },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};

    // Get site URL from settings or body
    let siteUrl = body.site_url || '';
    if (!siteUrl) {
      const { data: s } = await supabase.from('settings').select('value').eq('key', 'site_url').maybeSingle();
      siteUrl = s?.value || 'https://altahany.com';
    }
    siteUrl = siteUrl.replace(/\/$/, '');

    const now = new Date().toISOString().split('T')[0];
    const urls: { loc: string; lastmod: string; priority: string; changefreq: string }[] = [];

    // Static pages
    for (const page of STATIC_PAGES) {
      urls.push({ loc: `${siteUrl}${page.path}`, lastmod: now, priority: page.priority, changefreq: page.changefreq });
    }

    // Blog posts
    const { data: posts } = await supabase.from('posts').select('slug, updated_at').eq('status', 'published');
    for (const post of (posts || [])) {
      urls.push({
        loc: `${siteUrl}/blog/${post.slug}`,
        lastmod: (post.updated_at || now).split('T')[0],
        priority: '0.6',
        changefreq: 'monthly',
      });
    }

    // Wedding halls
    const { data: halls } = await supabase.from('wedding_halls').select('id, updated_at').eq('is_active', true);
    for (const hall of (halls || [])) {
      urls.push({
        loc: `${siteUrl}/halls/${hall.id}`,
        lastmod: now,
        priority: '0.7',
        changefreq: 'weekly',
      });
    }

    // Build XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    // Store in settings for retrieval
    await supabase.from('settings').upsert(
      { key: 'sitemap_xml', value: xml, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
    await supabase.from('settings').upsert(
      { key: 'sitemap_generated_at', value: new Date().toISOString(), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );

    return new Response(
      JSON.stringify({ success: true, url_count: urls.length, generated_at: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ success: false, message: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
