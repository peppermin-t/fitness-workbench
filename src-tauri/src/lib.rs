use rusqlite::{params, Connection, OptionalExtension};
use serde_json::{json, Value};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const DB_FILE_NAME: &str = "fitness-workbench.sqlite3";
const STRUCTURED_SCHEMA_MIGRATION: &str = "002_structured_source_of_truth";

const STRUCTURED_SCHEMA_SQL: &str = r#"
DROP TABLE IF EXISTS app_meta;
DROP TABLE IF EXISTS goals;
DROP TABLE IF EXISTS gyms;
DROP TABLE IF EXISTS gym_equipment;
DROP TABLE IF EXISTS training_plans;
DROP TABLE IF EXISTS workout_days;
DROP TABLE IF EXISTS planned_exercises;
DROP TABLE IF EXISTS workout_sessions;
DROP TABLE IF EXISTS exercise_logs;
DROP TABLE IF EXISTS set_logs;
DROP TABLE IF EXISTS body_metrics;
DROP TABLE IF EXISTS nutrition_logs;
DROP TABLE IF EXISTS advice;
DROP TABLE IF EXISTS revisions;
DROP TABLE IF EXISTS backup_snapshots;
DROP TABLE IF EXISTS app_settings;

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  primary_goal TEXT NOT NULL,
  primary_goal_label TEXT NOT NULL,
  secondary_goal TEXT,
  secondary_goal_label TEXT,
  target_weight REAL,
  training_days_per_week INTEGER NOT NULL,
  session_duration_minutes INTEGER NOT NULL,
  frequent_travel INTEGER NOT NULL DEFAULT 0,
  convenience_priority INTEGER NOT NULL DEFAULT 0,
  parsed_json TEXT NOT NULL
);

CREATE TABLE gyms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT
);

CREATE TABLE gym_equipment (
  gym_id TEXT NOT NULL,
  equipment_id TEXT NOT NULL,
  PRIMARY KEY (gym_id, equipment_id),
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE
);

CREATE TABLE training_plans (
  id TEXT PRIMARY KEY,
  generated_at TEXT NOT NULL,
  goal_label TEXT NOT NULL,
  gym_name TEXT NOT NULL,
  metric_summary TEXT NOT NULL,
  notes_json TEXT NOT NULL
);

CREATE TABLE workout_days (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  day_index INTEGER NOT NULL,
  type TEXT NOT NULL,
  focus TEXT NOT NULL,
  intent TEXT NOT NULL,
  FOREIGN KEY (plan_id) REFERENCES training_plans(id) ON DELETE CASCADE
);

CREATE TABLE planned_exercises (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL,
  day_index INTEGER NOT NULL,
  row_index INTEGER NOT NULL,
  exercise_id TEXT NOT NULL,
  sets_text TEXT NOT NULL,
  reps_text TEXT NOT NULL,
  load_text TEXT NOT NULL,
  rpe_text TEXT NOT NULL,
  rest_text TEXT NOT NULL,
  notes TEXT NOT NULL,
  FOREIGN KEY (day_id) REFERENCES workout_days(id) ON DELETE CASCADE
);

CREATE TABLE workout_sessions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL,
  gym_id TEXT,
  gym_name TEXT NOT NULL,
  plan_id TEXT,
  day_index INTEGER NOT NULL,
  focus TEXT NOT NULL,
  completion REAL,
  rpe REAL,
  pain_score REAL,
  pain_area TEXT NOT NULL,
  sleep REAL,
  fatigue REAL,
  notes TEXT NOT NULL,
  exercise_log_ids_json TEXT NOT NULL
);

CREATE INDEX idx_workout_sessions_date ON workout_sessions(date);
CREATE INDEX idx_workout_sessions_status ON workout_sessions(status);

CREATE TABLE exercise_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  session_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  day_index INTEGER NOT NULL,
  focus TEXT NOT NULL,
  planned_sets TEXT NOT NULL,
  planned_reps TEXT NOT NULL,
  planned_load TEXT NOT NULL,
  planned_rpe TEXT NOT NULL,
  actual_load TEXT NOT NULL,
  actual_reps TEXT NOT NULL,
  volume_load REAL NOT NULL,
  hard_sets INTEGER NOT NULL,
  rpe REAL NOT NULL,
  quality TEXT NOT NULL,
  range_of_motion TEXT NOT NULL,
  target_muscle_feel TEXT NOT NULL,
  limiting_factor TEXT NOT NULL,
  side_issue TEXT NOT NULL,
  pain_score REAL NOT NULL,
  pain_area TEXT NOT NULL,
  free_text TEXT NOT NULL,
  analysis_json TEXT NOT NULL
);

CREATE INDEX idx_exercise_logs_session ON exercise_logs(session_id);
CREATE INDEX idx_exercise_logs_exercise ON exercise_logs(exercise_id, date);

CREATE TABLE set_logs (
  id TEXT PRIMARY KEY,
  exercise_log_id TEXT NOT NULL,
  set_index INTEGER NOT NULL,
  load_kg REAL,
  reps INTEGER,
  rpe REAL,
  completed INTEGER NOT NULL,
  note TEXT NOT NULL,
  FOREIGN KEY (exercise_log_id) REFERENCES exercise_logs(id) ON DELETE CASCADE
);

CREATE TABLE body_metrics (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  weight REAL,
  body_fat REAL,
  skeletal_muscle REAL,
  waist REAL,
  notes TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_body_metrics_date ON body_metrics(date);

CREATE TABLE nutrition_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  goal_id TEXT,
  analysis_json TEXT NOT NULL
);

CREATE INDEX idx_nutrition_logs_date ON nutrition_logs(date);

CREATE TABLE advice (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  priority TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT
);

CREATE INDEX idx_advice_status_priority ON advice(status, priority);

