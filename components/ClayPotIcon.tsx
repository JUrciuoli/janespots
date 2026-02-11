import React from 'react';
import Svg, { Path, Ellipse } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface ClayPotIconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export function ClayPotIcon({ size = 48, color = '#B8856A', style }: ClayPotIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" style={style}>
      <Path
        d="M16 14 C16 14, 14 20, 14 24 C14 32, 18 38, 24 38 C30 38, 34 32, 34 24 C34 20, 32 14, 32 14"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
      />

      <Path
        d="M15 14 C15 14, 16 12, 18 11 C20 10, 22 10, 24 10 C26 10, 28 10, 30 11 C32 12, 33 14, 33 14"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
      />

      <Ellipse
        cx="24"
        cy="14"
        rx="9"
        ry="2.5"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
      />
    </Svg>
  );
}
