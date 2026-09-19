const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withNotificationContentExtensionIOS = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      // In a real implementation, you would use a tool like `xcode` or `@expo/config-plugins`'s internal
      // APIs to add a new target to the PBXProj, generate a NotificationViewController.swift, 
      // MainInterface.storyboard, and Info.plist for the Notification Content Extension.
      
      const iosDir = path.join(config.modRequest.platformProjectRoot);
      const extensionDir = path.join(iosDir, 'NotificationContentExtension');
      
      if (!fs.existsSync(extensionDir)) {
        fs.mkdirSync(extensionDir, { recursive: true });
      }

      // Generate skeleton Swift file for the Custom UI
      const swiftCode = `
import UIKit
import UserNotifications
import UserNotificationsUI

class NotificationViewController: UIViewController, UNNotificationContentExtension {

    @IBOutlet var titleLabel: UILabel?
    @IBOutlet var bodyLabel: UILabel?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        self.view.backgroundColor = UIColor(red: 129/255, green: 212/255, blue: 250/255, alpha: 1.0) // #81D4FA
    }
    
    func didReceive(_ notification: UNNotification) {
        self.titleLabel?.text = notification.request.content.title
        self.bodyLabel?.text = notification.request.content.body
    }
}
`;
      fs.writeFileSync(path.join(extensionDir, 'NotificationViewController.swift'), swiftCode);

      // Generating the xcodeproj modifications and storyboard is highly complex and typically done
      // via specialized libraries like 'react-native-permissions' or custom scripts.
      // This serves as the starting point for injecting the extension.

      return config;
    },
  ]);
};

module.exports = withNotificationContentExtensionIOS;