CREATE TABLE revisions (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  summary TEXT NOT NULL,
  reason TEXT NOT NULL,
  evidence_json TEXT NOT NULL,
  patch_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  applied_at TEXT
);

CREATE TABLE backup_snapshots (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  reason TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  state_json TEXT NOT NULL
);
"#;

#[tauri::command]
fn load_app_data(app: AppHandle) -> Result<String, String> {
    let conn = open_database(&app)?;
    load_app_data_from_connection(&conn).map(|value| value.to_string())
}

#[tauri::command]
fn save_app_data(app: AppHandle, data_json: String) -> Result<(), String> {
    let mut conn = open_database(&app)?;
    save_app_data_to_connection(&mut conn, &data_json)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![load_app_data, save_app_data])
        .run(tauri::generate_context!())
        .expect("error while running fitness workbench");
}

fn open_database(app: &AppHandle) -> Result<Connection, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Connection::open(database_path(dir)).map_err(|error| error.to_string())
}

fn database_path(mut dir: PathBuf) -> PathBuf {
    dir.push(DB_FILE_NAME);
    dir
}

fn init_schema(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version TEXT PRIMARY KEY,
          applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        "#,
    )
    .map_err(|error| error.to_string())?;
    apply_migration(conn, STRUCTURED_SCHEMA_MIGRATION, STRUCTURED_SCHEMA_SQL)
}

