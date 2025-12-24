// src/screens/HistoryScreen.js
// 置物櫃使用紀錄畫面
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import BaseScreen from '../components/BaseScreen';
import { useThemeColors } from '../theme/ThemeContext';
import { useAppData } from '../data/DataContext';
import { styles as globalStyles } from '../styles';

// 事件對應的圖示 / 文案 / 顏色
function getEventMeta(type, theme) {
  switch (type) {
    case 'DELIVERY':
      return {
        icon: 'download-outline',
        label: '放入包裹',
        toneBg: theme.accentSoft,
        toneColor: theme.accent,
      };
    case 'PICKUP':
      return {
        icon: 'checkmark-done-outline',
        label: '領取完成',
        toneBg: 'rgba(22,163,74,0.12)',      // success 綠系
        toneColor: theme.success || '#16A34A',
      };
    default:
      // 一律視為異常相關
      return {
        icon: 'warning-outline',
        label: '異常事件',
        toneBg: theme.dangerSoft,
        toneColor: theme.danger,
      };
  }
}

export default function HistoryScreen() {
  const theme = useThemeColors();
  const { history } = useAppData();
  const [typeFilter, setTypeFilter] = useState('ALL');

  // 根據類型過濾：全部 / 放入 / 領取 / 異常
  const filteredHistory = useMemo(() => {
    if (typeFilter === 'ALL') return history;
    if (typeFilter === 'ALERT') {
      // 「異常」= 不是 DELIVERY / PICKUP 的其他事件
      return history.filter(
        (h) => h.type !== 'DELIVERY' && h.type !== 'PICKUP'
      );
    }
    return history.filter((h) => h.type === typeFilter);
  }, [history, typeFilter]);

  // 依照 dateLabel 分組成 SectionList 結構
  const sections = useMemo(() => {
    const map = new Map();

    filteredHistory.forEach((item) => {
      const label = item.dateLabel || '其他日期';
      if (!map.has(label)) {
        map.set(label, []);
      }
      map.get(label).push(item);
    });

    // 依照「今天 / 昨天 / 更早」排序
    const order = ['今天', '昨天', '更早'];
    const entries = Array.from(map.entries());

    entries.sort((a, b) => {
      const ia = order.indexOf(a[0]);
      const ib = order.indexOf(b[0]);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    return entries.map(([title, data]) => ({
      title,
      data,
    }));
  }, [filteredHistory]);

  return (
    <BaseScreen title="使用紀錄" scroll={false}>
      {/* 上方篩選 pill */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <View style={globalStyles.sectionTitleRow}>
          <Text
            style={[
              globalStyles.sectionTitle,
              { color: theme.text },
            ]}
          >
            篩選紀錄
          </Text>
          <Text
            style={[
              globalStyles.sectionHint,
              { color: theme.subtleText },
            ]}
          >
            共 {filteredHistory.length} 筆
          </Text>
        </View>

        <View style={globalStyles.pillRow}>
          {[
            { label: '全部', value: 'ALL' },
            { label: '放入', value: 'DELIVERY' },
            { label: '領取', value: 'PICKUP' },
            { label: '異常', value: 'ALERT' },
          ].map((item) => {
            const active = typeFilter === item.value;
            return (
              <View
                key={item.value}
                style={[
                  globalStyles.pill,
                  {
                    borderColor: active
                      ? theme.accent
                      : theme.chipBorder,
                    backgroundColor: active
                      ? theme.accentSoft
                      : theme.chipBg,
                  },
                ]}
              >
                <Text
                  onPress={() => setTypeFilter(item.value)}
                  style={[
                    globalStyles.pillText,
                    {
                      color: active
                        ? theme.accent
                        : theme.chipText,
                      fontWeight: active ? '600' : '400',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 主體：時間線 SectionList */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 24,
        }}
        renderSectionHeader={({ section: { title } }) => (
          <View
            style={{
              marginTop: 16,
              marginBottom: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: theme.mutedText,
              }}
            >
              {title}
            </Text>
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: theme.divider,
                marginLeft: 8,
                opacity: 0.6,
              }}
            />
          </View>
        )}
        renderItem={({ item }) => {
          const meta = getEventMeta(item.type, theme);

          return (
            <View
              style={[
                globalStyles.card,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                  marginBottom: 8,
                },
              ]}
            >
              <View
                style={[
                  globalStyles.cardRow,
                  { alignItems: 'center' },
                ]}
              >
                {/* 左邊 icon 圓圈 */}
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    backgroundColor: meta.toneBg,
                  }}
                >
                  <Ionicons
                    name={meta.icon}
                    size={18}
                    color={meta.toneColor}
                  />
                </View>

                {/* 中間文字區塊 */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      globalStyles.cardTitle,
                      { color: theme.text },
                    ]}
                    numberOfLines={1}
                  >
                    {item.boxName}
                  </Text>
                  <Text
                    style={[
                      globalStyles.cardSubtitle,
                      { color: theme.mutedText },
                    ]}
                    numberOfLines={1}
                  >
                    {item.userName}
                  </Text>

                  {/* 事件類型小標籤 + 備註 */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 6,
                    }}
                  >
                    <View
                      style={[
                        globalStyles.chip,
                        {
                          paddingVertical: 3,
                          paddingHorizontal: 8,
                          borderColor: meta.toneBg,
                          backgroundColor: meta.toneBg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          globalStyles.chipText,
                          {
                            fontSize: 11,
                            color: meta.toneColor,
                          },
                        ]}
                      >
                        {meta.label}
                      </Text>
                    </View>
                    {item.note ? (
                      <Text
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          color: theme.subtleText,
                        }}
                        numberOfLines={1}
                      >
                        {item.note}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* 右邊時間 */}
                <Text
                  style={[
                    globalStyles.cardSubtitle,
                    {
                      color: theme.mutedText,
                      marginLeft: 8,
                      fontVariant: ['tabular-nums'],
                    },
                  ]}
                >
                  {item.timestamp?.slice(11, 16)}
                </Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={globalStyles.listEmptyContainer}>
            <Text
              style={[
                globalStyles.listEmptyText,
                { color: theme.mutedText },
              ]}
            >
              目前沒有任何使用紀錄。
            </Text>
          </View>
        }
      />
    </BaseScreen>
  );
}
