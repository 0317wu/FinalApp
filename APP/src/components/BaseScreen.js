// src/components/BaseScreen.js
// 作用是 : 基本畫面框架元件
import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useThemeColors } from '../theme/ThemeContext';
import { styles as globalStyles } from '../styles';
// 基本畫面框架元件
export default function BaseScreen({
  title,
  desc,
  children,
  scroll = false,
  showBack, // ✅ 新增：可強制控制是否顯示返回
  right,    // ✅ 可選：右側放 icon/button
}) {
  const theme = useThemeColors();
  const navigation = useNavigation();

  const canGoBack = typeof navigation?.canGoBack === 'function'
    ? navigation.canGoBack()
    : false;

  // ✅ 預設：只有能返回才顯示；若 showBack 明確給 false，則強制不顯示
  const shouldShowBack = typeof showBack === 'boolean' ? showBack : canGoBack;

  const Container = scroll ? ScrollView : View;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.bg,
      }}
    >
      {/* Header */}
      <View style={[globalStyles.header, { paddingHorizontal: 20 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Left */}
          <View style={{ width: 40, alignItems: 'flex-start' }}>
            {shouldShowBack ? (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.card,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                }}
              >
                <Ionicons name="chevron-back" size={20} color={theme.text} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Center */}
          <View style={{ flex: 1 }}>
            {title ? (
              <Text
                style={[globalStyles.title, { color: theme.headerText }]}
                numberOfLines={1}
              >
                {title}
              </Text>
            ) : null}
            {desc ? (
              <Text style={[globalStyles.desc, { color: theme.subtleText }]}>
                {desc}
              </Text>
            ) : null}
          </View>

          {/* Right */}
          <View style={{ width: 40, alignItems: 'flex-end' }}>
            {right || null}
          </View>
        </View>
      </View>

      {/* Body */}
      <Container
        style={{ flex: 1 }}
        contentContainerStyle={scroll ? globalStyles.scrollContent : undefined}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}
