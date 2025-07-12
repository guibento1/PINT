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
    var db = await openDatabase(
      path,
      version: 4, // Incremented version for new fields/tables
      onCreate: _onCreate,
      onUpgrade: (Database db, int oldVersion, int newVersion) async {
        // Add missing columns and tables if upgrading
        await db.execute(
          'CREATE TABLE IF NOT EXISTS inscricoes('
          'curso INTEGER, '
          'formando INTEGER, '
          'registo TEXT, '
          'PRIMARY KEY(curso, formando), '
          'FOREIGN KEY(curso) REFERENCES cursos(idcurso)'
          ')'
        );
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
          'CREATE TABLE IF NOT EXISTS topicosglobais('
          'idtopico INTEGER PRIMARY KEY, '
          'idarea INTEGER, '
          'designacao TEXT, '
          'FOREIGN KEY(idarea) REFERENCES areas(idarea)'
          ')'
        );
        // Add new columns if missing
        await db.execute("CREATE INDEX IF NOT EXISTS idx_cursos_idcategoria ON cursos(idcategoria);");
        await db.execute("CREATE INDEX IF NOT EXISTS idx_cursos_nome ON cursos(nome);");
        // Notification subscriptions table
        await db.execute(
          'CREATE TABLE IF NOT EXISTS notificacoes_subscritas('
          'id INTEGER PRIMARY KEY AUTOINCREMENT, '
          'idutilizador INTEGER, '
          'idcanal INTEGER, '
          'data_subscricao TEXT'
          ')'
        );
        await db.execute(
          'CREATE TABLE IF NOT EXISTS licoes('
          'idlicao INTEGER PRIMARY KEY, '
          'idcurso INTEGER, '
          'titulo TEXT, '
          'descricao TEXT, '
          'ordem INTEGER, '
          'FOREIGN KEY(idcurso) REFERENCES cursos(idcurso)'
          ')'
        );
        await db.execute(
          'CREATE TABLE IF NOT EXISTS materiais('
          'idmaterial INTEGER PRIMARY KEY, '
          'idlicao INTEGER, '
          'titulo TEXT, '
          'referencia TEXT, '
          'tipo INTEGER, '
          'criador INTEGER, '
          'FOREIGN KEY(idlicao) REFERENCES licoes(idlicao)'
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
      'CREATE TABLE perfil('
      'idutilizador INTEGER PRIMARY KEY, '
      'nome TEXT, '
      'email TEXT, '
      'foto TEXT, '
      'telefone TEXT, '
      'morada TEXT'
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
      'CREATE TABLE IF NOT EXISTS notificacoes_subscritas('
      'id INTEGER PRIMARY KEY AUTOINCREMENT, '
      'idutilizador INTEGER, '
      'idcanal INTEGER, '
      'data_subscricao TEXT'
      ')'
    );
    await db.execute("CREATE INDEX IF NOT EXISTS idx_cursos_idcategoria ON cursos(idcategoria);");
    await db.execute("CREATE INDEX IF NOT EXISTS idx_cursos_nome ON cursos(nome);");
  }

  // Upsert for perfil
  Future<void> upsertPerfil(Map<String, dynamic> perfil) async {
    var dbClient = await db;
    await dbClient.insert(
      'perfil',
      perfil,
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  // Upsert for curso
  Future<void> upsertCurso(Map<String, dynamic> curso) async {
    var dbClient = await db;
    await dbClient.insert(
      'cursos',
      curso,
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  // Update curso
  Future<int> updateCurso(int idcurso, Map<String, dynamic> values) async {
    var dbClient = await db;
    return await dbClient.update('cursos', values, where: 'idcurso = ?', whereArgs: [idcurso]);
  }

  // Delete curso
  Future<int> deleteCurso(int idcurso) async {
    var dbClient = await db;
    return await dbClient.delete('cursos', where: 'idcurso = ?', whereArgs: [idcurso]);
  }

  // Save notification subscription
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

  // Remove notification subscription
  Future<void> removeNotificationSubscription(int idutilizador, int idcanal) async {
    var dbClient = await db;
    await dbClient.delete(
      'notificacoes_subscritas',
      where: 'idutilizador = ? AND idcanal = ?',
      whereArgs: [idutilizador, idcanal],
    );
  }

  // List notification subscriptions for user
  Future<List<Map<String, dynamic>>> listarNotificacoesSubscritas(int idutilizador) async {
    var dbClient = await db;
    return await dbClient.query('notificacoes_subscritas', where: 'idutilizador = ?', whereArgs: [idutilizador]);
  }

  // Métodos para cursos
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

  // Sincroniza cursos da API para a base de dados local (upsert)
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

  // Listar cursos com filtros locais
  Future<List<Map<String, dynamic>>> listarCursosFiltrado({String? search, String? categoria, String? area, String? topico}) async {
    var dbClient = await db;
    String where = '';
    List<dynamic> whereArgs = [];
    if (search != null && search.isNotEmpty) {
      where += '(nome LIKE ? OR planocurricular LIKE ?)';
      whereArgs.add('%$search%');
      whereArgs.add('%$search%');
    }
    if (categoria != null && categoria.isNotEmpty) {
      if (where.isNotEmpty) where += ' AND ';
      where += 'idcategoria = ?';
      whereArgs.add(int.tryParse(categoria) ?? categoria);
    }
    // area/topico: add logic if you store these in cursos or via join
    return await dbClient.query('cursos', where: where.isNotEmpty ? where : null, whereArgs: whereArgs);
  }

  // Métodos para tópicos
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

  // Métodos para perfil
  Future<int> guardarPerfil(Map<String, dynamic> perfil) async {
    var dbClient = await db;
    return await dbClient.rawInsert(
      'INSERT INTO perfil (idutilizador, nome, email, foto, telefone, morada) VALUES (?, ?, ?, ?, ?, ?)',
      [
        perfil['idutilizador'],
        perfil['nome'],
        perfil['email'],
        perfil['foto'],
        perfil['telefone'],
        perfil['morada'],
      ],
    );
  }
  Future<Map<String, dynamic>?> obterPerfil(int idutilizador) async {
    var dbClient = await db;
    var result = await dbClient.query('perfil', where: 'idutilizador = ?', whereArgs: [idutilizador]);
    if (result.isNotEmpty) {
      return result.first;
    }
    return null;
  }

  // Guardar inscrições do utilizador
  Future<void> syncInscricoesFromApi(List<Map<String, dynamic>> inscricoes) async {
    var dbClient = await db;
    // Limpa inscrições antigas (opcional: só do utilizador atual)
    await dbClient.delete('inscricoes');
    final batch = dbClient.batch();
    for (final inscricao in inscricoes) {
      batch.insert(
        'inscricoes',
        {
          'curso': inscricao['idcurso'],
          'formando': inscricao['idformando'],
          'registo': inscricao['registo'],
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }

  // Listar cursos inscritos (join com cursos)
  Future<List<Map<String, dynamic>>> listarCursosInscritos() async {
    var dbClient = await db;
    return await dbClient.rawQuery('''
      SELECT c.* FROM cursos c
      INNER JOIN inscricoes i ON c.idcurso = i.curso
    ''');
  }

  // --- Métodos para Categorias ---
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

  // --- Métodos para Áreas ---
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

  // --- Métodos para Tópicos Globais ---
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
    if (inscricoes is List) await syncInscricoesFromApi(List<Map<String, dynamic>>.from(inscricoes));
  }
}