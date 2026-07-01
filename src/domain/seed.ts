import type { AppData, Equipment, Exercise, Gym } from "./types";

const equipmentRows = [
  ["barbell", "Barbell"],
  ["dumbbell", "Dumbbell"],
  ["bench", "Bench"],
  ["squat_rack", "Squat rack"],
  ["cable", "Cable station"],
  ["lat_pulldown", "Lat pulldown"],
  ["seated_row_machine", "Seated row machine"],
  ["leg_press", "Leg press"],
  ["smith", "Smith machine"],
  ["mat", "Mat"],
  ["treadmill", "Treadmill"],
  ["bike", "Bike"],
  ["rower", "Rower"],
  ["bands", "Bands"],
  ["shoulder_press_machine", "Shoulder press machine"],
  ["chest_press_machine", "Chest press machine"],
  ["ez_bar", "EZ bar"],
  ["pullup_bar", "Pull-up bar"]
] as const;

export const equipment: Equipment[] = equipmentRows.map(([id, label]) => ({ id, label }));

const ex = (
  id: string,
  name: string,
  pattern: string,
  muscles: string[],
  gear: string[],
  substitutes: string[],
  cue: string,
  risk: string
): Exercise => ({ id, name, pattern, muscles, equipment: gear, substitutes, cue, risk });

