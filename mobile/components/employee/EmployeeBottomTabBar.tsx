import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Tabs } from 'expo-router';

export type EmployeeBottomTabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0] & { navigation?: any };

// Employee Theme Color Tokens
const ACTIVE_COLOR = '#2864DC'; // Primary blue
const INACTIVE_COLOR = '#68768A'; // Inactive slate grey
const BAR_BACKGROUND = '#F1F5FD'; // Soft light-blue tinted container
const BAR_BORDER = '#DBEAFE'; // Subtle light blue border

export const EmployeeBottomTabBar: React.FC<EmployeeBottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  // Responsive sizing for 5-tab layout on mobile screens
  const isCompact = screenWidth < 360;
  const buttonHeight = isCompact ? 42 : 46;
  const buttonRadius = buttonHeight / 2;
  const inactiveButtonSize = buttonHeight;
  const activeFlex = isCompact ? 1.6 : 1.8;

  // CRITICAL: Dynamic clearance for Android 3-Button & Gesture Navigation + iOS Home Indicator:
  // - Android 3-button navigation: insets.bottom is typically 40-48px -> bar floats 6px above buttons
  // - Android gesture line: insets.bottom is 16-24px -> bar floats 6px above gesture line
  // - iOS Home indicator: insets.bottom is 34px -> bar floats 4px above indicator
  // - No insets (web/desktop): fallback to 14px floating margin
  const bottomOffset =
    insets.bottom > 0
      ? insets.bottom + (Platform.OS === 'android' ? 6 : 4)
      : 14;

  // Filter out hidden routes (e.g. href: null or display: 'none')
  const visibleRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    const isHidden =
      (options as any).href === null ||
      (options.tabBarItemStyle as any)?.display === 'none';
    return !isHidden;
  });

  if (visibleRoutes.length === 0) {
    return null;
  }

  const currentRoute = state.routes[state.index];
  const currentOptions = descriptors[currentRoute?.key]?.options;
  const isCurrentScreenHidden =
    (currentOptions?.tabBarStyle as any)?.display === 'none' ||
    (currentOptions?.tabBarItemStyle as any)?.display === 'none' ||
    !visibleRoutes.some((r) => r.key === currentRoute?.key);

  if (isCurrentScreenHidden) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.outerWrapper,
        {
          bottom: bottomOffset,
        },
      ]}
    >
      <View style={styles.capsuleContainer}>
        {visibleRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const isFocused = currentRoute?.key === route.key;

          const rawLabel =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const label =
            typeof rawLabel === 'string'
              ? rawLabel
              : typeof rawLabel === 'function'
              ? rawLabel({
                  focused: isFocused,
                  color: isFocused ? ACTIVE_COLOR : INACTIVE_COLOR,
                  position: 'beside-icon',
                  children: route.name,
                })
              : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const iconColor = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;
          const iconSize = isCompact ? 20 : 22;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel || String(label)}
              testID={(options as any).tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.7}
              style={[
                styles.tabItem,
                {
                  flex: isFocused ? activeFlex : 1,
                },
              ]}
            >
              {isFocused ? (
                // Active Tab: 3D Raised White Pill with Icon + Label
                <View
                  style={[
                    styles.activeButton,
                    {
                      height: buttonHeight,
                      borderRadius: buttonRadius,
                      paddingHorizontal: isCompact ? 10 : 12,
                    },
                  ]}
                >
                  {options.tabBarIcon
                    ? options.tabBarIcon({
                        focused: true,
                        color: iconColor,
                        size: iconSize,
                      })
                    : null}
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.activeLabel,
                      {
                        fontSize: isCompact ? 11 : 12,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              ) : (
                // Inactive Tab: Outline Icon with subtle soft backing
                <View
                  style={[
                    styles.inactiveButton,
                    {
                      width: inactiveButtonSize,
                      height: inactiveButtonSize,
                      borderRadius: buttonRadius,
                    },
                  ]}
                >
                  {options.tabBarIcon
                    ? options.tabBarIcon({
                        focused: false,
                        color: iconColor,
                        size: iconSize,
                      })
                    : null}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    zIndex: 99,
  },
  capsuleContainer: {
    width: '100%',
    maxWidth: 520,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: BAR_BACKGROUND,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: BAR_BORDER,
    paddingHorizontal: 6,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#172033',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 24px rgba(23, 32, 51, 0.12)',
      },
    }),
  },
  tabItem: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  activeButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    borderWidth: 1,
    borderColor: 'rgba(219, 234, 254, 0.7)',
    ...Platform.select({
      ios: {
        shadowColor: '#172033',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 3px 8px rgba(23, 32, 51, 0.15)',
      },
    }),
  },
  activeLabel: {
    color: ACTIVE_COLOR,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.2,
  },
  inactiveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
});

export default EmployeeBottomTabBar;
