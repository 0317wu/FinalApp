// src/screens/BoxDetailScreen.js
// 置物櫃詳情畫面
import React, { useMemo, useState } from 'react';
import { View, Text, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';

import BaseScreen from '../components/BaseScreen';
import PressableScale from '../components/PressableScale';
import { useThemeColors } from '../theme/ThemeContext';
import { useAppData } from '../data/DataContext';
import { useToast } from '../components/ToastContext';
import { styles as globalStyles } from '../styles';
import { getStatusMeta } from '../utils/boxUtils';
import { formatDateTime } from '../utils/timeUtils';

const EVENT_META = {
  DELIVERY: { icon: 'download-outline', title: '放入包裹', type: 'success' },
  PICKUP: { icon: 'checkmark-done-outline', title: '領取完成', type: 'success' },
  ALERT: { icon: 'warning-outline', title: '標記異常', type: 'warning' },
};

export default function BoxDetailScreen() {
  const theme = useThemeColors();
  const toast = useToast();
  const route = useRoute();
  const { boxId } = route.params ?? {};
  const { boxes, logEvent } = useAppData();

  const box = useMemo(() => boxes.find((b) => b.id === boxId), [boxes, boxId]);

  const [modalVisible, setModalVisible] = useState(false);
  const [eventType, setEventType] = useState('DELIVERY');
  const [note, setNote] = useState('');

  if (!box) {
    return (
      <BaseScreen title="箱子詳情" showBack>
        <View style={globalStyles.listEmptyContainer}>
          <Text style={[globalStyles.listEmptyText, { color: theme.mutedText }]}>找不到此共享箱。</Text>
        </View>
      </BaseScreen>
    );
  }

  const statusMeta = getStatusMeta(box.status);
  const badgeBg =
    statusMeta.tone === 'success' ? theme.accentSoft : statusMeta.tone === 'danger' ? theme.dangerSoft : theme.chipBg;
  const badgeColor =
    statusMeta.tone === 'success' ? theme.accent : statusMeta.tone === 'danger' ? theme.danger : theme.chipText;

  const openEvent = (type) => {
    setEventType(type);
    setNote('');
    setModalVisible(true);
  };

  const closeEvent = () => setModalVisible(false);

  const submit = async () => {
    const ok = await logEvent?.({
      boxId: box.id,
      type: eventType,
      note: note?.trim() || '',
    });

    closeEvent();

    if (ok) {
      toast.showToast(`已新增：${EVENT_META[eventType].title}`, { type: EVENT_META[eventType].type });
    } else {
      toast.showToast('新增失敗：請確認電腦端 API 是否已啟動、IP/Port 是否正確', { type: 'danger' });
    }
  };

  return (
    <BaseScreen title={box.name} showBack>
      {/* 詳細資訊卡 */}
      <View style={[globalStyles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        <View style={[globalStyles.cardRow, { alignItems: 'center' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[globalStyles.cardTitle, { color: theme.text }]}>{box.name}</Text>
            <Text style={[globalStyles.cardSubtitle, { color: theme.mutedText, marginTop: 2 }]}>{box.location}</Text>
            <Text style={[globalStyles.cardSubtitle, { color: theme.mutedText, marginTop: 2 }]}>
              上次更新：{box.lastUpdated ? formatDateTime(box.lastUpdated) : '—'}
            </Text>
          </View>

          <View style={[globalStyles.statusBadge, { backgroundColor: badgeBg }]}>
            <Text style={[globalStyles.statusBadgeText, { color: badgeColor }]}>{statusMeta.label}</Text>
          </View>
        </View>
      </View>

      {/* 快速操作 */}
      <View style={globalStyles.sectionHeader}>
        <Text style={[globalStyles.sectionTitle, { color: theme.text }]}>快速操作（模擬事件）</Text>
        <Text style={[globalStyles.sectionHint, { color: theme.subtleText }]}>新增事件會寫入紀錄，並更新箱子狀態</Text>
      </View>

      <View style={globalStyles.quickActionsContainer}>
        {(['DELIVERY', 'PICKUP', 'ALERT'] || []).map((t) => {
          const m = EVENT_META[t];
          const isAlert = t === 'ALERT';
          const bg = isAlert ? theme.warningSoft : theme.accentSoft;
          const fg = isAlert ? theme.warning : theme.accent;

          return (
            <PressableScale
              key={t}
              onPress={() => openEvent(t)}
              style={[
                globalStyles.quickActionCard,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
              ]}
            >
              <View style={[globalStyles.quickActionIconWrapper, { backgroundColor: bg }]}>
                <Ionicons name={m.icon} size={18} color={fg} />
              </View>
              <View style={globalStyles.quickActionTextWrapper}>
                <Text style={[globalStyles.quickActionTitle, { color: theme.text }]}>{m.title}</Text>
                <Text style={[globalStyles.quickActionSubtitle, { color: theme.subtleText }]}>可選填備註</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.mutedText} />
            </PressableScale>
          );
        })}
      </View>

      {/* 新增事件 Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeEvent}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 18 }}>
          <View style={{ borderRadius: 16, borderWidth: 1, borderColor: theme.cardBorder, backgroundColor: theme.card, padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>新增事件</Text>
              <PressableScale onPress={closeEvent} style={{ padding: 6 }}>
                <Ionicons name="close" size={20} color={theme.mutedText} />
              </PressableScale>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              <View style={{ width: 34, height: 34, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.accentSoft, marginRight: 10 }}>
                <Ionicons name={EVENT_META[eventType].icon} size={18} color={theme.accent} />
              </View>
              <Text style={{ color: theme.text, fontWeight: '800' }}>{EVENT_META[eventType].title}</Text>
            </View>

            <Text style={{ marginTop: 10, color: theme.subtleText, fontSize: 12 }}>備註（可留空）</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="例如：外送員已放入 / 超時未取..."
              placeholderTextColor={theme.subtleText}
              style={{ marginTop: 6, borderWidth: 1, borderColor: theme.cardBorder, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: theme.text }}
            />

            <PressableScale onPress={submit} style={{ marginTop: 12, borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: theme.accent }}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>確認新增</Text>
            </PressableScale>
          </View>
        </View>
      </Modal>
    </BaseScreen>
  );
}
