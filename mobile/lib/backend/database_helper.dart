import 'package:sqflite/sqflite.dart';
import 'server.dart';

class DatabaseHelper {

  static final DatabaseHelper _instance = DatabaseHelper.internal();
  factory DatabaseHelper() => _instance;
  static Database? _db;
  Future<Database> get db async {
    if (_db != null) return _db!;
    _db = await initDb();
    return _db!;
  }
  DatabaseHelper.internal();
  initDb() async {
    String path = await getDatabasesPath() + 'appdata.db';
    print("[DB] Path da Base de Dados: $path");
    var db = await openDatabase(
      path,
      version: 4,
      onCreate: _onCreate,
      onUpgrade: (Database db, int oldVersion, int newVersion) async {

        await db.execute(
          'CREATE TABLE IF NOT EXISTS categorias('
          'idcategoria INTEGER PRIMARY KEY, '
          'designacao TEXT'
          ')'
        );

        await db.execute(
          'CREATE TABLE IF NOT EXISTS areas('
          'idarea INTEGER PRIMARY KEY, '
          'idcategoria INTEGER, '
          'designacao TEXT, '
          'FOREIGN KEY(idcategoria) REFERENCES categorias(idcategoria)'
          ')'
        );

        await db.execute(
          'CREATE TABLE IF NOT EXISTS topicos('
          'idtopico INTEGER PRIMARY KEY, '
          'idarea INTEGER, '
          'designacao TEXT, '
          'FOREIGN KEY(idarea) REFERENCES areas(idarea)'
          ')'
        );
        await db.execute(
          'CREATE TABLE IF NOT EXISTS utilizadores('
          'idutilizador INTEGER PRIMARY KEY, '
          'nome TEXT, '
          'email TEXT, '
          'foto TEXT, '
          'telefone TEXT, '
          'morada TEXT, '
          'ativo INTEGER, '
          'dataregisto TEXT'
          ')'
        );
        await db.execute(
          'CREATE TABLE IF NOT EXISTS utilizador_cursos('
          'idutilizador INTEGER, '
          'idcurso INTEGER, '
          'PRIMARY KEY(idutilizador, idcurso), '
          'FOREIGN KEY(idutilizador) REFERENCES utilizadores(idutilizador) ON DELETE CASCADE, '
          'FOREIGN KEY(idcurso) REFERENCES cursos(idcurso) ON DELETE CASCADE'
          ')'
        );
        await db.execute(
          'CREATE TABLE IF NOT EXISTS notificacoes_subscritas('
          'idutilizador INTEGER, '
          'idcanal INTEGER, '
          'data_subscricao TEXT, '
          'PRIMARY KEY(idutilizador, idcanal)'
          ')'
        );
      },
    );
    return db;
  }

