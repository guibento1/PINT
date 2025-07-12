import 'package:flutter/material.dart';
import '../backend/server.dart';
import '../backend/shared_preferences.dart' as my_prefs;
import 'package:go_router/go_router.dart';
import '../backend/notifications_service.dart'; // Import the notification service

class LoginPage extends StatefulWidget {
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _loadingLogin = false; // Separate loading state for login button
  bool _loadingSubscriptions = false; // New loading state for subscriptions
  String? _error;

  final NotificationService _notificationService = NotificationService(); // Notification service instance

  Future<void> _login() async {
    setState(() {
      _loadingLogin = true; // Start loading for the login button
      _error = null;
    });

    final servidor = Servidor();
    final result = await servidor.login(
      _emailController.text.trim(),
      _passwordController.text,
    );

    setState(() {
      _loadingLogin = false; // Stop loading for the login button
    });

    final String? token = result != null && result['accessToken'] != null
        ? result['accessToken'] as String // Certificar que é String
        : null;

    if (token != null) {
      final String? userId = result?['idutilizador']?.toString();

      if (userId != null) {
        final dynamic perfilResp = await servidor.getData('utilizador/id/$userId');
        final Map<String, dynamic> perfil = (perfilResp is Map<String, dynamic>)
            ? perfilResp
            : {};

        await my_prefs.saveUser(perfil); // CORRIGIDO: Usar my_prefs.saveUser
        print(perfil);

        if (mounted) {
          setState(() {
            _loadingSubscriptions = true; // Start loading for subscriptions
          });
        }

        // Fetch subscriptions for the user after login
        final subscriptions = await _fetchUserSubscriptions(userId);
        if (subscriptions != null && subscriptions.isNotEmpty) {
          for (var topicId in subscriptions) {
            await _notificationService.subscribeToCourseTopic(topicId);
          }
        }

        if (mounted) {
          setState(() {
            _loadingSubscriptions = false; // Stop loading for subscriptions
          });
        }

      } else {
        print('Login: userId not found in login response. Profile might not load correctly.');
      }

      if (!mounted) return;
      context.go('/home');
    } else {
      setState(() {
        _error = result != null && result['message'] != null
            ? result['message'].toString()
            : 'Email ou password inválidos.';
      });
    }
  }

  // Function to fetch user subscriptions from the backend
  Future<List<int>?> _fetchUserSubscriptions(String userId) async {
    try {
      final response = await Servidor().getData('notificacao/list/subscricoes/$userId');
      if (response is List && response.isNotEmpty) {
        return List<int>.from(response);
      }
    } catch (e) {
      print('Error fetching subscriptions: $e');
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F4FD),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 80),
                const Text(
                  'SOFTINSA',
                  style: TextStyle(
                    fontFamily: 'Montserrat',
                    fontSize: 40,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF007BFF),
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF00C4B4),
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        spreadRadius: 1,
                        blurRadius: 3,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: const Text(
                    'THE SOFTSKILLS',
                    style: TextStyle(
                      fontFamily: 'Montserrat',
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 80),
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        spreadRadius: 1,
                        blurRadius: 5,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: TextField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    style: const TextStyle(color: Colors.black87),
                    decoration: InputDecoration(
                      labelText: 'Email',
                      labelStyle: TextStyle(color: Colors.grey[600]),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF007BFF), width: 2),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
                      prefixIcon: Icon(Icons.email, color: Colors.grey[400]),
                    ).applyDefaults(Theme.of(context).inputDecorationTheme),
                  ),
                ),
                const SizedBox(height: 20),
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        spreadRadius: 1,
                        blurRadius: 5,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: TextField(
                    controller: _passwordController,
                    obscureText: true,
                    style: const TextStyle(color: Colors.black87),
                    decoration: InputDecoration(
                      labelText: 'Password',
                      labelStyle: TextStyle(color: Colors.grey[600]),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF007BFF), width: 2),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
                      prefixIcon: Icon(Icons.lock, color: Colors.grey[400]),
                    ).applyDefaults(Theme.of(context).inputDecorationTheme),
                  ),
                ),
                const SizedBox(height: 30),
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 15),
                    child: Text(
                      _error!,
                      style: const TextStyle(color: Color(0xFFDC3545), fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                  ),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: (_loadingLogin || _loadingSubscriptions) ? null : _login,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF007BFF),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 5,
                      shadowColor: const Color(0xFF007BFF).withOpacity(0.4),
                    ),
                    child: (_loadingLogin || _loadingSubscriptions)
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 3,
                            ),
                          )
                        : const Text(
                            'Login',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Montserrat',
                            ),
                          ),
                  ),
                ),
                // New spinning indicator specifically for subscriptions
                if (_loadingSubscriptions)
                  const Padding(
                    padding: EdgeInsets.only(top: 20),
                    child: Column(
                      children: [
                        CircularProgressIndicator(
                          color: Color(0xFF007BFF),
                          strokeWidth: 2,
                        ),
                        SizedBox(height: 10),
                        Text(
                          'A preparar aplicação...',
                          style: TextStyle(color: Color(0xFF007BFF), fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 30),
                TextButton(
                  onPressed: () {
                    print('Navigate to Register Page');
                  },
                  child: const Text(
                    'Regista-te',
                    style: TextStyle(
                      color: Color(0xFF007BFF),
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 50),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
