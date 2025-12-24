import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";
import path from "path";

async function ensureMigrations(db) {
  // 如果是舊版資料庫，補 boxes.location
  const boxes = await db.all("PRAGMA table_info(boxes)").catch(() => []);
  const hasBoxes = Array.isArray(boxes) && boxes.length > 0;
  if (hasBoxes) {
    const hasLocation = boxes.some((c) => c?.name === "location");
    if (!hasLocation) {
      await db.exec("ALTER TABLE boxes ADD COLUMN location TEXT");
    }
  }

  // 如果缺 users/app_settings/sensor_readings，schema.sql 會建立，不需要額外處理
}

export async function initDb() {
  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = path.join(dataDir, "app.db");
  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  const schemaPath = path.join(process.cwd(), "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  await db.exec(schema);

  await ensureMigrations(db);
  return { db, dbPath };
}

export function nowIso() {
  return new Date().toISOString();
}
