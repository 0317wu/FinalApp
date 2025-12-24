// src/screens/BoxesScreen.js
// 置物櫃列表畫面
import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import BaseScreen from '../components/BaseScreen';
import PressableScale from '../components/PressableScale';
import { useThemeColors } from '../theme/ThemeContext';
import { useAppData } from '../data/DataContext';
import { styles as globalStyles } from '../styles';
import { getStatusMeta } from '../utils/boxUtils';
import { formatDateTime } from '../utils/timeUtils';

function badgeColors(theme, tone) {
  if (tone === 'success') return { bg: theme.successSoft, text: theme.success };
  if (tone === 'danger') return { bg: theme.dangerSoft, text: theme.danger };
  return { bg: theme.accentSoft, text: theme.accent };
}

export default function BoxesScreen() {
  const theme = useThemeColors();
  const nav = useNavigation();
  const { boxes } = useAppData();

  const [filter, setFilter] = useState('ALL');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const list = Array.isArray(boxes) ? boxes : [];
    const byStatus = filter === 'ALL' ? list : list.filter((b) => b.status === filter);
    const query = q.trim().toLowerCase();
    if (!query) return byStatus;
    return byStatus.filter(
      (b) =>
        (b.name || '').toLowerCase().includes(query) ||
        (b.id || '').toLowerCase().includes(query) ||
        (b.location || '').toLowerCase().includes(query)
    );
  }, [boxes, filter, q]);

  return (
    <BaseScreen title="共享箱" desc="查看所有箱子狀態，點擊可進入詳細操作。" scroll={false}>
      <View style={{ flex: 1 }}>
        <View style={[globalStyles.searchBar, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.cardBorder }]}>
          <Ionicons name="search-outline" size={18} color={theme.mutedText} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="搜尋箱子（例如 A、BOX-A）"
            placeholderTextColor={theme.subtleText}
            style={[globalStyles.searchInput, { color: theme.text }]}
          />
          {q ? (
            <PressableScale onPress={() => setQ('')} style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={16} color={theme.mutedText} />
            </PressableScale>
          ) : null}
        </View>

        <View style={globalStyles.pillRow}>
          {[
            { label: '全部', value: 'ALL' },
            { label: '可預約', value: 'AVAILABLE' },
            { label: '使用中', value: 'IN_USE' },
            { label: '異常', value: 'ALERT' },
          ].map((item) => {
            const active = filter === item.value;
            return (
              <PressableScale
                key={item.value}
                onPress={() => setFilter(item.value)}
                style={[
                  globalStyles.pill,
                  {
                    borderColor: active ? theme.accent : theme.chipBorder,
                    backgroundColor: active ? theme.accentSoft : theme.chipBg,
                  },
                ]}
              >
                <Text style={[globalStyles.pillText, { color: active ? theme.accent : theme.chipText, fontWeight: active ? '600' : '400' }]}>
                  {item.label}
                </Text>
              </PressableScale>
            );
          })}
        </View>

        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const meta = getStatusMeta(item.status);
            const colors = badgeColors(theme, meta.tone);

            return (
              <PressableScale
                onPress={() => nav.navigate('BoxDetail', { boxId: item.id })}
                style={[globalStyles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
              >
                <View style={globalStyles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[globalStyles.cardTitle, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[globalStyles.cardSubtitle, { color: theme.mutedText }]} numberOfLines={1}>{item.location}</Text>
                    <Text style={[globalStyles.cardSubtitle, { color: theme.subtleText, marginTop: 6 }]} numberOfLines={1}>
                      上次更新：{formatDateTime(item.lastUpdated)}
                    </Text>
                  </View>

                  <View style={[globalStyles.statusBadge, { backgroundColor: colors.bg }]}>
                    <Text style={[globalStyles.statusBadgeText, { color: colors.text }]}>{meta.label}</Text>
                  </View>
                </View>
              </PressableScale>
            );
          }}
          ListEmptyComponent={
            <View style={globalStyles.listEmptyContainer}>
              <Ionicons name="cube-outline" size={22} color={theme.subtleText} />
              <Text style={[globalStyles.listEmptyText, { color: theme.mutedText, marginTop: 10 }]}>找不到符合條件的箱子。</Text>
            </View>
          }
        />
      </View>
    </BaseScreen>
  );
}