fn apply_migration(conn: &Connection, version: &str, sql: &str) -> Result<(), String> {
    let applied = conn
        .query_row(
            "SELECT version FROM schema_migrations WHERE version = ?1",
            params![version],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .map_err(|error| error.to_string())?
        .is_some();
    if applied {
        return Ok(());
    }
    conn.execute_batch(sql).map_err(|error| error.to_string())?;
    conn.execute(
        "INSERT INTO schema_migrations (version, applied_at) VALUES (?1, datetime('now'))",
        params![version],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

fn save_app_data_to_connection(conn: &mut Connection, data_json: &str) -> Result<(), String> {
    let data: Value = serde_json::from_str(data_json).map_err(|error| error.to_string())?;
    init_schema(conn)?;
    let tx = conn.transaction().map_err(|error| error.to_string())?;
    clear_tables(&tx)?;

    upsert_setting(&tx, "currentGymId", data.get("currentGymId").and_then(Value::as_str))?;
    upsert_setting(&tx, "currentGoalId", data.get("currentGoalId").and_then(Value::as_str))?;

    for goal in array_items(&data, "goals") {
        let parsed = goal.get("parsed").cloned().unwrap_or_else(|| json!({}));
        tx.execute(
            r#"
            INSERT INTO goals (
              id, text, created_at, primary_goal, primary_goal_label, secondary_goal,
              secondary_goal_label, target_weight, training_days_per_week,
              session_duration_minutes, frequent_travel, convenience_priority, parsed_json
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
            "#,
            params![
                json_id(goal, "goal"),
                json_string(goal, "text"),
                json_string(goal, "createdAt"),
                json_nested_string(&parsed, "primaryGoal"),
                json_nested_string(&parsed, "primaryGoalLabel"),
                json_nested_optional_string(&parsed, "secondaryGoal"),
                json_nested_optional_string(&parsed, "secondaryGoalLabel"),
                json_nested_optional_f64(&parsed, "targetWeight"),
                json_nested_i64(&parsed, "trainingDaysPerWeek"),
                json_nested_i64(&parsed, "sessionDurationMinutes"),
                bool_as_i64(json_nested_bool(&parsed, "frequentTravel")),
                bool_as_i64(json_nested_bool(&parsed, "conveniencePriority")),
                parsed.to_string()
            ],
        )
        .map_err(|error| error.to_string())?;
    }

    for gym in array_items(&data, "gyms") {
        let gym_id = json_id(gym, "gym");
        tx.execute(
            "INSERT INTO gyms (id, name, location) VALUES (?1, ?2, ?3)",
            params![gym_id, json_string(gym, "name"), json_optional_string(gym, "location")],
        )
        .map_err(|error| error.to_string())?;
        for equipment_id in string_array(gym, "equipment") {
            tx.execute(
                "INSERT INTO gym_equipment (gym_id, equipment_id) VALUES (?1, ?2)",
                params![json_id(gym, "gym"), equipment_id],
            )
            .map_err(|error| error.to_string())?;
        }
    }

    if let Some(plan) = data.get("plan").filter(|value| value.is_object()) {
        insert_plan(&tx, plan)?;
    }

    for session in array_items(&data, "sessions") {
        tx.execute(
            r#"
            INSERT INTO workout_sessions (
              id, date, created_at, started_at, completed_at, status, gym_id, gym_name, plan_id,
              day_index, focus, completion, rpe, pain_score, pain_area, sleep, fatigue, notes,
              exercise_log_ids_json
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)
            "#,
            params![
                json_id(session, "session"),
                json_string(session, "date"),
                json_string(session, "createdAt"),
                json_string(session, "startedAt"),
                json_optional_string(session, "completedAt"),
                json_string(session, "status"),
                json_optional_string(session, "gymId"),
                json_string(session, "gymName"),
                json_optional_string(session, "planId"),
                json_i64(session, "dayIndex"),
                json_string(session, "focus"),
                json_optional_f64(session, "completion"),
                json_optional_f64(session, "rpe"),
                json_optional_f64(session, "painScore"),
                json_string(session, "painArea"),
                json_optional_f64(session, "sleep"),
                json_optional_f64(session, "fatigue"),
                json_string(session, "notes"),
                json_array_string(session, "exerciseLogIds")
            ],
        )
        .map_err(|error| error.to_string())?;
    }

    for log in array_items(&data, "exerciseLogs") {
        insert_exercise_log(&tx, log)?;
    }
    for metric in array_items(&data, "metrics") {
        tx.execute(
            "INSERT INTO body_metrics (id, date, weight, body_fat, skeletal_muscle, waist, notes, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                json_id(metric, "metric"),
                json_string(metric, "date"),
                json_optional_f64(metric, "weight"),
                json_optional_f64(metric, "bodyFat"),
                json_optional_f64(metric, "skeletalMuscle"),
                json_optional_f64(metric, "waist"),
                json_string(metric, "notes"),
                json_string(metric, "createdAt")
            ],
        )
        .map_err(|error| error.to_string())?;
    }
    for log in array_items(&data, "nutritionLogs") {
        tx.execute(
            "INSERT INTO nutrition_logs (id, date, created_at, raw_text, goal_id, analysis_json) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                json_id(log, "nutrition"),
                json_string(log, "date"),
                json_string(log, "createdAt"),
                json_string(log, "rawText"),
                json_optional_string(log, "goalId"),
                json_object_string(log, "analysis")
            ],
        )
        .map_err(|error| error.to_string())?;
    }
    for item in array_items(&data, "advice") {
        tx.execute(
            r#"
            INSERT INTO advice (
              id, type, priority, title, detail, evidence_json, tags_json, source, status, created_at, expires_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
            "#,
            params![
                json_id(item, "advice"),
                json_string(item, "type"),
                json_string(item, "priority"),
                json_string(item, "title"),
                json_string(item, "detail"),
                json_array_string(item, "evidence"),
                json_array_string(item, "tags"),
                json_string(item, "source"),
                json_string(item, "status"),
                json_string(item, "createdAt"),
                json_optional_string(item, "expiresAt")
            ],
        )
        .map_err(|error| error.to_string())?;
    }
    for item in array_items(&data, "revisions") {
        tx.execute(
            "INSERT INTO revisions (id, status, summary, reason, evidence_json, patch_json, created_at, applied_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                json_id(item, "revision"),
                json_string(item, "status"),
                json_string(item, "summary"),
                json_string(item, "reason"),
                json_array_string(item, "evidence"),
                json_object_string(item, "patch"),
                json_string(item, "createdAt"),
                json_optional_string(item, "appliedAt")
            ],
        )
        .map_err(|error| error.to_string())?;
    }
    for item in array_items(&data, "backupSnapshots") {
        tx.execute(
            "INSERT INTO backup_snapshots (id, created_at, reason, schema_version, state_json) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                json_id(item, "backup"),
                json_string(item, "createdAt"),
                json_string(item, "reason"),
                json_i64(item, "schemaVersion"),
                json_string(item, "stateJson")
            ],
        )
        .map_err(|error| error.to_string())?;
    }

    tx.commit().map_err(|error| error.to_string())
}

fn load_app_data_from_connection(conn: &Connection) -> Result<Value, String> {
    init_schema(conn)?;
    Ok(json!({
        "schemaVersion": 3,
        "currentGymId": setting(conn, "currentGymId")?,
        "currentGoalId": setting(conn, "currentGoalId")?,
        "gyms": load_gyms(conn)?,
        "goals": load_goals(conn)?,
        "plan": load_plan(conn)?,
        "sessions": load_sessions(conn)?,
        "exerciseLogs": load_exercise_logs(conn)?,
        "metrics": load_metrics(conn)?,
        "nutritionLogs": load_nutrition_logs(conn)?,
        "advice": load_advice(conn)?,
        "revisions": load_revisions(conn)?,
        "backupSnapshots": load_backup_snapshots(conn)?
    }))
}

fn clear_tables(conn: &Connection) -> Result<(), String> {
    for table in [
        "backup_snapshots",
        "revisions",
        "advice",
        "nutrition_logs",
        "body_metrics",
        "set_logs",
        "exercise_logs",
        "workout_sessions",
        "planned_exercises",
        "workout_days",
        "training_plans",
        "gym_equipment",
        "gyms",
        "goals",
        "app_settings",
    ] {
        conn.execute(&format!("DELETE FROM {table}"), [])
            .map_err(|error| error.to_string())?;
    }
    Ok(())
}

fn upsert_setting(conn: &Connection, key: &str, value: Option<&str>) -> Result<(), String> {
    conn.execute(
        "INSERT INTO app_settings (key, value, updated_at) VALUES (?1, ?2, datetime('now'))",
        params![key, value],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

fn insert_plan(conn: &Connection, plan: &Value) -> Result<(), String> {
    let plan_id = json_id(plan, "plan");
    let context = plan.get("context").cloned().unwrap_or_else(|| json!({}));
    conn.execute(
        "INSERT INTO training_plans (id, generated_at, goal_label, gym_name, metric_summary, notes_json) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            plan_id,
            json_string(plan, "generatedAt"),
            json_nested_string(&context, "goalLabel"),
            json_nested_string(&context, "gymName"),
            json_nested_string(&context, "metricSummary"),
            json_nested_array_string(&context, "notes")
        ],
    )
    .map_err(|error| error.to_string())?;

    for (day_index, day) in array_items(plan, "days").iter().enumerate() {
        let day_id = json_id(day, "day");
        conn.execute(
            "INSERT INTO workout_days (id, plan_id, day_index, type, focus, intent) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                day_id,
                json_id(plan, "plan"),
                day_index as i64,
                json_string(day, "type"),
                json_string(day, "focus"),
                json_string(day, "intent")
            ],
        )
        .map_err(|error| error.to_string())?;
        for (row_index, row) in array_items(day, "exercises").iter().enumerate() {
            conn.execute(
                r#"
                INSERT INTO planned_exercises (
                  id, day_id, day_index, row_index, exercise_id, sets_text, reps_text,
                  load_text, rpe_text, rest_text, notes
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
                "#,
                params![
                    json_id(row, "planned"),
                    json_id(day, "day"),
                    day_index as i64,
                    row_index as i64,
                    json_string(row, "exerciseId"),
                    json_scalar_string(row, "sets"),
                    json_scalar_string(row, "reps"),
                    json_string(row, "load"),
                    json_scalar_string(row, "rpe"),
                    json_string(row, "rest"),
                    json_string(row, "notes")
                ],
            )
            .map_err(|error| error.to_string())?;
        }
    }
    Ok(())
}

fn insert_exercise_log(conn: &Connection, log: &Value) -> Result<(), String> {
    let log_id = json_id(log, "exercise_log");
    conn.execute(
        r#"
        INSERT INTO exercise_logs (
          id, date, created_at, session_id, exercise_id, exercise_name, day_index, focus,
          planned_sets, planned_reps, planned_load, planned_rpe, actual_load, actual_reps,
          volume_load, hard_sets, rpe, quality, range_of_motion, target_muscle_feel,
          limiting_factor, side_issue, pain_score, pain_area, free_text, analysis_json
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26)
        "#,
        params![
            log_id,
            json_string(log, "date"),
            json_string(log, "createdAt"),
            json_string(log, "sessionId"),
            json_string(log, "exerciseId"),
            json_string(log, "exerciseName"),
            json_i64(log, "dayIndex"),
            json_string(log, "focus"),
            json_scalar_string(log, "plannedSets"),
            json_scalar_string(log, "plannedReps"),
            json_string(log, "plannedLoad"),
            json_scalar_string(log, "plannedRpe"),
            json_string(log, "actualLoad"),
            json_string(log, "actualReps"),
            json_f64(log, "volumeLoad"),
            json_i64(log, "hardSets"),
            json_f64(log, "rpe"),
            json_string(log, "quality"),
            json_string(log, "rangeOfMotion"),
            json_string(log, "targetMuscleFeel"),
            json_string(log, "limitingFactor"),
            json_string(log, "sideIssue"),
            json_f64(log, "painScore"),
            json_string(log, "painArea"),
            json_string(log, "freeText"),
            json_object_string(log, "analysis")
        ],
    )
    .map_err(|error| error.to_string())?;
    for set in array_items(log, "sets") {
        conn.execute(
            "INSERT INTO set_logs (id, exercise_log_id, set_index, load_kg, reps, rpe, completed, note) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                json_id(set, "set"),
                json_id(log, "exercise_log"),
                json_i64(set, "setIndex"),
                json_optional_f64(set, "loadKg"),
                json_optional_i64(set, "reps"),
                json_optional_f64(set, "rpe"),
                bool_as_i64(json_bool(set, "completed")),
                json_string(set, "note")
            ],
        )
        .map_err(|error| error.to_string())?;
    }
    Ok(())
}

fn setting(conn: &Connection, key: &str) -> Result<Value, String> {
    let value = conn
        .query_row(
            "SELECT value FROM app_settings WHERE key = ?1",
            params![key],
            |row| row.get::<_, Option<String>>(0),
        )
        .optional()
        .map_err(|error| error.to_string())?
        .flatten();
    Ok(value.map(Value::String).unwrap_or(Value::Null))
}

fn load_goals(conn: &Connection) -> Result<Vec<Value>, String> {
    let mut stmt = conn
        .prepare("SELECT id, text, created_at, parsed_json FROM goals ORDER BY created_at DESC")
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            let parsed_json: String = row.get(3)?;
            let parsed = parse_value(&parsed_json);
            Ok(json!({
                "id": row.get::<_, String>(0)?,
                "text": row.get::<_, String>(1)?,
                "createdAt": row.get::<_, String>(2)?,
                "parsed": parsed
            }))
        })
        .map_err(|error| error.to_string())?;
    collect_rows(rows)
}

