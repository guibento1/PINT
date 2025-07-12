import 'dart:io'; // Required for SocketException
import 'package:connectivity_plus/connectivity_plus.dart'; // Import connectivity_plus
import 'backend/server.dart'; // Import your existing Servidor class

class AppMiddleware {
  final Servidor _servidor = Servidor();

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
      print('Offline: Returning empty user profile.');
      return {}; // Return empty map if offline
    }
    try {
      final dynamic response = await _servidor.getData('utilizador/id/$userId');
      if (response is Map<String, dynamic>) {
        return response;
      }
      throw Exception('Invalid user profile data format.');
    } on SocketException catch (e) {
      print('SocketException in AppMiddleware.fetchUserProfile: $e. Returning empty data.');
      return {}; // Return empty map on network error
    } catch (e) {
      print('Error in AppMiddleware.fetchUserProfile: $e');
      rethrow;
    }
  }

  // Updates user profile data
  Future<Map<String, dynamic>> updateUserProfile(String userId, Map<String, String> fields, {File? profileImage}) async {
    if (!await _isOnline()) {
      print('Offline: Returning empty response for profile update.');
      return {}; // Return empty map if offline
    }
    try {
      dynamic response;
      if (profileImage != null) {
        response = await _servidor.putMultipartData(
          'utilizador/id/$userId',
          fields,
          'foto',
          profileImage.path,
        );
      } else {
        response = await _servidor.putData(
          'utilizador/id/$userId',
          fields,
        );
      }

      if (response is Map<String, dynamic>) {
        return response;
      }
      throw Exception('Invalid response format for profile update.');
    } on SocketException catch (e) {
      print('SocketException in AppMiddleware.updateUserProfile: $e. Returning empty data.');
      return {}; // Return empty map on network error
    } catch (e) {
      print('Error in AppMiddleware.updateUserProfile: $e');
      rethrow;
    }
  }

  // Fetches details for a specific course by ID
  Future<Map<String, dynamic>> fetchCourseDetails(int courseId) async {
    if (!await _isOnline()) {
      print('Offline: Returning empty course details.');
      return {}; // Return empty map if offline
    }
    try {
      final dynamic courseDetailsResp = await _servidor.getData('curso/$courseId');
      if (courseDetailsResp is Map<String, dynamic>) {
        return courseDetailsResp;
      }
      throw Exception('Formato de dados de detalhes do curso inválido.');
    } on SocketException catch (e) {
      print('SocketException in AppMiddleware.fetchCourseDetails: $e. Returning empty data.');
      return {}; // Return empty map on network error
    } catch (e) {
      print('Error in AppMiddleware.fetchCourseDetails: $e');
      rethrow;
    }
  }

  // Subscribes a user to a course
  Future<Map<String, dynamic>> subscribeToCourse(int courseId) async {
    if (!await _isOnline()) {
      print('Offline: Returning empty response for course subscription.');
      return {}; // Return empty map if offline
    }
    try {
      final dynamic response = await _servidor.postData('curso/$courseId/inscrever', {});
      if (response is Map<String, dynamic>) {
        return response;
      }
      throw Exception('Formato de resposta de inscrição inválido.');
    } on SocketException catch (e) {
      print('SocketException in AppMiddleware.subscribeToCourse: $e. Returning empty data.');
      return {}; // Return empty map on network error
    } catch (e) {
      print('Error in AppMiddleware.subscribeToCourse: $e');
      rethrow;
    }
  }

  // Unsubscribes a user from a course
  Future<Map<String, dynamic>> unsubscribeFromCourse(int courseId) async {
    if (!await _isOnline()) {
      print('Offline: Returning empty response for course unsubscription.');
      return {}; // Return empty map if offline
    }
    try {
      final dynamic response = await _servidor.postData('curso/$courseId/sair', {});
      if (response is Map<String, dynamic>) {
        return response;
      }
      throw Exception('Formato de resposta de cancelamento de inscrição inválido.');
    } on SocketException catch (e) {
      print('SocketException in AppMiddleware.unsubscribeFromCourse: $e. Returning empty data.');
      return {}; // Return empty map on network error
    } catch (e) {
      print('Error in AppMiddleware.unsubscribeFromCourse: $e');
      rethrow;
    }
  }

  // Fetches all categories
  Future<List<Map<String, dynamic>>> fetchAllCategories() async {
    if (!await _isOnline()) {
      print('Offline: Returning empty categories list.');
      return []; // Return empty list if offline
    }
    try {
      final dynamic categoriesResp = await _servidor.getData('categoria/list');
      if (categoriesResp is List) {
        return List<Map<String, dynamic>>.from(
            categoriesResp.whereType<Map<String, dynamic>>());
      }
      return []; // Return an empty list if data is not as expected
    } on SocketException catch (e) {
      print('SocketException in AppMiddleware.fetchAllCategories: $e. Returning empty data.');
      return []; // Return empty list on network error
    } catch (e) {
      print('Error in AppMiddleware.fetchAllCategories: $e');
      rethrow; // Re-throw to allow UI to handle errors
    }
  }

  // Fetches areas for a given category ID
  Future<List<Map<String, dynamic>>> fetchAreas(String categoriaId) async {
    if (!await _isOnline()) {
      print('Offline: Returning empty areas list.');
      return []; // Return empty list if offline
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
      return []; // Return empty list on network error
    } catch (e) {
      print('Error in AppMiddleware.fetchAreas: $e');
      rethrow;
    }
  }

  // Fetches topics for a given area ID
  Future<List<Map<String, dynamic>>> fetchTopics(String areaId) async {
    if (!await _isOnline()) {
      print('Offline: Returning empty topics list.');
      return []; // Return empty list if offline
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
      return []; // Return empty list on network error
    } catch (e) {
      print('Error in AppMiddleware.fetchTopics: $e');
      rethrow;
    }
  }

  // Fetches user's subscribed courses with optional search and category filters
  Future<List<Map<String, dynamic>>> fetchUserCourses({
    required String userId,
    String? searchTerm,
    List<int>? categoryIds,
  }) async {
    if (!await _isOnline()) {
      print('Offline: Returning empty user courses list.');
      return <Map<String, dynamic>>[]; // Return empty list if offline
    }
    try {
      String coursesUrl = 'curso/inscricoes/utilizador/$userId';
      Map<String, dynamic> queryParams = {};

      if (searchTerm != null && searchTerm.isNotEmpty) {
        queryParams['search'] = searchTerm;
      }
      if (categoryIds != null && categoryIds.isNotEmpty) {
        // The original code had an empty loop here, which is not needed.
        // The categoryIds are used in finalQueryParams below.
      }

      final Map<String, dynamic> finalQueryParams = {};
      if (searchTerm != null && searchTerm.isNotEmpty) {
        finalQueryParams['search'] = searchTerm;
      }
      if (categoryIds != null && categoryIds.isNotEmpty) {
        finalQueryParams['categoria'] = categoryIds;
      }

      final dynamic cursosResp = await _servidor.getData(
        'curso/inscricoes/utilizador/$userId',
        queryParameters: finalQueryParams,
      );

      if (cursosResp is List) {
        return List<Map<String, dynamic>>.from(
            cursosResp.whereType<Map<String, dynamic>>());
      }
      return <Map<String, dynamic>>[];
    } on SocketException catch (e) {
      print('SocketException in AppMiddleware.fetchUserCourses: $e. Returning empty data.');
      return <Map<String, dynamic>>[]; // Return empty list on network error
    } catch (e) {
      print('Error in AppMiddleware.fetchUserCourses: $e');
      rethrow;
    }
  }

  // Fetches all courses with optional search, category, area, and topic filters
  Future<List<Map<String, dynamic>>> fetchAllCourses({
    String? searchTerm,
    String? categoriaId,
    String? areaId,
    String? topicoId,
  }) async {
    if (!await _isOnline()) {
      print('Offline: Returning empty all courses list.');
      return []; // Return empty list if offline
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
        return List<Map<String, dynamic>>.from(
            coursesResp.whereType<Map<String, dynamic>>());
      }
      return [];
    } on SocketException catch (e) {
      print('SocketException in AppMiddleware.fetchAllCourses: $e. Returning empty data.');
      return []; // Return empty list on network error
    } catch (e) {
      print('Error in AppMiddleware.fetchAllCourses: $e');
      rethrow;
    }
  }
}
