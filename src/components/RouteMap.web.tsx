import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import type { RouteMapProps } from './RouteMap.types';

export type { RouteMapProps, MapPin } from './RouteMap.types';

const W = 300;
const PAD = 16;

/** Web preview: draws the route as a simple SVG (no map tiles). */
export function RouteMap({ route = [], pins = [], height = 220, caption }: RouteMapProps) {
  const { colors, radius, typography } = useTheme();
  const H = (height / 220) * 200;

  const { line, dots } = useMemo(() => {
    const all = [...route, ...pins];
    if (all.length === 0) return { line: '', dots: [] as { x: number; y: number; color: string }[] };
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const p of all) {
      minLat = Math.min(minLat, p.lat);
      maxLat = Math.max(maxLat, p.lat);
      minLng = Math.min(minLng, p.lng);
      maxLng = Math.max(maxLng, p.lng);
    }
    const k = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
    const spanX = Math.max(1e-6, (maxLng - minLng) * k);
    const spanY = Math.max(1e-6, maxLat - minLat);
    const scale = Math.min((W - 2 * PAD) / spanX, (H - 2 * PAD) / spanY);
    const offX = (W - spanX * scale) / 2;
    const offY = (H - spanY * scale) / 2;
    const proj = (p: { lat: number; lng: number }) => ({
      x: offX + (p.lng - minLng) * k * scale,
      y: offY + (maxLat - p.lat) * scale,
    });
    return {
      line: route.map((p) => { const q = proj(p); return `${q.x.toFixed(1)},${q.y.toFixed(1)}`; }).join(' '),
      dots: pins.map((p) => ({ ...proj(p), color: p.color ?? colors.amber })),
    };
  }, [route, pins, H, colors.amber]);

  return (
    <View>
      <View
        accessible
        accessibilityLabel="Route preview"
        style={{
          height,
          borderRadius: radius.card,
          overflow: 'hidden',
          backgroundColor: colors.surfaceAlt,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          {line ? (
            <Polyline points={line} fill="none" stroke={colors.primary} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
          ) : null}
          {dots.map((d, i) => (
            <Circle key={i} cx={d.x} cy={d.y} r={6} fill={d.color} stroke={colors.surface} strokeWidth={2} />
          ))}
        </Svg>
      </View>
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 6 }]}>
        Map preview{caption ? ` · ${caption}` : ''}
      </Text>
    </View>
  );
}