fn load_gyms(conn: &Connection) -> Result<Vec<Value>, String> {
    let mut stmt = conn
        .prepare("SELECT id, name, location FROM gyms ORDER BY rowid")
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            let id: String = row.get(0)?;
            Ok(json!({
                "id": id,
                "name": row.get::<_, String>(1)?,
                "location": row.get::<_, Option<String>>(2)?.unwrap_or_default(),
                "equipment": load_gym_equipment_row(conn, &id).unwrap_or_default()
            }))
        })
        .map_err(|error| error.to_string())?;
    collect_rows(rows)
}

fn load_gym_equipment_row(conn: &Connection, gym_id: &str) -> Result<Vec<String>, String> {
    let mut stmt = conn
        .prepare("SELECT equipment_id FROM gym_equipment WHERE gym_id = ?1 ORDER BY rowid")
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map(params![gym_id], |row| row.get::<_, String>(0))
        .map_err(|error| error.to_string())?;
    collect_rows(rows)
}

fn load_plan(conn: &Connection) -> Result<Value, String> {
    let plan = conn
        .query_row(
            "SELECT id, generated_at, goal_label, gym_name, metric_summary, notes_json FROM training_plans ORDER BY rowid DESC LIMIT 1",
            [],
            |row| {
                let id: String = row.get(0)?;
                let notes_json: String = row.get(5)?;
                Ok(json!({
                    "id": id,
                    "generatedAt": row.get::<_, String>(1)?,
                    "context": {
                        "goalLabel": row.get::<_, String>(2)?,
                        "gymName": row.get::<_, String>(3)?,
                        "metricSummary": row.get::<_, String>(4)?,
                        "notes": parse_value(&notes_json)
                    },
                    "days": load_days_row(conn, &id).unwrap_or_default()
                }))
            },
        )
        .optional()
        .map_err(|error| error.to_string())?;
    Ok(plan.unwrap_or(Value::Null))
}

fn load_days_row(conn: &Connection, plan_id: &str) -> Result<Vec<Value>, String> {
    let mut stmt = conn
        .prepare("SELECT id, day_index, type, focus, intent FROM workout_days WHERE plan_id = ?1 ORDER BY day_index")
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map(params![plan_id], |row| {
            let id: String = row.get(0)?;
            Ok(json!({
                "id": id,
                "type": row.get::<_, String>(2)?,
                "focus": row.get::<_, String>(3)?,
                "intent": row.get::<_, String>(4)?,
                "exercises": load_planned_exercises_row(conn, &id).unwrap_or_default()
            }))
        })
        .map_err(|error| error.to_string())?;
    collect_rows(rows)
}

