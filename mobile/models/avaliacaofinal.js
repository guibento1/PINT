const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('avaliacaofinal', {
    cursosincrono: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'cursosincrono',
        key: 'idcursosincrono'
      }
    },
    formando: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'formando',
        key: 'idformando'
      }
    },
    nota: {
      type: DataTypes.DOUBLE,
      allowNull: false
    }
  }, {
    tableName: 'avaliacaofinal',
    schema: 'public',
    timestamps: false
  });
};
