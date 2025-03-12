import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Rect, Path } from 'react-native-svg';

export const MastercardLogo = () => (
  <View style={styles.mastercardContainer}>
    <Svg width="45" height="28" viewBox="0 0 45 28">
      <Circle cx="15" cy="14" r="9" fill="#EB001B" />
      <Circle cx="30" cy="14" r="9" fill="#F79E1B" />
      <Path
        d="M22.5 6.5a11.2 11.2 0 0 0-7.5 7.5 11.2 11.2 0 0 0 0 7.5 11.2 11.2 0 0 0 7.5 7.5 11.2 11.2 0 0 0 7.5-7.5 11.2 11.2 0 0 0 0-7.5 11.2 11.2 0 0 0-7.5-7.5z"
        fill="#FF5F00"
        fillOpacity="0.8"
      />
    </Svg>
  </View>
);

export const ChipIcon = () => (
  <View style={styles.chipContainer}>
    <Svg width="30" height="24" viewBox="0 0 30 24">
      <Rect
        x="2"
        y="2"
        width="26"
        height="20"
        rx="2"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.5"
        fill="none"
      />
      <Rect
        x="7"
        y="6"
        width="16"
        height="12"
        rx="1"
        fill="rgba(255,255,255,0.3)"
      />
      <Path
        d="M4 8h4M4 12h4M4 16h4"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1"
      />
    </Svg>
  </View>
);

const styles = StyleSheet.create({
  mastercardContainer: {
    width: 45,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipContainer: {
    width: 30,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 