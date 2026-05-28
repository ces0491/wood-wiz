# Vendor announcement template

Use this template to introduce Wood Wiz to each listed vendor. Sending these
proactively (rather than waiting for a vendor to discover the listing on their
own) sets the relationship up as collaborative rather than adversarial.

Aim for one email per vendor, lightly personalised. Track replies in GitHub
issues (label: `vendor-relations`).

---

## Subject

`Wood Wiz — listing your store on woodwiz.co.za`

(Or whichever domain ends up live.)

## Body

> Hi {first name},
>
> I run **Wood Wiz** ({SITE URL}) — a small independent price-comparison
> site that ranks Cape Town firewood vendors by **rand per kilogram**, so
> buyers can compare across bag sizes, pallet counts, and ton quantities
> without doing the maths themselves.
>
> {Vendor name} is one of the 8 vendors currently listed. I scrape your
> public product catalogue daily (your {Shopify / WooCommerce / Wix} feed
> at {URL}), normalise each listing to R/kg, and display it on the site
> with a direct **Buy at {Vendor name}** link that goes straight to your
> product page. No tracking redirects, no affiliate codes, no commission.
> If a customer buys, you get the whole sale.
>
> A few things worth being upfront about:
>
> - **Independent.** No affiliate links, no paid placement, no
>   vendor-sponsored ranking. The order is purely by metric (price per kg
>   by default).
> - **Methodology is public.** The R/kg figures come from your stated
>   price ÷ your stated weight. Where you only list pieces or volume, we
>   estimate (with a `~est` tag on the product). The full method is
>   documented at {SITE URL}/faq.
> - **Daily refresh.** We re-scrape every 24 hours, so listings move
>   with your prices.
> - **You're in charge of accuracy.** If anything looks wrong —
>   prices that don't match your site, weights we've miscalculated,
>   products that shouldn't be listed (eg. accessories) — please open
>   a GitHub issue at {REPO URL}/issues and we'll fix within a few days.
> - **Opt-out is fully respected.** If you'd prefer not to be listed at
>   all, reply to this email or open a GitHub issue and we'll remove
>   {Vendor name} from the next scrape. No questions asked.
>
> A couple of things that would help us list you better, if you're
> happy to share:
>
> 1. Do you include **stacking** on delivery, or just drop-off?
>    (Right now only Mother City Firewood and Lancehoudt are confirmed.
>    Everyone else is unspecified.)
> 2. Is there a **minimum order amount** or **suburb-based pricing
>    table** I should reflect?
>
> Thanks for your time. Wood Wiz exists because I got tired of building
> spreadsheets every winter; if it sends you a few buyers along the way,
> all the better.
>
> — Cesaire
> github.com/ces0491

---

## Per-vendor checklist

Use this to track which vendors have been emailed, whether they replied,
and whether any of the answers fed back into the data model.

| Vendor | Sent | Replied | Notes |
| --- | --- | --- | --- |
| Mother City Firewood | ☐ | ☐ | Stacking already confirmed. Ask about minimum order. |
| The Wood Gurus | ☐ | ☐ | By-zone pricing — ask if there's a public table. |
| Cape Town Firewood (CTF) | ☐ | ☐ | R250 minimum already known. Confirm stacking. |
| The Firewood Company | ☐ | ☐ | Lists zones (Northern/Southern/Atlantic/CBD/Winelands) — ask for prices per zone. |
| The Fire Man | ☐ | ☐ | Smallest catalogue (4 products) — confirm everything. |
| Lancehoudt | ☐ | ☐ | Stacking already confirmed. Variable-product handling rolled out — verify their per-zone prices look right. |
| Namibian Hardwood | ☐ | ☐ | Free over R1000 already known. Many accessories on the site that we filter out — confirm we're filtering the right things. |
| The Wood Bros | ☐ | ☐ | Wix sitemap-based scrape — flag any new products that should be listed. |

---

## Reply playbook

- **No reply within 2 weeks** → no action needed; the listing continues.
- **Opt-out request** → remove from `src/lib/vendors.ts`, push, scrape
  will skip them on next run. Acknowledge by email.
- **Pricing correction** → open an issue, investigate; usually a
  scraper-rule update fixes it. Re-scrape to confirm.
- **"Can you list me too?" from a new vendor** → file under
  `vendor-suggestions` in GitHub issues. Adding a vendor is a half-day
  job (vendors.ts entry + scraper module). Don't promise a timeline.
- **Hostile reply** → opt them out, no argument. Document the
  interaction in the issue tracker so future-you remembers.