export const exercises: Exercise[] = [
  ex("barbell_squat", "Barbell squat", "squat", ["quads", "glutes", "core"], ["barbell", "squat_rack"], ["goblet_squat", "leg_press", "smith_squat"], "Brace, keep knees tracking over toes.", "Reduce depth or load if knee pain appears."),
  ex("goblet_squat", "Goblet squat", "squat", ["quads", "glutes"], ["dumbbell"], ["barbell_squat", "leg_press"], "Keep the dumbbell close to the chest.", "Load may become limiting before legs."),
  ex("leg_press", "Leg press", "squat", ["quads", "glutes"], ["leg_press"], ["goblet_squat", "barbell_squat"], "Press through mid-foot and avoid knee collapse.", "Avoid excessive depth if lower back rounds."),
  ex("smith_squat", "Smith squat", "squat", ["quads", "glutes"], ["smith"], ["goblet_squat", "leg_press"], "Use a stable stance and controlled depth.", "Do not force an uncomfortable bar path."),
  ex("bench_press", "Barbell bench press", "horizontal_push", ["chest", "triceps"], ["barbell", "bench"], ["dumbbell_bench_press", "push_up", "machine_chest_press"], "Set shoulder blades and control the descent.", "Switch grip or substitute if shoulder pain appears."),
  ex("dumbbell_bench_press", "Dumbbell bench press", "horizontal_push", ["chest", "triceps"], ["dumbbell", "bench"], ["bench_press", "push_up"], "Use a neutral wrist and smooth press.", "Neutral grip can help if shoulders feel irritated."),
  ex("push_up", "Push-up", "horizontal_push", ["chest", "triceps", "core"], ["mat"], ["dumbbell_bench_press"], "Keep the body in one line.", "Elevate hands or kneel to reduce difficulty."),
  ex("machine_chest_press", "Machine chest press", "horizontal_push", ["chest", "triceps"], ["chest_press_machine"], ["dumbbell_bench_press", "push_up"], "Adjust seat so handles start around mid-chest.", "Keep shoulder position comfortable."),
  ex("lat_pulldown", "Lat pulldown", "vertical_pull", ["lats", "biceps"], ["lat_pulldown"], ["pull_up", "band_pulldown"], "Depress shoulder blades before pulling.", "Use assistance if forearms limit the set."),
  ex("pull_up", "Pull-up", "vertical_pull", ["lats", "biceps"], ["pullup_bar"], ["lat_pulldown", "band_pulldown"], "Pull chest toward the bar without shrugging.", "Reduce volume if elbows or shoulders complain."),
  ex("band_pulldown", "Band pulldown", "vertical_pull", ["lats"], ["bands"], ["lat_pulldown"], "Keep shoulder control and pause at contraction.", "Good option when equipment is limited."),
  ex("seated_cable_row", "Seated cable row", "horizontal_pull", ["back", "biceps"], ["cable"], ["one_arm_dumbbell_row", "band_row"], "Stay tall and pull elbows back.", "Avoid using lower back momentum."),
  ex("one_arm_dumbbell_row", "One-arm dumbbell row", "horizontal_pull", ["back", "biceps"], ["dumbbell", "bench"], ["seated_cable_row", "band_row"], "Stabilize torso and pull elbow toward hip.", "Lower load if low back takes over."),
  ex("band_row", "Band row", "horizontal_pull", ["back"], ["bands"], ["seated_cable_row"], "Squeeze shoulder blades at the end.", "Add reps if resistance is light."),
  ex("dumbbell_shoulder_press", "Dumbbell shoulder press", "vertical_push", ["shoulders", "triceps"], ["dumbbell", "bench"], ["machine_shoulder_press"], "Use a stable torso and comfortable range.", "Lower angle or load if shoulder pain appears."),
  ex("machine_shoulder_press", "Machine shoulder press", "vertical_push", ["shoulders"], ["shoulder_press_machine"], ["dumbbell_shoulder_press"], "Set seat height to match shoulder path.", "Do not lock into painful joint positions."),
  ex("dumbbell_rdl", "Dumbbell RDL", "hinge", ["hamstrings", "glutes"], ["dumbbell"], ["barbell_deadlift", "glute_bridge"], "Hinge at hips with neutral spine.", "Do not trade back position for range."),
  ex("barbell_deadlift", "Barbell deadlift", "hinge", ["hamstrings", "glutes", "back"], ["barbell"], ["dumbbell_rdl", "glute_bridge"], "Brace hard and keep the bar close.", "Avoid heavy pulls when back is irritated."),
  ex("glute_bridge", "Glute bridge", "hip_extension", ["glutes", "core"], ["mat"], ["dumbbell_rdl"], "Pause at the top and keep ribs down.", "Good recovery-day substitute."),
  ex("plank", "Plank", "core_anti_extension", ["core"], ["mat"], ["dead_bug"], "Keep ribs down and pelvis neutral.", "Shorten duration if low back takes over."),
  ex("dead_bug", "Dead bug", "core_anti_extension", ["core"], ["mat"], ["plank"], "Keep lower back gently pressed down.", "Slow quality beats higher reps."),
  ex("treadmill_incline_walk", "Incline treadmill walk", "cardio", ["cardio", "glutes"], ["treadmill"], ["bike_easy", "rower_easy"], "Use a sustainable pace.", "Lower incline if legs are fatigued."),
  ex("bike_easy", "Easy bike", "cardio", ["cardio"], ["bike"], ["treadmill_incline_walk"], "Keep cadence steady.", "Useful for low-impact recovery."),
  ex("rower_easy", "Easy rower", "cardio", ["cardio", "back", "legs"], ["rower"], ["bike_easy"], "Drive legs, hinge, then pull.", "Use caution if low back is sensitive.")
];

export const defaultGyms: Gym[] = [
  { id: "gym_default", name: "Default gym", location: "Full equipment gym", equipment: equipment.map((item) => item.id) },
  { id: "gym_hotel", name: "Hotel gym", location: "Dumbbells, bench, cardio, mat, bands", equipment: ["dumbbell", "bench", "mat", "treadmill", "bike", "bands"] },
  { id: "gym_home", name: "Home / temporary place", location: "Minimal equipment", equipment: ["dumbbell", "bands", "mat"] }
];

export function createDefaultData(): AppData {
  return {
    schemaVersion: 3,
    currentGymId: "gym_default",
    currentGoalId: null,
    gyms: defaultGyms,
    goals: [],
    plan: null,
    sessions: [],
    exerciseLogs: [],
    metrics: [],
    nutritionLogs: [],
    advice: [],
    revisions: [],
    backupSnapshots: []
  };
}
