import React, { useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

import { formatCurrency } from "@/utils/calculations";

type RollingNumberProps = {
  value: number;
  style?: TextStyle;
  duration?: number;
};

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const STACK_CYCLES = 3;
const DIGIT_STACK = Array.from({ length: DIGITS.length * STACK_CYCLES }, (_, index) => DIGITS[index % 10]);

type RollingDigitProps = {
  digit: number;
  height: number;
  duration: number;
  delay: number;
  extraTurns: number;
  textStyle: TextStyle;
  spacingStyle?: ViewStyle;
};

function RollingDigit({ digit, height, duration, delay, extraTurns, textStyle, spacingStyle }: RollingDigitProps) {
  const animatedIndex = useSharedValue(digit);
  const didAnimate = useRef(false);

  useEffect(() => {
    if (!height) {
      animatedIndex.value = digit;
      return;
    }

    const currentIndex = Math.round(animatedIndex.value);
    const currentDigit = ((currentIndex % 10) + 10) % 10;
    let delta = (digit - currentDigit + 10) % 10;
    if (delta === 0 && !didAnimate.current) {
      delta = 10;
    }
    if (delta === 0) delta = 10;

    const targetIndex = currentIndex + delta + extraTurns * 10;
    animatedIndex.value = withDelay(
      delay,
      withTiming(
        targetIndex,
        { duration, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) {
            animatedIndex.value = targetIndex % 10;
          }
        },
      ),
    );
    didAnimate.current = true;
  }, [digit, duration, delay, extraTurns, height, animatedIndex]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -animatedIndex.value * height }],
  }));

  if (!height) {
    return (
      <Text style={[textStyle, spacingStyle]} accessibilityRole="text">
        {digit}
      </Text>
    );
  }

  return (
    <View style={[styles.digitWindow, { height }, spacingStyle]} accessibilityRole="text">
      <Animated.View style={animatedStyle}>
        {DIGIT_STACK.map((d, index) => (
          <Text key={`digit-${index}`} style={[textStyle, styles.digitText]}>
            {d}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

type RollingSignProps = {
  char: string;
  height: number;
  delay: number;
  duration: number;
  textStyle: TextStyle;
  spacingStyle?: ViewStyle;
};

function RollingSign({ char, height, delay, duration, textStyle, spacingStyle }: RollingSignProps) {
  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!height) {
      translateY.value = 0;
      opacity.value = 1;
      return;
    }
    translateY.value = height;
    opacity.value = 0;
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration, easing: Easing.out(Easing.cubic) }),
    );
    opacity.value = withDelay(delay, withTiming(1, { duration: Math.max(120, duration * 0.6), easing: Easing.out(Easing.cubic) }));
  }, [delay, duration, height, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!height) {
    return (
      <Text style={[textStyle, spacingStyle]} accessibilityRole="text">
        {char}
      </Text>
    );
  }

  return (
    <View style={[styles.digitWindow, { height }, spacingStyle]} accessibilityRole="text">
      <Animated.Text style={[textStyle, styles.digitText, animatedStyle]}>{char}</Animated.Text>
    </View>
  );
}

export default function RollingNumber({ value, style, duration = 900 }: RollingNumberProps) {
  const formatted = useMemo(() => formatCurrency(value), [value]);
  const [digitHeight, setDigitHeight] = useState(0);

  const baseStyle = useMemo(() => StyleSheet.flatten([styles.tabular, style]) as TextStyle, [style]);
  const {
    margin,
    marginBottom,
    marginTop,
    marginLeft,
    marginRight,
    marginHorizontal,
    marginVertical,
    ...textStyle
  } = baseStyle ?? {};
  const containerStyle: ViewStyle = {
    margin,
    marginBottom,
    marginTop,
    marginLeft,
    marginRight,
    marginHorizontal,
    marginVertical,
  };

  const letterSpacing = typeof textStyle.letterSpacing === "number" ? textStyle.letterSpacing : 0;

  const handleMeasure = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (height !== digitHeight) {
      setDigitHeight(height);
    }
  };

  const chars = formatted.split("");
  const digitOrderByIndex = useMemo(() => {
    const digitIndices: number[] = [];
    chars.forEach((char, index) => {
      if (/\d/.test(char)) digitIndices.push(index);
    });
    const map = new Map<number, number>();
    digitIndices.forEach((charIndex, digitIndex) => {
      map.set(charIndex, digitIndices.length - 1 - digitIndex);
    });
    return map;
  }, [chars]);

  const digitConfigs = useMemo(
    () =>
      chars.map((char, index) => {
        if (!/\d/.test(char)) return null;
        const orderFromRight = digitOrderByIndex.get(index) ?? 0;
        const baseDelay = orderFromRight * 120;
        const randomDelay = Math.floor(Math.random() * 140);
        const extraTurns = Math.floor(Math.random() * 3);
        const durationJitter = Math.floor(Math.random() * 250);
        return {
          delay: baseDelay + randomDelay,
          extraTurns,
          duration: duration + durationJitter + orderFromRight * 40,
        };
      }),
    [chars, duration, digitOrderByIndex],
  );
  const maxDigitTime = useMemo(() => {
    let max = 0;
    digitConfigs.forEach((config) => {
      if (!config) return;
      const total = (config.delay ?? 0) + (config.duration ?? duration);
      if (total > max) max = total;
    });
    return max;
  }, [digitConfigs, duration]);
  const signConfig = useMemo(() => {
    const hasMinus = chars.some((char) => char === "-" || char === "\u2212");
    if (!hasMinus) return null;
    const durationJitter = Math.floor(Math.random() * 250);
    return {
      delay: maxDigitTime + 80,
      duration: duration + durationJitter,
    };
  }, [chars, duration, maxDigitTime]);

  return (
    <View style={[styles.row, containerStyle]} accessibilityRole="text">
      <Text style={[textStyle, styles.hiddenMeasure]} onLayout={handleMeasure}>
        0
      </Text>
      {chars.map((char, index) => {
        const isDigit = /\d/.test(char);
        const spacingStyle = index < chars.length - 1 && letterSpacing !== 0 ? { marginRight: letterSpacing } : undefined;

        if (isDigit) {
          const config = digitConfigs[index];
          return (
            <RollingDigit
              key={`digit-${index}`}
              digit={Number(char)}
              height={digitHeight}
              duration={config?.duration ?? duration}
              delay={config?.delay ?? 0}
              extraTurns={config?.extraTurns ?? 0}
              textStyle={textStyle}
              spacingStyle={spacingStyle}
            />
          );
        }

        if (char === "-" || char === "\u2212") {
          return (
            <RollingSign
              key={`char-${index}`}
              char={char}
              height={digitHeight}
              delay={signConfig?.delay ?? maxDigitTime}
              duration={signConfig?.duration ?? duration}
              textStyle={textStyle}
              spacingStyle={spacingStyle}
            />
          );
        }

        return (
          <Text key={`char-${index}`} style={[textStyle, spacingStyle]} accessibilityRole="text">
            {char}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  tabular: {
    fontVariant: ["tabular-nums"],
  },
  hiddenMeasure: {
    position: "absolute",
    opacity: 0,
    zIndex: -1,
  },
  digitWindow: {
    overflow: "hidden",
  },
  digitText: {
    textAlign: "center",
  },
});
