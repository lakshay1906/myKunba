# Ad Optimization & Revenue Growth Report: My Kunba

This report outlines strategies to increase ad impressions and revenue for the My Kunba website while maintaining a premium user experience (UX) and visual aesthetic.

---

## 1. Current State Analysis

Currently, the website has basic ad placements:
- **Homepage**: Top horizontal banner and one banner after the featured carousel.
- **Blog Grid**: In-feed ads every 4 cards (both list and grid view).
- **Blog Posts**:
    - Below title ad unit.
    - One in-article ad (after the second paragraph).
    - Optional sidebar ad (only if FAQ exists).

**Problem**: The "impression-to-pageview" ratio is likely low because most ads are "above the fold" or concentrated at the start of the content. Users who scroll deep into articles or browse multiple pages aren't seeing enough ad units.

---

## 2. Recommended Strategic Placements

To increase impressions without cluttering the UI, we should focus on **high-viewability** and **non-intrusive** placements.

### A. Persistent Sticky Sidebar (Desktop)
The blog content is centered with a max-width of 720px. This leaves significant empty space on the left and right on larger screens.
- **Recommendation**: Implement a **Sticky Skyscraper (160x600 or 300x600)** ad unit in the sidebar.
- **Why**: It stays in the user's viewport as they scroll through long articles, maximizing "viewable impressions."
- **UI Tip**: Use a glassmorphism container for the ad with a subtle border to match the "Space Command" aesthetic.

### B. Multiplex Ads (Content Recommendation Style)
Multiplex ads look like "Related Posts" and have very high Click-Through Rates (CTR).
- **Recommendation**: Place a **Multiplex Ad Unit** at the very bottom of every blog post, either right before or after the "Comments" section.
- **Why**: It captures the user's attention after they finish reading, providing a "natural" transition to other content (even if it's sponsored).

### C. Anchor (Sticky) Ads
These are ads that stick to the bottom or top of the screen.
- **Recommendation**: Enable **Anchor Ads** in your AdSense "Auto Ads" settings or implement a custom sticky footer ad for mobile.
- **Why**: They have nearly 100% viewability because they move with the user.
- **UI Tip**: Add a "Close" button so users can dismiss it if it blocks content, preserving the premium feel.

### D. Increased In-Article Density
For long-form content, one ad is not enough.
- **Recommendation**: Insert an ad unit every **4-6 paragraphs** or every **600-800 words**.
- **Why**: Users spending 5+ minutes on a page should be exposed to 3-4 ad units naturally.

### E. "In-between" Section Ads
- **Recommendation**: On the homepage, add ads between major segments (e.g., between the "Featured" section and the main "Blog" grid).

---

## 3. Recommended Ad Types

| Ad Type | Best For | Placement |
| :--- | :--- | :--- |
| **Display Ads** | Branding & Revenue | Sidebar (Sticky), Header, Footer |
| **In-Article Ads** | CTR | Between paragraphs in blog posts |
| **In-Feed Ads** | Native Look | Between cards in the Home/Category grid |
| **Multiplex Ads** | High Engagement | Bottom of articles (Grid of 4-8 units) |
| **Vignette Ads** | Maximum Revenue | Shown between page loads (AdSense Auto Ads) |

---

## 4. Maintaining UI & Aesthetic Quality

To keep the website looking premium:

1.  **Skeleton Loaders**: Always use skeleton loaders for ad units (like you already do in `AdBanner.tsx`). This prevents Layout Shift (CLS).
2.  **Glassmorphism styling**: Wrap ad units in subtle `bg-white/5` or `bg-muted/30` containers with `backdrop-blur-sm` and `rounded-xl` corners.
3.  **Sponsored Labels**: Use tiny, elegant "Sponsored" or "Advertisement" labels above ads.
4.  **Lazy Loading**: Ensure all ads are lazy-loaded. Your current `requestIdleCallback` implementation is good.
5.  **Frequency Capping**: Avoid showing too many ads on a single viewport.

---

## 5. Technical Implementation Checklist

- [ ] **Modify `src/app/(frontend)/[slug]/page.tsx`**: Make the sidebar persistent even if `faqItems` is empty.
- [ ] **Update `AdBanner.tsx`**: Add a new prop for "Sticky" behavior.
- [ ] **Add Multiplex unit**: Create a new component `MultiplexAd.tsx` for the footer of articles.
- [ ] **Environment Variables**: Add new slot IDs to your Cloudflare/Vercel/Local `.env` for the new positions.

---

> [!TIP]
> **Pro Tip**: Use **Google AdSense Auto Ads** with the "Vignette" and "Anchor" options turned ON, but keep "In-page ads" OFF so you can place them manually for better UI control.
