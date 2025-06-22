# Personal Record Goals Feature

## Overview
Added functionality to set and track personal record goals in the FITCORE app. Users can now set targets for specific exercises and track their progress toward achieving those goals.

## New Features

### 1. Goal Setting
- Users can set specific targets for any exercise
- Support for different goal types: strength, time, distance, reps, weight
- Optional target dates for motivation
- Notes support for additional context

### 2. Goal Tracking
- Automatic goal achievement detection when new PRs are recorded
- Goal status tracking (active, achieved, overdue, cancelled)
- Visual progress indicators
- Achievement notifications

### 3. Enhanced UI
- New "Goals" tab in Personal Records screen
- Tab-based navigation between Records and Goals
- Goal cards with detailed progress information
- Integrated add goal functionality

## Database Changes

### New Table: `personal_record_goals`
```sql
CREATE TABLE personal_record_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id VARCHAR(255) NOT NULL,
  exercise_name VARCHAR(255) NOT NULL,
  exercise_body_part VARCHAR(255),
  exercise_target VARCHAR(255),
  exercise_equipment VARCHAR(255),
  record_type VARCHAR(50) NOT NULL,
  target_value DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  target_reps INTEGER,
  target_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  achieved_at TIMESTAMP WITH TIME ZONE,
  achieved_value DECIMAL(10,2),
  achieved_reps INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## New Components

### 1. `AddPRGoalModal.tsx`
- Modal for creating new personal record goals
- Exercise selection with search functionality
- Goal type selection (strength, time, distance, etc.)
- Target value input with appropriate units
- Optional target date picker
- Notes input

### 2. `PRGoalCard.tsx`
- Card component for displaying individual goals
- Status indicators (active, achieved, overdue)
- Progress information
- Action buttons (mark as achieved, edit, delete)
- Time remaining/overdue calculations

## New Service Functions

### Goal Management
- `createPersonalRecordGoal()` - Create new goals
- `getUserPersonalRecordGoals()` - Get all user goals
- `getActivePersonalRecordGoals()` - Get only active goals
- `updatePersonalRecordGoal()` - Update existing goals
- `deletePersonalRecordGoal()` - Delete goals
- `markGoalAsAchieved()` - Mark goals as completed

### Goal Automation
- `checkAndUpdateGoalsOnNewPR()` - Automatically check if new PRs achieve goals
- `updateOverdueGoals()` - Update status of overdue goals
- `getGoalStats()` - Get goal statistics

## Updated Features

### Personal Records Screen
- Added tab navigation between Records and Goals
- Updated stats to include goal information
- Context-aware floating action button
- Integrated goal achievement notifications

### PR Creation
- Automatic goal checking when new PRs are added
- Achievement notifications with goal details
- Seamless integration with existing PR workflow

## Type Definitions

### New Interfaces
```typescript
interface PersonalRecordGoal {
  id: string;
  user_id: string;
  exercise_id: string;
  exercise_name: string;
  record_type: RecordType;
  target_value: number;
  unit: string;
  target_reps?: number;
  target_date?: string;
  notes?: string;
  status: 'active' | 'achieved' | 'overdue' | 'cancelled';
  achieved_at?: string;
  achieved_value?: number;
  achieved_reps?: number;
  created_at: string;
  updated_at: string;
}

interface NewPersonalRecordGoal {
  exercise_id: string;
  exercise_name: string;
  record_type: RecordType;
  target_value: number;
  unit: string;
  target_reps?: number;
  target_date?: string;
  notes?: string;
}
```

## Usage Instructions

### Setting a Goal
1. Navigate to Personal Records screen
2. Switch to "Goals" tab
3. Tap the "+" button or "Set Your First Goal"
4. Select an exercise
5. Choose goal type (strength, time, distance, etc.)
6. Enter target value and optional target date
7. Add notes if desired
8. Save the goal

### Tracking Progress
- Goals automatically update when you log new PRs
- Achievement notifications appear when goals are met
- View goal status and time remaining on goal cards
- Manually mark goals as achieved if needed

### Managing Goals
- View all goals in the Goals tab
- Delete goals that are no longer relevant
- Goals automatically become "overdue" if target date passes
- Achievement history is preserved

## Benefits

1. **Motivation**: Clear targets to work toward
2. **Progress Tracking**: Visual feedback on improvement
3. **Gamification**: Achievement notifications and status tracking
4. **Organization**: Separate goal management from PR recording
5. **Flexibility**: Support for various goal types and optional dates
6. **Integration**: Seamless integration with existing PR system

## Future Enhancements

Potential future improvements:
- Goal templates for common fitness targets
- Progress charts and visualizations
- Goal sharing with friends/trainers
- Reminder notifications for upcoming target dates
- Goal categories and filtering
- Advanced goal metrics and analytics 