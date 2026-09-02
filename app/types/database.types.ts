export type MuscleGroup =
  | 'Upper chest'
  | 'Middle chest'
  | 'Lower chest'
  | 'Front delts'
  | 'Side delts'
  | 'Rear delts'
  | 'Upper Abs'
  | 'Lower Abs'
  | 'Obliques'
  | 'Lats'
  | 'Traps'
  | 'Lower back'
  | 'Forearm'
  | 'Triceps'
  | 'Biceps'

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
  | 'Incline Machine Chest Press'
  | 'Machine Chest Press'
  | 'Cable Fly'
  | 'Incline Cable Fly'
  | 'Pec Deck Fly'
  | 'TNG Chest Press'
  | 'TNG Pure Chest Press'
  | 'TNG Pectoral Fly'
  | 'TNG Pure Pectoral Fly'

  // Front delts
  | 'Barbell Overhead Press'
  | 'DB Shoulder Press'
  | 'Arnold Press'
  | 'Machine Shoulder Press'
  | 'Front Raise'
  | 'TNG Shoulder Press'
  | 'TNG Pure Shoulder Press'

  // Side delts
  | 'DB Lateral Raise'
  | 'Cable Lateral Raise'
  | 'Machine Lateral Raise'
  | 'Leaning Cable Lateral Raise'
  | 'Upright Row'
  | 'TNG Lateral Raise'
  | 'TNG Pure Lateral Raise'

  // Rear delts
  | 'Rear Delt Fly'
  | 'Reverse Pec Deck'
  | 'Face Pull'
  | 'Cable Rear Delt Fly'
  | 'Chest-Supported Rear Delt Raise'
  | 'TNG Rear Delt Fly'
  | 'TNG Pure Rear Delt Fly'

  // Lats
  | 'Pull-Up'
  | 'Chin-Up'
  | 'Lat Pulldown'
  | 'Straight-Arm Pulldown'
  | 'Single-Arm Lat Pulldown'
  | 'Chest-supported Row'
  | 'DB Row'
  | 'TNG Lat Pulldown'
  | 'TNG Pure Lat Pulldown'
  | 'TNG Pulley'
  | 'TNG Row'
  | 'TNG Pure Row'

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
  | 'TNG Back Extension'
  | 'TNG Pure Back Extension'
  | 'TNG Hyperextension'

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
  | 'TNG Triceps Pushdown'
  | 'TNG Pure Triceps Pushdown'
  | 'TNG Dip'

  // Biceps
  | 'Barbell Curl'
  | 'EZ-Bar Curl'
  | 'Incline DB Curl'
  | 'DB Curl'
  | 'Preacher Curl'
  | 'Cable Curl'
  | 'Concentration Curl'
  | 'TNG Biceps Curl'
  | 'TNG Pure Biceps Curl'

  // Abs
  | 'Cable Crunch'
  | 'Machine Crunch'
  | 'Rope Crunch'
  | 'Ab Wheel Rollout'
  | 'Decline Crunch'
  | 'Weighted Sit-Up'
  | 'V-Up'
  | 'Leg Raise'
  | 'Hanging Leg Raise'
  | 'Decline Leg Raise'
  | 'Ab Machine'
  | 'Cable Woodchop'
  | 'Landmine Rotation'
  | 'TNG Ab Crunch'
  | 'TNG Pure Ab Crunch'
  | 'TNG Ab Machine'
  | 'TNG Core Rotation'

export type Split = 'Push' | 'Pull'

