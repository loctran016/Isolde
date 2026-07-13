export const WEEK_SCHEDULE = [
  {
    day: 'Monday',
    label: 'Push A (Power/Size)',
    target: 'Upper Chest, Front Delts, Triceps Heavy',
    exercises: [
      {
        display: 'Incline Machine Chest Press',
        canonical: 'Incline Machine Chest Press',
        detail: '4×6–8',
      },
      { display: 'Incline Dumbbell Press', canonical: 'Incline DB Bench Press', detail: '4×6–8' },
      { display: 'Machine Shoulder Press', canonical: 'Machine Shoulder Press', detail: '4×6–8' },
      //   { display: 'Overhead Barbell Press', canonical: 'Barbell Overhead Press', detail: '3×8–10' },
      { display: 'Flat Bench Press', canonical: 'Flat Barbell Bench Press', detail: '3×8–10' },
      { display: 'Dumbbell Lateral Raises', canonical: 'DB Lateral Raise', detail: '4×12–15' },
      { display: 'Heavy Weighted Dips', canonical: 'Chest Dip', detail: '3×8–10' },
    ],
  },
  {
    day: 'Tuesday',
    label: 'Pull A (Width/Thickness)',
    target: 'Upper Lats, Mid-Back, Biceps Heavy',
    exercises: [
      { display: 'Pull-Ups', canonical: 'Pull-Up', detail: '4×max' },
      { display: 'Lat Pulldowns (Wide Grip)', canonical: 'Lat Pulldown', detail: '4×8–10' },
      { display: 'Chest-Supported T-Bar Row', canonical: 'Chest-supported Row', detail: '3×8–10' },
      { display: 'Seated Cable Row', canonical: 'DB Row', detail: '3×10–12', isApproximate: true },
      { display: 'Standing Barbell Curls', canonical: 'Barbell Curl', detail: '3×8–10' },
      { display: 'Hammer Curls', canonical: 'Hammer Curl', detail: '3×10–12' },
    ],
  },
  {
    day: 'Wednesday',
    label: 'Mid-Week Mobility & Core',
    note: 'Planks, hanging knee raises, bird-dogs, Pigeon Pose, Butterfly Stretch — not logged here, this app only tracks weighted strength sets.',
  },
  {
    day: 'Thursday',
    label: 'Push B (Sculpt/Pump)',
    target: 'Mid/Lower Chest, Side Delts, Tricep Isolation',
    exercises: [
      {
        display: 'Decline Bench Press',
        canonical: 'Decline Barbell Bench Press',
        detail: '3×12–15',
      },
      {
        display: 'Incline Machine Chest Press',
        canonical: 'Incline Machine Chest Press',
        detail: '3×10–12',
        isApproximate: true,
      },
      { display: 'Cable Lateral Raises', canonical: 'Cable Lateral Raise', detail: '4×15' },
      { display: 'Tricep Rope Pushdowns', canonical: 'Triceps Pushdown', detail: '4×12–15' },
    ],
  },
  {
    day: 'Friday',
    label: 'Pull B (Detail/Arms)',
    target: 'Lower Lats, Rear Delts, Arm Volume',
    exercises: [
      { display: 'Pull-Ups', canonical: 'Pull-Up', detail: '4×max' },
      { display: 'Single-Arm DB Row', canonical: 'DB Row', detail: '3×10–12/side' },
      { display: 'Dumbbell Rear Delt Flyes', canonical: 'Rear Delt Fly', detail: '4×15' },
      { display: 'Incline Dumbbell Curls', canonical: 'Incline DB Curl', detail: '3×12' },
      { display: 'Preacher Curls', canonical: 'Preacher Curl', detail: '3×12' },
    ],
  },
  {
    day: 'Saturday',
    label: 'Flex Cardio & Lotus (Optional)',
    note: 'Incline treadmill 20 min + Frog Pose stretch — skip if needed, not logged here.',
  },
  { day: 'Sunday', label: 'Rest', note: 'Complete recovery.' },
]
