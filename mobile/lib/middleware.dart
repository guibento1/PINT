import 'dart:convert';
import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'backend/server.dart';
import 'backend/database_helper.dart';
import 'backend/shared_preferences.dart' as my_prefs;

class AppMiddleware {
  final Servidor _servidor = Servidor();
  final DatabaseHelper _dbHelper = DatabaseHelper();

  Future<bool> _isOnline() async {
    try {
      final connectivityResult = await (Connectivity().checkConnectivity());
      if (connectivityResult == ConnectivityResult.none) {
        print('App is offline (ConnectivityResult.none).');
        return false;
      }

      final result = await InternetAddress.lookup('example.com');
      if (result.isNotEmpty && result[0].rawAddress.isNotEmpty) {
        print('App is online.');
        return true;
      } else {
        print('App is offline (InternetAddress lookup failed).');
        return false;
      }
    } on SocketException catch (_) {
      print('App is offline (SocketException during connectivity check).');
      return false;
    } catch (e) {
      print('Error checking connectivity: $e');
      return false; 
    }
  }

  Future<Map<String, dynamic>> fetchUserProfile(String userId) async {
    if (!await _isOnline()) {
      print('Offline: Fetching user profile from local DB.');
      final user = await _dbHelper.getUtilizador(int.parse(userId));
      return user ?? {};
    }

    try {
      print('Online: Fetching user profile from API.');
      final dynamic response = await _servidor.getData('utilizador/id/$userId');
      if (response is Map<String, dynamic>) {
        await _dbHelper.upsertUtilizador(response);
        return response;
      }
      throw Exception('Invalid user profile data format from API.');
    } on SocketException catch (e) {
      print('SocketException in AppMiddleware.fetchUserProfile: $e. Trying local DB.');
      final user = await _dbHelper.getUtilizador(int.parse(userId));
      return user ?? {};
    } catch (e) {
      print('Error in AppMiddleware.fetchUserProfile: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> updateUserProfile(
    String userId,
    Map<String, dynamic> userData,
    {File? profileImage}
  ) async {
    if (!await _isOnline()) {
      print('Offline: Returning empty response for profile update.');
      return {};
    }

    try {
      final String endpoint = 'utilizador/id/$userId';
      final Map<String, String> finalMultipartFields = {}; 
      final Map<String, dynamic> infoData = {}; 

      const List<String> infoKeys = ['nome', 'morada', 'telefone'];

      userData.forEach((key, value) {
        if (infoKeys.contains(key)) {
          if (value != null) {
            if (value is List) {
              infoData[key] = value.map((e) => e.toString()).toList();
            } else {
              infoData[key] = value;
            }
          }
        } else if (value != null) {
          finalMultipartFields[key] = value.toString();
        }
      });

      if (infoData.isNotEmpty) {
        finalMultipartFields['info'] = jsonEncode(infoData);
      }

      dynamic response = await _servidor.putMultipartData(
        endpoint,
        finalMultipartFields,
        'foto',
        profileImage?.path,
      );

      if (response is Map<String, dynamic>) {
        await _dbHelper.upsertUtilizador(response);
        return response;
      } else if (response == null) {
        print('Profile update request returned null. Check previous Servidor logs for details.');
        return {};
      }

      throw Exception('Invalid response format for profile update.');
    } on SocketException catch (e) {
      print('SocketException in AppMiddleware.updateUserProfile: $e. Returning empty data.');
      return {};
    } catch (e) {
      print('Error in AppMiddleware.updateUserProfile: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> fetchCourseDetails(int courseId) async {
    if (!await _isOnline()) {
      print('Offline: Returning empty course details.');
      return {};
    }
    try {
      final dynamic courseDetailsResp = await _servidor.getData('curso/$courseId');
      if (courseDetailsResp is Map<String, dynamic>) {
        return courseDetailsResp;
      }
      throw Exception('Formato de dados de detalhes do curso inválido.');
    } on SocketException catch (e) {
      print('SocketException in AppMiddleware.fetchCourseDetails: $e. Returning empty data.');
      return {};
    } catch (e) {
      print('Error in AppMiddleware.fetchCourseDetails: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> subscribeToCourse(int courseId, int userId) async {
    if (!await _isOnline()) {
      print('Offline: Returning empty response for course subscription.');
      return {};
    }
    try {
      final dynamic response = await _servidor.postData('curso/$courseId/inscrever', {});
      if (response is Map<String, dynamic>) {
        await _dbHelper.db.then((db) => db.insert('utilizador_cursos', {'idutilizador': userId, 'idcurso': courseId}));
        return response;
      }
      throw Exception('Formato de resposta de inscrição inválido.');
    } on SocketException catch (e) {
      print('SocketException in AppMiddleware.subscribeToCourse: $e. Returning empty data.');
      return {};
    } catch (e) {
      print('Error in AppMiddleware.subscribeToCourse: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> unsubscribeFromCourse(int courseId, int userId) async {
    if (!await _isOnline()) {
      print('Offline: Returning empty response for course unsubscription.');
      return {};
    }
    try {
      final dynamic response = await _servidor.postData('curso/$courseId/sair', {});
      if (response is Map<String, dynamic>) {
        await _dbHelper.db.then((db) => db.delete('utilizador_cursos', where: 'idutilizador = ? AND idcurso = ?', whereArgs: [userId, courseId]));
        return response;
      }
      throw Exception('Formato de resposta de cancelamento de inscrição inválido.');
    } on SocketException catch (e) {
      print('SocketException in AppMiddleware.unsubscribeFromCourse: $e. Returning empty data.');
      return {};
    } catch (e) {
      print('Error in AppMiddleware.unsubscribeFromCourse: $e');
      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> fetchAllCategories() async {
    if (!await _isOnline()) {
      print('Offline: Returning empty categories list.');
      return [];
    }
    try {
      final dynamic categoriesResp = await _servidor.getData('categoria/list');
      if (categoriesResp is List) {
        return List<Map<String, dynamic>>.from(
            categoriesResp.whereType<Map<String, dynamic>>());
      }
      return [];
    } on SocketException catch (e) {
      print('SocketException in AppMiddleware.fetchAllCategories: $e. Returning empty data.');
      return [];
    } catch (e) {
      print('Error in AppMiddleware.fetchAllCategories: $e');
      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> fetchAreas(String categoriaId) async {
    if (!await _isOnline()) {
      print('Offline: Returning empty areas list.');
      return [];
    }
    try {
      final dynamic areasResp = await _servidor.getData('categoria/id/$categoriaId/list');
      if (areasResp is List) {
        return List<Map<String, dynamic>>.from(
            areasResp.whereType<Map<String, dynamic>>());
      }
      return [];
    } on SocketException catch (e) {
      print('SocketException in AppMiddleware.fetchAreas: $e. Returning empty data.');
      return [];
    } catch (e) {
      print('Error in AppMiddleware.fetchAreas: $e');
      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> fetchTopics(String areaId) async {
    if (!await _isOnline()) {
      print('Offline: Returning empty topics list.');
      return [];
    }
    try {
      final dynamic topicsResp = await _servidor.getData('area/id/$areaId/list');
      if (topicsResp is List) {
        return List<Map<String, dynamic>>.from(
            topicsResp.whereType<Map<String, dynamic>>());
      }
      return [];
    } on SocketException catch (e) {
      print('SocketException in AppMiddleware.fetchTopics: $e. Returning empty data.');
      return [];
    } catch (e) {
      print('Error in AppMiddleware.fetchTopics: $e');
      rethrow;
    }
  }


  Future<List<Map<String, dynamic>>> fetchUserCourses({
    required String userId,
    String? searchTerm,
    List<int>? categoryIds,
  }) async {
    if (!await _isOnline()) {
      print('Offline: Fetching user courses from local DB.');
      return await _dbHelper.listarCursosInscritos(int.parse(userId));
    }
    try {
      String coursesBasePath = 'curso/inscricoes/utilizador/$userId';

      final Map<String, dynamic> finalQueryParams = {};
      if (searchTerm != null && searchTerm.isNotEmpty) {
        finalQueryParams['search'] = searchTerm;
      }
      if (categoryIds != null && categoryIds.isNotEmpty) {
        finalQueryParams['categoria'] = categoryIds.map((id) => id.toString()).toList();
      }

      final Uri finalUri = Uri(
        path: coursesBasePath,
        queryParameters: finalQueryParams.map((key, value) {
          if (value is List) {
            return MapEntry(key, value.map((e) => e.toString()).toList());
          }
          return MapEntry(key, value.toString());
        }),
      );

      print('Fetching user courses with URL path and parameters: ${finalUri.toString()}');

      final dynamic cursosResp = await _servidor.getData(
        coursesBasePath,
        queryParameters: finalQueryParams,
      );

      print('API response for courses: $cursosResp');

      if (cursosResp is List) {
        final coursesList = List<Map<String, dynamic>>.from(cursosResp.whereType<Map<String, dynamic>>());

        await _dbHelper.syncInscricoesFromApi(int.parse(userId), coursesList);
        await _dbHelper.syncCursosFromApi(coursesList);
        return coursesList;
      }
      print('Courses response is NOT a List. Type: ${cursosResp.runtimeType}, Value: $cursosResp');
      return <Map<String, dynamic>>[];
    } on SocketException catch (e) {
      print('SocketException in AppMiddleware.fetchUserCourses: $e. Returning local data.');
      return await _dbHelper.listarCursosInscritos(int.parse(userId));
    } catch (e) {
      print('Error in AppMiddleware.fetchUserCourses: $e');
      rethrow;
    }
  }

  Future<List<Map<String, dynamic>>> fetchAllCourses({
    String? searchTerm,
    String? categoriaId,
    String? areaId,
    String? topicoId,
  }) async {
    if (!await _isOnline()) {
      print('Offline: Returning empty all courses list.');
      return [];
    }
    try {
      Map<String, dynamic> queryParams = {};
      if (searchTerm != null && searchTerm.isNotEmpty) {
        queryParams['search'] = searchTerm;
      }
      if (categoriaId != null && categoriaId.isNotEmpty) {
        queryParams['categoria'] = categoriaId;
      }
      if (areaId != null && areaId.isNotEmpty) {
        queryParams['area'] = areaId;
      }
      if (topicoId != null && topicoId.isNotEmpty) {
        queryParams['topico'] = topicoId;
      }

      final dynamic coursesResp = await _servidor.getData(
        'curso/list',
        queryParameters: queryParams,
      );

      if (coursesResp is List) {
        final courseList = List<Map<String, dynamic>>.from(coursesResp.whereType<Map<String, dynamic>>());
        return courseList;
      }
      return [];
    } on SocketException catch (e) {
      print('SocketException in AppMiddleware.fetchAllCourses: $e. Returning empty data.');
      return [];
    } catch (e) {
      print('Error in AppMiddleware.fetchAllCourses: $e');
      rethrow;
    }
  }
}
