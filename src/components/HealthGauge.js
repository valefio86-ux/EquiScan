import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../theme/colors';

// Gauge circolare per il punteggio di salute (0-100)
// Verde (70-100), Giallo (40-69), Rosso (0-39)
export default function HealthGauge({ score = null, size = 180, strokeWidth = 14 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const hasData = score !== null && score !== undefined;
  const safeScore = hasData ? Math.max(0, Math.min(100, score)) : 0;
  const progress = hasData ? (safeScore / 100) * circumference : 0;

  const getColor = (s) => {
    if (!hasData) return COLORS.border;
    if (s >= 70) return COLORS.success;
    if (s >= 40) return COLORS.warning;
    return COLORS.error;
  };

  const getLabel = (s) => {
    if (!hasData) return 'Nessun dato';
    if (s >= 70) return 'Buono';
    if (s >= 40) return 'Attenzione';
    return 'Critico';
  };

  const color = getColor(safeScore);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Cerchio di sfondo */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={COLORS.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Cerchio di progresso */}
        {hasData && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${progress} ${circumference - progress}`}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        )}
      </Svg>
      <View style={[styles.labelContainer, { width: size, height: size }]}>
        <Text style={[styles.score, { color: hasData ? color : COLORS.textLight }]}>
          {hasData ? safeScore : '—'}
        </Text>
        <Text style={[styles.label, { color: hasData ? color : COLORS.textLight }]}>
          {getLabel(safeScore)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  labelContainer: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
  },
  score: { fontSize: 42, fontWeight: 'bold' },
  label: { fontSize: 14, fontWeight: '600', marginTop: 2 },
});
