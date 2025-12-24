PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- 共享箱
CREATE TABLE IF NOT EXISTS boxes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE | IN_USE | ALERT
  updated_at TEXT NOT NULL
);

-- 使用者
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- 全域設定（單列）
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  current_user_id TEXT,
  show_alert_banner INTEGER NOT NULL DEFAULT 1,
  admin_pin TEXT,
  is_admin_mode INTEGER NOT NULL DEFAULT 0,
  sensor_bound_box_id TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (current_user_id) REFERENCES users(id)
);

-- 事件紀錄
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  box_id TEXT NOT NULL,
  user_id TEXT,
  type TEXT NOT NULL,          -- DELIVERY | PICKUP | ALERT | NOTE
  note TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (box_id) REFERENCES boxes(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_events_box_time ON events(box_id, created_at);

-- 感測資料（HTTP/WS 都可寫入）
CREATE TABLE IF NOT EXISTS sensor_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  box_id TEXT NOT NULL,
  device_id TEXT,
  payload TEXT NOT NULL,       -- JSON string
  created_at TEXT NOT NULL,
  FOREIGN KEY (box_id) REFERENCES boxes(id)
);

CREATE INDEX IF NOT EXISTS idx_sensor_box_time ON sensor_readings(box_id, created_at);
