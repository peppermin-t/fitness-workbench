use rusqlite::{params, Connection, OptionalExtension};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const DB_FILE_NAME: &str = "fitness-workbench.sqlite3";

#[tauri::command]
fn load_app_state(app: AppHandle) -> Result<Option<String>, String> {
    let conn = open_database(&app)?;
    load_state_from_connection(&conn)
}

#[tauri::command]
fn save_app_state(app: AppHandle, state_json: String) -> Result<(), String> {
    let mut conn = open_database(&app)?;
    save_state_to_connection(&mut conn, &state_json)
}

fn load_state_from_connection(conn: &Connection) -> Result<Option<String>, String> {
    init_schema(conn)?;
    conn.query_row(
        "SELECT value FROM app_meta WHERE key = 'app_state'",
        [],
        |row| row.get::<_, String>(0),
    )
    .optional()
    .map_err(|error| error.to_string())
}

fn save_state_to_connection(conn: &mut Connection, state_json: &str) -> Result<(), String> {
    let state: Value = serde_json::from_str(state_json).map_err(|error| error.to_string())?;
    init_schema(conn)?;
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

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn save_state_round_trips_and_mirrors_rows() {
        let state = json!({
            "goals": [{ "id": "goal-1", "text": "减脂保持力量" }],
            "gyms": [
                { "id": "gym-full", "name": "完整健身房" },
                { "id": "gym-hotel", "name": "酒店健身房" }
            ],
            "exercises": [{ "id": "ex-row", "name": "坐姿划船" }],
            "plan": {
                "id": "plan-1",
                "days": [
                    {
                        "id": "day-1",
                        "focus": "拉",
                        "exercises": [
                            { "id": "planned-1", "exerciseId": "ex-row", "sets": 3 }
                        ]
                    }
                ]
            },
            "sessions": [{ "id": "session-1", "completion": 90, "rpe": 8 }],
            "exerciseLogs": [
                {
                    "id": "elog-1",
                    "exerciseId": "ex-row",
                    "sets": [
                        { "id": "set-1", "weight": 40, "reps": 10 },
                        { "id": "set-2", "weight": 42.5, "reps": 8 }
                    ]
                }
            ],
            "metrics": [{ "id": "metric-1", "weight": 78 }],
            "nutritionLogs": [{ "id": "nutrition-1", "text": "牛肉火锅" }],
            "advice": [{ "id": "advice-1", "title": "先稳住正餐" }],
            "revisions": [{ "id": "rev-1", "status": "pending" }]
        });
        let state_json = state.to_string();
        let mut conn = Connection::open_in_memory().expect("open in-memory sqlite");

        save_state_to_connection(&mut conn, &state_json).expect("save state");

        let loaded_json = load_state_from_connection(&conn)
            .expect("load state")
            .expect("stored app_state");
        let loaded: Value = serde_json::from_str(&loaded_json).expect("parse loaded state");
        assert_eq!(loaded, state);

        assert_eq!(row_count(&conn, "goals"), 1);
        assert_eq!(row_count(&conn, "gyms"), 2);
        assert_eq!(row_count(&conn, "exercises"), 1);
        assert_eq!(row_count(&conn, "training_plans"), 1);
        assert_eq!(row_count(&conn, "workout_days"), 1);
        assert_eq!(row_count(&conn, "planned_exercises"), 1);
        assert_eq!(row_count(&conn, "workout_sessions"), 1);
        assert_eq!(row_count(&conn, "exercise_logs"), 1);
        assert_eq!(row_count(&conn, "set_logs"), 2);
        assert_eq!(row_count(&conn, "body_metrics"), 1);
        assert_eq!(row_count(&conn, "nutrition_logs"), 1);
        assert_eq!(row_count(&conn, "advice"), 1);
        assert_eq!(row_count(&conn, "revisions"), 1);
    }

    #[test]
    fn sample_baseline_state_round_trips_and_mirrors_core_tables() {
        let state_json = include_str!("../../docs/sample-data/manual-smoke-baseline.json");
        let state: Value = serde_json::from_str(state_json).expect("parse sample baseline");
        let mut conn = Connection::open_in_memory().expect("open in-memory sqlite");

        save_state_to_connection(&mut conn, state_json).expect("save sample baseline");

        let loaded_json = load_state_from_connection(&conn)
            .expect("load sample baseline")
            .expect("stored sample baseline");
        let loaded: Value = serde_json::from_str(&loaded_json).expect("parse loaded sample baseline");
        assert_eq!(loaded, state);

        assert_table_count(&conn, "goals", array_len(&state, "goals"));
        assert_table_count(&conn, "gyms", array_len(&state, "gyms"));
        assert_table_count(&conn, "exercises", array_len(&state, "exercises"));
        assert_table_count(&conn, "workout_sessions", array_len(&state, "sessions"));
        assert_table_count(&conn, "exercise_logs", array_len(&state, "exerciseLogs"));
        assert_table_count(&conn, "body_metrics", array_len(&state, "metrics"));
        assert_table_count(&conn, "nutrition_logs", array_len(&state, "nutritionLogs"));
        assert_table_count(&conn, "advice", array_len(&state, "advice"));
        assert_table_count(&conn, "revisions", array_len(&state, "revisions"));
        assert_table_count(&conn, "training_plans", if state.get("plan").is_some() { 1 } else { 0 });
        assert_table_count(&conn, "workout_days", plan_day_count(&state));
        assert_table_count(&conn, "planned_exercises", planned_exercise_count(&state));
        assert_table_count(&conn, "set_logs", set_log_count(&state));

        assert!(array_len(&state, "goals") >= 1);
        assert!(array_len(&state, "gyms") >= 2);
        assert!(plan_day_count(&state) >= 1);
        assert!(array_len(&state, "metrics") >= 2);
        assert!(array_len(&state, "sessions") >= 1);
        assert!(array_len(&state, "exerciseLogs") >= 2);
        assert!(array_len(&state, "nutritionLogs") >= 1);
        assert!(array_len(&state, "advice") >= 1);
        assert!(array_len(&state, "revisions") >= 1);
    }

    fn row_count(conn: &Connection, table: &str) -> i64 {
        conn.query_row(&format!("SELECT COUNT(*) FROM {table}"), [], |row| row.get(0))
            .expect("count table")
    }

    fn assert_table_count(conn: &Connection, table: &str, expected: i64) {
        assert_eq!(row_count(conn, table), expected, "{table} row count");
    }

    fn array_len(state: &Value, key: &str) -> i64 {
        state
            .get(key)
            .and_then(Value::as_array)
            .map(|items| items.len() as i64)
            .unwrap_or(0)
    }

    fn plan_day_count(state: &Value) -> i64 {
        state
            .get("plan")
            .and_then(|plan| plan.get("days"))
            .and_then(Value::as_array)
            .map(|items| items.len() as i64)
            .unwrap_or(0)
    }

    fn planned_exercise_count(state: &Value) -> i64 {
        state
            .get("plan")
            .and_then(|plan| plan.get("days"))
            .and_then(Value::as_array)
            .map(|days| {
                days.iter()
                    .map(|day| {
                        day.get("exercises")
                            .and_then(Value::as_array)
                            .map(|items| items.len() as i64)
                            .unwrap_or(0)
                    })
                    .sum()
            })
            .unwrap_or(0)
    }

    fn set_log_count(state: &Value) -> i64 {
        state
            .get("exerciseLogs")
            .and_then(Value::as_array)
            .map(|logs| {
                logs.iter()
                    .map(|log| {
                        log.get("sets")
                            .and_then(Value::as_array)
                            .map(|items| items.len() as i64)
                            .unwrap_or(0)
                    })
                    .sum()
            })
            .unwrap_or(0)
    }
}
