import 'package:shared_preferences/shared_preferences.dart';

Future<bool> isLoggedIn() async {
  final prefs = await SharedPreferences.getInstance();
  // Supondo que guardas um token ou flag 'loggedIn' ao fazer login
  // Podes mudar para verificar um token, por exemplo: prefs.getString('token') != null
  return prefs.getBool('loggedIn') ?? false;
}

