import 'package:flutter/material.dart';
import 'package:mobile/routes.dart'; // Mantém as tuas rotas

// Imports do Firebase
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

// Se tiveres um serviço de API, importa-o aqui. Exemplo:
// import 'package:mobile/services/api_service.dart';

void main() async {
  try {
    // Garante que o Flutter está pronto
    WidgetsFlutterBinding.ensureInitialized();

    // ===================================================================
    // AQUI PODES INICIALIZAR OS TEUS OUTROS SERVIÇOS
    // Se tiveres uma classe para a tua API, inicializa-a aqui primeiro.
    // Exemplo: await ApiService.init();
    // ===================================================================

    // Depois, inicializa o Firebase.
    // A app vai esperar aqui até o Firebase estar pronto.
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );

    // Só depois de TUDO estar inicializado é que a app corre.
    runApp(const MyApp());

  } catch (e) {
    // Se alguma das inicializações falhar, podes ver o erro aqui
    // em vez de a app simplesmente bloquear.
    print('ERRO AO INICIALIZAR A APP: $e');
    // Opcionalmente, podes mostrar um ecrã de erro
    // runApp(ErrorApp(error: e.toString()));
  }
}

// O resto do teu código (MyApp, etc.) permanece igual.
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Projeto Prático PDM',
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFFF6F9FB),
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFF6F9FB)),
      ),
      debugShowCheckedModeBanner: false,
      routerConfig: rotas,
    );
  }
}
