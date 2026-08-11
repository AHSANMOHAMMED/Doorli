-- Centralized super-admin control plane (Phase B)
-- Adds per-subscription quota override columns (users / monthly sales) so the
-- super-admin control API can increase/reduce tenant limits with one click.
ALTER TABLE "subscriptions" ADD COLUMN "override_max_users" integer;
ALTER TABLE "subscriptions" ADD COLUMN "override_max_sales_monthly" integer;