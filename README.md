# 📮 Substack Newsletter & Author Scraper

Extract rich data from **Substack newsletters, leaderboards, authors, pricing plans, and latest articles** in seconds. Built for marketing agencies, newsletter sponsors, B2B lead generation specialists, and content researchers.

---

## 🌟 Why Use Substack Newsletter Scraper?

Substack is home to over 35+ categories of top independent writers, industry leaders, and creators. Finding the right newsletters to sponsor, partner with, or analyze has never been easier.

* 🎯 **Leaderboard & Category Exploration:** Scrape top newsletters across 35+ categories (Technology, Business, Finance, Culture, Crypto, Science, Design, etc.).
* 💰 **Monetization & Pricing Insights:** Extract monthly and annual subscription pricing, currencies, and paid tiers.
* 👤 **Author & Lead Profiling:** Scrape author names, bios, avatars, and direct **Twitter / X handles** for direct outreach.
* 📰 **Recent Content & Engagement Metrics:** Fetch the latest articles along with publication dates, like counts, and comments count.
* ⚡ **Lightning Fast & Cost-Effective:** Pure HTTP extraction designed to run in seconds with minimal Apify compute unit usage.
* 📊 **Export Anywhere:** Download your data in **CSV, JSON, Excel, XML, or HTML**, or sync directly to **Google Sheets, Airtable, Webhooks, Make, or Zapier**.

---

## 📥 Input Options

| Parameter | Type | Default | Description |
|---|---|---|---|
| `mode` | String | `"categories"` | `"categories"` (explore by category leaderboards) or `"customUrls"` (scrape specific URLs). |
| `categories` | Array | `["technology", "business", "finance"]` | List of categories to scrape (e.g., `technology`, `business`, `finance`, `crypto`, `culture`, `science`). |
| `maxPublicationsPerCategory` | Integer | `25` | Maximum number of newsletters to extract per category. |
| `publicationUrls` | Array | `[]` | Specific Substack URLs (e.g. `["https://bytebytego.substack.com"]`). |
| `scrapeLatestPosts` | Boolean | `true` | Whether to extract the latest 3-5 articles with like and comment metrics. |
| `proxyConfiguration` | Object | `null` | Optional Apify proxy settings. |

---

## 📤 Sample Output (JSON)

```json
{
  "id": 817132,
  "name": "ByteByteGo Newsletter",
  "subdomain": "bytebytego",
  "customDomain": "blog.bytebytego.com",
  "url": "https://blog.bytebytego.com",
  "category": "Technology",
  "description": "Explain complex systems with simple terms, from the authors of the best-selling system design book series. Join over 1,000,000 friendly readers.",
  "logoUrl": "https://substackcdn.com/image/fetch/...",
  "coverPhotoUrl": "https://substack-post-media.s3.amazonaws.com/...",
  "authorName": "Alex Xu",
  "authorHandle": "bytebytego",
  "authorBio": "Author of 3 Bestselling Books | Co-Founder of ByteByteGo",
  "authorPhotoUrl": "https://substackcdn.com/image/fetch/...",
  "twitterHandle": "alexxubyte",
  "twitterUrl": "https://twitter.com/alexxubyte",
  "language": "en",
  "createdAt": "2022-03-27T03:36:45.845Z",
  "firstPostDate": "2021-11-25T17:31:00.000Z",
  "hasPaidPlans": true,
  "monthlyPrice": "15.00 USD/month",
  "annualPrice": "150.00 USD/year",
  "currency": "USD",
  "subscribers": "Thousands+",
  "latestPostsCount": 5,
  "latestPosts": [
    {
      "title": "How Instacart Uses LLMs to Make People Buy More",
      "url": "https://blog.bytebytego.com/p/how-instacart-uses-llms-to-make-people",
      "postDate": "2026-11-16T16:30:56.763Z",
      "audience": "everyone",
      "isPaidOnly": false,
      "likesCount": 237,
      "commentsCount": 5
    }
  ],
  "scrapedAt": "2026-11-17T10:47:40.000Z"
}
```

---

## 💼 High-Value Use Cases

1. **Newsletter Sponsorship Outreach:** Find newsletters with high engagement in your niche and reach out to authors via Twitter or email for sponsorship deals.
2. **Competitive Intelligence:** Monitor what topics rival publications are writing about, their audience tier, and how they price their subscriptions.
3. **B2B Lead Generation:** Build curated lists of influential thought leaders, tech writers, and domain experts.
4. **Content Strategy & Ideation:** Analyze the most liked articles in any category to discover trending topics and headlines.

---

## 🛠 Support & Feedback

If you have feature requests, custom scraping requirements, or need help integrating with your CRM or database, please submit an issue on the Actor's **Issues** tab or contact us through Apify.
