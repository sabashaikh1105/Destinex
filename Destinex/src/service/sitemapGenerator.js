import { format } from "date-fns";
import { getTrips } from "./backendApi";

export async function generateSitemap() {
  try {
    const baseUrl = "https://destinex.com";
    const today = format(new Date(), "yyyy-MM-dd");

    const staticPages = [
      { url: "/", priority: "1.0", changefreq: "weekly" },
      { url: "/create-trip", priority: "0.9", changefreq: "weekly" },
      { url: "/my-trips", priority: "0.8", changefreq: "weekly" },
      { url: "/trip-stats", priority: "0.7", changefreq: "weekly" },
      { url: "/how-it-works", priority: "0.8", changefreq: "monthly" },
      { url: "/contact", priority: "0.7", changefreq: "monthly" },
      { url: "/terms", priority: "0.5", changefreq: "monthly" },
      { url: "/privacy", priority: "0.5", changefreq: "monthly" },
      { url: "/cookies", priority: "0.5", changefreq: "monthly" },
    ];

    const tripPages = [];
    const recentTrips = await getTrips();
    (Array.isArray(recentTrips) ? recentTrips : []).slice(0, 1000).forEach((trip) => {
      if (trip?.id) {
        tripPages.push({
          url: `/view-trip/${trip.id}`,
          priority: "0.6",
          changefreq: "monthly",
        });
      }
    });

    const allPages = [...staticPages, ...tripPages];
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    allPages.forEach((page) => {
      sitemap += "  <url>\n";
      sitemap += `    <loc>${baseUrl}${page.url}</loc>\n`;
      sitemap += `    <lastmod>${today}</lastmod>\n`;
      sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
      sitemap += `    <priority>${page.priority}</priority>\n`;
      sitemap += "  </url>\n";
    });

    sitemap += "</urlset>";
    return sitemap;
  } catch (error) {
    console.error("Error generating sitemap:", error);
    throw error;
  }
}

export async function scheduleSitemapUpdate() {
  try {
    await generateSitemap();
  } catch (error) {
    console.error("Failed to update sitemap:", error);
  }
}

