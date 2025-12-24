// src/screens/AnalyticsScreen.js
// 使用統計畫面
import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';

import BaseScreen from '../components/BaseScreen';
import PressableScale from '../components/PressableScale';
import { useThemeColors } from '../theme/ThemeContext';
import { useAppData } from '../data/DataContext';
import { styles as globalStyles } from '../styles';
import { getTimeOfDayBucket } from '../utils/timeUtils';

export default function AnalyticsScreen({ navigation }) {
  const theme = useThemeColors();
  const { boxes, history, users, isAdminMode } = useAppData();

  // ✅ 非管理員：顯示鎖定畫面（開啟管理員後，因為 isAdminMode 變 true 會立刻重 render）
  if (!isAdminMode) {
    return (
      <BaseScreen title="使用統計" showBack>
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <View
            style={[
              globalStyles.card,
              { backgroundColor: theme.card, borderColor: theme.cardBorder },
            ]}
          >
            <Text style={[globalStyles.cardTitle, { color: theme.text }]}>需要管理員權限</Text>
            <Text style={[globalStyles.cardSubtitle, { color: theme.mutedText, marginTop: 6 }]}>
              請到「設定 → 管理員模式」開啟後再查看統計。
            </Text>

            <View style={{ marginTop: 12 }}>
              <PressableScale
                onPress={() => navigation?.navigate?.('Settings')}
                style={{
                  borderRadius: 14,
                  paddingVertical: 10,
                  alignItems: 'center',
                  backgroundColor: theme.accent,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>前往設定</Text>
              </PressableScale>
            </View>
          </View>
        </View>
      </BaseScreen>
    );
  }

  const historySafe = Array.isArray(history) ? history : [];

  const { byBox, byUser, byTimeOfDay, totalEvents } = useMemo(() => {
    const byBox = {};
    const byUser = {};
    const byTimeOfDay = {};

    historySafe.forEach((h) => {
      if (h.boxId) byBox[h.boxId] = (byBox[h.boxId] || 0) + 1;
      if (h.userId) byUser[h.userId] = (byUser[h.userId] || 0) + 1;

      if (h.timestamp) {
        const bucket = getTimeOfDayBucket(h.timestamp);
        if (bucket) byTimeOfDay[bucket] = (byTimeOfDay[bucket] || 0) + 1;
      }
    });

    return { byBox, byUser, byTimeOfDay, totalEvents: historySafe.length };
  }, [historySafe]);

  const maxBoxCount = Object.values(byBox).reduce((m, v) => Math.max(m, v), 0) || 1;
  const maxUserCount = Object.values(byUser).reduce((m, v) => Math.max(m, v), 0) || 1;
  const maxTimeCount = Object.values(byTimeOfDay).reduce((m, v) => Math.max(m, v), 0) || 1;

  const boxName = (boxId) => boxes.find((b) => b.id === boxId)?.name || boxId;
  const userName = (userId) =>
    users.find((u) => u.id === userId)?.name || users.find((u) => u.id === userId)?.label || userId;

  const renderBarRow = (label, value, max) => {
    const pct = Math.max(0, Math.min(1, value / max));
    return (
      <View style={globalStyles.barRow} key={label}>
        <Text style={[globalStyles.barLabel, { color: theme.mutedText }]} numberOfLines={1}>
          {label}
        </Text>
        <View style={[globalStyles.barTrack, { backgroundColor: theme.chipBg }]}>
          <View style={[globalStyles.barFill, { width: `${pct * 100}%`, backgroundColor: theme.accent }]} />
        </View>
        <Text style={{ width: 36, textAlign: 'right', color: theme.mutedText, fontVariant: ['tabular-nums'] }}>
          {value}
        </Text>
      </View>
    );
  };

  return (
    <BaseScreen title="使用統計" showBack>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <View style={globalStyles.sectionTitleRow}>
          <Text style={[globalStyles.sectionTitle, { color: theme.text }]}>總覽</Text>
          <Text style={[globalStyles.sectionHint, { color: theme.subtleText }]}>
            事件共 {totalEvents} 筆（管理員）
          </Text>
        </View>

        <View style={[globalStyles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[globalStyles.cardTitle, { color: theme.text }]}>依箱子</Text>
          <View style={{ marginTop: 10 }}>
            {Object.keys(byBox).length === 0 ? (
              <Text style={{ color: theme.mutedText, fontSize: 13 }}>尚無資料</Text>
            ) : (
              Object.entries(byBox)
                .sort((a, b) => b[1] - a[1])
                .map(([id, v]) => renderBarRow(boxName(id), v, maxBoxCount))
            )}
          </View>
        </View>

        <View style={[globalStyles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[globalStyles.cardTitle, { color: theme.text }]}>依使用者</Text>
          <View style={{ marginTop: 10 }}>
            {Object.keys(byUser).length === 0 ? (
              <Text style={{ color: theme.mutedText, fontSize: 13 }}>尚無資料</Text>
            ) : (
              Object.entries(byUser)
                .sort((a, b) => b[1] - a[1])
                .map(([id, v]) => renderBarRow(userName(id), v, maxUserCount))
            )}
          </View>
        </View>

        <View style={[globalStyles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[globalStyles.cardTitle, { color: theme.text }]}>依時段</Text>
          <View style={{ marginTop: 10 }}>
            {Object.keys(byTimeOfDay).length === 0 ? (
              <Text style={{ color: theme.mutedText, fontSize: 13 }}>尚無資料</Text>
            ) : (
              Object.entries(byTimeOfDay)
                .sort((a, b) => b[1] - a[1])
                .map(([id, v]) => renderBarRow(id, v, maxTimeCount))
            )}
          </View>
        </View>
      </ScrollView>
    </BaseScreen>
  );
}
