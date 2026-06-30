use rusqlite::{params, Connection, OptionalExtension};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const DB_FILE_NAME: &str = "fitness-workbench.sqlite3";

#[tauri::command]
fn load_app_state(app: AppHandle) -> Result<Option<String>, String> {
    let conn = open_database(&app)?;
    init_schema(&conn)?;
    conn.query_row(
        "SELECT value FROM app_meta WHERE key = 'app_state'",
        [],
        |row| row.get::<_, String>(0),
    )
    .optional()
    .map_err(|error| error.to_string())
}

#[tauri::command]
fn save_app_state(app: AppHandle, state_json: String) -> Result<(), String> {
    let state: Value = serde_json::from_str(&state_json).map_err(|error| error.to_string())?;
    let mut conn = open_database(&app)?;
    init_schema(&conn)?;
    let tx = conn.transaction().map_err(|error| error.to_string())?;

    tx.execute(
        "INSERT INTO app_meta (key, value, updated_at) VALUES ('app_state', ?1, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        params![state_json],
    )
    .map_err(|error| error.to_string())?;

    clear_mirror_tables(&tx)?;
    mirror_state(&tx, &state)?;
    tx.commit().map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![load_app_state, save_app_state])
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
        "
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS app_meta (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS goals (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS gyms (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS exercises (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS training_plans (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS workout_days (
          id TEXT PRIMARY KEY,
          plan_id TEXT NOT NULL,
          day_index INTEGER NOT NULL,
          payload TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS planned_exercises (
          id TEXT PRIMARY KEY,
          plan_id TEXT NOT NULL,
          day_id TEXT NOT NULL,
          day_index INTEGER NOT NULL,
          row_index INTEGER NOT NULL,
          payload TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS workout_sessions (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS exercise_logs (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS set_logs (
          id TEXT PRIMARY KEY,
          exercise_log_id TEXT NOT NULL,
          set_index INTEGER NOT NULL,
          payload TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS body_metrics (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS nutrition_logs (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS advice (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS revisions (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
        ",
    )
    .map_err(|error| error.to_string())
}

fn clear_mirror_tables(conn: &Connection) -> Result<(), String> {
    for table in [
        "goals",
        "gyms",
        "exercises",
        "training_plans",
        "workout_days",
        "planned_exercises",
        "workout_sessions",
        "exercise_logs",
        "set_logs",
        "body_metrics",
        "nutrition_logs",
        "advice",
        "revisions",
    ] {
        conn.execute(&format!("DELETE FROM {table}"), [])
            .map_err(|error| error.to_string())?;
    }
    Ok(())
}

fn mirror_state(conn: &Connection, state: &Value) -> Result<(), String> {
    insert_collection(conn, "goals", state, "goals")?;
    insert_collection(conn, "gyms", state, "gyms")?;
    insert_collection(conn, "exercises", state, "exercises")?;
    insert_collection(conn, "workout_sessions", state, "sessions")?;
    insert_collection(conn, "exercise_logs", state, "exerciseLogs")?;
    insert_collection(conn, "body_metrics", state, "metrics")?;
    insert_collection(conn, "nutrition_logs", state, "nutritionLogs")?;
    insert_collection(conn, "advice", state, "advice")?;
    insert_collection(conn, "revisions", state, "revisions")?;
    insert_plan(conn, state)?;
    insert_set_logs(conn, state)?;
    Ok(())
}

fn insert_collection(
    conn: &Connection,
    table: &str,
    state: &Value,
    key: &str,
) -> Result<(), String> {
    for (index, item) in array_items(state, key).iter().enumerate() {
        let id = json_id(item, table, index);
        conn.execute(
            &format!("INSERT INTO {table} (id, payload) VALUES (?1, ?2)"),
            params![id, item.to_string()],
        )
        .map_err(|error| error.to_string())?;
    }
    Ok(())
}

fn insert_plan(conn: &Connection, state: &Value) -> Result<(), String> {
    let Some(plan) = state.get("plan").filter(|value| value.is_object()) else {
        return Ok(());
    };
    let plan_id = json_id(plan, "plan", 0);
    conn.execute(
        "INSERT INTO training_plans (id, payload) VALUES (?1, ?2)",
        params![&plan_id, plan.to_string()],
    )
    .map_err(|error| error.to_string())?;

    for (day_index, day) in plan
        .get("days")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .enumerate()
    {
        let day_id = json_id(day, &format!("day_{plan_id}"), day_index);
        conn.execute(
            "INSERT INTO workout_days (id, plan_id, day_index, payload) VALUES (?1, ?2, ?3, ?4)",
            params![&day_id, &plan_id, day_index as i64, day.to_string()],
        )
        .map_err(|error| error.to_string())?;

        for (row_index, row) in day
            .get("exercises")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .enumerate()
        {
            let row_id = json_id(row, &format!("planned_exercise_{day_id}"), row_index);
            conn.execute(
                "INSERT INTO planned_exercises
                 (id, plan_id, day_id, day_index, row_index, payload)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![
                    &row_id,
                    &plan_id,
                    &day_id,
                    day_index as i64,
                    row_index as i64,
                    row.to_string()
                ],
            )
            .map_err(|error| error.to_string())?;
        }
    }
    Ok(())
}

fn insert_set_logs(conn: &Connection, state: &Value) -> Result<(), String> {
    for log in array_items(state, "exerciseLogs") {
        let log_id = json_id(log, "exercise_log", 0);
        for (set_index, set) in log
            .get("sets")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .enumerate()
        {
            let set_id = json_id(set, &format!("set_{log_id}"), set_index);
            conn.execute(
                "INSERT INTO set_logs (id, exercise_log_id, set_index, payload)
                 VALUES (?1, ?2, ?3, ?4)",
                params![set_id, &log_id, set_index as i64, set.to_string()],
            )
            .map_err(|error| error.to_string())?;
        }
    }
    Ok(())
}

fn array_items<'a>(state: &'a Value, key: &str) -> &'a [Value] {
    state
        .get(key)
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .unwrap_or(&[])
}

fn json_id(value: &Value, prefix: &str, index: usize) -> String {
    value
        .get("id")
        .and_then(Value::as_str)
        .map(ToOwned::to_owned)
        .unwrap_or_else(|| format!("{prefix}_{index}"))
}