  void _onCreate(Database db, int newVersion) async {
    await db.execute(
      'CREATE TABLE cursos('
      'idcurso INTEGER PRIMARY KEY, '
      'nome TEXT, '
      'disponivel INTEGER, '
      'iniciodeinscricoes TEXT, '
      'fimdeinscricoes TEXT, '
      'maxinscricoes INTEGER, '
      'thumbnail TEXT, '
      'sincrono INTEGER, '
      'inscrito INTEGER, '
      'canal INTEGER, '
      'planocurricular TEXT, '
      'idcategoria INTEGER'
      ')'
    );
    await db.execute(
      'CREATE TABLE topicos('
      'idtopico INTEGER PRIMARY KEY, '
      'idcurso INTEGER, '
      'designacao TEXT, '
      'FOREIGN KEY(idcurso) REFERENCES cursos(idcurso)'
      ')'
    );
    await db.execute(
      'CREATE TABLE utilizadores('
      'idutilizador INTEGER PRIMARY KEY, '
      'nome TEXT, '
      'email TEXT, '
      'foto TEXT, '
      'telefone TEXT, '
      'morada TEXT, '
      'ativo INTEGER, '
      'dataregisto TEXT'
      ')'
    );
    await db.execute(
      'CREATE TABLE inscricoes('
      'curso INTEGER, '
      'formando INTEGER, '
      'registo TEXT, '
      'PRIMARY KEY(curso, formando), '
      'FOREIGN KEY(curso) REFERENCES cursos(idcurso)'
      ')'
    );
    await db.execute(
      'CREATE TABLE categorias('
      'idcategoria INTEGER PRIMARY KEY, '
      'designacao TEXT'
      ')'
    );
    await db.execute(
      'CREATE TABLE areas('
      'idarea INTEGER PRIMARY KEY, '
      'idcategoria INTEGER, '
      'designacao TEXT, '
      'FOREIGN KEY(idcategoria) REFERENCES categorias(idcategoria)'
      ')'
    );
    await db.execute(
      'CREATE TABLE topicosglobais('
      'idtopico INTEGER PRIMARY KEY, '
      'idarea INTEGER, '
      'designacao TEXT, '
      'FOREIGN KEY(idarea) REFERENCES areas(idarea)'
      ')'
    );
    await db.execute(
      'CREATE TABLE licoes('
      'idlicao INTEGER PRIMARY KEY, '
      'idcurso INTEGER, '
      'titulo TEXT, '
      'descricao TEXT, '
      'ordem INTEGER, '
      'FOREIGN KEY(idcurso) REFERENCES cursos(idcurso)'
      ')'
    );
    await db.execute(
      'CREATE TABLE materiais('
      'idmaterial INTEGER PRIMARY KEY, '
      'idlicao INTEGER, '
      'titulo TEXT, '
      'referencia TEXT, '
      'tipo INTEGER, '
      'criador INTEGER, '
      'FOREIGN KEY(idlicao) REFERENCES licoes(idlicao)'
      ')'
    );
    await db.execute(
      'CREATE TABLE IF NOT EXISTS utilizador_cursos('
      'idutilizador INTEGER, '
      'idcurso INTEGER, '
      'PRIMARY KEY(idutilizador, idcurso), '
      'FOREIGN KEY(idutilizador) REFERENCES utilizadores(idutilizador) ON DELETE CASCADE, '
      'FOREIGN KEY(idcurso) REFERENCES cursos(idcurso) ON DELETE CASCADE'
      ')'
    );
    await db.execute(
      'CREATE TABLE IF NOT EXISTS notificacoes_subscritas('
      'idutilizador INTEGER, '
      'idcanal INTEGER, '
      'data_subscricao TEXT, '
      'PRIMARY KEY(idutilizador, idcanal)'
      ')'
    );
    await db.execute("CREATE INDEX IF NOT EXISTS idx_cursos_idcategoria ON cursos(idcategoria);");
    await db.execute("CREATE INDEX IF NOT EXISTS idx_cursos_nome ON cursos(nome);");
  }

  // --- Métodos para Utilizadores ---

  Future<void> upsertUtilizador(Map<String, dynamic> utilizador) async {
    final dbClient = await db;
    print("[DB] A fazer upsert do utilizador: ${utilizador['idutilizador']}");

    final userMap = Map<String, dynamic>.from(utilizador);
    userMap.remove('roles');

    Map<String, dynamic> utilizadorData = {
      'idutilizador': userMap['idutilizador'],
      'nome': userMap['nome'],
      'email': userMap['email'],
      'foto': userMap['foto'],
      'telefone': userMap['telefone'],
      'morada': userMap['morada'],
      'ativo': userMap['ativo'] == true ? 1 : 0,
      'dataregisto': userMap['dataregisto'],
    };

    await dbClient.insert('utilizadores', utilizadorData, conflictAlgorithm: ConflictAlgorithm.replace);
    print("[DB] Utilizador ${utilizador['idutilizador']} inserido/atualizado.");
  }

