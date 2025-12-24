import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { initDb, nowIso } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const server = createServer(app);
const wss = new WebSocketServer({ server });

const { db, dbPath } = await initDb();

async function seedIfEmpty() {
  // users
  const u = await db.get("SELECT COUNT(*) as cnt FROM users");
  if ((u?.cnt ?? 0) === 0) {
    const users = [
      { id: "user-001", name: "住戶 A" },
      { id: "user-002", name: "住戶 B" },
      { id: "user-003", name: "住戶 C" },
    ];
    const stmt = await db.prepare("INSERT INTO users(id,name) VALUES(?,?)");
    try {
      for (const x of users) await stmt.run(x.id, x.name);
    } finally {
      await stmt.finalize();
    }
  }

  // boxes
  const b = await db.get("SELECT COUNT(*) as cnt FROM boxes");
  if ((b?.cnt ?? 0) === 0) {
    const t = nowIso();
    const boxes = [
      { id: "B01", name: "共享箱 01", location: "一樓大廳", status: "AVAILABLE" },
      { id: "B02", name: "共享箱 02", location: "二樓走廊", status: "IN_USE" },
      { id: "B03", name: "共享箱 03", location: "地下室入口", status: "ALERT" },
    ];
    const stmt = await db.prepare(
      "INSERT INTO boxes(id,name,location,status,updated_at) VALUES (?,?,?,?,?)"
    );
    try {
      for (const x of boxes) await stmt.run(x.id, x.name, x.location, x.status, t);
    } finally {
      await stmt.finalize();
    }
  }

  // settings (single row id=1)
  const s = await db.get("SELECT COUNT(*) as cnt FROM app_settings WHERE id=1");
  if ((s?.cnt ?? 0) === 0) {
    const t = nowIso();
    await db.run(
      "INSERT INTO app_settings(id,current_user_id,show_alert_banner,admin_pin,is_admin_mode,sensor_bound_box_id,updated_at) VALUES (1,?,?,?,?,?,?)",
      ["user-001", 1, null, 0, null, t]
    );
  }
}
await seedIfEmpty();

// health
app.get("/api/health", (req, res) => {
  res.json({ ok: true, dbPath });
});

// bootstrap: all data must come from DB
app.get("/api/bootstrap", async (req, res) => {
  const users = await db.all("SELECT id, name FROM users ORDER BY id ASC");
  const boxes = await db.all(
    "SELECT id, name, location, status, updated_at FROM boxes ORDER BY id ASC"
  );

  const settingsRow = await db.get(
    "SELECT current_user_id, show_alert_banner, admin_pin, is_admin_mode, sensor_bound_box_id FROM app_settings WHERE id=1"
  );

  const settings = {
    currentUserId: settingsRow?.current_user_id ?? null,
    showAlertBanner: !!settingsRow?.show_alert_banner,
    adminPin: settingsRow?.admin_pin ?? null,
    isAdminMode: !!settingsRow?.is_admin_mode,
    sensorBoundBoxId: settingsRow?.sensor_bound_box_id ?? null,
  };

  const history = await db.all(
    `SELECT e.id, e.box_id as boxId, b.name as boxName, b.location as boxLocation,
            e.user_id as userId, u.name as userName,
            e.type, e.note, e.created_at as createdAt
     FROM events e
     LEFT JOIN boxes b ON b.id = e.box_id
     LEFT JOIN users u ON u.id = e.user_id
     ORDER BY e.id DESC
     LIMIT 300`
  );

  res.json({ ok: true, users, boxes, settings, history });
});

// users
app.get("/api/users", async (req, res) => {
  const rows = await db.all("SELECT id, name FROM users ORDER BY id ASC");
  res.json(rows);
});

// settings get
app.get("/api/settings", async (req, res) => {
  const r = await db.get(
    "SELECT current_user_id, show_alert_banner, admin_pin, is_admin_mode, sensor_bound_box_id FROM app_settings WHERE id=1"
  );
  res.json({
    currentUserId: r?.current_user_id ?? null,
    showAlertBanner: !!r?.show_alert_banner,
    adminPin: r?.admin_pin ?? null,
    isAdminMode: !!r?.is_admin_mode,
    sensorBoundBoxId: r?.sensor_bound_box_id ?? null,
  });
});

