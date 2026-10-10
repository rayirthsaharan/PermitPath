import React, { useCallback, useState } from 'react';
import { FlatList, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import type { CoachingCard as CoachingCardData } from '../../domain/types';
import { CoachingCard } from '../CoachingCard';

/** Horizontal paged carousel of coaching cards with page dots. */
export function CoachingCarousel({ cards }: { cards: CoachingCardData[] }) {
  const { colors, spacing } = useTheme();
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width), []);
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (width <= 0) return;
      const i = Math.round(e.nativeEvent.contentOffset.x / width);
      setIndex((prev) => (prev === i ? prev : i));
    },
    [width],
  );

  if (cards.length === 0) return null;
  return (
    <View onLayout={onLayout} style={{ gap: spacing.sm }}>
      {width > 0 ? (
        <FlatList
          data={cards}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(c, i) => `${c.kind}-${i}`}
          onScroll={onScroll}
          scrollEventThrottle={16}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          style={{ width }}
          contentContainerStyle={{ alignItems: 'flex-start' }}
          renderItem={({ item }) => (
            <View style={{ width, paddingRight: spacing.xs }}>
              <CoachingCard card={item} />
            </View>
          )}
        />
      ) : null}
      {cards.length > 1 ? (
        <View
          accessible
          accessibilityLabel={`Card ${index + 1} of ${cards.length}. Swipe for more.`}
          style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}
        >
          {cards.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === index ? 18 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === index ? colors.primary : colors.border,
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
