# 智慧共享箱管理系統（IoT Smart Box Management System）

一套完整的物聯網系統，結合 **React Native 行動應用** 與 **Node.js 後端伺服器**，實現共享箱的即時監控、事件管理與感測器整合。

## 🎯 系統特色

✅ **完整的物聯網三層架構**
- 感知層：感測設備與感測器資料蒐集
- 網路層：WebSocket + HTTP API 雙向通訊
- 應用層：React Native 跨平台行動應用

✅ **即時資料同步**
- 使用 WebSocket 實現實時感測器資料推送
- HTTP REST API 提供資料查詢與管理功能

✅ **完善的使用者介面**
- 共享箱狀態即時顯示（AVAILABLE / IN_USE / ALERT）
- 歷史事件記錄與統計分析
- 深色/淺色主題支援

✅ **進階管理功能**
- 管理員密碼保護
- 管理員模式進階設定
- 感測器綁定與監控

---

## 📦 專案結構

```
期末報告/
├── APP/                      # React Native 行動應用
│   ├── src/
│   │   ├── components/       # 共用 UI 元件
│   │   ├── screens/          # 各功能頁面
│   │   ├── data/             # 全域狀態管理（DataContext）
│   │   ├── services/         # API 通訊服務
│   │   ├── theme/            # 主題管理
│   │   ├── utils/            # 工具函數
│   │   ├── constants/        # 常數與初始資料
│   │   └── navigation/       # 頁面導航配置
│   ├── App.js                # App 主入口
│   ├── package.json          # 依賴套件清單
│   └── README.md             # App 詳細說明
│
├── server/                   # Node.js 後端伺服器
│   ├── server.js             # Express 伺服器主檔案
│   ├── db.js                 # 資料庫初始化
│   ├── schema.sql            # 資料表結構定義
│   ├── package.json          # 依賴套件清單
│   ├── README.md             # 後端詳細說明
│   └── data/                 # 資料庫存儲目錄（自動建立）
│
├── README.md                 # 本檔案（總體說明）
└── 附註.txt                  # 快速啟動指南
```

---

## 🚀 快速開始

### 系統需求
- **Node.js** v16 以上
- **npm** 或 **yarn**
- **Expo CLI**（用於執行 React Native 應用）
- **手機**（Android / iOS）或模擬器

### 1️⃣ 啟動後端伺服器

```bash
cd server
npm install
npm run dev
```

✅ 伺服器執行在 `http://localhost:3000`

### 2️⃣ 啟動行動應用

開啟**新的終端**，執行：

```bash
cd APP
npm install
npx expo start
```

### 3️⃣ 連接行動裝置

#### 取得您的電腦區網 IP

**Windows (PowerShell)：**
```powershell
ipconfig
```
找出 `IPv4 Address`（通常為 `192.168.x.x` 或 `10.0.x.x`）

**macOS / Linux：**
```bash
ifconfig | grep "inet "
```

#### 設定 API 連線

在啟動 App 前，設定環境變數指向您的伺服器：

**Windows PowerShell：**
```powershell
$Env:EXPO_PUBLIC_API_BASE_URL="http://<你的電腦IP>:3000/api"
npx expo start
```

**macOS / Linux Bash：**
```bash
export EXPO_PUBLIC_API_BASE_URL="http://<你的電腦IP>:3000/api"
npx expo start
```

#### 選擇執行環境

| 環境 | 指令 | 備註 |
|------|------|------|
| **Android 真機** | 按 `a` 或掃 QR Code | 需連接同一 Wi-Fi |
| **iOS 真機** | 按 `i` 或掃 QR Code | 需連接同一 Wi-Fi |
| **Android 模擬器** | 按 `a` | 自動啟動模擬器 |
| **iOS 模擬器** | 按 `i` | 需 Mac 電腦 |
| **Web 瀏覽器** | 按 `w` | 有限支援 |

#### 模擬器特殊設定

**Android 模擬器：**
```powershell
$Env:EXPO_PUBLIC_API_BASE_URL="http://10.0.2.2:3000/api"
npx expo start
```

**iOS 模擬器：**
```bash
export EXPO_PUBLIC_API_BASE_URL="http://localhost:3000/api"
npx expo start
```

---

## ✅ 驗證連線

### 測試後端是否正常運作

在瀏覽器或手機中訪問：
```
http://<你的電腦IP>:3000/api/health
```

✅ 預期回應：
```json
{
  "ok": true,
  "dbPath": "...path/to/app.db"
}
```

### 取得完整初始資料

```
http://<你的電腦IP>:3000/api/bootstrap
```

✅ 預期包含：
- `users`: 使用者列表（預設 3 位使用者）
- `boxes`: 共享箱列表（預設 3 個共享箱）
- `settings`: 系統設定
- `history`: 事件歷史記錄

---

## 🏠 主要功能

### 📱 首頁（Home Screen）
- 系統概覽與異常警告
- 快捷功能入口

### 📦 共享箱列表（Boxes Screen）
- 顯示所有共享箱的狀態
- 支援狀態篩選（全部 / 可用 / 使用中 / 異常）
- 搜尋功能

### 📋 共享箱詳情（Box Detail Screen）
- 箱子詳細信息
- 新增事件（放入 / 領取 / 標記異常）
- 最近事件展示

### 📊 歷史紀錄（History Screen）
- 按日期分組顯示所有事件
- 顯示事件詳情（類型、時間、涉及的箱子與使用者）

### 📈 統計分析（Analytics Screen）
- 系統整體統計數據（需管理員模式）
- 箱子使用情況分析

