export type MuscleGroup =
  | 'Upper chest'
  | 'Middle chest'
  | 'Lower chest'
  | 'Front delts'
  | 'Side delts'
  | 'Rear delts'
  | 'Abs'
  | 'Lats'
  | 'Traps'
  | 'Lower back'
  | 'Forearm'
  | 'Triceps'
  | 'Biceps';

export type StrengthExercise =
  // Chest
  | 'DB Bench Press'
  | 'Incline DB Bench Press'
  | 'Decline DB Bench Press'
  | 'Flat Barbell Bench Press'
  | 'Incline Barbell Bench Press'
  | 'Decline Barbell Bench Press'
  | 'Push-Up'
  | 'Weighted Push-Up'
  | 'Chest Dip'
  | 'Machine Chest Press'
  | 'Cable Fly'
  | 'Incline Cable Fly'
  | 'Pec Deck Fly'

  // Front delts
  | 'Barbell Overhead Press'
  | 'DB Shoulder Press'
  | 'Arnold Press'
  | 'Machine Shoulder Press'
  | 'Front Raise'

  // Side delts
  | 'DB Lateral Raise'
  | 'Cable Lateral Raise'
  | 'Machine Lateral Raise'
  | 'Leaning Cable Lateral Raise'
  | 'Upright Row'

  // Rear delts
  | 'Rear Delt Fly'
  | 'Reverse Pec Deck'
  | 'Face Pull'
  | 'Cable Rear Delt Fly'
  | 'Chest-Supported Rear Delt Raise'

  // Lats
  | 'Pull-Up'
  | 'Chin-Up'
  | 'Lat Pulldown'
  | 'Straight-Arm Pulldown'
  | 'Single-Arm Lat Pulldown'

  // Traps
  | 'DB Shrug'
  | 'Barbell Shrug'
  | 'Trap Bar Shrug'
  | 'Farmer Carry'
  | 'High Pull'

  // Lower back
  | 'Conventional Deadlift'
  | 'Romanian Deadlift'
  | 'Back Extension'
  | 'Good Morning'
  | 'Superman Hold'

  // Forearm
  | 'Wrist Curl'
  | 'Reverse Wrist Curl'
  | 'Hammer Curl'
  | 'Farmer Hold'
  | 'Plate Pinch Hold'

  // Triceps
  | 'Close-Grip Bench Press'
  | 'Skull Crusher'
  | 'Triceps Pushdown'
  | 'Overhead Triceps Extension'
  | 'Cable Overhead Triceps Extension'
  | 'Bench Dip'

  // Biceps
  | 'Barbell Curl'
  | 'EZ-Bar Curl'
  | 'Incline DB Curl'
  | 'Preacher Curl'
  | 'Cable Curl'
  | 'Concentration Curl';


export const STRENGTH_EXERCISES = [
  'DB Bench Press',
  'Incline DB Bench Press',
  'Decline DB Bench Press',
  'Flat Barbell Bench Press',
  'Incline Barbell Bench Press',
  'Decline Barbell Bench Press',
  'Push-Up',
  'Weighted Push-Up',
  'Chest Dip',
  'Machine Chest Press',
  'Cable Fly',
  'Incline Cable Fly',
  'Pec Deck Fly',
  'Barbell Overhead Press',
  'DB Shoulder Press',
  'Arnold Press',
  'Machine Shoulder Press',
  'Front Raise',
  'DB Lateral Raise',
  'Cable Lateral Raise',
  'Machine Lateral Raise',
  'Leaning Cable Lateral Raise',
  'Upright Row',
  'Rear Delt Fly',
  'Reverse Pec Deck',
  'Face Pull',
  'Cable Rear Delt Fly',
  'Chest-Supported Rear Delt Raise',
  'Pull-Up',
  'Chin-Up',
  'Lat Pulldown',
  'Straight-Arm Pulldown',
  'Single-Arm Lat Pulldown',
  'DB Shrug',
  'Barbell Shrug',
  'Trap Bar Shrug',
  'Farmer Carry',
  'High Pull',
  'Conventional Deadlift',
  'Romanian Deadlift',
  'Back Extension',
  'Good Morning',
  'Superman Hold',
  'Wrist Curl',
  'Reverse Wrist Curl',
  'Hammer Curl',
  'Farmer Hold',
  'Plate Pinch Hold',
  'Close-Grip Bench Press',
  'Skull Crusher',
  'Triceps Pushdown',
  'Overhead Triceps Extension',
  'Cable Overhead Triceps Extension',
  'Bench Dip',
  'Barbell Curl',
  'EZ-Bar Curl',
  'Incline DB Curl',
  'Preacher Curl',
  'Cable Curl',
  'Concentration Curl',
] as const satisfies readonly StrengthExercise[]


