import React, { useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

import { formatCurrency } from "@/utils/calculations";

type RollingNumberProps = {
  value: number;
  style?: TextStyle;
  duration?: number;
  currencyCode?: string;
  hasData?: boolean;
};

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const STACK_CYCLES = 6;
const DIGIT_STACK = Array.from({ length: DIGITS.length * STACK_CYCLES }, (_, index) => DIGITS[index % 10]);

function isDigitChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 48 && code <= 57;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function createSeededRandom(seed: number): () => number {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

type RollingDigitProps = {
  digit: number;
  height: number;
  duration: number;
  delay: number;
  extraTurns: number;
  textStyle: TextStyle;
  spacingStyle?: ViewStyle;
};

const RollingDigit = React.memo(function RollingDigit({ digit, height, duration, delay, extraTurns, textStyle, spacingStyle }: RollingDigitProps) {
  const animatedIndex = useSharedValue(digit);
  const didAnimate = useRef(false);

  useEffect(() => {
    if (!height) {
      animatedIndex.value = digit;
      return;
    }

    const currentIndex = Math.round(animatedIndex.value);
    const normalizedIndex = ((currentIndex % 10) + 10) % 10 + 10;
    animatedIndex.value = normalizedIndex;
    const currentDigit = normalizedIndex % 10;
    let delta = (digit - currentDigit + 10) % 10;
    if (delta === 0 && !didAnimate.current) {
      delta = 10;
    }
    if (delta === 0) delta = 10;

    let targetIndex = normalizedIndex + delta + extraTurns * 10;
    const maxIndex = DIGIT_STACK.length - 1;
    if (targetIndex > maxIndex) {
      const overflow = targetIndex - maxIndex;
      const turnsToRemove = Math.ceil(overflow / 10);
      targetIndex -= turnsToRemove * 10;
    }
    animatedIndex.value = withDelay(
      delay,
      withTiming(
        targetIndex,
        { duration, easing: Easing.out(Easing.cubic) },
        undefined,
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
});

type RollingSignProps = {
  char: string;
  height: number;
  delay: number;
  duration: number;
  textStyle: TextStyle;
  spacingStyle?: ViewStyle;
};

const RollingSign = React.memo(function RollingSign({ char, height, delay, duration, textStyle, spacingStyle }: RollingSignProps) {
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
});

export default function RollingNumber({ value, style, duration = 900, currencyCode, hasData = true }: RollingNumberProps) {
  const formatted = useMemo(() => formatCurrency(value, currencyCode), [currencyCode, value]);
  const [digitHeight, setDigitHeight] = useState(0);

  const baseStyle = useMemo(() => StyleSheet.flatten([styles.tabular, style]) as TextStyle, [style]);
  const { textStyle, containerStyle } = useMemo(() => {
    const {
      margin,
      marginBottom,
      marginTop,
      marginLeft,
      marginRight,
      marginHorizontal,
      marginVertical,
      ...restTextStyle
    } = baseStyle ?? {};

    return {
      textStyle: restTextStyle as TextStyle,
      containerStyle: {
        margin,
        marginBottom,
        marginTop,
        marginLeft,
        marginRight,
        marginHorizontal,
        marginVertical,
      } as ViewStyle,
    };
  }, [baseStyle]);

  const letterSpacing = typeof textStyle.letterSpacing === "number" ? textStyle.letterSpacing : 0;
  const estimatedDigitHeight = useMemo(() => {
    if (typeof textStyle.lineHeight === "number" && textStyle.lineHeight > 0) {
      return textStyle.lineHeight;
    }
    if (typeof textStyle.fontSize === "number" && textStyle.fontSize > 0) {
      return Math.round(textStyle.fontSize * 1.2);
    }
    return 0;
  }, [textStyle.fontSize, textStyle.lineHeight]);
  const resolvedDigitHeight = digitHeight || estimatedDigitHeight;

  const handleMeasure = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (height > 0 && height !== digitHeight) {
      setDigitHeight(height);
    }
  };

  const chars = useMemo(() => formatted.split(""), [formatted]);
  const digitOrderByIndex = useMemo(() => {
    const digitIndices: number[] = [];
    chars.forEach((char, index) => {
      if (isDigitChar(char)) digitIndices.push(index);
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
        if (!isDigitChar(char)) return null;
        const orderFromRight = digitOrderByIndex.get(index) ?? 0;
        const baseDelay = orderFromRight * 120;
        const rng = createSeededRandom(hashString(`${formatted}-digit-${index}`));
        const randomDelay = Math.floor(rng() * 140);
        const extraTurns = Math.floor(rng() * 3);
        const durationJitter = Math.floor(rng() * 250);
        return {
          delay: baseDelay + randomDelay,
          extraTurns,
          duration: duration + durationJitter + orderFromRight * 40,
        };
      }),
    [chars, duration, digitOrderByIndex, formatted],
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
  const firstDigitTime = useMemo(() => {
    let time = 0;
    chars.forEach((char, index) => {
      if (!isDigitChar(char)) return;
      const orderFromRight = digitOrderByIndex.get(index) ?? 0;
      if (orderFromRight !== 0) return;
      const config = digitConfigs[index];
      if (!config) return;
      const total = (config.delay ?? 0) + (config.duration ?? duration);
      if (total > time) time = total;
    });
    return time;
  }, [chars, digitConfigs, digitOrderByIndex, duration]);
  const signConfig = useMemo(() => {
    const hasMinus = chars.some((char) => char === "-" || char === "\u2212");
    if (!hasMinus) return null;
    const rng = createSeededRandom(hashString(`${formatted}-sign`));
    const durationJitter = Math.floor(rng() * 250);
    const signDuration = duration + durationJitter;
    const targetFinish = firstDigitTime || maxDigitTime;
    const delay = Math.max(0, targetFinish - signDuration + 60);
    return {
      delay,
      duration: signDuration,
    };
  }, [chars, duration, firstDigitTime, maxDigitTime, formatted]);

  if (!hasData) {
    return (
      <Text style={[baseStyle]} accessibilityRole="text">
        -
      </Text>
    );
  }

  return (
    <View style={[styles.row, containerStyle]} accessibilityRole="text">
      <Text style={[textStyle, styles.hiddenMeasure]} onLayout={handleMeasure}>
        0
      </Text>
      {chars.map((char, index) => {
        const isDigit = isDigitChar(char);
        const spacingStyle = index < chars.length - 1 && letterSpacing !== 0 ? { marginRight: letterSpacing } : undefined;

        if (isDigit) {
          const config = digitConfigs[index];
          return (
            <RollingDigit
              key={`digit-${index}`}
              digit={Number(char)}
              height={resolvedDigitHeight}
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
              height={resolvedDigitHeight}
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
