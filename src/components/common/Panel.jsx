import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

const Panel = ({ children, style }) => <View style={[styles.panel, style]}>{children}</View>;

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.26,
    shadowRadius: 34,
    elevation: 8,
  },
});

export default Panel;
