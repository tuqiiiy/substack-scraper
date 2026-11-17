import { Actor, log } from 'apify';
import { gotScraping } from 'got-scraping';

await Actor.init();

const input = (await Actor.getInput()) || {};
const {
    mode = 'categories',
    categories = ['technology', 'business', 'finance'],
    maxPublicationsPerCategory = 25,
    publicationUrls = [],
    scrapeLatestPosts = true,
    proxyConfiguration,
} = input;

const proxyConfig = proxyConfiguration ? await Actor.createProxyConfiguration(proxyConfiguration) : undefined;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Make an HTTP GET request with retry handling and optional proxy
 */
async function requestJson(url) {
    const proxyUrl = proxyConfig ? await proxyConfig.newUrl() : undefined;
    try {
        const response = await gotScraping({
            url,
            proxyUrl,
            headers: {
                'user-agent': USER_AGENT,
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
            },
            responseType: 'json',
            timeout: { request: 15000 },
            retry: { limit: 3 },
        });
        return response.body;
    } catch (error) {
        log.warning(`Failed to fetch JSON from ${url}: ${error.message}`);
        return null;
    }
}

/**
 * Fetch HTML page
 */
async function requestHtml(url) {
    const proxyUrl = proxyConfig ? await proxyConfig.newUrl() : undefined;
    try {
        const response = await gotScraping({
            url,
            proxyUrl,
            headers: {
                'user-agent': USER_AGENT,
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'accept-language': 'en-US,en;q=0.9',
            },
            timeout: { request: 15000 },
            retry: { limit: 2 },
        });
        return response.body;
    } catch (error) {
        log.debug(`Failed to fetch HTML from ${url}: ${error.message}`);
        return null;
    }
}

/**
 * Fetch Substack categories map
 */
async function getCategoriesMap() {
    log.info('Fetching Substack categories list...');
    const data = await requestJson('https://substack.com/api/v1/categories');
    const map = new Map();

    if (Array.isArray(data)) {
        for (const cat of data) {
            const slug = (cat.slug || '').toLowerCase();
            const name = (cat.name || '').toLowerCase();
            map.set(slug, cat);
            map.set(name, cat);
            if (cat.id) {
                map.set(String(cat.id), cat);
            }
        }
    }
    return map;
}

/**
 * Extract publication pricing plans
 */
function extractPricing(plans = []) {
    let monthlyPrice = null;
    let annualPrice = null;
    let currency = null;

    if (Array.isArray(plans)) {
        for (const plan of plans) {
            if (!plan || !plan.amount) continue;
            const amountFormatted = (plan.amount / 100).toFixed(2);
            const curr = (plan.currency || 'USD').toUpperCase();
            currency = curr;

            if (plan.interval === 'month' && !monthlyPrice) {
                monthlyPrice = `${amountFormatted} ${curr}/month`;
            } else if (plan.interval === 'year' && !annualPrice) {
                annualPrice = `${amountFormatted} ${curr}/year`;
            }
        }
    }

    return { monthlyPrice, annualPrice, currency };
}

/**
 * Fetch latest posts for a publication
 */
async function fetchLatestPosts(baseUrl, limit = 5) {
    const url = `${baseUrl.replace(/\/+$/, '')}/api/v1/posts?limit=${limit}`;
    const data = await requestJson(url);
    if (!data) return [];

    const postsList = Array.isArray(data) ? data : data.posts || [];
    return postsList.slice(0, limit).map((p) => {
        let likesCount = 0;
        if (p.reactions) {
            for (const count of Object.values(p.reactions)) {
                if (typeof count === 'number') likesCount += count;
            }
        }
        return {
            title: p.title || '',
            subtitle: p.subtitle || '',
            slug: p.slug || '',
            url: p.canonical_url || `${baseUrl.replace(/\/+$/, '')}/p/${p.slug}`,
            postDate: p.post_date || null,
            audience: p.audience || 'everyone',
            isPaidOnly: p.audience === 'only_paid',
            likesCount,
            commentsCount: p.comment_count || 0,
        };
    });
}

/**
 * Normalize and structure publication record
 */
async function processPublication(rawPub, categoryName = '') {
    const subdomain = rawPub.subdomain || '';
    const customDomain = rawPub.custom_domain || rawPub.hostname || null;
    const baseUrl = rawPub.base_url || (customDomain ? `https://${customDomain}` : `https://${subdomain}.substack.com`);

    const { monthlyPrice, annualPrice, currency } = extractPricing(rawPub.plans);

    let latestPosts = [];
    if (scrapeLatestPosts && baseUrl) {
        try {
            latestPosts = await fetchLatestPosts(baseUrl, 5);
        } catch (e) {
            log.debug(`Error fetching posts for ${baseUrl}: ${e.message}`);
        }
    }

    return {
        id: rawPub.id || null,
        name: rawPub.name || '',
        subdomain,
        customDomain,
        url: baseUrl,
        category: categoryName || (rawPub.category ? rawPub.category.name : null),
        description: rawPub.hero_text || '',
        logoUrl: rawPub.logo_url || null,
        coverPhotoUrl: rawPub.cover_photo_url || null,
        authorName: rawPub.author_name || rawPub.primary_profile_name || '',
        authorHandle: rawPub.author_handle || '',
        authorBio: rawPub.author_bio || '',
        authorPhotoUrl: rawPub.author_photo_url || rawPub.primary_profile_photo_url || null,
        twitterHandle: rawPub.twitter_screen_name || null,
        twitterUrl: rawPub.twitter_screen_name ? `https://twitter.com/${rawPub.twitter_screen_name}` : null,
        language: rawPub.language || 'en',
        createdAt: rawPub.created_at || null,
        firstPostDate: rawPub.first_post_date || null,
        hasPaidPlans: Array.isArray(rawPub.plans) && rawPub.plans.length > 0,
        monthlyPrice,
        annualPrice,
        currency,
        subscribers: rawPub.rankingDetailOrderOfMagnitude || rawPub.freeSubscriberCountOrderOfMagnitude || 'Thousands+',
        latestPostsCount: latestPosts.length,
        latestPosts,
        scrapedAt: new Date().toISOString(),
    };
}

