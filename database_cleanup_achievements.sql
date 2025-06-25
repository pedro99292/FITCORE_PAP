-- SQL script to clean up deleted achievements from database
-- Run this script to remove achievement records for deleted achievements

-- Delete Ultimate Athlete (ID 49 - removed from code)
-- Note: ID 49 is now being used for PR Machine, so we should not delete it

-- Delete Community Leader (ID 53 - removed from code)
DELETE FROM user_achievements 
WHERE achievement_id = 53;

-- Delete Legendary Lifter (ID 50 - removed from code)
DELETE FROM user_achievements 
WHERE achievement_id = 50;

-- Delete Transformation Triumph (ID 52 - removed from code)
DELETE FROM user_achievements 
WHERE achievement_id = 52;

-- Delete Achievement Marvel (ID 48 - removed from code)
DELETE FROM user_achievements 
WHERE achievement_id = 48;

-- Print summary of what was cleaned up
SELECT 
    'Cleanup completed. Deleted achievements:' as summary,
    '- Community Leader (ID 53)' as deleted_1,
    '- Legendary Lifter (ID 50)' as deleted_2,
    '- Transformation Triumph (ID 52)' as deleted_3,
    '- Achievement Marvel (ID 48)' as deleted_4,
    'Note: PR Machine now uses ID 49, Ultimate Athlete was removed' as note; 