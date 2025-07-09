import 'package:shared_preferences/shared_preferences.dart';

// Guardar token de sessão
Future<void> saveToken(String token) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString('token', token);
}

// Ler token de sessão
Future<String?> getToken() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getString('token');
}

// Remover token de sessão (logout)
Future<void> removeToken() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.remove('token');
}

// Guardar preferência de tema (ex: dark mode)
Future<void> saveThemeMode(bool isDarkMode) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setBool('darkMode', isDarkMode);
}

// Ler preferência de tema
Future<bool> getThemeMode() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getBool('darkMode') ?? false;
}

// Guardar preferência de idioma
Future<void> saveLanguage(String languageCode) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString('language', languageCode);
}

// Ler preferência de idioma
Future<String?> getLanguage() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getString('language');
}

// Verificar se o utilizador está autenticado
Future<bool> isLoggedIn() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getString('token') != null;
}