export const EXERCISE_TO_SPLIT: Record<StrengthExercise, Split> = {
  // Chest (Push)
  'DB Bench Press': 'Push',
  'Incline DB Bench Press': 'Push',
  'Decline DB Bench Press': 'Push',
  'Flat Barbell Bench Press': 'Push',
  'Incline Barbell Bench Press': 'Push',
  'Decline Barbell Bench Press': 'Push',
  'Push-Up': 'Push',
  'Weighted Push-Up': 'Push',
  'Chest Dip': 'Push',
  'Machine Chest Press': 'Push',
  'Incline Machine Chest Press': 'Push',
  'Cable Fly': 'Push',
  'Incline Cable Fly': 'Push',
  'Pec Deck Fly': 'Push',
  'TNG Chest Press': 'Push',
  'TNG Pure Chest Press': 'Push',
  'TNG Pectoral Fly': 'Push',
  'TNG Pure Pectoral Fly': 'Push',

  // Front Delts (Push)
  'Barbell Overhead Press': 'Push',
  'DB Shoulder Press': 'Push',
  'Arnold Press': 'Push',
  'Machine Shoulder Press': 'Push',
  'Front Raise': 'Push',
  'TNG Shoulder Press': 'Push',
  'TNG Pure Shoulder Press': 'Push',

  // Side Delts (Typically Push, though involved in some pulling mechanics)
  'DB Lateral Raise': 'Push',
  'Cable Lateral Raise': 'Push',
  'Machine Lateral Raise': 'Push',
  'Leaning Cable Lateral Raise': 'Push',
  'Upright Row': 'Push',
  'TNG Lateral Raise': 'Push',
  'TNG Pure Lateral Raise': 'Push',

  // Rear Delts (Pull)
  'Rear Delt Fly': 'Pull',
  'Reverse Pec Deck': 'Pull',
  'Face Pull': 'Pull',
  'Cable Rear Delt Fly': 'Pull',
  'Chest-Supported Rear Delt Raise': 'Pull',
  'TNG Rear Delt Fly': 'Pull',
  'TNG Pure Rear Delt Fly': 'Pull',

  // Lats (Pull)
  'Pull-Up': 'Pull',
  'Chin-Up': 'Pull',
  'Lat Pulldown': 'Pull',
  'Straight-Arm Pulldown': 'Pull',
  'Single-Arm Lat Pulldown': 'Pull',
  'Chest-supported Row': 'Pull',
  'DB Row': 'Pull',
  'TNG Lat Pulldown': 'Pull',
  'TNG Pure Lat Pulldown': 'Pull',
  'TNG Pulley': 'Pull',
  'TNG Row': 'Pull',
  'TNG Pure Row': 'Pull',

  // Traps (Pull)
  'DB Shrug': 'Pull',
  'Barbell Shrug': 'Pull',
  'Trap Bar Shrug': 'Pull',
  'Farmer Carry': 'Pull',
  'High Pull': 'Pull',

  // Lower Back (Pull)
  'Conventional Deadlift': 'Pull',
  'Romanian Deadlift': 'Pull',
  'Back Extension': 'Pull',
  'Good Morning': 'Pull',
  'Superman Hold': 'Pull',
  'TNG Back Extension': 'Pull',
  'TNG Pure Back Extension': 'Pull',
  'TNG Hyperextension': 'Pull',

  // Forearm (Pull)
  'Wrist Curl': 'Pull',
  'Reverse Wrist Curl': 'Pull',
  'Hammer Curl': 'Pull',
  'Farmer Hold': 'Pull',
  'Plate Pinch Hold': 'Pull',

  // Triceps (Push)
  'Close-Grip Bench Press': 'Push',
  'Skull Crusher': 'Push',
  'Triceps Pushdown': 'Push',
  'Overhead Triceps Extension': 'Push',
  'Cable Overhead Triceps Extension': 'Push',
  'Bench Dip': 'Push',
  'TNG Triceps Pushdown': 'Push',
  'TNG Pure Triceps Pushdown': 'Push',
  'TNG Dip': 'Push',

  // Biceps (Pull)
  'Barbell Curl': 'Pull',
  'EZ-Bar Curl': 'Pull',
  'Incline DB Curl': 'Pull',
  'DB Curl': 'Pull',
  'Preacher Curl': 'Pull',
  'Cable Curl': 'Pull',
  'Concentration Curl': 'Pull',
  'TNG Biceps Curl': 'Pull',
  'TNG Pure Biceps Curl': 'Pull',

  // Abs (Push)
  'Cable Crunch': 'Push',
  'Machine Crunch': 'Push',
  'Rope Crunch': 'Push',
  'Ab Wheel Rollout': 'Push',
  'Decline Crunch': 'Push',
  'Weighted Sit-Up': 'Push',
  'V-Up': 'Push',
  'Leg Raise': 'Pull',
  'Hanging Leg Raise': 'Pull',
  'Decline Leg Raise': 'Pull',
  'Ab Machine': 'Push',
  'Cable Woodchop': 'Push',
  'Landmine Rotation': 'Push',
  'TNG Ab Crunch': 'Push',
  'TNG Pure Ab Crunch': 'Push',
  'TNG Ab Machine': 'Push',
  'TNG Core Rotation': 'Push',
}

