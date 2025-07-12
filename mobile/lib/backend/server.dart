import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter/widgets.dart'; // Often not needed in backend/server.dart, can remove if not used for UI
import 'shared_preferences.dart' as prefs_utils;
import 'package:flutter/foundation.dart'; // Import for kDebugMode

class Servidor {
  final String urlAPI = 'https://api.thesoftskills.xyz';

  Future<Map<String, dynamic>?> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$urlAPI/utilizador/login'),
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
          await prefs_utils.setToken(token);
          print('Login successful. Token saved.');
          return responseBody;
        } else {
          print('Login successful but no token found in response.');
          return responseBody;
        }
      } else {
        print('Login failed: ${response.statusCode}'); // Corrected string interpolation
        print('Response body: ${response.body}');     // Corrected string interpolation
        return null;
      }
    } catch (e) {
      print('Error during login request: $e');
      return null;
    }
  }

  Future<Map<String, String>> _getAuthHeaders() async {
    final token = await prefs_utils.getToken();
    final Map<String, String> headers = {};
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<void> clearToken() async {
    await prefs_utils.removeToken();
  }

  // --- CORRECTED GET Method with queryParameters ---
  Future<dynamic> getData(String endpoint, {Map<String, dynamic>? queryParameters}) async {
    try {
      final headers = await _getAuthHeaders();
      headers['Content-Type'] = 'application/json; charset=UTF-8';

      // Start building the URI from the base URL and endpoint
      Uri uri = Uri.parse('$urlAPI/$endpoint');

      // Process query parameters to correctly handle lists
      if (queryParameters != null && queryParameters.isNotEmpty) {
        final Map<String, List<String>> finalEncodedQueryParams = {};

        queryParameters.forEach((key, value) {
          if (value is List) {
            // If the value is a List (like List<String> from AppMiddleware for 'categoria')
            // Convert all list items to String and assign to a List<String>
            finalEncodedQueryParams[key] = value.map((e) => e.toString()).toList();
          } else {
            // For single values, just convert to string and put into a List
            finalEncodedQueryParams[key] = [value.toString()];
          }
        });

        // Use uri.replace with the correctly formatted queryParameters map
        // This will correctly generate "key=value1&key=value2" for lists
        uri = uri.replace(queryParameters: finalEncodedQueryParams);
      }

      // Print the final URL that http.get will use for debugging
      if (kDebugMode) { // Only print in debug mode
        print('Servidor GET request URL: $uri');
      }

      final response = await http.get(
        uri,
        headers: headers,
      );

      if (kDebugMode) { // Only print in debug mode
        print('Response Status Code: ${response.statusCode}');
        print('Response Body: ${response.body}');
      }

      if (response.statusCode == 200) {
        final decodedResponse = json.decode(response.body);
        return decodedResponse;
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        print('Authentication error: Token might be invalid or expired. Status: ${response.statusCode}');
        return null;
      } else {
        print('Failed to load data: ${response.statusCode}');
        print('Response body: ${response.body}');
        return null;
      }
    } on SocketException catch (e) {
      print('Network error during GET request: $e');
      // Consider throwing an error or returning a specific error type
      return null;
    } catch (e) {
      print('Error during GET request: $e');
      return null;
    }
  }

  // Keep all other methods as they are, they don't use queryParameters in the same way.
  // ... (postData, putData, deleteData, postMultipartData, putMultipartData) ...

  Future<Map<String, dynamic>?> postData(
      String endpoint, Map<String, dynamic> data) async {
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
        print(
            'Authentication error: Token might be invalid or expired. Status: ${response.statusCode}');
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

  Future<Map<String, dynamic>?> putData(
      String endpoint, Map<String, dynamic> data) async {
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
        print(
            'Authentication error: Token might be invalid or expired. Status: ${response.statusCode}');
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
        print(
            'Authentication error: Token might be invalid or expired. Status: ${response.statusCode}');
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
        print(
            'Authentication error: Token might be invalid or expired. Status: ${response.statusCode}');
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
        print(
            'Authentication error: Token might be invalid or expired. Status: ${response.statusCode}');
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