### ⚙️ 設定（Settings Screen）
- 主題切換（深色/淺色）
- 異常提示開關
- 使用者選擇
- 管理員模式（需密碼）

---

## 🛢️ 資料庫架構

系統使用 **SQLite** 儲存所有資料，自動初始化以下表：

| 表名 | 用途 | 主要欄位 |
|------|------|--------|
| `users` | 使用者管理 | id, name |
| `boxes` | 共享箱 | id, name, location, status, updated_at |
| `events` | 事件記錄 | id, box_id, user_id, type, note, created_at |
| `sensor_readings` | 感測器資料 | id, box_id, device_id, payload, created_at |
| `app_settings` | 全域設定 | id, current_user_id, admin_pin, is_admin_mode, ... |

---

## 🔌 API 端點

### 公開端點

| 方法 | 端點 | 說明 |
|------|------|------|
| `GET` | `/api/health` | 健康檢查 |
| `GET` | `/api/bootstrap` | 取得全部初始資料（App 啟動時呼叫） |
| `GET` | `/api/users` | 取得使用者列表 |
| `GET` | `/api/boxes` | 取得共享箱列表 |
| `GET` | `/api/history?boxId=B01&limit=200` | 取得事件歷史（支援篩選） |
| `POST` | `/api/events` | 新增事件 |
| `GET` | `/api/settings` | 取得系統設定 |
| `PUT` | `/api/settings` | 更新系統設定 |
| `POST` | `/api/sensor` | 寫入感測器資料（HTTP） |
| `GET` | `/api/sensor/latest?boxId=B01` | 取得最新感測器資料 |

### WebSocket 連線

**連線端點：** `ws://<你的電腦IP>:3000`

**訊息格式（感測器資料）：**
```json
{
  "type": "sensor",
  "boxId": "B01",
  "deviceId": "phone",
  "payload": {
    "ts": "2025-12-25T10:00:00.000Z",
    "vibration": 0.45,
    "door": "CLOSED",
    "battery": 85
  }
}
```

---

## 🔧 環境設定

### 前端環境變數

在 `APP` 目錄下建立 `.env` 檔案（或使用環境變數）：

```env
# 後端 API 基礎 URL
EXPO_PUBLIC_API_BASE_URL=http://<你的電腦IP>:3000/api
```

### 後端環境變數

後端預設使用 `PORT=3000`，可透過環境變數修改：

```bash
PORT=8080 npm run dev
```

---

## 🐛 常見問題排查

### ❌ App 無法取得資料

**原因：** 通常是 API 連線位址錯誤或後端未啟動

**解決方案：**
1. ✅ 確認後端已執行：在 `server/` 目錄執行 `npm run dev`
2. ✅ 確認 IP 地址正確：執行 `ipconfig` 取得區網 IP
3. ✅ 設定正確的環境變數：`EXPO_PUBLIC_API_BASE_URL="http://<IP>:3000/api"`
4. ✅ 測試連線：在瀏覽器打 `http://<IP>:3000/api/health`
5. ✅ 檢查防火牆：允許 3000 連接埠

### ❌ 無法連接 WebSocket

**解決方案：**
1. 檢查防火牆設定（允許 3000 連接埠）
2. 確認路由器允許區網內設備通訊
3. 查看後端 console 是否有錯誤信息
4. 嘗試重新啟動後端

### ❌ 資料庫錯誤或資料遺失

**解決方案：**
1. 刪除 `server/data/app.db`（會自動重建）
2. 重新啟動後端：`npm run dev`
3. 重新啟動 App

### ❌ 模擬器無法連接到本機

**解決方案：**
- **Android 模擬器：** 使用 `10.0.2.2` 代替 `localhost`
- **iOS 模擬器：** 使用 `localhost` 或實際區網 IP
- **真機：** 確保手機與電腦在同一 Wi-Fi 網路

---

## 📚 技術棧

### 前端
- **React Native** v0.81.5
- **React** v19.1.0
- **Expo** ~54.0.25
- **React Navigation** v7.x（導航）
- **Context API**（狀態管理）
- **AsyncStorage**（本地儲存）

### 後端
- **Node.js** + **Express** v4.19.2
- **SQLite3** v5.1.7 + **sqlite** 套件
- **WebSocket**（ws v8.18.3）
- **CORS** 跨域支援

---

## 📖 進階使用

### 管理員模式

1. 在「設定」頁面設定管理員 PIN
2. 使用 PIN 碼進入管理員模式
3. 存取進階功能（統計分析等）

### 感測器綁定

1. 在「設定」頁面綁定感測設備到特定共享箱
2. 進入「感測器」模式開始監控
3. 系統會自動偵測異常（高震動值、異常開門）並記錄事件

### 自訂資料

編輯 `server/schema.sql` 與 `APP/src/constants/initialData.js` 可自訂：
- 預設使用者
- 預設共享箱
- 初始事件資料

---

## 📄 相關文件

| 檔案 | 位置 | 說明 |
|------|------|------|
| `README.md` | APP/ | App 詳細功能說明 |
| `file_function_and_use.md` | APP/ | 各模組檔案用途對照 |
| `schema.sql` | server/ | 資料庫 SQL 結構 |
| `README.md` | server/ | 後端詳細說明 |
| `附註.txt` | 根目錄 | 快速啟動指南 |

---

## 📞 支援與反饋

如有任何問題或建議，請檢查：
1. 各項環境設定是否正確
2. 後端與前端是否同時執行
3. 網路連線是否穩定
4. 相關 npm 依賴套件是否安裝完整

---

## 📄 授權

本專題為國立高雄科技大學「智連網應用」課程期末專題。

**開發時間：** 2025 年 12 月

---

**祝您使用愉快！** 🚀
