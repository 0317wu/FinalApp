// src/components/ToastContext.js 
// 作用：提供全域 Toast 提示訊息功能 
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const theme = useThemeColors();
  const [state, setState] = useState({ visible: false, message: '', type: 'info' });

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const timerRef = useRef(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 12, duration: 160, useNativeDriver: true }),
    ]).start(() => setState((s) => ({ ...s, visible: false })));
  }, [opacity, translateY]);

  const show = useCallback(
    (message, options = {}) => {
      const { type = 'info', duration = 1800 } = options;

      setState({ visible: true, message, type });

      opacity.setValue(0);
      translateY.setValue(12);

      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start();

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => hide(), duration);
    },
    [hide, opacity, translateY]
  );

  // ✅ 兼容你專案裡不同寫法：toast.show / showToast / toast.showToast
  const value = useMemo(
    () => ({
      show,
      hide,
      showToast: show,
      hideToast: hide,
    }),
    [show, hide]
  );

  const toastStyle = useMemo(() => {
    let bg = theme.card;
    let border = theme.cardBorder;
    let text = theme.text;

    if (state.type === 'success') {
      bg = theme.successSoft;
      border = 'rgba(22,163,74,0.35)';
    } 
    else if (state.type === 'danger') {
      bg = theme.dangerSoft;
      border = 'rgba(220,38,38,0.35)';
    } 
    else if (state.type === 'warning') {
      bg = theme.warningSoft;
      border = 'rgba(245,158,11,0.45)';
    }
    return { bg, border, text };
  }, [state.type, theme]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {state.visible ? (
        <View pointerEvents="none" style={styles.overlay}>
          <Animated.View
            style={[
              styles.toast,
              {
                backgroundColor: toastStyle.bg,
                borderColor: toastStyle.border,
                opacity,
                transform: [{ translateY }],
              },
            ]}
          >
            <Text style={[styles.toastText, { color: toastStyle.text }]} numberOfLines={2}>
              {state.message}
            </Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
// 樣式
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 76,
    alignItems: 'center',
    zIndex: 999,
  },
  toast: {
    maxWidth: 320,
    width: '88%',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