export const SPLIT_TO_EXERCISE: Record<Split, StrengthExercise[]> = {
  Push: [
    'DB Bench Press',
    'Incline DB Bench Press',
    'Decline DB Bench Press',
    'Flat Barbell Bench Press',
    'Incline Barbell Bench Press',
    'Decline Barbell Bench Press',
    'Push-Up',
    'Weighted Push-Up',
    'Chest Dip',
    'Incline Machine Chest Press',
    'Machine Chest Press',
    'Cable Fly',
    'Incline Cable Fly',
    'Pec Deck Fly',
    'TNG Chest Press',
    'TNG Pure Chest Press',
    'TNG Pectoral Fly',
    'TNG Pure Pectoral Fly',
    'Barbell Overhead Press',
    'DB Shoulder Press',
    'Arnold Press',
    'Machine Shoulder Press',
    'Front Raise',
    'TNG Shoulder Press',
    'TNG Pure Shoulder Press',
    'DB Lateral Raise',
    'Cable Lateral Raise',
    'Machine Lateral Raise',
    'Leaning Cable Lateral Raise',
    'Upright Row',
    'TNG Lateral Raise',
    'TNG Pure Lateral Raise',
    'Close-Grip Bench Press',
    'Skull Crusher',
    'Triceps Pushdown',
    'Overhead Triceps Extension',
    'Cable Overhead Triceps Extension',
    'Bench Dip',
    'TNG Triceps Pushdown',
    'TNG Pure Triceps Pushdown',
    'TNG Dip',
    'Cable Crunch',
    'Machine Crunch',
    'Rope Crunch',
    'Ab Wheel Rollout',
    'Decline Crunch',
    'Weighted Sit-Up',
    'V-Up',
    'Ab Machine',
    'Cable Woodchop',
    'Landmine Rotation',
    'TNG Ab Crunch',
    'TNG Pure Ab Crunch',
    'TNG Ab Machine',
    'TNG Core Rotation',
  ],
  Pull: [
    'Rear Delt Fly',
    'Reverse Pec Deck',
    'Face Pull',
    'Cable Rear Delt Fly',
    'Chest-Supported Rear Delt Raise',
    'TNG Rear Delt Fly',
    'TNG Pure Rear Delt Fly',
    'Pull-Up',
    'Chin-Up',
    'Lat Pulldown',
    'Straight-Arm Pulldown',
    'Single-Arm Lat Pulldown',
    'Chest-supported Row',
    'DB Row',
    'TNG Lat Pulldown',
    'TNG Pure Lat Pulldown',
    'TNG Pulley',
    'TNG Row',
    'TNG Pure Row',
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
    'TNG Back Extension',
    'TNG Pure Back Extension',
    'TNG Hyperextension',
    'Wrist Curl',
    'Reverse Wrist Curl',
    'Hammer Curl',
    'Farmer Hold',
    'Plate Pinch Hold',
    'Barbell Curl',
    'EZ-Bar Curl',
    'Incline DB Curl',
    'DB Curl',
    'Preacher Curl',
    'Cable Curl',
    'Concentration Curl',
    'TNG Biceps Curl',
    'TNG Pure Biceps Curl',
    'Leg Raise',
    'Hanging Leg Raise',
    'Decline Leg Raise',
  ],
}

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
  'Incline Machine Chest Press',
  'Cable Fly',
  'Incline Cable Fly',
  'Pec Deck Fly',
  'TNG Chest Press',
  'TNG Pure Chest Press',
  'TNG Pectoral Fly',
  'TNG Pure Pectoral Fly',
  'Barbell Overhead Press',
  'DB Shoulder Press',
  'Arnold Press',
  'Machine Shoulder Press',
  'Front Raise',
  'TNG Shoulder Press',
  'TNG Pure Shoulder Press',
  'DB Lateral Raise',
  'Cable Lateral Raise',
  'Machine Lateral Raise',
  'Leaning Cable Lateral Raise',
  'Upright Row',
  'TNG Lateral Raise',
  'TNG Pure Lateral Raise',
  'Chest-supported Row',
  'DB Row',
  'Rear Delt Fly',
  'Reverse Pec Deck',
  'Face Pull',
  'Cable Rear Delt Fly',
  'Chest-Supported Rear Delt Raise',
  'TNG Rear Delt Fly',
  'TNG Pure Rear Delt Fly',
  'Pull-Up',
  'Chin-Up',
  'Lat Pulldown',
  'Straight-Arm Pulldown',
  'Single-Arm Lat Pulldown',
  'TNG Lat Pulldown',
  'TNG Pure Lat Pulldown',
  'TNG Pulley',
  'TNG Row',
  'TNG Pure Row',
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
  'TNG Back Extension',
  'TNG Pure Back Extension',
  'TNG Hyperextension',
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
  'TNG Triceps Pushdown',
  'TNG Pure Triceps Pushdown',
  'TNG Dip',
  'Barbell Curl',
  'EZ-Bar Curl',
  'Incline DB Curl',
  'DB Curl',
  'Preacher Curl',
  'Cable Curl',
  'Concentration Curl',
  'TNG Biceps Curl',
  'TNG Pure Biceps Curl',
  'Cable Crunch',
  'Machine Crunch',
  'Rope Crunch',
  'Ab Wheel Rollout',
  'Decline Crunch',
  'Weighted Sit-Up',
  'V-Up',
  'Leg Raise',
  'Hanging Leg Raise',
  'Decline Leg Raise',
  'Ab Machine',
  'Cable Woodchop',
  'Landmine Rotation',
  'TNG Ab Crunch',
  'TNG Pure Ab Crunch',
  'TNG Ab Machine',
  'TNG Core Rotation',
] as const satisfies readonly StrengthExercise[]

