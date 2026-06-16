-- ═══════════════════════════════════════════════════════════════
-- ONE-TIME cleanup — drop the OLD unprefixed tables from the first
-- (superseded) version of the schema. Everything now lives under the
-- prop_ prefix instead.
--
-- ⚠️  BEFORE RUNNING: confirm these six tables were created by the
--     proposal tool's first schema run and are NOT tables your project
--     used for anything else. If any of these names belonged to your
--     existing project, STOP and tell me — do not run this.
--
-- Run order for the switch-to-prefixed migration:
--   1. db/schema.sql   (creates prop_* tables)
--   2. db/seed.sql     (seeds prop_* catalog)
--   3. db/cleanup-old-unprefixed.sql   ← this file (drops the old ones)
-- ═══════════════════════════════════════════════════════════════

drop table if exists proposal_events cascade;
drop table if exists proposals       cascade;
drop table if exists reference_items  cascade;
drop table if exists services         cascade;
drop table if exists contacts         cascade;
drop table if exists companies        cascade;

-- The old schema also created a generically-named trigger function.
drop function if exists touch_updated_at() cascade;
