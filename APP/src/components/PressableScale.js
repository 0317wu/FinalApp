// src/components/PressableScale.js
// 作用是 : 可按壓縮放效果的元件
import React, { useRef } from 'react';
import { Animated, Pressable } from 'react-native';
// 可按壓縮放效果的元件
export default function PressableScale({
  children,
  onPress,
  style,
  disabled,
  ...rest
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const pressOut = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      {...rest}
      style={({ pressed }) => [
        { opacity: disabled ? 0.55 : pressed ? 0.98 : 1 },
      ]}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
