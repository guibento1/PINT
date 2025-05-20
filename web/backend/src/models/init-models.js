var DataTypes = require("sequelize").DataTypes;
var _admin = require("./admin");
var _area = require("./area");
var _avaliacaocontinua = require("./avaliacaocontinua");
var _avaliacaofinal = require("./avaliacaofinal");
var _canaisutilizadores = require("./canaisutilizadores");
var _canalnotificacoes = require("./canalnotificacoes");
var _categoria = require("./categoria");
var _comentario = require("./comentario");
var _curso = require("./curso");
var _cursoassincrono = require("./cursoassincrono");
var _cursosincrono = require("./cursosincrono");
var _cursotopico = require("./cursotopico");
var _denuncia = require("./denuncia");
var _denunciacomentario = require("./denunciacomentario");
var _denunciapost = require("./denunciapost");
var _formador = require("./formador");
var _formando = require("./formando");
var _inscricao = require("./inscricao");
var _licao = require("./licao");
var _licaomaterial = require("./licaomaterial");
var _material = require("./material");
var _notificacao = require("./notificacao");
var _notificacaogeral = require("./notificacaogeral");
var _notificacaopessoal = require("./notificacaopessoal");
var _post = require("./post");
var _respostacomentario = require("./respostacomentario");
var _respostapost = require("./respostapost");
var _sessao = require("./sessao");
var _submissao = require("./submissao");
var _tipodenuncia = require("./tipodenuncia");
var _tipomaterial = require("./tipomaterial");
var _topico = require("./topico");
var _topicoarea = require("./topicoarea");
var _utilizadores = require("./utilizadores");