fn load_planned_exercises_row(conn: &Connection, day_id: &str) -> Result<Vec<Value>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, exercise_id, sets_text, reps_text, load_text, rpe_text, rest_text, notes FROM planned_exercises WHERE day_id = ?1 ORDER BY row_index",
        )
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map(params![day_id], |row| {
            Ok(json!({
                "id": row.get::<_, String>(0)?,
                "exerciseId": row.get::<_, String>(1)?,
                "sets": parse_scalar(&row.get::<_, String>(2)?),
                "reps": parse_scalar(&row.get::<_, String>(3)?),
                "load": row.get::<_, String>(4)?,
                "rpe": parse_scalar(&row.get::<_, String>(5)?),
                "rest": row.get::<_, String>(6)?,
                "notes": row.get::<_, String>(7)?
            }))
        })
        .map_err(|error| error.to_string())?;
    collect_rows(rows)
}

fn load_sessions(conn: &Connection) -> Result<Vec<Value>, String> {
    let mut stmt = conn
        .prepare(
            r#"
            SELECT id, date, created_at, started_at, completed_at, status, gym_id, gym_name,
                   plan_id, day_index, focus, completion, rpe, pain_score, pain_area, sleep,
                   fatigue, notes, exercise_log_ids_json
            FROM workout_sessions ORDER BY date DESC, created_at DESC
            "#,
        )
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            let ids_json: String = row.get(18)?;
            Ok(json!({
                "id": row.get::<_, String>(0)?,
                "date": row.get::<_, String>(1)?,
                "createdAt": row.get::<_, String>(2)?,
                "startedAt": row.get::<_, String>(3)?,
                "completedAt": row.get::<_, Option<String>>(4)?,
                "status": row.get::<_, String>(5)?,
                "gymId": row.get::<_, Option<String>>(6)?,
                "gymName": row.get::<_, String>(7)?,
                "planId": row.get::<_, Option<String>>(8)?,
                "dayIndex": row.get::<_, i64>(9)?,
                "focus": row.get::<_, String>(10)?,
                "completion": row.get::<_, Option<f64>>(11)?,
                "rpe": row.get::<_, Option<f64>>(12)?,
                "painScore": row.get::<_, Option<f64>>(13)?,
                "painArea": row.get::<_, String>(14)?,
                "sleep": row.get::<_, Option<f64>>(15)?,
                "fatigue": row.get::<_, Option<f64>>(16)?,
                "notes": row.get::<_, String>(17)?,
                "exerciseLogIds": parse_value(&ids_json)
            }))
        })
        .map_err(|error| error.to_string())?;
    collect_rows(rows)
}

fn load_exercise_logs(conn: &Connection) -> Result<Vec<Value>, String> {
    let mut stmt = conn
        .prepare(
            r#"
            SELECT id, date, created_at, session_id, exercise_id, exercise_name, day_index, focus,
                   planned_sets, planned_reps, planned_load, planned_rpe, actual_load, actual_reps,
                   volume_load, hard_sets, rpe, quality, range_of_motion, target_muscle_feel,
                   limiting_factor, side_issue, pain_score, pain_area, free_text, analysis_json
            FROM exercise_logs ORDER BY date DESC, created_at DESC
            "#,
        )
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            let id: String = row.get(0)?;
            let analysis_json: String = row.get(25)?;
            Ok(json!({
                "id": id,
                "date": row.get::<_, String>(1)?,
                "createdAt": row.get::<_, String>(2)?,
                "sessionId": row.get::<_, String>(3)?,
                "exerciseId": row.get::<_, String>(4)?,
                "exerciseName": row.get::<_, String>(5)?,
                "dayIndex": row.get::<_, i64>(6)?,
                "focus": row.get::<_, String>(7)?,
                "plannedSets": parse_scalar(&row.get::<_, String>(8)?),
                "plannedReps": parse_scalar(&row.get::<_, String>(9)?),
                "plannedLoad": row.get::<_, String>(10)?,
                "plannedRpe": parse_scalar(&row.get::<_, String>(11)?),
                "actualLoad": row.get::<_, String>(12)?,
                "actualReps": row.get::<_, String>(13)?,
                "sets": load_set_logs_row(conn, &id).unwrap_or_default(),
                "volumeLoad": row.get::<_, f64>(14)?,
                "hardSets": row.get::<_, i64>(15)?,
                "rpe": row.get::<_, f64>(16)?,
                "quality": row.get::<_, String>(17)?,
                "rangeOfMotion": row.get::<_, String>(18)?,
                "targetMuscleFeel": row.get::<_, String>(19)?,
                "limitingFactor": row.get::<_, String>(20)?,
                "sideIssue": row.get::<_, String>(21)?,
                "painScore": row.get::<_, f64>(22)?,
                "painArea": row.get::<_, String>(23)?,
                "freeText": row.get::<_, String>(24)?,
                "analysis": parse_value(&analysis_json)
            }))
        })
        .map_err(|error| error.to_string())?;
    collect_rows(rows)
}

fn load_set_logs_row(conn: &Connection, log_id: &str) -> Result<Vec<Value>, String> {
    let mut stmt = conn
        .prepare("SELECT id, set_index, load_kg, reps, rpe, completed, note FROM set_logs WHERE exercise_log_id = ?1 ORDER BY set_index")
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map(params![log_id], |row| {
            Ok(json!({
                "id": row.get::<_, String>(0)?,
                "setIndex": row.get::<_, i64>(1)?,
                "loadKg": row.get::<_, Option<f64>>(2)?,
                "reps": row.get::<_, Option<i64>>(3)?,
                "rpe": row.get::<_, Option<f64>>(4)?,
                "completed": row.get::<_, i64>(5)? == 1,
                "note": row.get::<_, String>(6)?
            }))
        })
        .map_err(|error| error.to_string())?;
    collect_rows(rows)
}

