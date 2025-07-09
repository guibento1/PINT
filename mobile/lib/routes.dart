import 'package:go_router/go_router.dart';
import 'course_details_page.dart';
import 'courses_page.dart';
import 'home_page.dart';
import 'login_page.dart';
import 'profile_page.dart';
import 'shared_preferences.dart' as my_prefs;

final rotas = GoRouter(
  initialLocation: '/',
  redirect: (context, state) async {
    final token = await my_prefs.getToken();
    final loc = state.uri.toString();
    if (token == null || token.isEmpty) {
      if (loc != '/login') {
        return '/login';
      }
    } else {
      if (loc == '/login' || loc == '/') {
        return '/home';
      }
    }
    return null;
  },

  routes: [
    GoRoute(
      path: '/course_details',
      name: 'course_details',
      builder: (context, state) => CourseDetailsPage(),
    ),
    GoRoute(
      path: '/courses',
      name: 'courses',
      builder: (context, state) => CoursesPage(),
    ),
    GoRoute(
      path: '/home',
      name: 'home',
      builder: (context, state) => HomePage(),
    ),
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => LoginPage(),
    ),
    GoRoute(
      path: '/profile',
      name: 'profile',
      builder: (context, state) => ProfilePage(),
    ),
  ],
);
