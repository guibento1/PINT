import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'shared_preferences.dart' as prefs_utils;
import 'package:flutter/foundation.dart';

class Servidor {
  final String urlAPI = 'https://api.thesoftskills.xyz';

  Future<Map<String, dynamic>?> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$urlAPI/utilizador/login'),
        headers: <String, String>{
          'Content-Type': 'application/json; charset=UTF-8',
          'Accept': 'application/json',
        },
        body: jsonEncode({'email': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseBody = json.decode(response.body);
        final String? token =
            (responseBody['accessToken'] ??
                    responseBody['token'] ??
                    responseBody['access_token'])
                as String?;

        if (token != null) {
          await prefs_utils.setToken(token);
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
    final token = await prefs_utils.getToken();
    final Map<String, String> headers = {};
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    headers['Accept'] = 'application/json';
    return headers;
  }

  Future<void> clearToken() async {
    await prefs_utils.removeToken();
  }

  Uri _buildUri(String endpoint, {Map<String, dynamic>? queryParameters}) {
    Uri uri = Uri.parse('$urlAPI/$endpoint');
    if (queryParameters != null && queryParameters.isNotEmpty) {
      final Map<String, List<String>> qp = {};
      queryParameters.forEach((key, value) {
        if (value == null) return;
        if (value is List) {
          qp[key] = value.map((e) => e.toString()).toList();
        } else {
          qp[key] = [value.toString()];
        }
      });
      uri = uri.replace(queryParameters: qp);
    }
    return uri;
  }

  Future<dynamic> getData(
    String endpoint, {
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      final headers = await _getAuthHeaders();
      headers['Content-Type'] = 'application/json; charset=UTF-8';

      final uri = _buildUri(endpoint, queryParameters: queryParameters);

      if (kDebugMode) {
        print('Servidor GET request URL: $uri');
      }

      final response = await http.get(uri, headers: headers);

      if (kDebugMode) {
        print('Response Status Code: ${response.statusCode}');
        print('Response Body: ${response.body}');
      }

      if (response.statusCode == 200) {
        final decodedResponse = json.decode(response.body);
        return decodedResponse;
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        print(
          'Authentication error: Token might be invalid or expired. Status: ${response.statusCode}',
        );
        await clearToken();
        return null;
      } else {
        print('Failed to load data: ${response.statusCode}');
        print('Response body: ${response.body}');
        return null;
      }
    } on SocketException catch (e) {
      print('Network error during GET request: $e');
      return null;
    } catch (e) {
      print('Error during GET request: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> postData(
    String endpoint,
    Map<String, dynamic> data,
  ) async {
    try {
      final headers = await _getAuthHeaders();
      headers['Content-Type'] = 'application/json; charset=UTF-8';

      final response = await http.post(
        _buildUri(endpoint),
        headers: headers,
        body: jsonEncode(data),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        return json.decode(response.body);
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        print(
          'Authentication error: Token might be invalid or expired. Status: ${response.statusCode}',
        );
        await clearToken();
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
    String endpoint,
    Map<String, dynamic> data,
  ) async {
    try {
      final headers = await _getAuthHeaders();
      headers['Content-Type'] = 'application/json; charset=UTF-8';

      final response = await http.put(
        _buildUri(endpoint),
        headers: headers,
        body: jsonEncode(data),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        print(
          'Authentication error: Token might be invalid or expired. Status: ${response.statusCode}',
        );
        await clearToken();
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

      final response = await http.delete(_buildUri(endpoint), headers: headers);

      if (response.statusCode == 200 || response.statusCode == 204) {
        return true;
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        print(
          'Authentication error: Token might be invalid or expired. Status: ${response.statusCode}',
        );
        await clearToken();
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

      final request = http.MultipartRequest('POST', _buildUri(endpoint));

      request.fields.addAll(fields);

      request.files.add(await http.MultipartFile.fromPath(fileField, filePath));

      request.headers.addAll(headers);

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return json.decode(response.body);
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        print(
          'Authentication error: Token might be invalid or expired. Status: ${response.statusCode}',
        );
        await clearToken();
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

  Future<Map<String, dynamic>?> postMultipartFieldsOnly(
    String endpoint,
    Map<String, String> fields,
  ) async {
    try {
      final headers = await _getAuthHeaders();
      final request = http.MultipartRequest('POST', _buildUri(endpoint));
      request.fields.addAll(fields);
      request.headers.addAll(headers);
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return json.decode(response.body);
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        await clearToken();
        return null;
      } else {
        print('Failed to send multipart fields: ${response.statusCode}');
        print('Response body: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Error during multipart (fields-only) POST request: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> postMultipartDataBytes(
    String endpoint,
    Map<String, String> fields,
    String fileField,
    List<int> bytes,
    String filename,
  ) async {
    try {
      final headers = await _getAuthHeaders();
      final request = http.MultipartRequest('POST', _buildUri(endpoint));
      request.fields.addAll(fields);
      request.files.add(
        http.MultipartFile.fromBytes(fileField, bytes, filename: filename),
      );
      request.headers.addAll(headers);
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return json.decode(response.body);
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        await clearToken();
        return null;
      } else {
        print('Failed to send multipart bytes: ${response.statusCode}');
        print('Response body: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Error during multipart (bytes) POST request: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> putMultipartData(
    String endpoint,
    Map<String, String> fields,
    String fileField,
    String? filePath,
  ) async {
    try {
      final headers = await _getAuthHeaders();

      final request = http.MultipartRequest('PUT', _buildUri(endpoint));

      request.fields.addAll(fields);

      if (filePath != null && filePath.isNotEmpty) {
        request.files.add(
          await http.MultipartFile.fromPath(fileField, filePath),
        );
      }

      request.headers.addAll(headers);

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return json.decode(response.body);
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        print(
          'Authentication error: Token might be invalid or expired. Status: ${response.statusCode}',
        );
        await clearToken();
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

  Future<List<dynamic>> fetchCategorias() async {
    final res = await getData('categoria/list');
    return res is List ? res : [];
  }

  Future<List<dynamic>> fetchAreasByCategoria(String idCategoria) async {
    final res = await getData('categoria/id/$idCategoria/list');
    return res is List ? res : [];
  }

  Future<List<dynamic>> fetchTopicosByArea(String idArea) async {
    final res = await getData('area/id/$idArea/list');
    return res is List ? res : [];
  }

  // Forums
  Future<List<dynamic>> fetchForumPosts({
    String? idTopico,
    String order = 'recent',
  }) async {
    final endpoint =
        (idTopico != null && idTopico.isNotEmpty)
            ? 'forum/posts/topico/$idTopico'
            : 'forum/posts';
    final res = await getData(endpoint, queryParameters: {'order': order});
    return res is List ? res : [];
  }

  Future<Map<String, dynamic>?> getForumPost(int idPost) async {
    final res = await getData('forum/post/$idPost');
    if (res is Map<String, dynamic>) return res;
    if (res is Map) return Map<String, dynamic>.from(res);
    return null;
  }

  // Comments
  Future<List<dynamic>> getPostRootComments(int idPost) async {
    final res = await getData('forum/post/$idPost/comment');
    if (res is Map && res.containsKey('comments'))
      return (res['comments'] as List?) ?? [];
    if (res is Map && res.containsKey('data'))
      return (res['data'] as List?) ?? [];
    return res is List ? res : [];
  }

  Future<List<dynamic>> getCommentReplies(int idComment) async {
    final res = await getData('forum/comment/$idComment/replies');
    if (res is Map && res.containsKey('data'))
      return (res['data'] as List?) ?? [];
    return res is List ? res : [];
  }

  Future<Map<String, dynamic>?> postComment({
    required int idPost,
    required String conteudo,
  }) async {
    return await postData('forum/post/$idPost/comment', {'conteudo': conteudo});
  }

  Future<Map<String, dynamic>?> replyToComment({
    required int idComment,
    required String conteudo,
  }) async {
    return await postData('forum/comment/$idComment/respond', {
      'conteudo': conteudo,
    });
  }

  // Posts creation
  Future<Map<String, dynamic>?> createForumPost({
    required String idTopico,
    required Map<String, dynamic> payload,
  }) async {
    return await postData('forum/post/topico/$idTopico', payload);
  }

  // Voting on posts
  Future<bool> votePostUp(int idPost) async {
    final res = await postData('forum/post/$idPost/upvote', {});
    return res != null;
  }

  Future<bool> votePostDown(int idPost) async {
    final res = await postData('forum/post/$idPost/downvote', {});
    return res != null;
  }

  Future<bool> unvotePost(int idPost) async {
    return await deleteData('forum/post/$idPost/unvote');
  }

  // Denúncias
  Future<List<dynamic>> fetchReportTypes() async {
    final res = await getData('forum/denuncias/tipos');
    return res is List ? res : [];
  }

  Future<bool> reportPost(
    int idPost, {
    required int tipo,
    String descricao = '',
  }) async {
    final res = await postData('forum/post/$idPost/reportar', {
      'tipo': tipo,
      'descricao': descricao,
    });
    return res != null;
  }

  Future<bool> reportComment(
    int idComment, {
    required int tipo,
    String descricao = '',
  }) async {
    final res = await postData('forum/comment/$idComment/reportar', {
      'tipo': tipo,
      'descricao': descricao,
    });
    return res != null;
  }
}
