-- Modify existing personal_records table to support goals
ALTER TABLE personal_records 
ADD COLUMN record_category VARCHAR(10) DEFAULT 'record' CHECK (record_category IN ('record', 'goal')),
ADD COLUMN target_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN status VARCHAR(20) DEFAULT 'achieved' CHECK (status IN ('active', 'achieved', 'overdue', 'cancelled')),
ADD COLUMN target_value DECIMAL(10,2),
ADD COLUMN target_reps INTEGER;

-- Update existing records to be marked as 'record' type with 'achieved' status
UPDATE personal_records 
SET record_category = 'record', status = 'achieved'
WHERE record_category IS NULL OR record_category = 'record';

-- Add indexes for the new columns
CREATE INDEX idx_personal_records_category ON personal_records(record_category);
CREATE INDEX idx_personal_records_status ON personal_records(status);
CREATE INDEX idx_personal_records_target_date ON personal_records(target_date);

-- Update RLS policies to handle both records and goals
-- The existing policies should work fine for both types 