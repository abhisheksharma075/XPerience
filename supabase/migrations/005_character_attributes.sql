-- ==============================================================================
-- Migration: 005_character_attributes.sql
-- Description: Safe, atomic character attributes manipulation for XPerience RPG
-- Attributes: strength, intelligence, discipline, vitality
-- ==============================================================================

-- 1. Function: update_character_attributes
-- Updates one or more RPG attributes for a user's profile with validation.
CREATE OR REPLACE FUNCTION public.update_character_attributes(
  p_user_id UUID,
  p_strength INTEGER DEFAULT NULL,
  p_intelligence INTEGER DEFAULT NULL,
  p_discipline INTEGER DEFAULT NULL,
  p_vitality INTEGER DEFAULT NULL
)
RETURNS TABLE (
  strength INTEGER,
  intelligence INTEGER,
  discipline INTEGER,
  vitality INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent unauthorized cross-user modifications
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Access denied: Cannot modify attributes of another player';
  END IF;

  -- Validate positive integers >= 1 for provided attributes
  IF p_strength IS NOT NULL AND p_strength < 1 THEN
    RAISE EXCEPTION 'Strength attribute must be an integer >= 1, received: %', p_strength;
  END IF;

  IF p_intelligence IS NOT NULL AND p_intelligence < 1 THEN
    RAISE EXCEPTION 'Intelligence attribute must be an integer >= 1, received: %', p_intelligence;
  END IF;

  IF p_discipline IS NOT NULL AND p_discipline < 1 THEN
    RAISE EXCEPTION 'Discipline attribute must be an integer >= 1, received: %', p_discipline;
  END IF;

  IF p_vitality IS NOT NULL AND p_vitality < 1 THEN
    RAISE EXCEPTION 'Vitality attribute must be an integer >= 1, received: %', p_vitality;
  END IF;

  RETURN QUERY
  UPDATE profiles
  SET
    strength = COALESCE(p_strength, profiles.strength),
    intelligence = COALESCE(p_intelligence, profiles.intelligence),
    discipline = COALESCE(p_discipline, profiles.discipline),
    vitality = COALESCE(p_vitality, profiles.vitality),
    updated_at = now()
  WHERE id = p_user_id
  RETURNING profiles.strength, profiles.intelligence, profiles.discipline, profiles.vitality;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile with ID % not found', p_user_id;
  END IF;
END;
$$;

-- 2. Function: increment_attribute
-- Atomically increments a specific attribute by a given number of points.
CREATE OR REPLACE FUNCTION public.increment_attribute(
  p_user_id UUID,
  p_attribute TEXT,
  p_points INTEGER DEFAULT 1
)
RETURNS TABLE (
  strength INTEGER,
  intelligence INTEGER,
  discipline INTEGER,
  vitality INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attr TEXT;
BEGIN
  -- Prevent unauthorized cross-user modifications
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Access denied: Cannot modify attributes of another player';
  END IF;

  -- Validate positive increment
  IF p_points IS NULL OR p_points < 1 THEN
    RAISE EXCEPTION 'Attribute increment points must be a positive integer >= 1, received: %', p_points;
  END IF;

  v_attr := lower(trim(p_attribute));
  IF v_attr NOT IN ('strength', 'intelligence', 'discipline', 'vitality') THEN
    RAISE EXCEPTION 'Invalid attribute "%". Must be one of: strength, intelligence, discipline, vitality', p_attribute;
  END IF;

  RETURN QUERY
  UPDATE profiles
  SET
    strength = CASE WHEN v_attr = 'strength' THEN profiles.strength + p_points ELSE profiles.strength END,
    intelligence = CASE WHEN v_attr = 'intelligence' THEN profiles.intelligence + p_points ELSE profiles.intelligence END,
    discipline = CASE WHEN v_attr = 'discipline' THEN profiles.discipline + p_points ELSE profiles.discipline END,
    vitality = CASE WHEN v_attr = 'vitality' THEN profiles.vitality + p_points ELSE profiles.vitality END,
    updated_at = now()
  WHERE id = p_user_id
  RETURNING profiles.strength, profiles.intelligence, profiles.discipline, profiles.vitality;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile with ID % not found', p_user_id;
  END IF;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.update_character_attributes(UUID, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_attribute(UUID, TEXT, INTEGER) TO authenticated, service_role;
