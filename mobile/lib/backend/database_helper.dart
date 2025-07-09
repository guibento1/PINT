import 'package:sqflite/sqflite.dart';
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
    var db = await openDatabase(path, version: 1, onCreate: _onCreate);
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
      'planocurricular TEXT'
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
}