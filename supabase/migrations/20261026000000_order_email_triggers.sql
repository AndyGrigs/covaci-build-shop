-- Enable pg_net for async HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Store secrets in Vault (run once; skip if already exist)
-- Replace <ref> with your Supabase project ref before applying
-- SELECT vault.create_secret('https://<ref>.supabase.co', 'project_url');
-- SELECT vault.create_secret('<your-ORDER_EMAIL_SECRET>', 'order_email_secret');

-- Trigger function shared by both orders and rentals.
-- TG_ARGV[0] is 'order' or 'rental', passed from each trigger below.
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_url    text;
  v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_url
    FROM vault.decrypted_secrets WHERE name = 'project_url';
  SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets WHERE name = 'order_email_secret';

  PERFORM net.http_post(
    url     := v_url || '/functions/v1/send-order-email',
    headers := jsonb_build_object(
                 'Content-Type',   'application/json',
                 'x-order-secret', v_secret),
    body    := jsonb_build_object('type', TG_ARGV[0], 'id', NEW.id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_notify
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_new_order('order');

CREATE TRIGGER rentals_notify
  AFTER INSERT ON rentals
  FOR EACH ROW EXECUTE FUNCTION notify_new_order('rental');
