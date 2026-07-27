/*
# Reactions counter RPC functions

Adds `increment_likes`, `decrement_likes`, and `increment_impressions` —
atomic upsert-style counter functions used by the article reader. Each
function creates a `reactions` row for the post if one does not yet exist,
then increments the relevant counter. Safe to call concurrently.

These are SECURITY DEFINER functions so the anon role can invoke them; they
only touch the public `reactions` table and take a single post id argument.
*/

CREATE OR REPLACE FUNCTION increment_likes(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO reactions (post_id, likes, impressions)
  VALUES (p_post_id, 1, 0)
  ON CONFLICT (post_id) DO UPDATE SET likes = reactions.likes + 1;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_likes(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO reactions (post_id, likes, impressions)
  VALUES (p_post_id, 0, 0)
  ON CONFLICT (post_id) DO UPDATE SET likes = GREATEST(0, reactions.likes - 1);
END;
$$;

CREATE OR REPLACE FUNCTION increment_impressions(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO reactions (post_id, likes, impressions)
  VALUES (p_post_id, 0, 1)
  ON CONFLICT (post_id) DO UPDATE SET impressions = reactions.impressions + 1;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_likes(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_likes(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_impressions(uuid) TO anon, authenticated;