// settings update
app.put("/api/settings", async (req, res) => {
  const {
    currentUserId,
    showAlertBanner,
    adminPin,
    isAdminMode,
    sensorBoundBoxId,
  } = req.body ?? {};

  const t = nowIso();

  // Only update provided keys (partial update)
  const cur = await db.get("SELECT * FROM app_settings WHERE id=1");

  const next = {
    current_user_id: currentUserId ?? cur?.current_user_id ?? null,
    show_alert_banner:
      typeof showAlertBanner === "boolean"
        ? (showAlertBanner ? 1 : 0)
        : (cur?.show_alert_banner ?? 1),
    admin_pin:
      adminPin === null
        ? null
        : (typeof adminPin === "string" ? adminPin : cur?.admin_pin ?? null),
    is_admin_mode:
      typeof isAdminMode === "boolean"
        ? (isAdminMode ? 1 : 0)
        : (cur?.is_admin_mode ?? 0),
    sensor_bound_box_id:
      sensorBoundBoxId === null
        ? null
        : (typeof sensorBoundBoxId === "string" ? sensorBoundBoxId : cur?.sensor_bound_box_id ?? null),
  };

  // If adminPin is cleared, also force is_admin_mode=0
  if (!next.admin_pin) next.is_admin_mode = 0;

  await db.run(
    `UPDATE app_settings
     SET current_user_id=?, show_alert_banner=?, admin_pin=?, is_admin_mode=?, sensor_bound_box_id=?, updated_at=?
     WHERE id=1`,
    [
      next.current_user_id,
      next.show_alert_banner,
      next.admin_pin,
      next.is_admin_mode,
      next.sensor_bound_box_id,
      t,
    ]
  );

  res.json({
    ok: true,
    settings: {
      currentUserId: next.current_user_id,
      showAlertBanner: !!next.show_alert_banner,
      adminPin: next.admin_pin,
      isAdminMode: !!next.is_admin_mode,
      sensorBoundBoxId: next.sensor_bound_box_id,
    },
  });
});

// boxes
app.get("/api/boxes", async (req, res) => {
  const rows = await db.all(
    "SELECT id, name, location, status, updated_at FROM boxes ORDER BY id ASC"
  );
  res.json(rows);
});

// history (option boxId)
app.get("/api/history", async (req, res) => {
  const { boxId, limit = 200 } = req.query;
  const lim = Math.min(Number(limit) || 200, 1000);

  const baseSql = `
    SELECT e.id, e.box_id as boxId, b.name as boxName, b.location as boxLocation,
           e.user_id as userId, u.name as userName,
           e.type, e.note, e.created_at as createdAt
    FROM events e
    LEFT JOIN boxes b ON b.id = e.box_id
    LEFT JOIN users u ON u.id = e.user_id
  `;

  if (boxId) {
    const rows = await db.all(
      `${baseSql} WHERE e.box_id = ? ORDER BY e.id DESC LIMIT ?`,
      [boxId, lim]
    );
    return res.json(rows);
  }

  const rows = await db.all(`${baseSql} ORDER BY e.id DESC LIMIT ?`, [lim]);
  res.json(rows);
});

