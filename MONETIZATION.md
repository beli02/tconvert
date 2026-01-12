# 💰 Monetization Setup Guide

## ☕ Donation Setup

1. **Create your donation page:**
   - Go to https://buymeacoffee.com/ (or Ko-fi, Patreon)
   - Sign up and get your link

2. **Update the bot:**
   - Open `src/bot.ts`
   - Find line with: `.url('☕ Support Us', 'https://buymeacoffee.com/yourname')`
   - Replace with your actual link

3. **Test:** Start bot, tap "☕ Support Us" button

---

## 📢 Sponsor Setup

**Current Settings:**
- Sponsor message shows every **10 conversions** (configurable)
- Non-intrusive, appears between conversions

**To add a sponsor:**

1. **Edit sponsor message** in `src/bot.ts`:
   ```typescript
   // Around line 410
   const sponsorMsgs = {
     en: '🌟 *This conversion brought to you by:*\n\n🚀 **[Sponsor Name]** - What they offer\n\n_Visit: sponsor-website.com_',
   };
   ```

2. **Adjust frequency** (line ~13):
   ```typescript
   const SPONSOR_INTERVAL = 10; // Show every N conversions
   ```

3. **Rebuild:**
   ```bash
   docker-compose down && docker-compose up -d --build
   ```

---

## 📧 Contact Setup

Update your Telegram handle in the About section:
- Open `src/bot.ts`
- Search for `@yourusername`
- Replace with your actual username (e.g., `@yourhandle`)

---

## 💡 Pricing Ideas

**For Sponsors:**
- Every 10 conversions: $50-100/month
- Every 5 conversions: $150-250/month
- Exclusive sponsor (only them): $500+/month

**What to offer:**
- Link in sponsor message
- Mention in About section
- Monthly conversion stats report

---

## 📊 Track Success

Watch bot logs to see conversion count:
```bash
docker-compose logs -f tconvert-bot | grep "Conversion complete"
```

Count unique users by checking message patterns in logs.

---

## 🎯 Next Steps

1. Set up donation link (5 mins)
2. Update contact username (2 mins)
3. Wait until you have ~500 daily users
4. Reach out to potential sponsors with your stats
5. Test sponsor message thoroughly before going live
