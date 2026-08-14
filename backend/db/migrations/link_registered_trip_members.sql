BEGIN;

ALTER TABLE trip_members
  ADD COLUMN IF NOT EXISTS user_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'trip_members_user_id_fkey'
      AND conrelid = 'trip_members'::regclass
  ) THEN
    ALTER TABLE trip_members
      ADD CONSTRAINT trip_members_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
  END IF;
END $$;

WITH participants AS (
  SELECT t.id AS trip_id, t.user_id, u.name, 0 AS participant_order
  FROM trips t
  JOIN users u ON u.id = t.user_id

  UNION ALL

  SELECT tc.trip_id, tc.user_id, u.name, 1 AS participant_order
  FROM trip_collaborators tc
  JOIN trips t ON t.id = tc.trip_id
  JOIN users u ON u.id = tc.user_id
  WHERE tc.status = 'accepted'
    AND tc.user_id <> t.user_id
),
unlinked_participants AS (
  SELECT p.*
  FROM participants p
  WHERE NOT EXISTS (
    SELECT 1
    FROM trip_members linked
    WHERE linked.trip_id = p.trip_id
      AND linked.user_id = p.user_id
  )
),
ranked_participants AS (
  SELECT p.*,
    ROW_NUMBER() OVER (
      PARTITION BY p.trip_id, LOWER(BTRIM(p.name))
      ORDER BY p.participant_order, p.user_id
    ) AS name_position
  FROM unlinked_participants p
),
ranked_manual_members AS (
  SELECT tm.id,
    tm.trip_id,
    LOWER(BTRIM(tm.name)) AS normalized_name,
    ROW_NUMBER() OVER (
      PARTITION BY tm.trip_id, LOWER(BTRIM(tm.name))
      ORDER BY tm.id
    ) AS name_position
  FROM trip_members tm
  WHERE tm.user_id IS NULL
)
UPDATE trip_members tm
SET user_id = participant.user_id,
  name = participant.name
FROM ranked_manual_members manual_member
JOIN ranked_participants participant
  ON participant.trip_id = manual_member.trip_id
 AND LOWER(BTRIM(participant.name)) = manual_member.normalized_name
 AND participant.name_position = manual_member.name_position
WHERE tm.id = manual_member.id;

INSERT INTO trip_members (trip_id, user_id, name)
SELECT participant.trip_id, participant.user_id, participant.name
FROM (
  SELECT t.id AS trip_id, t.user_id, u.name
  FROM trips t
  JOIN users u ON u.id = t.user_id

  UNION ALL

  SELECT tc.trip_id, tc.user_id, u.name
  FROM trip_collaborators tc
  JOIN trips t ON t.id = tc.trip_id
  JOIN users u ON u.id = tc.user_id
  WHERE tc.status = 'accepted'
    AND tc.user_id <> t.user_id
) participant
WHERE NOT EXISTS (
  SELECT 1
  FROM trip_members tm
  WHERE tm.trip_id = participant.trip_id
    AND tm.user_id = participant.user_id
);

CREATE UNIQUE INDEX IF NOT EXISTS trip_members_trip_user_unique_idx
  ON trip_members (trip_id, user_id)
  WHERE user_id IS NOT NULL;

UPDATE trips t
SET num_of_people = (
  SELECT COUNT(*)::integer
  FROM trip_members tm
  WHERE tm.trip_id = t.id
    AND (
      tm.user_id IS NULL
      OR tm.user_id = t.user_id
      OR EXISTS (
        SELECT 1
        FROM trip_collaborators tc
        WHERE tc.trip_id = t.id
          AND tc.user_id = tm.user_id
          AND tc.status = 'accepted'
      )
    )
);

COMMIT;
