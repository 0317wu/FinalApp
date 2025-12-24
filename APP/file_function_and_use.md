## 檔案用途與內部函數簡述

```text
APP/
├─ assets/                 # 圖片資源（icon / splash / favicon 等；對應 app.json）
├─ src/
│  ├─ components/          # 共用 UI 元件
│  │  ├─ BaseScreen.js     # 共用頁面框架：Header（標題/返回鍵）+ SafeArea + 容器
│  │  ├─ PressableScale.js # 可按壓縮放動畫按鈕（統一互動手感）
│  │  └─ ToastContext.js   # 全域 Toast 提示（show/hide、動畫、顏色）
│  ├─ constants/
│  │  └─ initialData.js    # 初始假資料：共享箱/使用者/歷史事件（供 Demo）
│  ├─ data/
│  │  └─ DataContext.js    # 全域資料狀態：boxes/history/users + admin/設定 + 事件紀錄 logEvent
│  ├─ navigation/
│  │  └─ BoxesStackNavigator.js # 「共享箱」頁面的 Stack 導航（列表→詳情）
│  ├─ screens/             # 各功能頁面（Tab 會導到這些）
│  │  ├─ HomeScreen.js     # 首頁：總覽、異常 Banner、快捷入口（如統計）
│  │  ├─ BoxesScreen.js    # 共享箱列表：搜尋/篩選（ALL/AVAILABLE/IN_USE/ALERT）
│  │  ├─ BoxDetailScreen.js# 共享箱詳情：新增事件（放入/領取/異常）→ 呼叫 logEvent
│  │  ├─ HistoryScreen.js  # 歷史紀錄：SectionList 分組顯示事件
│  │  ├─ AnalyticsScreen.js# 統計：管理員模式才可看（isAdminMode gate）
│  │  └─ SettingsScreen.js # 設定：深淺色、異常提示、使用者切換、管理員 PIN / 模式
│  ├─ theme/
│  │  └─ ThemeContext.js   # 主題（深/淺色）+ 提供 navigationTheme + toggleTheme
│  ├─ utils/
│  │  ├─ boxUtils.js       # 箱子狀態對照（AVAILABLE/IN_USE/ALERT → label/tone）
│  │  └─ timeUtils.js      # 時間格式化 + 日期分組 + 時段 bucket（統計用）
│  └─ styles.js            # 全域 StyleSheet（卡片、標題、banner、chip、列表…）
├─ App.js                  # App 主入口：BottomTab 導航 + icon + Theme/Data/Toast Provider 包裝
├─ index.js                # Expo 啟動入口：registerRootComponent(App)
├─ app.json                # Expo 專案設定（name/slug/icon/splash/平台設定）
├─ eas.json                # EAS 打包/上架設定（development/preview/production profiles）
├─ package.json            # 套件與 scripts（expo start / android / ios / web）
├─ package-lock.json       # 依賴鎖定版本（確保環境一致）
├─ README.md               # 專案說明（功能、架構、頁面、技術選型）
├─ file_function_and_use.md# 你自己整理的「檔案用途說明」（文件）
├─ src.rar                 # src 備份壓縮檔（通常可不提交，但保留也OK）
└─ .gitignore              # Git 忽略規則（node_modules、build 等）
