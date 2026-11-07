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

export type BottomTabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0];

// Admin dashboard primary brand colors
const ACTIVE_COLOR = '#2563eb'; // Royal blue matching admin dashboard primary
const INACTIVE_COLOR = '#64748b'; // Slate grey matching secondary text
const BAR_BACKGROUND = '#F1F5FD'; // Light blue-tinted container matching dashboard cards
const BAR_BORDER = '#DBEAFE'; // Subtle light blue border

export const CustomBottomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  // Responsive calculations:
  // Compact screens (width < 360) get slightly smaller buttons
  const isCompact = screenWidth < 360;
  const buttonHeight = isCompact ? 42 : 46;
  const buttonRadius = buttonHeight / 2;
  const inactiveButtonSize = buttonHeight;
  const activeFlex = isCompact ? 1.6 : 1.85;

  // Responsive clearance for system navigation gestures and 3-button bar:
  // - Android 3-button bar: insets.bottom ~40-48px -> floats cleanly above the buttons
  // - Android gesture navigation: insets.bottom ~16-24px -> floats cleanly above the gesture bar
  // - iOS Home indicator: insets.bottom ~34px -> floats cleanly above the home indicator
  // - Web / No bottom inset: fallback to 14px floating clearance
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
                // 3D Raised White Button with Icon + Label text visible right after icon
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
                // Inactive Button with subtle rounded hit area matching reference image
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
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 24px rgba(30, 58, 138, 0.12)',
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
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.16,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 3px 8px rgba(30, 58, 138, 0.16)',
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

export default CustomBottomTabBar;