export const EXERCISE_TO_MUSCLES = {
  // Chest-focused
  'DB Bench Press': ['Middle chest', 'Front delts', 'Triceps'],
  'Incline DB Bench Press': ['Upper chest', 'Front delts', 'Triceps'],
  'Decline DB Bench Press': ['Lower chest', 'Triceps'],
  'Flat Barbell Bench Press': ['Middle chest', 'Front delts', 'Triceps'],
  'Incline Barbell Bench Press': ['Upper chest', 'Front delts', 'Triceps'],
  'Decline Barbell Bench Press': ['Lower chest', 'Triceps'],
  'Push-Up': ['Middle chest', 'Front delts', 'Triceps', 'Abs'],
  'Weighted Push-Up': ['Middle chest', 'Front delts', 'Triceps', 'Abs'],
  'Chest Dip': ['Lower chest', 'Triceps', 'Front delts'],
  'Machine Chest Press': ['Middle chest', 'Front delts', 'Triceps'],
  'Cable Fly': ['Middle chest'],
  'Incline Cable Fly': ['Upper chest'],
  'Pec Deck Fly': ['Middle chest'],

  // Front delts
  'Barbell Overhead Press': ['Front delts', 'Triceps', 'Side delts'],
  'DB Shoulder Press': ['Front delts', 'Triceps', 'Side delts'],
  'Arnold Press': ['Front delts', 'Side delts', 'Triceps'],
  'Machine Shoulder Press': ['Front delts', 'Triceps', 'Side delts'],
  'Front Raise': ['Front delts'],

  // Side delts
  'DB Lateral Raise': ['Side delts'],
  'Cable Lateral Raise': ['Side delts'],
  'Machine Lateral Raise': ['Side delts'],
  'Leaning Cable Lateral Raise': ['Side delts'],
  'Upright Row': ['Side delts', 'Traps'],

  // Rear delts
  'Rear Delt Fly': ['Rear delts'],
  'Reverse Pec Deck': ['Rear delts'],
  'Face Pull': ['Rear delts', 'Traps'],
  'Cable Rear Delt Fly': ['Rear delts'],
  'Chest-Supported Rear Delt Raise': ['Rear delts'],

  // Lats / upper back pulling
  'Pull-Up': ['Lats', 'Biceps', 'Forearm'],
  'Chin-Up': ['Lats', 'Biceps', 'Forearm'],
  'Lat Pulldown': ['Lats', 'Biceps', 'Forearm'],
  'Straight-Arm Pulldown': ['Lats'],
  'Single-Arm Lat Pulldown': ['Lats', 'Biceps'],

  // Traps
  'DB Shrug': ['Traps', 'Forearm'],
  'Barbell Shrug': ['Traps', 'Forearm'],
  'Trap Bar Shrug': ['Traps', 'Forearm'],
  'Farmer Carry': ['Traps', 'Forearm', 'Abs'],
  'High Pull': ['Traps', 'Side delts'],

  // Lower back / posterior chain
  'Conventional Deadlift': ['Lower back', 'Traps', 'Forearm', 'Abs'],
  'Romanian Deadlift': ['Lower back', 'Forearm'],
  'Back Extension': ['Lower back'],
  'Good Morning': ['Lower back', 'Abs'],
  'Superman Hold': ['Lower back'],

  // Forearm
  'Wrist Curl': ['Forearm'],
  'Reverse Wrist Curl': ['Forearm'],
  'Hammer Curl': ['Biceps', 'Forearm'],
  'Farmer Hold': ['Forearm', 'Traps', 'Abs'],
  'Plate Pinch Hold': ['Forearm'],

  // Triceps
  'Close-Grip Bench Press': ['Triceps', 'Middle chest', 'Front delts'],
  'Skull Crusher': ['Triceps'],
  'Triceps Pushdown': ['Triceps'],
  'Overhead Triceps Extension': ['Triceps'],
  'Cable Overhead Triceps Extension': ['Triceps'],
  'Bench Dip': ['Triceps', 'Lower chest', 'Front delts'],

  // Biceps
  'Barbell Curl': ['Biceps', 'Forearm'],
  'EZ-Bar Curl': ['Biceps', 'Forearm'],
  'Incline DB Curl': ['Biceps'],
  'Preacher Curl': ['Biceps'],
  'Cable Curl': ['Biceps'],
  'Concentration Curl': ['Biceps'],
} as const satisfies Record<StrengthExercise, readonly MuscleGroup[]>;

