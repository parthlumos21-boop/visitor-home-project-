const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withCustomNotificationLayoutAndroid = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const resDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res');
      const layoutDir = path.join(resDir, 'layout');

      // Create layout directory if it doesn't exist
      if (!fs.existsSync(layoutDir)) {
        fs.mkdirSync(layoutDir, { recursive: true });
      }

      // Write custom_notification.xml
      const layoutXml = `<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:background="#81D4FA"
    android:padding="16dp">

    <ImageView
        android:id="@+id/notification_icon"
        android:layout_width="48dp"
        android:layout_height="48dp"
        android:src="@drawable/notification_icon" />

    <TextView
        android:id="@+id/notification_title"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_toEndOf="@id/notification_icon"
        android:layout_marginStart="16dp"
        android:textColor="#000000"
        android:textSize="16sp"
        android:textStyle="bold" />

    <TextView
        android:id="@+id/notification_body"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_below="@id/notification_title"
        android:layout_toEndOf="@id/notification_icon"
        android:layout_marginStart="16dp"
        android:layout_marginTop="4dp"
        android:textColor="#333333"
        android:textSize="14sp" />
</RelativeLayout>
`;
      fs.writeFileSync(path.join(layoutDir, 'custom_notification.xml'), layoutXml);

      return config;
    },
  ]);
};

module.exports = withCustomNotificationLayoutAndroid;
