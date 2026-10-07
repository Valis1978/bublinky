-- Bublinky — close public read access to chat messages
--
-- bub_messages_anon_select (USING true) let anyone holding the public anon key
-- (it ships in the web bundle) read every message. The chat no longer needs it:
-- realtime now sends content-free "sync" pings over broadcast and messages are
-- fetched through the authenticated /api/messages route (service role).
--
-- Run AFTER the app version with broadcast sync is deployed.

DROP POLICY IF EXISTS bub_messages_anon_select ON bub_messages;

-- postgres_changes on this table is no longer subscribed to
ALTER PUBLICATION supabase_realtime DROP TABLE bub_messages;
