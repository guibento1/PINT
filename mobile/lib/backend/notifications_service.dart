import 'dart:async';
import 'package:firebase_messaging/firebase_messaging.dart';

// Modelo para representar uma mensagem de notificação
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

/// Um serviço para gerir todas as operações relacionadas com
/// as notificações push do Firebase.
class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;

  // A "fonte da verdade" para todas as notificações recebidas.
  final List<NotificationMessage> _notifications = [];
  List<NotificationMessage> get notifications => _notifications;

  // Um "canal de rádio" que transmite novas notificações para quem estiver a ouvir.
  final StreamController<NotificationMessage> _notificationStreamController =
  StreamController<NotificationMessage>.broadcast();

  Stream<NotificationMessage> get notificationStream => _notificationStreamController.stream;


  /// Configura todos os listeners do Firebase Messaging.
  /// Deve ser chamado uma vez quando a app inicia.
  Future<void> setupListeners() async {
    await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    final token = await _firebaseMessaging.getToken();
    print("======================================");
    print("FCM Token: $token");
    print("======================================");

    // Listener para quando a app está aberta (em primeiro plano)
    FirebaseMessaging.onMessage.listen(_handleMessage);

    // Listener para quando o utilizador clica na notificação (app em 2º plano)
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessage);

    // Verifica se a app foi aberta a partir de uma notificação (app fechada)
    RemoteMessage? initialMessage = await _firebaseMessaging.getInitialMessage();
    if (initialMessage != null) {
      _handleMessage(initialMessage);
    }
  }

  /// Processa uma mensagem recebida e adiciona-a à lista e ao stream.
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

  Future<void> subscribeToCourseTopic(int courseId) async {
    final String topicName = 'curso_$courseId';
    try {
      await _firebaseMessaging.subscribeToTopic(topicName);
      print('SUCCESS: Subscribed to topic: $topicName');
    } catch (e) {
      print('ERROR: Could not subscribe to topic $topicName. Error: $e');
    }
  }

  Future<void> unsubscribeFromCourseTopic(int courseId) async {
    final String topicName = 'curso_$courseId';
    try {
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