export const EXERCISE_TO_MUSCLES = {
  // Chest-focused
  'DB Bench Press': ['Middle chest', 'Front delts', 'Triceps'],
  'Incline DB Bench Press': ['Upper chest', 'Front delts', 'Triceps'],
  'Decline DB Bench Press': ['Lower chest', 'Triceps'],
  'Flat Barbell Bench Press': ['Middle chest', 'Front delts', 'Triceps'],
  'Incline Barbell Bench Press': ['Upper chest', 'Front delts', 'Triceps'],
  'Decline Barbell Bench Press': ['Lower chest', 'Triceps'],
  'Push-Up': ['Middle chest', 'Front delts', 'Triceps', 'Upper Abs'],
  'Weighted Push-Up': ['Middle chest', 'Front delts', 'Triceps', 'Upper Abs'],
  'Chest Dip': ['Lower chest', 'Triceps', 'Front delts'],
  'Machine Chest Press': ['Middle chest', 'Front delts', 'Triceps'],
  'Incline Machine Chest Press': ['Upper chest', 'Front delts', 'Triceps'],
  'Cable Fly': ['Middle chest'],
  'Incline Cable Fly': ['Upper chest'],
  'Pec Deck Fly': ['Middle chest'],
  'TNG Chest Press': ['Middle chest', 'Front delts', 'Triceps'],
  'TNG Pure Chest Press': ['Middle chest', 'Front delts', 'Triceps'],
  'TNG Pectoral Fly': ['Middle chest'],
  'TNG Pure Pectoral Fly': ['Middle chest'],

  // Front delts
  'Barbell Overhead Press': ['Front delts', 'Triceps', 'Side delts'],
  'DB Shoulder Press': ['Front delts', 'Triceps', 'Side delts'],
  'Arnold Press': ['Front delts', 'Side delts', 'Triceps'],
  'Machine Shoulder Press': ['Front delts', 'Triceps', 'Side delts'],
  'Front Raise': ['Front delts'],
  'TNG Shoulder Press': ['Front delts', 'Triceps', 'Side delts'],
  'TNG Pure Shoulder Press': ['Front delts', 'Triceps', 'Side delts'],

  // Side delts
  'DB Lateral Raise': ['Side delts'],
  'Cable Lateral Raise': ['Side delts'],
  'Machine Lateral Raise': ['Side delts'],
  'Leaning Cable Lateral Raise': ['Side delts'],
  'Upright Row': ['Side delts', 'Traps'],
  'TNG Lateral Raise': ['Side delts'],
  'TNG Pure Lateral Raise': ['Side delts'],

  // Rear delts
  'Rear Delt Fly': ['Rear delts'],
  'Reverse Pec Deck': ['Rear delts'],
  'Face Pull': ['Rear delts', 'Traps'],
  'Cable Rear Delt Fly': ['Rear delts'],
  'Chest-Supported Rear Delt Raise': ['Rear delts'],
  'TNG Rear Delt Fly': ['Rear delts'],
  'TNG Pure Rear Delt Fly': ['Rear delts'],

  // Lats / upper back pulling
  'Pull-Up': ['Lats', 'Biceps', 'Forearm'],
  'Chin-Up': ['Lats', 'Biceps', 'Forearm'],
  'Lat Pulldown': ['Lats', 'Biceps', 'Forearm'],
  'Straight-Arm Pulldown': ['Lats'],
  'Single-Arm Lat Pulldown': ['Lats', 'Biceps'],
  'Chest-supported Row': ['Lats', 'Traps'],
  'DB Row': ['Lats', 'Triceps'],
  'TNG Lat Pulldown': ['Lats', 'Biceps', 'Forearm'],
  'TNG Pure Lat Pulldown': ['Lats', 'Biceps', 'Forearm'],
  'TNG Pulley': ['Lats', 'Biceps'],
  'TNG Row': ['Lats', 'Traps'],
  'TNG Pure Row': ['Lats', 'Traps'],

  // Traps
  'DB Shrug': ['Traps', 'Forearm'],
  'Barbell Shrug': ['Traps', 'Forearm'],
  'Trap Bar Shrug': ['Traps', 'Forearm'],
  'Farmer Carry': ['Traps', 'Forearm', 'Obliques'],
  'High Pull': ['Traps', 'Side delts'],

  // Lower back / posterior chain
  'Conventional Deadlift': ['Lower back', 'Traps', 'Forearm', 'Lower Abs'],
  'Romanian Deadlift': ['Lower back', 'Forearm'],
  'Good Morning': ['Lower back', 'Lower Abs'],
  'Back Extension': ['Lower back'],
  'Superman Hold': ['Lower back'],
  'TNG Back Extension': ['Lower back'],
  'TNG Pure Back Extension': ['Lower back'],
  'TNG Hyperextension': ['Lower back'],

  // Forearm
  'Wrist Curl': ['Forearm'],
  'Reverse Wrist Curl': ['Forearm'],
  'Hammer Curl': ['Biceps', 'Forearm'],
  'Farmer Hold': ['Forearm', 'Traps', 'Obliques'],
  'Plate Pinch Hold': ['Forearm'],

  // Triceps
  'Close-Grip Bench Press': ['Triceps', 'Middle chest', 'Front delts'],
  'Skull Crusher': ['Triceps'],
  'Triceps Pushdown': ['Triceps'],
  'Overhead Triceps Extension': ['Triceps'],
  'Cable Overhead Triceps Extension': ['Triceps'],
  'Bench Dip': ['Triceps', 'Lower chest', 'Front delts'],
  'TNG Triceps Pushdown': ['Triceps'],
  'TNG Pure Triceps Pushdown': ['Triceps'],
  'TNG Dip': ['Triceps', 'Lower chest', 'Front delts'],

  // Biceps
  'Barbell Curl': ['Biceps', 'Forearm'],
  'EZ-Bar Curl': ['Biceps', 'Forearm'],
  'Incline DB Curl': ['Biceps'],
  'DB Curl': ['Biceps'],
  'Preacher Curl': ['Biceps'],
  'Cable Curl': ['Biceps'],
  'Concentration Curl': ['Biceps'],
  'TNG Biceps Curl': ['Biceps', 'Forearm'],
  'TNG Pure Biceps Curl': ['Biceps', 'Forearm'],

  // Abs
  'Cable Crunch': ['Upper Abs'],
  'Machine Crunch': ['Upper Abs'],
  'Rope Crunch': ['Upper Abs'],
  'Ab Wheel Rollout': ['Upper Abs', 'Lower Abs'],
  'Decline Crunch': ['Upper Abs'],
  'Weighted Sit-Up': ['Upper Abs', 'Lower Abs'],
  'V-Up': ['Upper Abs', 'Lower Abs'],
  'Leg Raise': ['Lower Abs', 'Obliques'],
  'Hanging Leg Raise': ['Lower Abs', 'Obliques'],
  'Decline Leg Raise': ['Lower Abs', 'Obliques'],
  'Ab Machine': ['Upper Abs', 'Lower Abs'],
  'Cable Woodchop': ['Obliques'],
  'Landmine Rotation': ['Obliques'],
  'TNG Ab Crunch': ['Upper Abs'],
  'TNG Pure Ab Crunch': ['Upper Abs'],
  'TNG Ab Machine': ['Upper Abs', 'Lower Abs'],
  'TNG Core Rotation': ['Obliques'],
} as const satisfies Record<StrengthExercise, readonly MuscleGroup[]>

