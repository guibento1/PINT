const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('curso', {
    idcurso: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    nome: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    disponivel: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    iniciodeinscricoes: {
      type: DataTypes.DATE,
      allowNull: false
    },
    canal: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'canalnotificacoes',
        key: 'idcanalnotificacoes'
      }
    },
    fimdeinscricoes: {
      type: DataTypes.DATE,
      allowNull: true
    },
    maxinscricoes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    planocurricular: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    thumbnail: {
      type: DataTypes.STRING(300),
      allowNull: true
    }
  }, {
    tableName: 'curso',
    schema: 'public',
    timestamps: false
  });
};
