import 'dart:async';
import 'package:firebase_messaging/firebase_messaging.dart';

class NotificationMessage {
  final String title;
  final String body;
  final DateTime receivedTime;

  NotificationMessage({
    required this.title,
    required this.body,
    required this.receivedTime,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is NotificationMessage &&
          runtimeType == other.runtimeType &&
          title == other.title &&
          body == other.body;

  @override
  int get hashCode => title.hashCode ^ body.hashCode;
}

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;

  String? _token; 
  String? get token => _token; 

  final List<NotificationMessage> _notifications = [];
  List<NotificationMessage> get notifications => _notifications;

  final StreamController<NotificationMessage> _notificationStreamController =
      StreamController<NotificationMessage>.broadcast();

  Stream<NotificationMessage> get notificationStream => _notificationStreamController.stream;

  Future<void> setupListeners() async {
    await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    _token = await _firebaseMessaging.getToken(); // Save token here
    print("======================================");
    print("FCM Token: $_token");
    print("======================================");

    // Listener for when the app is in the foreground
    FirebaseMessaging.onMessage.listen(_handleMessage);

    // Listener for when the user taps on a notification (app in the background)
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessage);

    // Check if the app was opened from a notification (app was closed)
    RemoteMessage? initialMessage = await _firebaseMessaging.getInitialMessage();
    if (initialMessage != null) {
      _handleMessage(initialMessage);
    }
  }

  void _handleMessage(RemoteMessage message) {
    print("Mensagem recebida pelo serviço: ${message.notification?.title}");
    if (message.notification != null) {
      final newNotification = NotificationMessage(
        title: message.notification!.title ?? 'Sem Título',
        body: message.notification!.body ?? 'Sem Conteúdo',
        receivedTime: DateTime.now(),
      );

      if (!_notifications.contains(newNotification)) {
        _notifications.insert(0, newNotification);
        _notificationStreamController.add(newNotification);
      }
    }
  }

  Future<void> subscribeToCourseTopic(int canalId) async {
    final String topicName = 'canal_$canalId';
    try {
      print('DEBUG: Attempting to subscribe to Firebase topic: $topicName');
      await _firebaseMessaging.subscribeToTopic(topicName);
      print('SUCCESS: Subscribed to topic: $topicName');
    } catch (e) {
      print('ERROR: Could not subscribe to topic $topicName. Error: $e');
    }
  }

  Future<void> unsubscribeFromCourseTopic(int canalId) async {
    final String topicName = 'canal_$canalId';
    try {
      print('DEBUG: Calling FirebaseMessaging.unsubscribeFromTopic for topic: $topicName');
      await _firebaseMessaging.unsubscribeFromTopic(topicName);
      print('SUCCESS: Unsubscribed from topic: $topicName');
    } catch (e) {
      print('ERROR: Could not unsubscribe from topic $topicName. Error: $e');
    }
  }

  void dispose() {
    _notificationStreamController.close();
  }
}
