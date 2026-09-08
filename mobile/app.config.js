module.exports = ({ config }) => {
  const isExpoGo = process.env.EXPO_GO === '1';

  let plugins = [
    "@react-native-community/datetimepicker",
    [
      "expo-build-properties",
      {
        "android": {
          "usesCleartextTraffic": true
        }
      }
    ],
    [
      "expo-notifications",
      {
        "icon": "./assets/icon.png",
        "color": "#81D4FA"
      }
    ]
  ];

  if (!isExpoGo) {
    plugins.push("./plugins/withCustomNotificationLayoutAndroid.js");
    plugins.push("./plugins/withNotificationContentExtensionIOS.js");
  }

  return {
    ...config,
    name: "Visitor Management",
    slug: "visitor-system",
    version: "1.0.0",
    scheme: "visitor-gate",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true
    },
    android: {
      permissions: [
        "POST_NOTIFICATIONS"
      ],
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png"
      },
      predictiveBackGestureEnabled: false,
      package: "com.visitor.management",
      googleServicesFile: "./google-services.json"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins,
    owner: "saaho123",
    extra: {
      eas: {
        projectId: "58af7df8-b5c1-471f-8ce3-35506c1ff79a"
      }
    }
  };
};
