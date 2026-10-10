import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useTheme } from '../theme/ThemeProvider';
import { regionForPoints } from '../domain/geo';
import type { RouteMapProps } from './RouteMap.types';

export type { RouteMapProps, MapPin } from './RouteMap.types';

export function RouteMap({ route = [], pins = [], height = 220, caption }: RouteMapProps) {
  const { colors, radius, typography } = useTheme();
  const region = useMemo(
    () => regionForPoints([...route.map((p) => ({ lat: p.lat, lng: p.lng })), ...pins]),
    [route, pins],
  );
  return (
    <View>
      <View
        accessible
        accessibilityLabel={`Route map${pins.length ? ` with ${pins.length} marker${pins.length === 1 ? '' : 's'}` : ''}`}
        style={{ height, borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.surfaceAlt }}
      >
        <MapView
          style={{ flex: 1 }}
          initialRegion={region ?? undefined}
          region={region ?? undefined}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
        >
          {route.length > 1 ? (
            <Polyline
              coordinates={route.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
              strokeColor={colors.primary}
              strokeWidth={4}
            />
          ) : null}
          {pins.map((p, i) => (
            <Marker
              key={`${p.lat},${p.lng},${i}`}
              coordinate={{ latitude: p.lat, longitude: p.lng }}
              pinColor={p.color ?? colors.amber}
              title={p.title}
            />
          ))}
        </MapView>
      </View>
      {caption ? <Text style={[typography.caption, { color: colors.textMuted, marginTop: 6 }]}>{caption}</Text> : null}
    </View>
  );
}
