import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';

import 'views/course_details_page.dart';
import 'views/explore_courses_page.dart';
import 'views/home_page.dart';
import 'views/login_page.dart';
import 'views/profile_page.dart';

import 'backend/shared_preferences.dart' as my_prefs;

import 'components/navigation_bar.dart';
import 'components/top_headr_bar.dart'; // Assuming this is your AppBar-like widget

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
      builder: (context, state) => LoginPage(), // No TopHeaderBar here
    ),

    // ShellRoute for authenticated routes with shared layout
    ShellRoute(
      builder: (context, state, child) {
        // Get the current route's URI to determine if TopHeaderBar should be shown
        // state.uri gives you the full URI of the current location
        final String currentPath = state.uri.path;

        // Define routes where TopHeaderBar (and possibly NavigationBar) should NOT appear
        final bool hideTopBar = currentPath == '/course_details' || currentPath.startsWith('/course_details/');
        // You can add more conditions here: || currentPath == '/another_route_without_topbar'

        return Scaffold(
          body: SafeArea(
            child: Column(
              children: [
                // Conditionally render TopHeaderBar
                if (!hideTopBar) const TopHeaderBar(), // Only show if hideTopBar is false
                Expanded(
                  child: child, // This is the actual page content
                ),
              ],
            ),
          ),
          // Conditionally render NavigationBarClass if it also needs to be hidden on specific routes
          bottomNavigationBar: !hideTopBar ? NavigationBarClass() : null, // Assuming NavigationBarClass is a StatelessWidget
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
          path: '/groups',
          name: 'groups',
          builder: (context, state) => const Placeholder(child: Center(child: Text('Grupos Page'))),
        ),
        GoRoute(
          path: '/notifications',
          name: 'notifications',
          builder: (context, state) => const Placeholder(child: Center(child: Text('Notificações Page'))),
        ),
        GoRoute(
          path: '/profile',
          name: 'profile',
          builder: (context, state) => ProfilePage(),
        ),
        GoRoute(
          path: '/course_details/:id', // This route should NOT have TopHeaderBar
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
      builder: (context, state) => const Scaffold(
        body: Center(
          child: Text('Página não encontrada.'),
        ),
      ),
    ),
  ],
);