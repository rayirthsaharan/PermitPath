import { Text, View } from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';

export default function Index() {
  const { colors, typography } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <Text style={{ color: colors.text, ...typography.title }}>PermitPath WilCo</Text>
    </View>
  );
}