fn load_metrics(conn: &Connection) -> Result<Vec<Value>, String> {
    let mut stmt = conn
        .prepare("SELECT id, date, weight, body_fat, skeletal_muscle, waist, notes, created_at FROM body_metrics ORDER BY date DESC")
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(json!({
                "id": row.get::<_, String>(0)?,
                "date": row.get::<_, String>(1)?,
                "weight": row.get::<_, Option<f64>>(2)?,
                "bodyFat": row.get::<_, Option<f64>>(3)?,
                "skeletalMuscle": row.get::<_, Option<f64>>(4)?,
                "waist": row.get::<_, Option<f64>>(5)?,
                "notes": row.get::<_, String>(6)?,
                "createdAt": row.get::<_, String>(7)?
            }))
        })
        .map_err(|error| error.to_string())?;
    collect_rows(rows)
}

fn load_nutrition_logs(conn: &Connection) -> Result<Vec<Value>, String> {
    load_rows_with_json(
        conn,
        "SELECT id, date, created_at, raw_text, goal_id, analysis_json FROM nutrition_logs ORDER BY date DESC, created_at DESC",
        |columns| {
            json!({
                "id": columns[0].clone(),
                "date": columns[1].clone(),
                "createdAt": columns[2].clone(),
                "rawText": columns[3].clone(),
                "goalId": nullable_string(&columns[4]),
                "analysis": parse_value(&columns[5])
            })
        },
    )
}

fn load_advice(conn: &Connection) -> Result<Vec<Value>, String> {
    load_rows_with_json(
        conn,
        "SELECT id, type, priority, title, detail, evidence_json, tags_json, source, status, created_at, expires_at FROM advice ORDER BY created_at DESC",
        |columns| {
            json!({
                "id": columns[0].clone(),
                "type": columns[1].clone(),
                "priority": columns[2].clone(),
                "title": columns[3].clone(),
                "detail": columns[4].clone(),
                "evidence": parse_value(&columns[5]),
                "tags": parse_value(&columns[6]),
                "source": columns[7].clone(),
                "status": columns[8].clone(),
                "createdAt": columns[9].clone(),
                "expiresAt": nullable_string(&columns[10])
            })
        },
    )
}

fn load_revisions(conn: &Connection) -> Result<Vec<Value>, String> {
    load_rows_with_json(
        conn,
        "SELECT id, status, summary, reason, evidence_json, patch_json, created_at, applied_at FROM revisions ORDER BY created_at DESC",
        |columns| {
            json!({
                "id": columns[0].clone(),
                "status": columns[1].clone(),
                "summary": columns[2].clone(),
                "reason": columns[3].clone(),
                "evidence": parse_value(&columns[4]),
                "patch": parse_value(&columns[5]),
                "createdAt": columns[6].clone(),
                "appliedAt": nullable_string(&columns[7])
            })
        },
    )
}

fn load_backup_snapshots(conn: &Connection) -> Result<Vec<Value>, String> {
    let mut stmt = conn
        .prepare("SELECT id, created_at, reason, schema_version, state_json FROM backup_snapshots ORDER BY created_at DESC LIMIT 20")
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(json!({
                "id": row.get::<_, String>(0)?,
                "createdAt": row.get::<_, String>(1)?,
                "reason": row.get::<_, String>(2)?,
                "schemaVersion": row.get::<_, i64>(3)?,
                "stateJson": row.get::<_, String>(4)?
            }))
        })
        .map_err(|error| error.to_string())?;
    collect_rows(rows)
}

fn load_rows_with_json<F>(conn: &Connection, sql: &str, mapper: F) -> Result<Vec<Value>, String>
where
    F: Fn(Vec<String>) -> Value,
{
    let mut stmt = conn.prepare(sql).map_err(|error| error.to_string())?;
    let column_count = stmt.column_count();
    let rows = stmt
        .query_map([], |row| {
            let mut columns = Vec::with_capacity(column_count);
            for index in 0..column_count {
                columns.push(row.get::<_, Option<String>>(index)?.unwrap_or_default());
            }
            Ok(mapper(columns))
        })
        .map_err(|error| error.to_string())?;
    collect_rows(rows)
}

fn collect_rows<T>(rows: rusqlite::MappedRows<'_, impl FnMut(&rusqlite::Row<'_>) -> rusqlite::Result<T>>) -> Result<Vec<T>, String> {
    let mut values = Vec::new();
    for row in rows {
        values.push(row.map_err(|error| error.to_string())?);
    }
    Ok(values)
}

fn array_items<'a>(state: &'a Value, key: &str) -> &'a [Value] {
    state
        .get(key)
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .unwrap_or(&[])
}

fn json_id(value: &Value, fallback: &str) -> String {
    value
        .get("id")
        .and_then(Value::as_str)
        .map(ToOwned::to_owned)
        .unwrap_or_else(|| fallback.to_owned())
}

fn json_string(value: &Value, key: &str) -> String {
    value.get(key).and_then(Value::as_str).unwrap_or_default().to_owned()
}

fn json_optional_string(value: &Value, key: &str) -> Option<String> {
    value.get(key).and_then(Value::as_str).map(ToOwned::to_owned)
}

fn json_nested_string(value: &Value, key: &str) -> String {
    json_string(value, key)
}

fn json_nested_optional_string(value: &Value, key: &str) -> Option<String> {
    json_optional_string(value, key)
}

fn json_i64(value: &Value, key: &str) -> i64 {
    value.get(key).and_then(Value::as_i64).unwrap_or_default()
}

fn json_optional_i64(value: &Value, key: &str) -> Option<i64> {
    value.get(key).and_then(Value::as_i64)
}

