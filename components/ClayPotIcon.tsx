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
        fill={color}
        opacity={0.9}
      />

      <Path
        d="M15 14 C15 14, 16 12, 18 11 C20 10, 22 10, 24 10 C26 10, 28 10, 30 11 C32 12, 33 14, 33 14"
        fill={color}
        opacity={0.95}
      />

      <Ellipse
        cx="24"
        cy="14"
        rx="9"
        ry="2.5"
        fill={color}
      />

      <Path
        d="M14 24 C14 24, 14.5 25, 15 26"
        stroke={color}
        strokeWidth="0.5"
        fill="none"
        opacity={0.3}
      />

      <Path
        d="M34 24 C34 24, 33.5 25, 33 26"
        stroke={color}
        strokeWidth="0.5"
        fill="none"
        opacity={0.3}
      />
    </Svg>
  );
}
