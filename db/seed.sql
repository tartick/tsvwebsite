-- ═══════════════════════════════════════════════════════════════
-- The Season — Proposal Tool seed data
-- Run AFTER schema.sql. Populates the catalog from the mockups.
-- Re-running clears + reloads the three catalog tables (not proposals).
-- ═══════════════════════════════════════════════════════════════

truncate services, reference_items, contacts restart identity cascade;

-- ── Services ───────────────────────────────────────────────────
insert into services (company_key, name, description, rate_amount, rate_unit, rate_note, is_default, sort) values
  ('tsv',  'Marketing Direction', 'End-to-end strategy across campaign, brand, partnerships, and media. Acts as the show''s marketing lead, coordinating across all Season studios.', 15000, 'flat', null, true, 0),

  ('11oc', 'Logo & Key Art', 'Show identity package — logo, key art, color system, and the foundational campaign visual that everything else builds on.', 5000, 'flat', null, true, 0),
  ('11oc', 'Logo Development & Branding', 'Brand-only engagement when key art is sourced elsewhere — logo, typography, color, and brand standards doc.', 5000, 'flat', null, false, 1),
  ('11oc', 'Print & Poster Extension', 'Adapt the key art system into poster, marquee, and out-of-home formats. Add-on to Logo & Key Art.', 3500, 'flat', null, false, 2),

  ('relay', 'Creator Activation', 'Vetted creator collaborations — not ad reads, real partnerships. Includes brief, outreach, contracting, and post review.', 8000, 'flat', null, true, 0),
  ('relay', 'Creator Night / Press Seats', 'Curated invite list, RSVP management, and on-night coordination for creator screenings or press performances.', 4500, 'flat', null, false, 1),

  ('flyer', 'Creative Production', 'Shoot day(s) for stills and short-form video — production, direction, and edit. Output formatted for socials, paid, and web.', 2500, 'flat', null, true, 0),
  ('flyer', 'Animation Package', 'A library of animated key art moments — logo motion, social cutdowns, and reusable templates for the in-house team.', 10000, 'flat', null, true, 1),
  ('flyer', 'Merchandise Design', 'Apparel, totes, posters, and small goods designed from the show''s brand system. Includes vendor-ready files.', 7500, 'flat', null, false, 2),
  ('flyer', 'Merchandise Project Management', 'Vendor sourcing, sample review, production schedule, and fulfillment coordination. Pairs with Merch Design.', 2500, 'flat', null, false, 3),
  ('flyer', 'Website Development', 'Show website — custom design extending the key art system, mobile-first, CMS for the in-house team to update copy and dates.', 5000, 'flat', null, true, 4),

  ('marathon', 'Social Media Management', 'Ongoing organic social — calendar, copy, light graphic design, posting, and community management across IG, TikTok, X.', 6000, 'monthly', null, false, 0),
  ('marathon', 'Paid Social Boost', 'Strategy + execution for paid social — ad creative versioning, audience targeting, budget pacing. Media spend billed at cost.', 3500, 'monthly', '+ media', false, 1);

-- ── Reference library ──────────────────────────────────────────
insert into reference_items (type, title, client, url, company_key, tags, page_count, sort) values
  ('link', 'CATS: The Jellicle Ball — show site',    'PAC NYC · 2024',        'https://catsthejelicleball.com',            '11oc', '{Key Art,Website}', null, 0),
  ('link', 'Proof on Broadway — campaign site',      'Roundabout · 2025',     'https://proofbroadway.com',                 '11oc', '{Key Art,Logo}',    null, 1),
  ('pdf',  'Mr. Leather 1976 — Brand Standards',     'Hartshorn Studios · 2025','/assets/refs/mr-leather-brand-standards.pdf','11oc','{Branding}',       14,   2),
  ('link', 'Drama Desk Awards — identity refresh',   'Drama Desk Inc · 2024', 'https://dramadesks.com',                    '11oc', '{Branding,Logo}',   null, 3),
  ('pdf',  '11 O''Clock — Key Art Portfolio 2026',   'Internal portfolio deck','/assets/refs/11oc-key-art-portfolio.pdf',  '11oc', '{Key Art}',         22,   4),

  ('link', 'CATS animation reel',                    'PAC NYC · 2024',        'https://vimeo.com/11oclock',                'flyer','{Animation,Video}', null, 5),
  ('link', 'ProofBroadway.com — show website',       'Roundabout · 2025',     'https://proofbroadway.com',                 'flyer','{Website}',         null, 6),
  ('pdf',  'Flyer — Merch Design Case Study',        'Internal · CATS, Proof, NPAC','/assets/refs/flyer-merch-case-study.pdf','flyer','{Merch}',        9,    7),
  ('link', 'CATS retail line — shop page',           'PAC NYC · 2024',        'https://catsthejelicleball.com/shop',       'flyer','{Merch}',           null, 8),
  ('pdf',  'Flyer — Creative Production Reel Deck',   'Internal · 2026 capabilities','/assets/refs/flyer-production-reel.pdf','flyer','{Production,Video}',18,  9),
  ('link', 'Drama Desk — broadcast graphics package','Drama Desk Inc · 2024', 'https://dramadesks.com/broadcast',          'flyer','{Animation}',       null, 10),

  ('pdf',  'Relay — Creator Activation Case Study',  'Internal · Proof, CATS','/assets/refs/relay-creator-case-study.pdf', 'relay','{Creators}',        11,   11),
  ('link', 'CATS creator collab — featured posts',   'PAC NYC · 2024',        'https://www.tiktok.com/@catsthejelicleball','relay','{Creators,Social}', null, 12),

  ('pdf',  'Marathon — Social Management Sample Calendar','Internal · capabilities sample','/assets/refs/marathon-social-calendar.pdf','marathon','{Social}',8,13);

-- ── Team contacts ──────────────────────────────────────────────
-- NOTE: phone numbers + some emails are placeholders — edit in the
-- Contacts admin page once real details are confirmed.
insert into contacts (name, title, company_key, email, phone, specialty, is_pinned, sort) values
  ('Steven Tartick', 'Founder & Marketing Director', 'tsv',      'steven@theseason.nyc',     '(212) 555-0101', 'Strategy · Producing · Pricing', true,  0),
  ('Emma Chen',      'Associate Producer',           'tsv',      'emma@theseason.nyc',       '(212) 555-0102', 'Operations · Scheduling · Contracts', false, 1),
  ('Alex Rivera',    'Creative Director',            '11oc',     'alex@11oclock.com',        '(212) 555-0103', 'Logo · Key Art · Brand Strategy', true,  2),
  ('Jordan Kim',     'Senior Designer',              '11oc',     'jordan@11oclock.com',      '(212) 555-0104', 'Illustration · Type · Print', false, 3),
  ('Maya Patel',     'Head of Creator Partnerships', 'relay',    'maya@relayinfluence.com',  '(212) 555-0105', 'Creator Network · Activations · TikTok', true, 4),
  ('Danny Lopez',    'Production Director',           'flyer',    'danny@flyerweb.com',       '(212) 555-0106', 'Shoots · Editorial · Edit Suite', false, 5),
  ('Taylor Brooks',  'Lead Developer / Motion',      'flyer',    'taylor@flyerweb.com',      '(212) 555-0107', 'Web · Animation · Merch PM', false, 6),
  ('Sam Ortiz',      'Social Lead',                  'marathon', 'sam@marathondigital.com',  '(212) 555-0108', 'IG · TikTok · Paid Social', false, 7);
