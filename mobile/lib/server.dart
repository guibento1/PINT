import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/widgets.dart'; // Provides WidgetsFlutterBinding.ensureInitialized()

class Servidor {
  final String urlAPI = 'https://api.thesoftskills.xyz';
  static const String _jwtTokenKey = 'jwt_token';

  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_jwtTokenKey, token); }
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_jwtTokenKey);
  }

  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_jwtTokenKey);
  }

  Future<Map<String, dynamic>?> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$urlAPI/login'),
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseBody = json.decode(response.body);
        final String? token = responseBody['accessToken'];

        if (token != null) {
          await _saveToken(token);
          print('Login successful. Token saved.');
          return responseBody;
        } else {
          print('Login successful but no token found in response.');
          return responseBody;
        }
      } else {
        print('Login failed: ${response.statusCode}');
        print('Response body: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Error during login request: $e');
      return null;
    }
  }

  Future<Map<String, String>> _getAuthHeaders() async {
    final token = await _getToken();
    final Map<String, String> headers = {};
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // --- GET Method ---
  Future<Map<String, dynamic>?> getData(String endpoint) async {
    try {
      final headers = await _getAuthHeaders();
      headers['Content-Type'] = 'application/json; charset=UTF-8';

      final response = await http.get(
        Uri.parse('$urlAPI/$endpoint'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        print('Authentication error: Token might be invalid or expired. Status: ${response.statusCode}');
        return null;
      } else {
        print('Failed to load data: ${response.statusCode}');
        print('Response body: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Error during GET request: $e');
      return null;
    }
  }

  // ... (rest of your Servidor class methods: postData, putData, deleteData, postMultipartData, putMultipartData) ...
  // Keep all other methods as they are.
  Future<Map<String, dynamic>?> postData(String endpoint, Map<String, dynamic> data) async {
    try {
      final headers = await _getAuthHeaders();
      headers['Content-Type'] = 'application/json; charset=UTF-8';

      final response = await http.post(
        Uri.parse('$urlAPI/$endpoint'),
        headers: headers,
        body: jsonEncode(data),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        return json.decode(response.body);
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        print('Authentication error: Token might be invalid or expired. Status: ${response.statusCode}');
        return null;
      } else {
        print('Failed to post data: ${response.statusCode}');
        print('Response body: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Error during POST request: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> putData(String endpoint, Map<String, dynamic> data) async {
    try {
      final headers = await _getAuthHeaders();
      headers['Content-Type'] = 'application/json; charset=UTF-8';

      final response = await http.put(
        Uri.parse('$urlAPI/$endpoint'),
        headers: headers,
        body: jsonEncode(data),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        print('Authentication error: Token might be invalid or expired. Status: ${response.statusCode}');
        return null;
      } else {
        print('Failed to update data: ${response.statusCode}');
        print('Response body: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Error during PUT request: $e');
      return null;
    }
  }

  Future<bool> deleteData(String endpoint) async {
    try {
      final headers = await _getAuthHeaders();

      final response = await http.delete(
        Uri.parse('$urlAPI/$endpoint'),
        headers: headers,
      );

      if (response.statusCode == 200 || response.statusCode == 204) {
        return true;
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        print('Authentication error: Token might be invalid or expired. Status: ${response.statusCode}');
        return false;
      } else {
        print('Failed to delete data: ${response.statusCode}');
        print('Response body: ${response.body}');
        return false;
      }
    } catch (e) {
      print('Error during DELETE request: $e');
      return false;
    }
  }

  Future<Map<String, dynamic>?> postMultipartData(
    String endpoint,
    Map<String, String> fields,
    String fileField,
    String filePath,
  ) async {
    try {
      final headers = await _getAuthHeaders();

      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$urlAPI/$endpoint'),
      );

      request.fields.addAll(fields);

      request.files.add(await http.MultipartFile.fromPath(fileField, filePath));

      request.headers.addAll(headers);

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return json.decode(response.body);
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        print('Authentication error: Token might be invalid or expired. Status: ${response.statusCode}');
        return null;
      } else {
        print('Failed to send multipart data: ${response.statusCode}');
        print('Response body: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Error during multipart POST request: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> putMultipartData(
    String endpoint,
    Map<String, String> fields,
    String fileField,
    String filePath,
  ) async {
    try {
      final headers = await _getAuthHeaders();

      final request = http.MultipartRequest(
        'PUT',
        Uri.parse('$urlAPI/$endpoint'),
      );

      request.fields.addAll(fields);

      request.files.add(await http.MultipartFile.fromPath(fileField, filePath));

      request.headers.addAll(headers);

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        print('Authentication error: Token might be invalid or expired. Status: ${response.statusCode}');
        return null;
      } else {
        print('Failed to send multipart data: ${response.statusCode}');
        print('Response body: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Error during multipart PUT request: $e');
      return null;
    }
  }
}

void main() async {

  WidgetsFlutterBinding.ensureInitialized();

  final servidor = Servidor();

  print('Attempting a simple login and then a GET request...');

  try {
    final loginResult = await servidor.login("pedro.martins@email.com", "pedromartinspm");

    if (loginResult != null) {
      print('\nLogin successful! Now attempting a GET request for a protected resource...');

      final protectedData = await servidor.getData('users/me'); 

      if (protectedData != null) {
        print('GET request for protected data successful!');
        print('Received protected data:');
        print(protectedData);
      } else {
        print('GET request for protected data failed or returned null.');
      }
    } else {
      print('Login failed. Cannot proceed with authenticated GET request.');
    }
  } catch (e) {
    print('An unexpected error occurred during the test: $e');
  }

  print('\nTest finished.');
}
