import { Tabs } from 'expo-router';
import { Grid3x3, Lightbulb } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { ClayPotIcon } from '@/components/ClayPotIcon';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          paddingTop: 12,
          paddingBottom: 16,
          height: 80,
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: colors.clay,
        tabBarInactiveTintColor: colors.textLight,
        tabBarIconStyle: {
          marginTop: -1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Works',
          tabBarIcon: ({ size, color }) => <ClayPotIcon size={33} color={color} />,
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
