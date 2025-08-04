import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart';

const String _tokenKey = 'token';
const String _userKey = 'user';

final ValueNotifier<Map<String, dynamic>?> currentUserNotifier = ValueNotifier(null);

Future<void> setToken(String token) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString(_tokenKey, token);
}

Future<String?> getToken() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getString(_tokenKey);
}

Future<void> removeToken() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.remove(_tokenKey);
  await prefs.remove(_userKey);
  currentUserNotifier.value = null;
}

Future<void> saveUser(Map<String, dynamic> user) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString(_userKey, jsonEncode(user));
  currentUserNotifier.value = user;
}

Future<Map<String, dynamic>?> getUser() async {
  if (currentUserNotifier.value != null) {
    return currentUserNotifier.value;
  }

  final prefs = await SharedPreferences.getInstance();
  final userString = prefs.getString(_userKey);
  if (userString == null || userString.isEmpty) {
    currentUserNotifier.value = null;
    return null;
  }
  try {
    final Map<String, dynamic> userData = jsonDecode(userString) as Map<String, dynamic>;
    currentUserNotifier.value = userData;
    return userData;
  } catch (e) {
    currentUserNotifier.value = null;
    return null;
  }
}

Future<void> removeUser() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.remove(_userKey);
  currentUserNotifier.value = null;
}

Future<bool> isLoggedIn() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getString(_tokenKey) != null && prefs.getString(_tokenKey)!.isNotEmpty;
}

Future<String?> getUserId() async {
  final user = await getUser();
  if (user != null && user.containsKey('idutilizador')) {
    return user['idutilizador'].toString();
  }
  return null;
}


Future<void> setGoogleServices() async {
  final prefs = await SharedPreferences.getInstance();
  prefs.setString("googlePlayServices","true");
}


Future<bool> googleServiceStatus() async {

  final prefs = await SharedPreferences.getInstance();
  return prefs.getString("googlePlayServices") != null ;

}
