import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { ClayPotIcon } from './ClayPotIcon';
import { colors } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export function CustomSplashScreen() {
  return (
    <View style={styles.container}>
      <ClayPotIcon size={width * 0.35} color="#B8856A" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
