// utils/NotificationManager.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationManager {
  
  // Request notification permissions
  static async requestPermissions() {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('❌ Notification permission denied');
          return false;
        }
        
        console.log('✅ Notification permission granted');
        return true;
      } else {
        console.log('⚠️ Must use physical device for Push Notifications');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return false;
    }
  }

  // Schedule daily learning reminder
  static async scheduleDailyReminder(hour = 19, minute = 0) {
    try {
      // Cancel any existing daily reminders
      await this.cancelDailyReminder();
      
      const trigger = {
        hour: hour,
        minute: minute,
        repeats: true,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "📚 Time to learn your daily word!",
          body: "Keep your streak going with just 2 minutes of learning",
          sound: 'default',
          data: { type: 'daily_reminder' },
        },
        trigger,
      });

      console.log('✅ Daily reminder scheduled for', hour + ':' + minute.toString().padStart(2, '0'));
      return notificationId;
    } catch (error) {
      console.error('❌ Error scheduling daily reminder:', error);
      return null;
    }
  }

  // Schedule a test notification (1 minute from now)
  static async scheduleTestNotification() {
    try {
      const trigger = {
        seconds: 60, // 1 minute from now
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "🧪 Test Notification - OneWord",
          body: "Great! Your notifications are working perfectly. Daily reminders are all set! 🎉",
          sound: 'default',
          data: { type: 'test_notification' },
        },
        trigger,
      });

      console.log('✅ Test notification scheduled for 1 minute from now');
      return notificationId;
    } catch (error) {
      console.error('❌ Error scheduling test notification:', error);
      return null;
    }
  }

  // Cancel daily reminder
  static async cancelDailyReminder() {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.type === 'daily_reminder') {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          console.log('🗑️ Cancelled existing daily reminder');
        }
      }
    } catch (error) {
      console.error('❌ Error cancelling reminders:', error);
    }
  }
}

export default NotificationManager;