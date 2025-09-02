import 'package:flutter/material.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:intl/intl.dart';
import 'package:mobile/backend/server.dart';

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

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  static final List<NotificationMessage> _notifications = [];
  final List<NotificationMessage> _apiNotifications = [];

  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _setupFirebaseListeners();
  }

  void _setupFirebaseListeners() async {
    await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    final token = await _firebaseMessaging.getToken();
    print("======================================");
    print("FCM Token: $token");
    print("======================================");

    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print("Recebida notificação com a app aberta!");
      _addNotification(message);
    });

    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print("App aberta a partir de uma notificação em 2º plano!");
      _addNotification(message);
    });

    RemoteMessage? initialMessage =
        await _firebaseMessaging.getInitialMessage();
    if (initialMessage != null) {
      print("App aberta a partir de uma notificação com a app fechada!");
      _addNotification(initialMessage);
    }

    // Carregar notificações iniciais da API
    _fetchNotificationsFromApi();
  }

  void _addNotification(RemoteMessage message) {
    if (message.notification != null) {
      final newNotification = NotificationMessage(
        title: message.notification!.title ?? 'Sem Título',
        body: message.notification!.body ?? 'Sem Conteúdo',
        receivedTime: DateTime.now(),
      );

      if (!_notifications.contains(newNotification)) {
        _notifications.insert(0, newNotification);

        if (mounted) {
          setState(() {});
        }
      }
    }
  }

  Future<void> _fetchNotificationsFromApi() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final servidor = Servidor();
      final res = await servidor.getData('notificacao/list');

      // Espera-se um array de objetos; mapear para NotificationMessage
      final List data = (res is List) ? res : [];

      _apiNotifications
        ..clear()
        ..addAll(
          data.map((item) {
            final map = (item is Map) ? item : <String, dynamic>{};
            final String title =
                (map['titulo'] ?? map['title'] ?? 'Notificação').toString();
            final String body =
                (map['mensagem'] ?? map['conteudo'] ?? map['body'] ?? '—')
                    .toString();
            final dynamic dtRaw =
                map['instante'] ??
                map['data'] ??
                map['createdAt'] ??
                map['criado'];
            DateTime when;
            if (dtRaw is String) {
              when = DateTime.tryParse(dtRaw) ?? DateTime.now();
            } else if (dtRaw is int) {
              // epoch millis
              when = DateTime.fromMillisecondsSinceEpoch(dtRaw);
            } else {
              when = DateTime.now();
            }
            return NotificationMessage(
              title: title,
              body: body,
              receivedTime: when,
            );
          }).cast<NotificationMessage>(),
        );
    } catch (e) {
      _error = 'Não foi possível carregar as notificações.';
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final all =
        <NotificationMessage>{..._apiNotifications, ..._notifications}.toList()
          ..sort((a, b) => b.receivedTime.compareTo(a.receivedTime));

    final today = DateTime.now();
    final isSameDay =
        (DateTime d) =>
            d.day == today.day &&
            d.month == today.month &&
            d.year == today.year;

    final notificationsToday =
        all.where((n) => isSameDay(n.receivedTime)).toList();
    final notificationsOlder =
        all.where((n) => !isSameDay(n.receivedTime)).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF6F9FB),
      body:
          _loading
              ? const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 12),
                    Text(
                      'A carregar notificações...',
                      style: TextStyle(color: Colors.grey),
                    ),
                  ],
                ),
              )
              : _error != null
              ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Text(
                    _error!,
                    style: const TextStyle(color: Colors.red),
                  ),
                ),
              )
              : all.isEmpty
              ? const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.notifications_off_outlined,
                      size: 60,
                      color: Colors.grey,
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Ainda não tem notificações',
                      style: TextStyle(fontSize: 18, color: Colors.grey),
                    ),
                  ],
                ),
              )
              : RefreshIndicator(
                onRefresh: _fetchNotificationsFromApi,
                child: ListView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16.0,
                    vertical: 24.0,
                  ),
                  children: [
                    if (notificationsToday.isNotEmpty)
                      _buildSectionTitle('Hoje'),
                    ...notificationsToday.map(
                      (n) => NotificationCard(notification: n),
                    ),
                    if (notificationsOlder.isNotEmpty)
                      const SizedBox(height: 24),
                    if (notificationsOlder.isNotEmpty)
                      _buildSectionTitle('Anteriores'),
                    ...notificationsOlder.map(
                      (n) => NotificationCard(notification: n),
                    ),
                  ],
                ),
              ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Text(
        title,
        style: const TextStyle(
          fontFamily: 'ADLaM Display',
          fontSize: 19,
          fontWeight: FontWeight.bold,
          color: Color(0xFF1D1B20),
        ),
      ),
    );
  }
}

class NotificationCard extends StatelessWidget {
  final NotificationMessage notification;

  const NotificationCard({super.key, required this.notification});

  @override
  Widget build(BuildContext context) {
    final timeFormat = DateFormat('HH:mm');
    final dateFormat = DateFormat('dd/MM/yyyy');
    final String displayTime = timeFormat.format(notification.receivedTime);
    final String displayDate = dateFormat.format(notification.receivedTime);

    return Card(
      elevation: 2.0,
      margin: const EdgeInsets.only(bottom: 12.0),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      color: const Color(0xFFECECEC),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.notifications_active, color: Colors.blue),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    notification.title,
                    style: const TextStyle(
                      fontFamily: 'ADLaM Display',
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1D1B20),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.body,
                    style: const TextStyle(
                      fontFamily: 'Roboto',
                      fontSize: 14,
                      color: Color(0xFF49454F),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerRight,
                    child: Text(
                      '$displayDate às $displayTime',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
