BEGIN;

CREATE OR REPLACE FUNCTION validate_trip_item_date()
RETURNS TRIGGER AS $$
DECLARE
  item_date DATE;
  trip_start DATE;
  trip_end DATE;
BEGIN
  item_date := (to_jsonb(NEW) ->> TG_ARGV[0])::date;

  IF item_date IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT start_date, end_date
  INTO trip_start, trip_end
  FROM trips
  WHERE id = NEW.trip_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF trip_start IS NULL OR trip_end IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'Trip start and end dates must be set before adding dated trip items';
  END IF;

  IF item_date < trip_start OR item_date > trip_end THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = format(
        '%s must be between %s and %s (inclusive)',
        TG_ARGV[0],
        trip_start,
        trip_end
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_trip_date_range()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.start_date IS NULL) <> (NEW.end_date IS NULL) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'Trip start and end dates must be provided together';
  END IF;

  IF NEW.start_date IS NOT NULL AND NEW.start_date > NEW.end_date THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'Trip start date cannot be after end date';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF EXISTS (
      SELECT 1
      FROM itinerary_items
      WHERE trip_id = NEW.id
        AND (
          NEW.start_date IS NULL
          OR itinerary_date < NEW.start_date
          OR itinerary_date > NEW.end_date
        )
    ) THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'Trip date range excludes an existing itinerary item';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM expenses
      WHERE trip_id = NEW.id
        AND expense_date IS NOT NULL
        AND (
          NEW.start_date IS NULL
          OR expense_date < NEW.start_date
          OR expense_date > NEW.end_date
        )
    ) THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'Trip date range excludes an existing expense';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_expense_trip_date ON expenses;
CREATE TRIGGER validate_expense_trip_date
BEFORE INSERT OR UPDATE ON expenses
FOR EACH ROW
EXECUTE FUNCTION validate_trip_item_date('expense_date');

DROP TRIGGER IF EXISTS validate_itinerary_trip_date ON itinerary_items;
CREATE TRIGGER validate_itinerary_trip_date
BEFORE INSERT OR UPDATE ON itinerary_items
FOR EACH ROW
EXECUTE FUNCTION validate_trip_item_date('itinerary_date');

DROP TRIGGER IF EXISTS validate_trip_dates_on_insert ON trips;
CREATE TRIGGER validate_trip_dates_on_insert
BEFORE INSERT ON trips
FOR EACH ROW
EXECUTE FUNCTION validate_trip_date_range();

DROP TRIGGER IF EXISTS validate_trip_dates_on_update ON trips;
CREATE TRIGGER validate_trip_dates_on_update
BEFORE UPDATE OF start_date, end_date ON trips
FOR EACH ROW
EXECUTE FUNCTION validate_trip_date_range();

COMMIT;
