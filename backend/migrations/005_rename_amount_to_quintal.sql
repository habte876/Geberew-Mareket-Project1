DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'farmer_listings'
      AND column_name = 'amount_kuntal'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'farmer_listings'
      AND column_name = 'amount_quintal'
  ) THEN
    ALTER TABLE farmer_listings RENAME COLUMN amount_kuntal TO amount_quintal;
  END IF;
END $$;