// create event => write DB, update box status
app.post("/api/events", async (req, res) => {
  const { boxId, type, note = "", userId = null } = req.body ?? {};
  if (!boxId || !type) return res.status(400).json({ ok: false, error: "boxId/type required" });

  const t = nowIso();

  // ensure box exists (optional safety)
  const box = await db.get("SELECT id FROM boxes WHERE id=?", [boxId]);
  if (!box) {
    await db.run(
      "INSERT INTO boxes(id,name,location,status,updated_at) VALUES (?,?,?,?,?)",
      [boxId, `共享箱 ${boxId}`, "", "AVAILABLE", t]
    );
  }

  let newStatus = null;
  if (type === "DELIVERY") newStatus = "IN_USE";
  else if (type === "PICKUP") newStatus = "AVAILABLE";
  else if (type === "ALERT") newStatus = "ALERT";

  try {
    await db.exec("BEGIN");

    await db.run(
      "INSERT INTO events(box_id,user_id,type,note,created_at) VALUES (?,?,?,?,?)",
      [boxId, userId, type, note, t]
    );

    if (newStatus) {
      await db.run("UPDATE boxes SET status=?, updated_at=? WHERE id=?", [newStatus, t, boxId]);
    } else {
      await db.run("UPDATE boxes SET updated_at=? WHERE id=?", [t, boxId]);
    }

    await db.exec("COMMIT");
    res.json({ ok: true });
  } catch (e) {
    await db.exec("ROLLBACK");
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// sensor: write reading (HTTP)
app.post("/api/sensor", async (req, res) => {
  const { boxId, deviceId = "", payload = {} } = req.body ?? {};
  if (!boxId) return res.status(400).json({ ok: false, error: "boxId required" });

  const t = nowIso();
  await db.run(
    "INSERT INTO sensor_readings(box_id,device_id,payload,created_at) VALUES (?,?,?,?)",
    [boxId, deviceId, JSON.stringify(payload ?? {}), t]
  );
  res.json({ ok: true });
});

app.get("/api/sensor/latest", async (req, res) => {
  const { boxId } = req.query;
  if (!boxId) return res.status(400).json({ ok: false, error: "boxId required" });

  const row = await db.get(
    "SELECT id, box_id as boxId, device_id as deviceId, payload, created_at as createdAt FROM sensor_readings WHERE box_id=? ORDER BY id DESC LIMIT 1",
    [boxId]
  );
  if (!row) return res.json(null);
  let payloadObj = null;
  try { payloadObj = JSON.parse(row.payload); } catch { payloadObj = row.payload; }
  res.json({ ...row, payload: payloadObj });
});

// WebSocket 連接處理
wss.on('connection', (ws) => {
  console.log('📡 WebSocket client connected');

  ws.on('message', async (data) => {
    const receiveTime = Date.now();
    try {
      const msg = JSON.parse(data.toString());
      
      // 處理感測器資料
      if (msg.type === 'sensor') {
        const { boxId, deviceId = '', payload = {} } = msg;
        if (!boxId) {
          ws.send(JSON.stringify({ ok: false, error: 'boxId required' }));
          return;
        }

        // 計算延遲（如果 payload 有 ts）
        let latency = null;
        if (payload.ts) {
          const payloadTime = new Date(payload.ts).getTime();
          latency = receiveTime - payloadTime;
        }

        const t = nowIso();
        const dbStartTime = Date.now();
        
        await db.run(
          "INSERT INTO sensor_readings(box_id,device_id,payload,created_at) VALUES (?,?,?,?)",
          [boxId, deviceId, JSON.stringify(payload ?? {}), t]
        );
        
        const dbEndTime = Date.now();
        const dbLatency = dbEndTime - dbStartTime;
        
        ws.send(JSON.stringify({ ok: true, type: 'sensor', timestamp: t }));
        
        // 詳細的 console.log
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('感測器資料接收');
        console.log(`箱子 ID: ${boxId}`);
        console.log(`裝置 ID: ${deviceId}`);
        console.log(`資料內容:`);
        console.log(`   - 時間戳記: ${payload.ts || 'N/A'}`);
        console.log(`   - 震動值: ${payload.vibration ?? 'N/A'}`);
        console.log(`   - 門狀態: ${payload.door || 'N/A'}`);
        if (latency !== null) {
          console.log(`⏱️  網路延遲: ${latency}ms`);
        }
        console.log(`資料庫寫入延遲: ${dbLatency}ms`);
        console.log(`接收時間: ${new Date(receiveTime).toLocaleString('zh-TW')}`);
        console.log(`儲存時間: ${new Date(t).toLocaleString('zh-TW')}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }
    } catch (e) {
      console.error('WebSocket message error:', e);
      ws.send(JSON.stringify({ ok: false, error: String(e) }));
    }
  });

  ws.on('close', () => {
    console.log('📡 WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://0.0.0.0:${PORT}`);
  console.log(`WebSocket running on ws://0.0.0.0:${PORT}`);
});
