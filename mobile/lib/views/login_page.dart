import 'package:flutter/material.dart';
import '../backend/server.dart';
import '../backend/shared_preferences.dart';
import 'package:go_router/go_router.dart';

class LoginPage extends StatefulWidget {
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _login() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final servidor = Servidor();
    final result = await servidor.login(
      _emailController.text.trim(),
      _passwordController.text,
    );
    setState(() {
      _loading = false;
    });
    final user = result;
    final token = result != null && result['accessToken'] != null ? result['accessToken'] : null;
    if (user != null && token != null) {
      await saveUser(user);
      await saveToken(token);
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF0F4FD), // Background color from the Home page image
      body: SafeArea(
        // Wrap the Padding with SingleChildScrollView
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              // Use MainAxisSize.min to allow the column to take only necessary space vertically
              // and let SingleChildScrollView handle the scrolling.
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 80), // Increased space for a cleaner look
                // SOFTINSA Text
                const Text(
                  'SOFTINSA',
                  style: TextStyle(
                    fontFamily: 'Montserrat', // Assuming a modern font like Montserrat or Poppins
                    fontSize: 40, // Slightly larger
                    fontWeight: FontWeight.w900, // Extra bold
                    color: Color(0xFF007BFF), // Main blue color from the app bar
                  ),
                ),
                const SizedBox(height: 4),
                // THE SOFTSKILLS Button
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF00C4B4), // Green accent color
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        spreadRadius: 1,
                        blurRadius: 3,
                        offset: const Offset(0, 2), // subtle shadow
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
                const SizedBox(height: 80), // More space before input fields
                // Email Text Field Wrapper for Shadow
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
                        borderRadius: BorderRadius.circular(12), // Softer corners
                        borderSide: BorderSide.none, // No border line, relying on fill color and shadow
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF007BFF), width: 2), // Blue border when focused
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
                const SizedBox(height: 20), // Increased space between fields
                // Password Text Field Wrapper for Shadow
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
                const SizedBox(height: 30), // More space before the login button
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 15),
                    child: Text(
                      _error!,
                      style: const TextStyle(color: Color(0xFFDC3545), fontWeight: FontWeight.bold), // Red error color
                      textAlign: TextAlign.center,
                    ),
                  ),
                // Login Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _login,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF007BFF), // Main blue color
                      foregroundColor: Colors.white, // Text color
                      padding: const EdgeInsets.symmetric(vertical: 18), // Taller button
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12), // Rounded corners
                      ),
                      elevation: 5, // Add some shadow
                      shadowColor: const Color(0xFF007BFF).withOpacity(0.4),
                    ),
                    child: _loading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 3, // Thicker spinner
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
                // Instead of Spacer, use a SizedBox for consistent spacing with scroll view
                const SizedBox(height: 30), // Add explicit space
                // Register Button
                TextButton(
                  onPressed: () {
                    // context.go('/register'); // Assuming a register route exists
                    print('Navigate to Register Page');
                  },
                  child: const Text(
                    'Regista-te',
                    style: TextStyle(
                      color: Color(0xFF007BFF), // Main blue color
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 30), // Bottom padding
                // Add extra padding at the bottom to ensure content is visible above the keyboard
                // You might need to adjust this value based on typical keyboard height or use MediaQuery for dynamic height
                const SizedBox(height: 50), // Example: Add 50 pixels more space
              ],
            ),
          ),
        ),
      ),
    );
  }
}