// Optional helper map: muscle -> exercises
export const MUSCLE_TO_EXERCISES: Record<MuscleGroup, StrengthExercise[]> = {
  'Upper chest': [
    'Incline DB Bench Press',
    'Incline Barbell Bench Press',
    'Incline Cable Fly',
  ],
  'Middle chest': [
    'DB Bench Press',
    'Flat Barbell Bench Press',
    'Push-Up',
    'Weighted Push-Up',
    'Machine Chest Press',
    'Cable Fly',
    'Pec Deck Fly',
    'Close-Grip Bench Press',
  ],
  'Lower chest': [
    'Decline DB Bench Press',
    'Decline Barbell Bench Press',
    'Chest Dip',
    'Bench Dip',
  ],
  'Front delts': [
    'DB Bench Press',
    'Incline DB Bench Press',
    'Flat Barbell Bench Press',
    'Incline Barbell Bench Press',
    'Push-Up',
    'Weighted Push-Up',
    'Chest Dip',
    'Machine Chest Press',
    'Barbell Overhead Press',
    'DB Shoulder Press',
    'Arnold Press',
    'Machine Shoulder Press',
    'Front Raise',
    'Close-Grip Bench Press',
    'Bench Dip',
  ],
  'Side delts': [
    'Barbell Overhead Press',
    'DB Shoulder Press',
    'Arnold Press',
    'Machine Shoulder Press',
    'DB Lateral Raise',
    'Cable Lateral Raise',
    'Machine Lateral Raise',
    'Leaning Cable Lateral Raise',
    'Upright Row',
    'High Pull',
  ],
  'Rear delts': [
    'Rear Delt Fly',
    'Reverse Pec Deck',
    'Face Pull',
    'Cable Rear Delt Fly',
    'Chest-Supported Rear Delt Raise',
  ],
  'Abs': [
    'Push-Up',
    'Weighted Push-Up',
    'Farmer Carry',
    'Conventional Deadlift',
    'Good Morning',
    'Farmer Hold',
  ],
  'Lats': [
    'Pull-Up',
    'Chin-Up',
    'Lat Pulldown',
    'Straight-Arm Pulldown',
    'Single-Arm Lat Pulldown',
  ],
  'Traps': [
    'Upright Row',
    'Face Pull',
    'DB Shrug',
    'Barbell Shrug',
    'Trap Bar Shrug',
    'Farmer Carry',
    'High Pull',
    'Conventional Deadlift',
    'Farmer Hold',
  ],
  'Lower back': [
    'Conventional Deadlift',
    'Romanian Deadlift',
    'Back Extension',
    'Good Morning',
    'Superman Hold',
  ],
  'Forearm': [
    'Pull-Up',
    'Chin-Up',
    'Lat Pulldown',
    'DB Shrug',
    'Barbell Shrug',
    'Trap Bar Shrug',
    'Conventional Deadlift',
    'Romanian Deadlift',
    'Wrist Curl',
    'Reverse Wrist Curl',
    'Hammer Curl',
    'Farmer Hold',
    'Plate Pinch Hold',
  ],
  'Triceps': [
    'DB Bench Press',
    'Incline DB Bench Press',
    'Decline DB Bench Press',
    'Flat Barbell Bench Press',
    'Incline Barbell Bench Press',
    'Decline Barbell Bench Press',
    'Push-Up',
    'Weighted Push-Up',
    'Chest Dip',
    'Machine Chest Press',
    'Barbell Overhead Press',
    'DB Shoulder Press',
    'Arnold Press',
    'Machine Shoulder Press',
    'Close-Grip Bench Press',
    'Skull Crusher',
    'Triceps Pushdown',
    'Overhead Triceps Extension',
    'Cable Overhead Triceps Extension',
    'Bench Dip',
  ],
  'Biceps': [
    'Pull-Up',
    'Chin-Up',
    'Lat Pulldown',
    'Single-Arm Lat Pulldown',
    'Hammer Curl',
    'Barbell Curl',
    'EZ-Bar Curl',
    'Incline DB Curl',
    'Preacher Curl',
    'Cable Curl',
    'Concentration Curl',
  ],
};

export interface ExerciseRecord {
  id: number;
  date: string; // timestamp
  exercise: StrengthExercise;
  created_at: string; // timestamp
  equipment: string;
  sets: number[];
  muscles: MuscleGroup[];
}

export interface Database {
  public: {
    Tables: {
      exercises: {
        Row: ExerciseRecord;
        Insert: Omit<ExerciseRecord, 'id' | 'created_at'>;
        Update: Partial<Omit<ExerciseRecord, 'id' | 'created_at'>>;
      };
    };
  };
}