  Future<Map<String, dynamic>?> getUtilizador(int idutilizador) async {
    final dbClient = await db;
    print("[DB] A obter utilizador com ID: $idutilizador");
    final List<Map<String, dynamic>> maps = await dbClient.query('utilizadores', where: 'idutilizador = ?', whereArgs: [idutilizador]);

    if (maps.isNotEmpty) {
      print("[DB] Utilizador encontrado: $idutilizador");
      var user = Map<String, dynamic>.from(maps.first);
      user['ativo'] = user['ativo'] == 1;
      return user;
    }
    print("[DB] Utilizador não encontrado na DB local: $idutilizador");
    return null;
  }

  Future<void> deleteUtilizador(int idutilizador) async {
    final dbClient = await db;
    await dbClient.delete('utilizadores', where: 'idutilizador = ?', whereArgs: [idutilizador]);
  }

  Future<Map<String, dynamic>?> getCurso(int idcurso) async {
    final dbClient = await db;
    print("[DB] A obter curso com ID: $idcurso");
    final List<Map<String, dynamic>> maps = await dbClient.query('cursos', where: 'idcurso = ?', whereArgs: [idcurso]);

    if (maps.isNotEmpty) {
      print("[DB] Curso encontrado: $idcurso");
      var curso = Map<String, dynamic>.from(maps.first);
      curso['disponivel'] = curso['disponivel'] == 1;
      curso['sincrono'] = curso['sincrono'] == 1;
      curso['inscrito'] = curso['inscrito'] == 1;
      final topicos = await listarTopicosDoCurso(idcurso);
      curso['topicos'] = topicos;
      final licoes = await listarLicoesDoCurso(idcurso);
      for (var licao in licoes) {
        final materiais = await listarMateriaisDaLicao(licao['idlicao']);
        licao['materiais'] = materiais;
      }
      curso['licoes'] = licoes;
      return curso;
    }
    print("[DB] Curso não encontrado na DB local: $idcurso");
    return null;
  }

