import 'package:flutter/material.dart';
import '../backend/server.dart';
import '../backend/shared_preferences.dart' as my_prefs;
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

    // O 'result' do servidor.login deve conter o token e, idealmente,
    // alguma informação do utilizador que pode ser usada para buscar o perfil completo.
    // Vamos assumir que 'result' é o mapa do utilizador completo, ou que contém 'accessToken' e 'idutilizador'.

    final String? token = result != null && result['accessToken'] != null
        ? result['accessToken'] as String // Certificar que é String
        : null;

    if (token != null) {
      await my_prefs.setToken(token); // CORRIGIDO: Usar my_prefs.setToken

      // Agora, vamos buscar o perfil completo do utilizador e salvá-lo.
      // Assumindo que o 'result' do login já contém o 'idutilizador'
      final String? userId = result?['idutilizador']?.toString();

      if (userId != null) {
        final dynamic perfilResp = await servidor.getData('utilizador/id/$userId');
        final Map<String, dynamic> perfil = (perfilResp is Map<String, dynamic>)
            ? perfilResp
            : {};

        // Criar um mapa completo do utilizador para salvar, incluindo o perfil
        final Map<String, dynamic> userDataToSave = {
          'idutilizador': userId,
          'perfil': perfil, // Incluir o perfil completo aqui
          // Você pode adicionar outras chaves do 'result' do login aqui se necessário,
          // como 'nome', 'email', etc., para ter tudo num só lugar.
          'accessToken': token, // Também pode ser útil guardar o token aqui
        };

        await my_prefs.saveUser(userDataToSave); // CORRIGIDO: Usar my_prefs.saveUser
      } else {
        // Se não houver userId na resposta de login, ainda salvamos o token.
        // O perfil completo será carregado na HomePage ou TopHeaderBar.
        // No entanto, é ideal que o login forneça um userId para buscar o perfil.
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
                    onPressed: _loading ? null : _login,
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
                    child: _loading
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
                const SizedBox(height: 30),
                const SizedBox(height: 50),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
