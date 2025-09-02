import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import 'views/course_details_page.dart';
import 'views/explore_courses_page.dart';
import 'views/home_page.dart';
import 'views/login_page.dart';
import 'views/profile_page.dart';
import 'views/notifications_page.dart';
import 'views/forums_page.dart';
import 'views/create_post_page.dart';
import 'views/post_details_page.dart';
import 'backend/shared_preferences.dart' as my_prefs;
import 'components/navigation_bar.dart';
import 'components/top_headr_bar.dart';
import 'components/offline_warning_wrapper.dart';

final rotas = GoRouter(
  initialLocation: '/',
  redirect: (context, state) async {
    final token = await my_prefs.getToken();
    final loc = state.uri.toString();

    final bool isLoggingIn = loc == '/login';
    final bool isPublicRoute = isLoggingIn;

    if (token == null || token.isEmpty) {
      if (!isPublicRoute) {
        return '/login';
      }
    } else {
      if (isLoggingIn || loc == '/') {
        return '/home';
      }
    }
    return null;
  },
  routes: [
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => LoginPage(),
    ),

    ShellRoute(
      builder: (context, state, child) {
        final String currentPath = state.uri.path;

        final bool hideTopBar =
            currentPath == '/course_details' ||
            currentPath.startsWith('/course_details/');

        return WillPopScope(
          onWillPop: () async {
            if (context.canPop()) {
              context.pop();
              return false;
            }
            return true;
          },
          child: Scaffold(
            backgroundColor: const Color(0xFF00B0DA),
            body: SafeArea(
              child: Container(
                color: const Color(0xFFF6F9FB),
                child: Column(
                  children: [
                    if (!hideTopBar) const TopHeaderBar(),
                    Expanded(
                      child: OfflineWarningWrapper(
                        offlineMessage:
                            "Está offline, certas funcionalidades podem não funcionar",
                        bannerColor: Colors.orange,
                        textStyle: const TextStyle(
                          color: Colors.white,
                          fontSize: 14.0,
                          fontWeight: FontWeight.bold,
                        ),
                        child: child,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            bottomNavigationBar:
                !hideTopBar ? SafeArea(child: NavigationBarClass()) : null,
          ),
        );
      },
      routes: [
        GoRoute(
          path: '/home',
          name: 'home',
          builder: (context, state) => const HomePage(),
        ),
        GoRoute(
          path: '/search_courses',
          name: 'search_courses',
          builder: (context, state) => ExploreCoursesPage(),
        ),
        GoRoute(
          path: '/settings',
          name: 'settings',
          builder: (context, state) => HomePage(),
        ),
        GoRoute(
          path: '/notifications',
          name: 'notifications',
          builder: (context, state) => NotificationsPage(),
        ),
        GoRoute(
          path: '/forums',
          name: 'forums',
          builder: (context, state) => const ForumsPage(),
        ),
        GoRoute(
          path: '/forum/create',
          name: 'forum_create',
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>?;
            final idtopico = (extra?['idtopico'] ?? '').toString();
            return CreatePostPage(idtopico: idtopico);
          },
        ),
        GoRoute(
          path: '/forum/post/:id',
          name: 'forum_post',
          builder: (context, state) {
            final idStr = state.pathParameters['id'];
            final id = int.tryParse(idStr ?? '');
            if (id != null) return PostDetailsPage(id: id);
            return const Scaffold(body: Center(child: Text('ID inválido')));
          },
        ),
        GoRoute(
          path: '/profile',
          name: 'profile',
          builder: (context, state) => ProfilePage(),
        ),
        GoRoute(
          path: '/course_details/:id',
          name: 'course_details',
          builder: (context, state) {
            final String? idString = state.pathParameters['id'];
            if (idString != null) {
              final int? id = int.tryParse(idString);
              if (id != null) {
                return CourseDetailsPage(id: id);
              }
            }
            return const Scaffold(
              body: Center(
                child: Text('Erro: ID do curso inválido ou ausente.'),
              ),
            );
          },
        ),
      ],
    ),

    GoRoute(
      path: '/:anything',
      builder:
          (context, state) => const Scaffold(
            body: Center(child: Text('Página não encontrada.')),
          ),
    ),
  ],
);