fn json_f64(value: &Value, key: &str) -> f64 {
    value.get(key).and_then(Value::as_f64).unwrap_or_default()
}

fn json_optional_f64(value: &Value, key: &str) -> Option<f64> {
    value.get(key).and_then(Value::as_f64)
}

fn json_nested_i64(value: &Value, key: &str) -> i64 {
    json_i64(value, key)
}

fn json_nested_optional_f64(value: &Value, key: &str) -> Option<f64> {
    json_optional_f64(value, key)
}

fn json_bool(value: &Value, key: &str) -> bool {
    value.get(key).and_then(Value::as_bool).unwrap_or(false)
}

fn json_nested_bool(value: &Value, key: &str) -> bool {
    json_bool(value, key)
}

fn json_array_string(value: &Value, key: &str) -> String {
    value.get(key).filter(|item| item.is_array()).cloned().unwrap_or_else(|| json!([])).to_string()
}

fn json_nested_array_string(value: &Value, key: &str) -> String {
    json_array_string(value, key)
}

fn json_object_string(value: &Value, key: &str) -> String {
    value.get(key).filter(|item| item.is_object()).cloned().unwrap_or_else(|| json!({})).to_string()
}

fn json_scalar_string(value: &Value, key: &str) -> String {
    match value.get(key) {
        Some(Value::String(text)) => text.clone(),
        Some(Value::Number(number)) => number.to_string(),
        Some(Value::Bool(flag)) => flag.to_string(),
        _ => String::new(),
    }
}

fn string_array(value: &Value, key: &str) -> Vec<String> {
    value
        .get(key)
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(Value::as_str)
        .map(ToOwned::to_owned)
        .collect()
}

fn bool_as_i64(flag: bool) -> i64 {
    if flag { 1 } else { 0 }
}

fn parse_value(text: &str) -> Value {
    serde_json::from_str(text).unwrap_or(Value::Null)
}

fn parse_scalar(text: &str) -> Value {
    if let Ok(value) = text.parse::<i64>() {
        return json!(value);
    }
    if let Ok(value) = text.parse::<f64>() {
        return json!(value);
    }
    Value::String(text.to_owned())
}