// Optional helper map: muscle -> exercises
export const MUSCLE_TO_EXERCISES: Record<MuscleGroup, StrengthExercise[]> = {
  'Upper chest': [
    'Incline DB Bench Press',
    'Incline Barbell Bench Press',
    'Incline Cable Fly',
    'Incline Machine Chest Press',
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
    'TNG Chest Press',
    'TNG Pure Chest Press',
    'TNG Pectoral Fly',
    'TNG Pure Pectoral Fly',
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
    'TNG Chest Press',
    'TNG Pure Chest Press',
    'TNG Shoulder Press',
    'TNG Pure Shoulder Press',
    'TNG Dip',
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
    'TNG Shoulder Press',
    'TNG Pure Shoulder Press',
    'TNG Lateral Raise',
    'TNG Pure Lateral Raise',
  ],
  'Rear delts': [
    'Rear Delt Fly',
    'Reverse Pec Deck',
    'Face Pull',
    'Cable Rear Delt Fly',
    'Chest-Supported Rear Delt Raise',
    'TNG Rear Delt Fly',
    'TNG Pure Rear Delt Fly',
  ],
  'Upper Abs': [
    'Push-Up',
    'Weighted Push-Up',
    'Cable Crunch',
    'Machine Crunch',
    'Rope Crunch',
    'Ab Wheel Rollout',
    'Decline Crunch',
    'Weighted Sit-Up',
    'V-Up',
    'Ab Machine',
    'TNG Ab Crunch',
    'TNG Pure Ab Crunch',
    'TNG Ab Machine',
  ],
  'Lower Abs': [
    'Conventional Deadlift',
    'Good Morning',
    'Ab Wheel Rollout',
    'Weighted Sit-Up',
    'V-Up',
    'Leg Raise',
    'Hanging Leg Raise',
    'Decline Leg Raise',
    'Ab Machine',
    'TNG Ab Machine',
  ],
  Obliques: [
    'Farmer Carry',
    'Farmer Hold',
    'Leg Raise',
    'Hanging Leg Raise',
    'Decline Leg Raise',
    'Cable Woodchop',
    'Landmine Rotation',
    'TNG Core Rotation',
  ],
  Lats: [
    'Pull-Up',
    'Chin-Up',
    'Lat Pulldown',
    'Straight-Arm Pulldown',
    'Single-Arm Lat Pulldown',
    'Chest-supported Row',
    'DB Row',
    'TNG Lat Pulldown',
    'TNG Pure Lat Pulldown',
    'TNG Pulley',
    'TNG Row',
    'TNG Pure Row',
  ],
  Traps: [
    'Upright Row',
    'Face Pull',
    'DB Shrug',
    'Barbell Shrug',
    'Trap Bar Shrug',
    'Farmer Carry',
    'High Pull',
    'Conventional Deadlift',
    'Farmer Hold',
    'TNG Row',
    'TNG Pure Row',
  ],
  'Lower back': [
    'Conventional Deadlift',
    'Romanian Deadlift',
    'Back Extension',
    'Good Morning',
    'Superman Hold',
    'TNG Back Extension',
    'TNG Pure Back Extension',
    'TNG Hyperextension',
  ],
  Forearm: [
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
    'TNG Lat Pulldown',
    'TNG Pure Lat Pulldown',
    'TNG Biceps Curl',
    'TNG Pure Biceps Curl',
  ],
  Triceps: [
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
    'TNG Chest Press',
    'TNG Pure Chest Press',
    'TNG Shoulder Press',
    'TNG Pure Shoulder Press',
    'TNG Triceps Pushdown',
    'TNG Pure Triceps Pushdown',
    'TNG Dip',
  ],
  Biceps: [
    'Pull-Up',
    'Chin-Up',
    'Lat Pulldown',
    'Single-Arm Lat Pulldown',
    'Hammer Curl',
    'Barbell Curl',
    'EZ-Bar Curl',
    'Incline DB Curl',
    'DB Curl',
    'Preacher Curl',
    'Cable Curl',
    'Concentration Curl',
    'TNG Lat Pulldown',
    'TNG Pure Lat Pulldown',
    'TNG Pulley',
    'TNG Biceps Curl',
    'TNG Pure Biceps Curl',
  ],
}

export interface StrengthRecord {
  id: number
  date: string
  exercise: StrengthExercise
  created_at: string
  sets: number[][]
  muscles: MuscleGroup[]
  one_rep_max: number
  total_volume: number
}

export interface Database {
  public: {
    Tables: {
      strength: {
        Row: StrengthRecord
        Insert: Omit<StrengthRecord, 'id' | 'created_at'>
        Update: Partial<Omit<StrengthRecord, 'id' | 'created_at'>>
      }
    }
  }
}
