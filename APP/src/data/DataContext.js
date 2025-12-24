// src/data/DataContext.js
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiGet, apiPost, apiPut, createWebSocketConnection } from '../services/api';
import { formatDateLabel } from '../utils/timeUtils';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [history, setHistory] = useState([]);

  // settings (全部存在 DB)
  const [currentUserId, setCurrentUserIdState] = useState(null);
  const [showAlertBanner, setShowAlertBannerState] = useState(true);
  const [adminPin, setAdminPinState] = useState(null);
  const [isAdminMode, setIsAdminModeState] = useState(false);
  const [sensorBoundBoxId, setSensorBoundBoxIdState] = useState(null);

  // sensor runtime (只在 APP 記憶體，重開會停止)
  const [sensorRunning, setSensorRunning] = useState(false);
  const [sensorLastSentAt, setSensorLastSentAt] = useState(null);
  const [sensorLastError, setSensorLastError] = useState(null);
  const sensorTimerRef = useRef(null);
  const wsRef = useRef(null);

  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const currentUser = useMemo(() => users.find((u) => u.id === currentUserId) || null, [users, currentUserId]);

  const refreshFromServer = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const data = await apiGet('/bootstrap');
      if (data?.users) setUsers(data.users);
      if (data?.boxes) setBoxes(data.boxes);
      if (data?.history) setHistory(data.history);

      const s = data?.settings || {};
      setCurrentUserIdState(s.currentUserId ?? (data?.users?.[0]?.id ?? null));
      setShowAlertBannerState(!!s.showAlertBanner);
      setAdminPinState(s.adminPin ?? null);
      setIsAdminModeState(!!s.isAdminMode);
      setSensorBoundBoxIdState(s.sensorBoundBoxId ?? null);

      setBootstrapped(true);
    } catch (e) {
      setSyncError(e?.message ?? String(e));
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    refreshFromServer();

    // unmount cleanup
    return () => {
      try {
        if (sensorTimerRef.current) clearInterval(sensorTimerRef.current);
        if (wsRef.current) {
          wsRef.current.close();
        }
      } catch {}
      sensorTimerRef.current = null;
      wsRef.current = null;
      setSensorRunning(false);
    };
  }, [refreshFromServer]);

  // ===== settings setters (all persist to DB) =====
  const setCurrentUserId = useCallback(
    async (id) => {
      setCurrentUserIdState(id);
      try {
        const res = await apiPut('/settings', { currentUserId: id });
        if (res?.settings) {
          setCurrentUserIdState(res.settings.currentUserId ?? id);
        }
      } catch (e) {
        setSyncError(e?.message ?? String(e));
      }
    },
    []
  );

  const setShowAlertBanner = useCallback(
    async (v) => {
      setShowAlertBannerState(v);
      try {
        const res = await apiPut('/settings', { showAlertBanner: !!v });
        if (res?.settings) setShowAlertBannerState(!!res.settings.showAlertBanner);
      } catch (e) {
        setSyncError(e?.message ?? String(e));
      }
    },
    []
  );

  const setAdminPin = useCallback(
    async (pin) => {
      const val = pin ? String(pin) : null;
      setAdminPinState(val);
      // pin 變更後預設關閉 adminMode（需要重新驗證）
      setIsAdminModeState(false);
      try {
        const res = await apiPut('/settings', { adminPin: val, isAdminMode: false });
        if (res?.settings) {
          setAdminPinState(res.settings.adminPin ?? null);
          setIsAdminModeState(!!res.settings.isAdminMode);
        }
      } catch (e) {
        setSyncError(e?.message ?? String(e));
      }
    },
    []
  );

  const verifyAdminPin = useCallback(
    (pin) => {
      if (!adminPin) return false;
      return String(pin) === String(adminPin);
    },
    [adminPin]
  );

  const enableAdminMode = useCallback(
    async (pin) => {
      if (!adminPin) return false;
      const ok = verifyAdminPin(pin);
      if (!ok) return false;
      setIsAdminModeState(true);
      try {
        await apiPut('/settings', { isAdminMode: true });
      } catch (e) {
        setSyncError(e?.message ?? String(e));
      }
      return true;
    },
    [adminPin, verifyAdminPin]
  );

  const disableAdminMode = useCallback(async () => {
    setIsAdminModeState(false);
    try {
      await apiPut('/settings', { isAdminMode: false });
    } catch (e) {
      setSyncError(e?.message ?? String(e));
    }
  }, []);

  // sensor binding stored in DB too
  const bindSensorBox = useCallback(async (boxId) => {
    setSensorBoundBoxIdState(boxId);
    try {
      const res = await apiPut('/settings', { sensorBoundBoxId: boxId });
      if (res?.settings) setSensorBoundBoxIdState(res.settings.sensorBoundBoxId ?? boxId);
    } catch (e) {
      setSyncError(e?.message ?? String(e));
    }
  }, []);

  const unbindSensorBox = useCallback(async () => {
    setSensorBoundBoxIdState(null);
    try {
      const res = await apiPut('/settings', { sensorBoundBoxId: null });
      if (res?.settings) setSensorBoundBoxIdState(res.settings.sensorBoundBoxId ?? null);
    } catch (e) {
      setSyncError(e?.message ?? String(e));
    }
  }, []);

  // ===== events =====
  const logEvent = useCallback(
    async ({ boxId, type, note = '' }) => {
      if (!boxId || !type) return false;
      try {
        await apiPost('/events', {
          boxId,
          type,
          note,
          userId: currentUserId,
        });
        await refreshFromServer();
        return true;
      } catch (e) {
        setSyncError(e?.message ?? String(e));
        return false;
      }
    },
    [currentUserId, refreshFromServer]
  );

  // ===== sensor via WebSocket =====
  const sendSensorReading = useCallback(
    async ({ boxId, deviceId = 'phone', payload = {} }) => {
      if (!boxId) return false;
      
      // 確保 WebSocket 連接
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        try {
          wsRef.current = createWebSocketConnection();
          
          // 等待連接建立
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
            
            wsRef.current.onopen = () => {
              clearTimeout(timeout);
              resolve();
            };
            
            wsRef.current.onerror = (error) => {
              clearTimeout(timeout);
              reject(error);
            };
          });
        } catch (e) {
          setSyncError('WebSocket 連接失敗: ' + (e?.message ?? String(e)));
          return false;
        }
      }
      
      try {
        // 透過 WebSocket 傳送感測器資料
        wsRef.current.send(JSON.stringify({
          type: 'sensor',
          boxId,
          deviceId,
          payload
        }));
        
        return true;
      } catch (e) {
        setSyncError(e?.message ?? String(e));
        return false;
      }
    },
    []
  );


  // 最後異常偵測時間
  const [lastAlertDetectedAt, setLastAlertDetectedAt] = useState(null);

  const sensorStatus = useMemo(() => ({
    running: !!sensorRunning,
    boundBoxId: sensorBoundBoxId ?? null,
    lastSentAt: sensorLastSentAt,
    lastError: sensorLastError,
    lastAlertDetectedAt,
  }), [sensorRunning, sensorBoundBoxId, sensorLastSentAt, sensorLastError, lastAlertDetectedAt]);

  const stopSensor = useCallback(() => {
    try {
      if (sensorTimerRef.current) clearInterval(sensorTimerRef.current);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    } catch {}
    sensorTimerRef.current = null;
    wsRef.current = null;
    setSensorRunning(false);
  }, []);

  const startSensor = useCallback(
    ({ deviceId = 'phone', intervalMs = 3000 } = {}) => {
      if (!sensorBoundBoxId) {
        setSensorLastError('尚未綁定共享箱（請先綁定 B01/B02...）');
        return false;
      }
      if (sensorTimerRef.current) return true;

      setSensorLastError(null);
      setSensorRunning(true);

      // 建立 WebSocket 連接
      try {
        wsRef.current = createWebSocketConnection();
        
        wsRef.current.onopen = () => {
          console.log('📡 WebSocket connected for sensor mode');
          setSensorLastError(null);
        };
        
        wsRef.current.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data);
            if (response.ok) {
              setSensorLastSentAt(response.timestamp || new Date().toISOString());
              setSensorLastError(null);
            } else {
              setSensorLastError(response.error || '伺服器回應錯誤');
            }
          } catch (e) {
            console.error('WebSocket message parse error:', e);
          }
        };
        
        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setSensorLastError('WebSocket 連接錯誤');
        };
        
        wsRef.current.onclose = () => {
          console.log('📡 WebSocket disconnected');
          if (sensorRunning) {
            setSensorLastError('WebSocket 連接已斷開');
          }
        };
      } catch (e) {
        setSensorLastError('無法建立 WebSocket 連接: ' + (e?.message ?? String(e)));
        return false;
      }

      // 先送一筆，避免等第一個 interval
      const sendOnce = async () => {
        const payload = {
          ts: new Date().toISOString(),
          vibration: Number((Math.random() * 1.0).toFixed(3)),
          door: Math.random() > 0.85 ? 'OPEN' : 'CLOSED',
          battery: Math.floor(60 + Math.random() * 40),
        };
        
        // 檢查是否有異常：震動過大或異常開門
        const hasVibrationAlert = payload.vibration > 0.7;
        const hasDoorAlert = payload.door === 'OPEN';
        const isAbnormal = hasVibrationAlert || hasDoorAlert;
        
        const ok = await sendSensorReading({ boxId: sensorBoundBoxId, deviceId, payload });
        if (!ok) {
          setSensorLastError('送出感測資料失敗（請檢查 WebSocket 連線）');
          return;
        }
        
        // 如果偵測到異常，記錄 ALERT 事件
        if (isAbnormal) {
          const alertNote = [];
          if (hasVibrationAlert) alertNote.push(`震動異常 (${payload.vibration})`);
          if (hasDoorAlert) alertNote.push('偵測到開門');
          
          const eventLogged = await logEvent({
            boxId: sensorBoundBoxId,
            type: 'ALERT',
            note: `感測器異常：${alertNote.join('、')}`,
          });
          
          if (eventLogged) {
            const now = new Date().toISOString();
            setLastAlertDetectedAt(now);
            console.log(`⚠️ 異常偵測：${alertNote.join('、')} at ${now}`);
          }
        }
      };

      // 等待 WebSocket 連接後開始發送
      const startInterval = () => {
        sendOnce();
        sensorTimerRef.current = setInterval(() => {
          sendOnce();
        }, Math.max(500, Number(intervalMs) || 3000));
      };

      // 如果已經連接就立即開始，否則等連接建立
      if (wsRef.current.readyState === WebSocket.OPEN) {
        startInterval();
      } else {
        const originalOnOpen = wsRef.current.onopen;
        wsRef.current.onopen = (event) => {
          if (originalOnOpen) originalOnOpen(event);
          startInterval();
        };
      }

      return true;
    },
    [sensorBoundBoxId, sendSensorReading]
  );

  const value = useMemo(
    () => ({
      users,
      boxes,
      history: Array.isArray(history) ? history : [],

      currentUserId,
      currentUser,
      setCurrentUserId,

      showAlertBanner,
      setShowAlertBanner,

      syncing,
      syncError,
      refreshFromServer,

      isAdminMode,
      adminPin,
      hasAdminPin: !!adminPin,
      setAdminPin,
      verifyAdminPin,
      enableAdminMode,
      disableAdminMode,

      // sensor binding + sensor mode
      sensorBoundBoxId,
      bindSensorBox,
      unbindSensorBox,

      sensorStatus,
      startSensor,
      stopSensor,

      // actions
      logEvent,
      sendSensorReading,

      bootstrapped,
    }),
    [
      users,
      boxes,
      history,
      currentUserId,
      currentUser,
      setCurrentUserId,
      showAlertBanner,
      setShowAlertBanner,
      syncing,
      syncError,
      refreshFromServer,
      isAdminMode,
      adminPin,
      setAdminPin,
      verifyAdminPin,
      enableAdminMode,
      disableAdminMode,
      sensorBoundBoxId,
      bindSensorBox,
      unbindSensorBox,
      sensorStatus,
      startSensor,
      stopSensor,
      logEvent,
      sendSensorReading,
      bootstrapped,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useAppData must be used within DataProvider');
  return ctx;
}