fn nullable_string(value: &str) -> Value {
    if value.is_empty() {
        Value::Null
    } else {
        Value::String(value.to_owned())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn app_data_round_trips_through_structured_tables() {
        let data = sample_app_data();
        let mut conn = Connection::open_in_memory().expect("open sqlite");

        save_app_data_to_connection(&mut conn, &data.to_string()).expect("save app data");
        let loaded = load_app_data_from_connection(&conn).expect("load app data");

        assert_eq!(loaded["schemaVersion"], data["schemaVersion"]);
        assert_eq!(loaded["currentGymId"], data["currentGymId"]);
        assert_eq!(loaded["currentGoalId"], data["currentGoalId"]);
        assert_eq!(loaded["goals"][0]["parsed"]["primaryGoal"], json!("fat_loss"));
        assert_eq!(loaded["gyms"][0]["equipment"], json!(["dumbbell", "bench"]));
        assert_eq!(loaded["plan"]["days"][0]["exercises"][0]["exerciseId"], json!("db-press"));
        assert_eq!(loaded["sessions"][0]["status"], json!("completed"));
        assert_eq!(loaded["exerciseLogs"][0]["sets"][0]["reps"], json!(10));
        assert_eq!(loaded["nutritionLogs"][0]["analysis"]["confidence"], json!("medium"));
        assert_eq!(loaded["advice"][0]["evidence"], json!(["rpe 8"]));
        assert_eq!(loaded["revisions"][0]["patch"]["type"], json!("reduce_day_volume"));
        assert_eq!(row_count(&conn, "goals"), 1);
        assert_eq!(row_count(&conn, "gyms"), 1);
        assert_eq!(row_count(&conn, "gym_equipment"), 2);
        assert_eq!(row_count(&conn, "training_plans"), 1);
        assert_eq!(row_count(&conn, "workout_days"), 1);
        assert_eq!(row_count(&conn, "planned_exercises"), 1);
        assert_eq!(row_count(&conn, "workout_sessions"), 1);
        assert_eq!(row_count(&conn, "exercise_logs"), 1);
        assert_eq!(row_count(&conn, "set_logs"), 1);
        assert_eq!(row_count(&conn, "body_metrics"), 1);
        assert_eq!(row_count(&conn, "nutrition_logs"), 1);
        assert_eq!(row_count(&conn, "advice"), 1);
        assert_eq!(row_count(&conn, "revisions"), 1);
        assert_eq!(row_count(&conn, "backup_snapshots"), 1);

        assert_eq!(text_column(&conn, "goals", "primary_goal"), "fat_loss");
        assert_eq!(text_column(&conn, "workout_sessions", "status"), "completed");
        assert_eq!(real_column(&conn, "exercise_logs", "volume_load"), 200.0);
    }

    #[test]
    fn empty_database_loads_empty_app_data_shape() {
        let conn = Connection::open_in_memory().expect("open sqlite");
        let loaded = load_app_data_from_connection(&conn).expect("load app data");
        assert_eq!(loaded["schemaVersion"], json!(3));
        assert_eq!(loaded["gyms"], json!([]));
        assert_eq!(loaded["plan"], Value::Null);
        assert_eq!(row_count(&conn, "schema_migrations"), 1);
    }

    #[test]
    fn migration_is_idempotent() {
        let conn = Connection::open_in_memory().expect("open sqlite");
        init_schema(&conn).expect("migrate once");
        init_schema(&conn).expect("migrate twice");

        assert!(table_exists(&conn, "app_settings"));
        assert_eq!(row_count(&conn, "schema_migrations"), 1);
    }

    fn sample_app_data() -> Value {
        json!({
            "schemaVersion": 3,
            "currentGymId": "gym-1",
            "currentGoalId": "goal-1",
            "gyms": [{
                "id": "gym-1",
                "name": "Garage Gym",
                "location": "Home",
                "equipment": ["dumbbell", "bench"]
            }],
            "goals": [{
                "id": "goal-1",
                "text": "fat loss and strength",
                "createdAt": "2026-01-01 08:00",
                "parsed": {
                    "rawText": "fat loss and strength",
                    "primaryGoal": "fat_loss",
                    "primaryGoalLabel": "Fat loss",
                    "secondaryGoal": "strength_maintenance",
                    "secondaryGoalLabel": "Strength",
                    "targetWeight": 75,
                    "trainingDaysPerWeek": 4,
                    "sessionDurationMinutes": 60,
                    "frequentTravel": false,
                    "conveniencePriority": false,
                    "constraints": [],
                    "notes": []
                }
            }],
            "plan": {
                "id": "plan-1",
                "generatedAt": "2026-01-01 08:05",
                "context": {
                    "goalLabel": "Fat loss",
                    "gymName": "Garage Gym",
                    "metricSummary": "baseline",
                    "notes": ["structured"]
                },
                "days": [{
                    "id": "day-1",
                    "type": "strength",
                    "focus": "Push",
                    "intent": "work",
                    "exercises": [{
                        "id": "planned-1",
                        "exerciseId": "db-press",
                        "sets": 3,
                        "reps": "8-10",
                        "load": "moderate",
                        "rpe": 8,
                        "rest": "90s",
                        "notes": "controlled"
                    }]
                }]
            },
            "sessions": [{
                "id": "session-1",
                "date": "2026-01-02",
                "createdAt": "2026-01-02 08:00",
                "startedAt": "2026-01-02 08:01",
                "completedAt": "2026-01-02 09:00",
                "status": "completed",
                "gymId": "gym-1",
                "gymName": "Garage Gym",
                "planId": "plan-1",
                "dayIndex": 0,
                "focus": "Push",
                "completion": 90,
                "rpe": 8,
                "painScore": 1,
                "painArea": "",
                "sleep": 7,
                "fatigue": 4,
                "notes": "ok",
                "exerciseLogIds": ["elog-1"]
            }],
            "exerciseLogs": [{
                "id": "elog-1",
                "date": "2026-01-02",
                "createdAt": "2026-01-02 08:20",
                "sessionId": "session-1",
                "exerciseId": "db-press",
                "exerciseName": "DB Press",
                "dayIndex": 0,
                "focus": "Push",
                "plannedSets": 3,
                "plannedReps": "8-10",
                "plannedLoad": "moderate",
                "plannedRpe": 8,
                "actualLoad": "20",
                "actualReps": "10",
                "sets": [{
                    "id": "set-1",
                    "setIndex": 1,
                    "loadKg": 20,
                    "reps": 10,
                    "rpe": 8,
                    "completed": true,
                    "note": ""
                }],
                "volumeLoad": 200,
                "hardSets": 1,
                "rpe": 8,
                "quality": "good",
                "rangeOfMotion": "full",
                "targetMuscleFeel": "good",
                "limitingFactor": "",
                "sideIssue": "",
                "painScore": 0,
                "painArea": "",
                "freeText": "",
                "analysis": {
                    "tags": [],
                    "evidence": ["full rom"],
                    "recommendations": [],
                    "priority": "low"
                }
            }],
            "metrics": [{
                "id": "metric-1",
                "date": "2026-01-02",
                "weight": 80,
                "bodyFat": null,
                "skeletalMuscle": null,
                "waist": 84,
                "notes": "",
                "createdAt": "2026-01-02 07:00"
            }],
            "nutritionLogs": [{
                "id": "nutrition-1",
                "date": "2026-01-02",
                "createdAt": "2026-01-02 21:00",
                "rawText": "eggs and rice",
                "goalId": "goal-1",
                "analysis": {
                    "calories": 700,
                    "protein": 40,
                    "confidence": "medium",
                    "tags": ["protein"],
                    "recommendations": ["keep protein steady"]
                }
            }],
            "advice": [{
                "id": "advice-1",
                "type": "training",
                "priority": "medium",
                "title": "Keep load steady",
                "detail": "RPE high",
                "evidence": ["rpe 8"],
                "tags": ["rpe"],
                "source": "session",
                "status": "active",
                "createdAt": "2026-01-02 09:01",
                "expiresAt": null
            }],
            "revisions": [{
                "id": "rev-1",
                "status": "pending",
                "summary": "Reduce volume",
                "reason": "fatigue",
                "evidence": ["fatigue 8"],
                "patch": {
                    "type": "reduce_day_volume",
                    "dayIndex": 0,
                    "factor": 0.8
                },
                "createdAt": "2026-01-02 09:02",
                "appliedAt": null
            }],
            "backupSnapshots": [{
                "id": "backup-1",
                "createdAt": "2026-01-02 09:03",
                "reason": "manual",
                "schemaVersion": 3,
                "stateJson": "{\"schemaVersion\":3}"
            }]
        })
    }

    fn row_count(conn: &Connection, table: &str) -> i64 {
        conn.query_row(&format!("SELECT COUNT(*) FROM {table}"), [], |row| row.get(0))
            .expect("count table")
    }

    fn text_column(conn: &Connection, table: &str, column: &str) -> String {
        conn.query_row(&format!("SELECT {column} FROM {table} LIMIT 1"), [], |row| row.get(0))
            .expect("text column")
    }

    fn real_column(conn: &Connection, table: &str, column: &str) -> f64 {
        conn.query_row(&format!("SELECT {column} FROM {table} LIMIT 1"), [], |row| row.get(0))
            .expect("real column")
    }

    fn table_exists(conn: &Connection, table: &str) -> bool {
        conn.query_row(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?1",
            params![table],
            |row| row.get::<_, String>(0),
        )
        .optional()
        .expect("table lookup")
        .is_some()
    }
}
