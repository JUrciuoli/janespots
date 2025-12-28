import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';
import { ClayPotIcon } from '@/components/ClayPotIcon';
import { colors, typography } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 800 }),
      withTiming(1, { duration: 1200 }),
      withTiming(0, { duration: 800 })
    );

    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, animatedStyle]}>
        <Text style={styles.welcomeText}>Welcome back, Jane</Text>
        <ClayPotIcon size={64} color={colors.clay} style={styles.icon} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    alignItems: 'center',
  },
  welcomeText: {
    ...typography.title,
    fontSize: 32,
    color: colors.clay,
    fontFamily: 'Cormorant_600SemiBold',
    marginBottom: 16,
  },
  icon: {
    marginTop: 8,
  },
});