function initModels(sequelize) {
  var admin = _admin(sequelize, DataTypes);
  var area = _area(sequelize, DataTypes);
  var avaliacaocontinua = _avaliacaocontinua(sequelize, DataTypes);
  var avaliacaofinal = _avaliacaofinal(sequelize, DataTypes);
  var canaisutilizadores = _canaisutilizadores(sequelize, DataTypes);
  var canalnotificacoes = _canalnotificacoes(sequelize, DataTypes);
  var categoria = _categoria(sequelize, DataTypes);
  var comentario = _comentario(sequelize, DataTypes);
  var curso = _curso(sequelize, DataTypes);
  var cursoassincrono = _cursoassincrono(sequelize, DataTypes);
  var cursosincrono = _cursosincrono(sequelize, DataTypes);
  var cursotopico = _cursotopico(sequelize, DataTypes);
  var denuncia = _denuncia(sequelize, DataTypes);
  var denunciacomentario = _denunciacomentario(sequelize, DataTypes);
  var denunciapost = _denunciapost(sequelize, DataTypes);
  var formador = _formador(sequelize, DataTypes);
  var formando = _formando(sequelize, DataTypes);
  var inscricao = _inscricao(sequelize, DataTypes);
  var licao = _licao(sequelize, DataTypes);
  var licaomaterial = _licaomaterial(sequelize, DataTypes);
  var material = _material(sequelize, DataTypes);
  var notificacao = _notificacao(sequelize, DataTypes);
  var notificacaogeral = _notificacaogeral(sequelize, DataTypes);
  var notificacaopessoal = _notificacaopessoal(sequelize, DataTypes);
  var post = _post(sequelize, DataTypes);
  var respostacomentario = _respostacomentario(sequelize, DataTypes);
  var respostapost = _respostapost(sequelize, DataTypes);
  var sessao = _sessao(sequelize, DataTypes);
  var submissao = _submissao(sequelize, DataTypes);
  var tipodenuncia = _tipodenuncia(sequelize, DataTypes);
  var tipomaterial = _tipomaterial(sequelize, DataTypes);
  var topico = _topico(sequelize, DataTypes);
  var topicoarea = _topicoarea(sequelize, DataTypes);
  var utilizadores = _utilizadores(sequelize, DataTypes);

  area.belongsToMany(topico, { as: 'topico_topico_topicoareas', through: topicoarea, foreignKey: "area", otherKey: "topico" });
  avaliacaocontinua.belongsToMany(avaliacaocontinua, { as: 'cursosincrono_avaliacaocontinuas', through: submissao, foreignKey: "avaliacaocontinua", otherKey: "cursosincrono" });
  avaliacaocontinua.belongsToMany(avaliacaocontinua, { as: 'avaliacaocontinua_avaliacaocontinuas', through: submissao, foreignKey: "cursosincrono", otherKey: "avaliacaocontinua" });
  canalnotificacoes.belongsToMany(notificacao, { as: 'idnotificacao_notificacaos', through: notificacaogeral, foreignKey: "canal", otherKey: "idnotificacao" });
  curso.belongsToMany(formando, { as: 'formando_formandos', through: inscricao, foreignKey: "curso", otherKey: "formando" });
  curso.belongsToMany(topico, { as: 'topico_topicos', through: cursotopico, foreignKey: "curso", otherKey: "topico" });
  cursosincrono.belongsToMany(licao, { as: 'licao_licaos', through: sessao, foreignKey: "cursosincrono", otherKey: "licao" });
  formando.belongsToMany(curso, { as: 'curso_curso_inscricaos', through: inscricao, foreignKey: "formando", otherKey: "curso" });
  licao.belongsToMany(cursosincrono, { as: 'cursosincrono_cursosincronos', through: sessao, foreignKey: "licao", otherKey: "cursosincrono" });
  notificacao.belongsToMany(canalnotificacoes, { as: 'canal_canalnotificacos', through: notificacaogeral, foreignKey: "idnotificacao", otherKey: "canal" });
  notificacao.belongsToMany(utilizadores, { as: 'utilizador_utilizadores', through: notificacaopessoal, foreignKey: "idnotificacao", otherKey: "utilizador" });
  topico.belongsToMany(area, { as: 'area_areas', through: topicoarea, foreignKey: "topico", otherKey: "area" });
  topico.belongsToMany(curso, { as: 'curso_cursos', through: cursotopico, foreignKey: "topico", otherKey: "curso" });
  utilizadores.belongsToMany(notificacao, { as: 'idnotificacao_notificacao_notificacaopessoals', through: notificacaopessoal, foreignKey: "utilizador", otherKey: "idnotificacao" });
  topicoarea.belongsTo(area, { as: "area_area", foreignKey: "area"});
  area.hasMany(topicoarea, { as: "topicoareas", foreignKey: "area"});
  submissao.belongsTo(avaliacaocontinua, { as: "avaliacaocontinua_avaliacaocontinua", foreignKey: "avaliacaocontinua"});
  avaliacaocontinua.hasMany(submissao, { as: "submissaos", foreignKey: "avaliacaocontinua"});
  submissao.belongsTo(avaliacaocontinua, { as: "cursosincrono_avaliacaocontinua", foreignKey: "cursosincrono"});
  avaliacaocontinua.hasMany(submissao, { as: "cursosincrono_submissaos", foreignKey: "cursosincrono"});
  curso.belongsTo(canalnotificacoes, { as: "canal_canalnotificaco", foreignKey: "canal"});
  canalnotificacoes.hasMany(curso, { as: "cursos", foreignKey: "canal"});
  notificacaogeral.belongsTo(canalnotificacoes, { as: "canal_canalnotificaco", foreignKey: "canal"});
  canalnotificacoes.hasMany(notificacaogeral, { as: "notificacaogerals", foreignKey: "canal"});
  area.belongsTo(categoria, { as: "categoria_categorium", foreignKey: "categoria"});
  categoria.hasMany(area, { as: "areas", foreignKey: "categoria"});
  denunciacomentario.belongsTo(comentario, { as: "comentario_comentario", foreignKey: "comentario"});
  comentario.hasMany(denunciacomentario, { as: "denunciacomentarios", foreignKey: "comentario"});
  respostacomentario.belongsTo(comentario, { as: "comentario_comentario", foreignKey: "comentario"});
  comentario.hasMany(respostacomentario, { as: "respostacomentarios", foreignKey: "comentario"});
  cursoassincrono.belongsTo(curso, { as: "curso_curso", foreignKey: "curso"});
  curso.hasMany(cursoassincrono, { as: "cursoassincronos", foreignKey: "curso"});
  cursosincrono.belongsTo(curso, { as: "curso_curso", foreignKey: "curso"});
  curso.hasMany(cursosincrono, { as: "cursosincronos", foreignKey: "curso"});
  cursotopico.belongsTo(curso, { as: "curso_curso", foreignKey: "curso"});
  curso.hasMany(cursotopico, { as: "cursotopicos", foreignKey: "curso"});
  inscricao.belongsTo(curso, { as: "curso_curso", foreignKey: "curso"});
  curso.hasMany(inscricao, { as: "inscricaos", foreignKey: "curso"});
  licao.belongsTo(curso, { as: "curso_curso", foreignKey: "curso"});
  curso.hasMany(licao, { as: "licaos", foreignKey: "curso"});
  avaliacaocontinua.belongsTo(cursosincrono, { as: "cursosincrono_cursosincrono", foreignKey: "cursosincrono"});
  cursosincrono.hasMany(avaliacaocontinua, { as: "avaliacaocontinuas", foreignKey: "cursosincrono"});
  avaliacaofinal.belongsTo(cursosincrono, { as: "cursosincrono_cursosincrono", foreignKey: "cursosincrono"});
  cursosincrono.hasMany(avaliacaofinal, { as: "avaliacaofinals", foreignKey: "cursosincrono"});
  sessao.belongsTo(cursosincrono, { as: "cursosincrono_cursosincrono", foreignKey: "cursosincrono"});
  cursosincrono.hasMany(sessao, { as: "sessaos", foreignKey: "cursosincrono"});
  denunciacomentario.belongsTo(denuncia, { as: "denuncia_denuncium", foreignKey: "denuncia"});
  denuncia.hasOne(denunciacomentario, { as: "denunciacomentario", foreignKey: "denuncia"});
  denunciapost.belongsTo(denuncia, { as: "denuncia_denuncium", foreignKey: "denuncia"});
  denuncia.hasOne(denunciapost, { as: "denunciapost", foreignKey: "denuncia"});
  cursosincrono.belongsTo(formador, { as: "formador_formador", foreignKey: "formador"});
  formador.hasMany(cursosincrono, { as: "cursosincronos", foreignKey: "formador"});
  avaliacaofinal.belongsTo(formando, { as: "formando_formando", foreignKey: "formando"});
  formando.hasMany(avaliacaofinal, { as: "avaliacaofinals", foreignKey: "formando"});
  inscricao.belongsTo(formando, { as: "formando_formando", foreignKey: "formando"});
  formando.hasMany(inscricao, { as: "inscricaos", foreignKey: "formando"});
  submissao.belongsTo(formando, { as: "formando_formando", foreignKey: "formando"});
  formando.hasMany(submissao, { as: "submissaos", foreignKey: "formando"});
  licaomaterial.belongsTo(licao, { as: "curso_licao", foreignKey: "curso"});
  licao.hasMany(licaomaterial, { as: "licaomaterials", foreignKey: "curso"});
  licaomaterial.belongsTo(licao, { as: "licao_licao", foreignKey: "licao"});
  licao.hasMany(licaomaterial, { as: "licao_licaomaterials", foreignKey: "licao"});
  sessao.belongsTo(licao, { as: "licao_licao", foreignKey: "licao"});
  licao.hasMany(sessao, { as: "sessaos", foreignKey: "licao"});
  avaliacaocontinua.belongsTo(material, { as: "enunciado_material", foreignKey: "enunciado"});
  material.hasMany(avaliacaocontinua, { as: "avaliacaocontinuas", foreignKey: "enunciado"});
  licaomaterial.belongsTo(material, { as: "material_material", foreignKey: "material"});
  material.hasMany(licaomaterial, { as: "licaomaterials", foreignKey: "material"});
  submissao.belongsTo(material, { as: "submissao_material", foreignKey: "submissao"});
  material.hasMany(submissao, { as: "submissaos", foreignKey: "submissao"});
  notificacaogeral.belongsTo(notificacao, { as: "idnotificacao_notificacao", foreignKey: "idnotificacao"});
  notificacao.hasMany(notificacaogeral, { as: "notificacaogerals", foreignKey: "idnotificacao"});
  notificacaopessoal.belongsTo(notificacao, { as: "idnotificacao_notificacao", foreignKey: "idnotificacao"});
  notificacao.hasMany(notificacaopessoal, { as: "notificacaopessoals", foreignKey: "idnotificacao"});
  denunciapost.belongsTo(post, { as: "post_post", foreignKey: "post"});
  post.hasMany(denunciapost, { as: "denunciaposts", foreignKey: "post"});
  respostapost.belongsTo(post, { as: "post_post", foreignKey: "post"});
  post.hasMany(respostapost, { as: "respostaposts", foreignKey: "post"});
  denuncia.belongsTo(tipodenuncia, { as: "tipo_tipodenuncium", foreignKey: "tipo"});
  tipodenuncia.hasMany(denuncia, { as: "denuncia", foreignKey: "tipo"});
  material.belongsTo(tipomaterial, { as: "tipo_tipomaterial", foreignKey: "tipo"});
  tipomaterial.hasMany(material, { as: "materials", foreignKey: "tipo"});
  cursotopico.belongsTo(topico, { as: "topico_topico", foreignKey: "topico"});
  topico.hasMany(cursotopico, { as: "cursotopicos", foreignKey: "topico"});
  post.belongsTo(topico, { as: "topico_topico", foreignKey: "topico"});
  topico.hasMany(post, { as: "posts", foreignKey: "topico"});
  topicoarea.belongsTo(topico, { as: "topico_topico", foreignKey: "topico"});
  topico.hasMany(topicoarea, { as: "topicoareas", foreignKey: "topico"});
  admin.belongsTo(utilizadores, { as: "utilizador_utilizadore", foreignKey: "utilizador"});
  utilizadores.hasMany(admin, { as: "admins", foreignKey: "utilizador"});
  canaisutilizadores.belongsTo(utilizadores, { as: "utilizador_utilizadore", foreignKey: "utilizador"});
  utilizadores.hasMany(canaisutilizadores, { as: "canaisutilizadores", foreignKey: "utilizador"});
  comentario.belongsTo(utilizadores, { as: "utilizador_utilizadore", foreignKey: "utilizador"});
  utilizadores.hasMany(comentario, { as: "comentarios", foreignKey: "utilizador"});
  denuncia.belongsTo(utilizadores, { as: "criador_utilizadore", foreignKey: "criador"});
  utilizadores.hasMany(denuncia, { as: "denuncia", foreignKey: "criador"});
  formador.belongsTo(utilizadores, { as: "utilizador_utilizadore", foreignKey: "utilizador"});
  utilizadores.hasMany(formador, { as: "formadors", foreignKey: "utilizador"});
  formando.belongsTo(utilizadores, { as: "utilizador_utilizadore", foreignKey: "utilizador"});
  utilizadores.hasMany(formando, { as: "formandos", foreignKey: "utilizador"});
  material.belongsTo(utilizadores, { as: "criador_utilizadore", foreignKey: "criador"});
  utilizadores.hasMany(material, { as: "materials", foreignKey: "criador"});
  notificacaopessoal.belongsTo(utilizadores, { as: "utilizador_utilizadore", foreignKey: "utilizador"});
  utilizadores.hasMany(notificacaopessoal, { as: "notificacaopessoals", foreignKey: "utilizador"});
  post.belongsTo(utilizadores, { as: "utilizador_utilizadore", foreignKey: "utilizador"});
  utilizadores.hasMany(post, { as: "posts", foreignKey: "utilizador"});

  return {
    admin,
    area,
    avaliacaocontinua,
    avaliacaofinal,
    canaisutilizadores,
    canalnotificacoes,
    categoria,
    comentario,
    curso,
    cursoassincrono,
    cursosincrono,
    cursotopico,
    denuncia,
    denunciacomentario,
    denunciapost,
    formador,
    formando,
    inscricao,
    licao,
    licaomaterial,
    material,
    notificacao,
    notificacaogeral,
    notificacaopessoal,
    post,
    respostacomentario,
    respostapost,
    sessao,
    submissao,
    tipodenuncia,
    tipomaterial,
    topico,
    topicoarea,
    utilizadores,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
