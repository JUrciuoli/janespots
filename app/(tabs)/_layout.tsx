import { Tabs } from 'expo-router';
import { Package, Grid3x3, Lightbulb } from 'lucide-react-native';
import { colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          paddingTop: 12,
          paddingBottom: 12,
          height: 70,
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: colors.clay,
        tabBarInactiveTintColor: colors.textLight,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter_500Medium',
          marginTop: 2,
          marginBottom: 4,
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Works',
          tabBarIcon: ({ size, color }) => <Package size={22} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Gallery',
          tabBarIcon: ({ size, color }) => <Grid3x3 size={22} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="ideas"
        options={{
          title: 'Ideas',
          tabBarIcon: ({ size, color }) => <Lightbulb size={22} color={color} strokeWidth={1.8} />,
        }}
      />
    </Tabs>
  );
}
