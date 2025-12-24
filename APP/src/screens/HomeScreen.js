// src/screens/HomeScreen.js
// 共享箱總覽畫面
import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import BaseScreen from '../components/BaseScreen';
import PressableScale from '../components/PressableScale';
import { useThemeColors } from '../theme/ThemeContext';
import { useAppData } from '../data/DataContext';
import { useToast } from '../components/ToastContext';
import { styles as globalStyles } from '../styles';

export default function HomeScreen() {
  const theme = useThemeColors();
  const navigation = useNavigation();
  const toast = useToast();

  const { boxes, history, showAlertBanner, lastAlertBoxId, isAdminMode } = useAppData();

  // ✅ Banner 本地消除狀態：點「已處理」就立刻消失
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const stats = useMemo(() => {
    const total = Array.isArray(boxes) ? boxes.length : 0;
    const inUse = (Array.isArray(boxes) ? boxes : []).filter((b) => b.status === 'IN_USE').length;
    const alert = (Array.isArray(boxes) ? boxes : []).filter((b) => b.status === 'ALERT').length;
    return { total, inUse, alert };
  }, [boxes]);

  // ✅ 只要「異常數量」或「最後異常箱」變了，就讓 Banner 再次出現（符合成品 App 行為）
  useEffect(() => {
    setBannerDismissed(false);
  }, [stats.alert, lastAlertBoxId, showAlertBanner]);

  const recent = useMemo(() => {
    const safe = Array.isArray(history) ? history : [];
    return safe.slice(0, 4);
  }, [history]);

  const handleGoAnalytics = () => {
    if (!isAdminMode) {
      toast?.show?.('統計功能僅限「管理員模式」使用', { type: 'warning' });
      return;
    }
    navigation.navigate('Analytics');
  };

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    toast?.show?.('已標記為已處理', { type: 'success' });
  };

  const shouldShowBanner = showAlertBanner && stats.alert > 0 && !bannerDismissed;

  return (
    <BaseScreen title="共享箱總覽" showBack={false}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[globalStyles.desc, { color: theme.mutedText, marginTop: -6, marginBottom: 12 }]}>
          即時掌握箱子狀態、使用紀錄與異常提醒。
        </Text>

        {shouldShowBanner ? (
          <View style={[globalStyles.banner, { backgroundColor: theme.bannerBg }]}>
            <Ionicons name="alert-circle" size={20} color={theme.bannerText} />
            <Text style={[globalStyles.bannerText, { color: theme.bannerText }]}>
              有共享箱處於異常狀態{lastAlertBoxId ? `（${lastAlertBoxId}）` : ''}，請盡快處理。
            </Text>

            <PressableScale
              onPress={handleDismissBanner}
              style={[
                globalStyles.chip,
                { backgroundColor: 'rgba(255,255,255,0.28)', borderColor: 'rgba(255,255,255,0.35)' },
              ]}
            >
              <Text style={[globalStyles.chipText, { color: theme.bannerText }]}>已處理</Text>
            </PressableScale>
          </View>
        ) : null}

        <View style={globalStyles.metricRow}>
          <View style={[globalStyles.metricCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginRight: 8 }]}>
            <Ionicons name="cube-outline" size={18} color={theme.mutedText} />
            <Text style={[globalStyles.metricValue, { color: theme.text }]}>{stats.total}</Text>
            <Text style={[globalStyles.metricLabel, { color: theme.mutedText }]}>箱子總數</Text>
          </View>

          <View style={[globalStyles.metricCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginRight: 8 }]}>
            <Ionicons name="time-outline" size={18} color={theme.accent} />
            <Text style={[globalStyles.metricValue, { color: theme.text }]}>{stats.inUse}</Text>
            <Text style={[globalStyles.metricLabel, { color: theme.mutedText }]}>使用中</Text>
          </View>

          <View style={[globalStyles.metricCard, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginRight: 0 }]}>
            <Ionicons name="warning-outline" size={18} color={theme.danger} />
            <Text style={[globalStyles.metricValue, { color: theme.text }]}>{stats.alert}</Text>
            <Text style={[globalStyles.metricLabel, { color: theme.mutedText }]}>異常</Text>
          </View>
        </View>

        <View style={globalStyles.sectionHeader}>
          <Text style={[globalStyles.sectionTitle, { color: theme.text }]}>快速操作</Text>
        </View>

        <View style={globalStyles.quickTileRow}>
          <PressableScale
            style={[globalStyles.quickTile, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={() => navigation.navigate('Boxes')}
          >
            <View style={globalStyles.quickTileTop}>
              <View style={[globalStyles.quickTileIconWrap, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="cube" size={20} color={theme.accent} />
              </View>
              <Text style={[globalStyles.quickTileTitle, { color: theme.text }]}>查看全部箱子</Text>
            </View>
            <Text style={[globalStyles.quickTileSubtitle, { color: theme.mutedText }]}>即時掌握每一個共享箱的狀態</Text>
          </PressableScale>

          <PressableScale
            style={[globalStyles.quickTile, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={handleGoAnalytics}
          >
            <View style={globalStyles.quickTileTop}>
              <View style={[globalStyles.quickTileIconWrap, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="stats-chart" size={20} color={theme.accent} />
              </View>
              <Text style={[globalStyles.quickTileTitle, { color: theme.text }]}>使用統計</Text>
            </View>

            {isAdminMode ? (
              <Text style={[globalStyles.quickTileSubtitle, { color: theme.mutedText }]}>查看高峰時段、使用頻率與住戶分佈</Text>
            ) : (
              <View style={[globalStyles.lockPill, { backgroundColor: theme.chipBg, borderColor: theme.chipBorder }]}>
                <Text style={[globalStyles.lockPillText, { color: theme.chipText }]}>需管理員模式</Text>
              </View>
            )}
          </PressableScale>
        </View>

        <View style={globalStyles.sectionHeader}>
          <View style={globalStyles.sectionTitleRow}>
            <Text style={[globalStyles.sectionTitle, { color: theme.text }]}>最近活動</Text>
            <Text style={[globalStyles.sectionHint, { color: theme.subtleText }]}>
              {Array.isArray(history) ? history.length : 0} 筆
            </Text>
          </View>
        </View>

        {recent.length === 0 ? (
          <View style={globalStyles.listEmptyContainer}>
            <Text style={[globalStyles.listEmptyText, { color: theme.mutedText }]}>目前沒有任何使用紀錄。</Text>
          </View>
        ) : (
          recent.map((item) => (
            <PressableScale
              key={item.id}
              style={[globalStyles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder, marginBottom: 10 }]}
              onPress={() => navigation.navigate('Boxes', { screen: 'BoxDetail', params: { boxId: item.boxId } })}
            >
              <View style={[globalStyles.cardRow, { alignItems: 'center' }]}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    backgroundColor:
                      item.type === 'ALERT'
                        ? theme.dangerSoft
                        : item.type === 'PICKUP'
                        ? theme.successSoft
                        : theme.accentSoft,
                  }}
                >
                  <Ionicons
                    name={
                      item.type === 'ALERT'
                        ? 'warning-outline'
                        : item.type === 'PICKUP'
                        ? 'checkmark-done-outline'
                        : 'download-outline'
                    }
                    size={18}
                    color={item.type === 'ALERT' ? theme.danger : item.type === 'PICKUP' ? theme.success : theme.accent}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[globalStyles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                    {item.boxName}
                  </Text>
                  <Text style={[globalStyles.cardSubtitle, { color: theme.mutedText }]} numberOfLines={1}>
                    {item.userName} ・ {item.type === 'DELIVERY' ? '放入包裹' : item.type === 'PICKUP' ? '領取完成' : '異常事件'}
                  </Text>
                </View>

                <Text style={[globalStyles.cardSubtitle, { color: theme.subtleText, fontVariant: ['tabular-nums'] }]}>
                  {item.timestamp?.slice(11, 16)}
                </Text>
              </View>
            </PressableScale>
          ))
        )}
      </ScrollView>
    </BaseScreen>
  );
}