// -------------------------------------------------------------
// MAIN WORKFLOW EXECUTION
// -------------------------------------------------------------

log.info('--- Starting Substack Newsletter Scraper ---');
log.info(`Mode: ${mode}`);

const seenPubIds = new Set();
let totalScraped = 0;

if (mode === 'customUrls') {
    if (!Array.isArray(publicationUrls) || publicationUrls.length === 0) {
        log.error('Mode is set to "customUrls" but no publicationUrls were provided in input.');
    } else {
        log.info(`Scraping ${publicationUrls.length} specific publication URLs...`);
        for (const inputUrl of publicationUrls) {
            if (!inputUrl) continue;
            try {
                let cleanUrl = inputUrl.trim();
                if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;
                const parsed = new URL(cleanUrl);
                const aboutUrl = `${parsed.origin}/about`;

                log.info(`Fetching details for: ${aboutUrl}`);
                const html = await requestHtml(aboutUrl);
                let pubData = null;

                if (html) {
                    const match = html.match(/id="preloads-json"[^>]*>([\s\S]*?)<\/script>/);
                    if (match && match[1]) {
                        try {
                            const preloads = JSON.parse(match[1]);
                            pubData = preloads.pub || null;
                        } catch (err) {
                            log.debug(`Failed parsing preloads JSON: ${err.message}`);
                        }
                    }
                }

                if (!pubData) {
                    // Fallback to basic structure
                    pubData = {
                        name: parsed.hostname,
                        base_url: parsed.origin,
                        subdomain: parsed.hostname.split('.')[0],
                    };
                }

                const record = await processPublication(pubData, 'Custom URL');
                await Actor.pushData(record);
                totalScraped++;
                log.info(`[✓] Scraped publication: ${record.name} (${record.url})`);
            } catch (err) {
                log.warning(`Error processing URL ${inputUrl}: ${err.message}`);
            }
        }
    }
} else {
    // Mode: categories / leaderboard exploration
    const categoriesMap = await getCategoriesMap();
    const targetCategories = Array.isArray(categories) && categories.length > 0 ? categories : ['technology'];

    log.info(`Scraping top newsletters for categories: ${targetCategories.join(', ')}`);
    log.info(`Max publications per category: ${maxPublicationsPerCategory}`);

    for (const catInput of targetCategories) {
        const catKey = String(catInput).trim().toLowerCase();
        const catObj = categoriesMap.get(catKey);

        if (!catObj) {
            log.warning(`Category "${catInput}" not recognized. Available categories: ${Array.from(new Set(Array.from(categoriesMap.values()).map((c) => c.slug))).join(', ')}`);
            continue;
        }

        const categoryId = catObj.id;
        const categoryName = catObj.name;
        log.info(`\n=== Processing Category: ${categoryName} (ID: ${categoryId}, Slug: ${catObj.slug}) ===`);

        let page = 0;
        let categoryCount = 0;
        let hasMore = true;

        while (hasMore && categoryCount < maxPublicationsPerCategory) {
            const url = `https://substack.com/api/v1/category/public/${categoryId}/leaderboard?page=${page}`;
            log.info(`Fetching page ${page + 1} for ${categoryName}...`);

            const data = await requestJson(url);
            if (!data || !Array.isArray(data.publications) || data.publications.length === 0) {
                log.info(`No more publications found for category ${categoryName}.`);
                break;
            }

            for (const pub of data.publications) {
                if (categoryCount >= maxPublicationsPerCategory) break;

                const pubId = pub.id || pub.subdomain;
                if (seenPubIds.has(pubId)) continue;
                seenPubIds.add(pubId);

                const record = await processPublication(pub, categoryName);
                await Actor.pushData(record);
                categoryCount++;
                totalScraped++;

                log.info(`[${totalScraped}] Saved: "${record.name}" | Author: ${record.authorName || 'N/A'} | Pricing: ${record.monthlyPrice || 'Free'} | Twitter: ${record.twitterHandle || 'N/A'}`);
            }

            hasMore = Boolean(data.more);
            page++;

            // Polite delay between pagination calls
            await new Promise((r) => setTimeout(r, 600));
        }

        log.info(`Finished category ${categoryName}. Total scraped for this category: ${categoryCount}`);
    }
}

log.info(`\n🎉 Scraping completed successfully! Total publications extracted: ${totalScraped}`);
await Actor.exit();
