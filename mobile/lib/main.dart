import 'package:flutter/material.dart';
import 'package:mobile/routes.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'backend/notifications_service.dart';
import 'backend/shared_preferences.dart' as my_prefs;

void main() async {

  try {

    WidgetsFlutterBinding.ensureInitialized();

    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );

    await NotificationService().setupListeners();
    await my_prefs.setGoogleServices();

  } catch (e) {
    print('ERRO AO INICIALIZAR A APP: $e');
  }

  runApp(const MyApp());

}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Projeto Prático PDM',
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFFF6F9FB),
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFF6F9FB)),
        fontFamily: 'ADLaMDisplay',
      ),
      debugShowCheckedModeBanner: false,
      routerConfig: rotas,
    );
  }
}