  Future<void> upsertPerfil(Map<String, dynamic> perfil) async {
    var dbClient = await db;
    await dbClient.insert(
      'utilizadores',
      perfil,
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> upsertCurso(Map<String, dynamic> curso) async {
    var dbClient = await db;
    await dbClient.insert(
      'cursos',
      curso,
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<int> updateCurso(int idcurso, Map<String, dynamic> values) async {
    var dbClient = await db;
    return await dbClient.update('cursos', values, where: 'idcurso = ?', whereArgs: [idcurso]);
  }

  Future<int> deleteCurso(int idcurso) async {
    var dbClient = await db;
    return await dbClient.delete('cursos', where: 'idcurso = ?', whereArgs: [idcurso]);
  }

  Future<void> saveNotificationSubscription(int idutilizador, int idcanal) async {
    var dbClient = await db;
    await dbClient.insert(
      'notificacoes_subscritas',
      {
        'idutilizador': idutilizador,
        'idcanal': idcanal,
        'data_subscricao': DateTime.now().toIso8601String(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<int> guardarCurso(Map<String, dynamic> curso) async {
    var dbClient = await db;
    return await dbClient.rawInsert(
      'INSERT INTO cursos (idcurso, nome, disponivel, iniciodeinscricoes, fimdeinscricoes, maxinscricoes, thumbnail, sincrono, inscrito, canal, planocurricular) '
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        curso['idcurso'],
        curso['nome'],
        curso['disponivel'],
        curso['iniciodeinscricoes'],
        curso['fimdeinscricoes'],
        curso['maxinscricoes'],
        curso['thumbnail'],
        curso['sincrono'],
        curso['inscrito'],
        curso['canal'],
        curso['planocurricular'],
      ],
    );
  }
  Future<List<Map<String, dynamic>>> listarCursos() async {
    var dbClient = await db;
    return await dbClient.query('cursos');
  }

  Future<void> syncCursosFromApi(List<Map<String, dynamic>> cursos) async {
    var dbClient = await db;
    final batch = dbClient.batch();
    for (final curso in cursos) {
      print('SYNC CURSO: ' + curso.toString());
      batch.insert(
        'cursos',
        {
          'idcurso': curso['idcurso'],
          'nome': curso['nome'],
          'disponivel': curso['disponivel'] == true ? 1 : 0,
          'iniciodeinscricoes': curso['iniciodeinscricoes'],
          'fimdeinscricoes': curso['fimdeinscricoes'],
          'maxinscricoes': curso['maxinscricoes'],
          'thumbnail': curso['thumbnail'],
          'sincrono': curso['sincrono'] == true ? 1 : 0,
          'inscrito': curso['inscrito'] == true ? 1 : 0,
          'canal': curso['canal'],
          'planocurricular': curso['planocurricular'],
          'idcategoria': curso['idcategoria'],
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }

  Future<int> guardarTopico(Map<String, dynamic> topico) async {
    var dbClient = await db;
    return await dbClient.rawInsert(
      'INSERT INTO topicos (idtopico, idcurso, designacao) VALUES (?, ?, ?)',
      [
        topico['idtopico'],
        topico['idcurso'],
        topico['designacao'],
      ],
    );
  }

  Future<List<Map<String, dynamic>>> listarTopicosDoCurso(int idcurso) async {
    var dbClient = await db;
    return await dbClient.query('topicos', where: 'idcurso = ?', whereArgs: [idcurso]);
  }

  Future<void> syncInscricoesFromApi(int userId, List<Map<String, dynamic>> inscricoes) async {
    var dbClient = await db;
    print("[DB] A sincronizar ${inscricoes.length} inscrições para o utilizador $userId");
    await dbClient.delete('utilizador_cursos', where: 'idutilizador = ?', whereArgs: [userId]);
    final batch = dbClient.batch();
    for (final inscricao in inscricoes) {
      batch.insert(
        'utilizador_cursos',
        {
          'idutilizador': userId,
          'idcurso': inscricao['idcurso'],
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }

  Future<List<Map<String, dynamic>>> listarCursosInscritos(int userId) async {
    var dbClient = await db;
    print("[DB] A listar cursos inscritos para o utilizador $userId a partir da DB local");
    return await dbClient.rawQuery('''
      SELECT c.* FROM cursos c
      INNER JOIN utilizador_cursos uc ON c.idcurso = uc.idcurso
      WHERE uc.idutilizador = ?
    ''', [userId]);
  }

  Future<void> syncCategoriasFromApi(List<Map<String, dynamic>> categorias) async {
    var dbClient = await db;
    await dbClient.delete('categorias');
    final batch = dbClient.batch();
    for (final cat in categorias) {
      print('SYNC CATEGORIA: ' + cat.toString());
      batch.insert(
        'categorias',
        {
          'idcategoria': cat['idcategoria'],
          'designacao': cat['designacao'],
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }
  Future<List<Map<String, dynamic>>> listarCategorias() async {
    var dbClient = await db;
    return await dbClient.query('categorias');
  }

  Future<void> syncAreasFromApi(List<Map<String, dynamic>> areas) async {
    var dbClient = await db;
    await dbClient.delete('areas');
    final batch = dbClient.batch();
    for (final area in areas) {
      print('SYNC AREA: ' + area.toString());
      batch.insert(
        'areas',
        {
          'idarea': area['idarea'],
          'idcategoria': area['idcategoria'],
          'designacao': area['designacao'],
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }
  Future<List<Map<String, dynamic>>> listarAreas({int? idCategoria}) async {
    var dbClient = await db;
    if (idCategoria != null) {
      return await dbClient.query('areas', where: 'idcategoria = ?', whereArgs: [idCategoria]);
    }
    return await dbClient.query('areas');
  }
  
  Future<void> syncTopicosGlobaisFromApi(List<Map<String, dynamic>> topicos) async {
    var dbClient = await db;
    await dbClient.delete('topicosglobais');
    final batch = dbClient.batch();
    for (final topico in topicos) {
      print('SYNC TOPICO GLOBAL: ' + topico.toString());
      batch.insert(
        'topicosglobais',
        {
          'idtopico': topico['idtopico'],
          'idarea': topico['idarea'],
          'designacao': topico['designacao'],
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }
  Future<List<Map<String, dynamic>>> listarTopicosGlobais({int? idArea}) async {
    var dbClient = await db;
    if (idArea != null) {
      return await dbClient.query('topicosglobais', where: 'idarea = ?', whereArgs: [idArea]);
    }
    return await dbClient.query('topicosglobais');
  }

  // --- Métodos para Licoes ---
  Future<void> syncLicoesFromApi(List<Map<String, dynamic>> licoes) async {
    var dbClient = await db;
    await dbClient.delete('licoes');
    final batch = dbClient.batch();
    for (final licao in licoes) {
      print('SYNC LICAO: ' + licao.toString());
      batch.insert(
        'licoes',
        {
          'idlicao': licao['idlicao'],
          'idcurso': licao['idcurso'],
          'titulo': licao['titulo'],
          'descricao': licao['descricao'],
          'ordem': licao['ordem'],
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }
  Future<List<Map<String, dynamic>>> listarLicoesDoCurso(int idcurso) async {
    var dbClient = await db;
    return await dbClient.query('licoes', where: 'idcurso = ?', whereArgs: [idcurso], orderBy: 'ordem ASC');
  }

  // --- Métodos para Materiais ---
  Future<void> syncMateriaisFromApi(List<Map<String, dynamic>> materiais) async {
    var dbClient = await db;
    await dbClient.delete('materiais');
    final batch = dbClient.batch();
    for (final material in materiais) {
      print('SYNC MATERIAL: ' + material.toString());
      batch.insert(
        'materiais',
        {
          'idmaterial': material['idmaterial'],
          'idlicao': material['idlicao'],
          'titulo': material['titulo'],
          'referencia': material['referencia'],
          'tipo': material['tipo'],
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }
  Future<List<Map<String, dynamic>>> listarMateriaisDaLicao(int idlicao) async {
    var dbClient = await db;
    return await dbClient.query('materiais', where: 'idlicao = ?', whereArgs: [idlicao]);
  }

  // Sincroniza todos os dados essenciais da API para a base local
  Future<void> syncAllFromApi(Servidor servidor, int userId) async {
    print("[DB] A iniciar sincronização completa a partir da API para o utilizador $userId...");
    // Cursos
    final cursos = await servidor.getData('curso/list');
    print('SYNCALL: cursos: ' + cursos.toString());
    if (cursos is List) await syncCursosFromApi(List<Map<String, dynamic>>.from(cursos));
    // Licoes
    final licoes = await servidor.getData('licao/list');
    print('SYNCALL: licoes: ' + licoes.toString());
    if (licoes is List) await syncLicoesFromApi(List<Map<String, dynamic>>.from(licoes));
    // Materiais
    final materiais = await servidor.getData('material/list');
    print('SYNCALL: materiais: ' + materiais.toString());
    if (materiais is List) {
      await syncMateriaisFromApi(
        materiais.map((e) => Map<String, dynamic>.from(e as Map)).toList()
      );
    }
    // Perfil do utilizador
    final perfil = await servidor.getData('utilizador/id/$userId');
    if (perfil is Map) await upsertUtilizador(Map<String, dynamic>.from(perfil));
    // Categorias
    final categorias = await servidor.getData('categoria/list');
    if (categorias is List) await syncCategoriasFromApi(List<Map<String, dynamic>>.from(categorias));
    // Areas
    final areas = await servidor.getData('area/list');
    if (areas is List) await syncAreasFromApi(List<Map<String, dynamic>>.from(areas));
    // Topicos globais
    final topicos = await servidor.getData('topico/list');
    if (topicos is List) await syncTopicosGlobaisFromApi(List<Map<String, dynamic>>.from(topicos));
    // Inscricoes do utilizador
    final inscricoes = await servidor.getData('curso/inscricoes/utilizador/$userId');
    if (inscricoes is List) await syncInscricoesFromApi(userId, List<Map<String, dynamic>>.from(inscricoes));
    print("[DB] Sincronização completa terminada.");
  }
}
