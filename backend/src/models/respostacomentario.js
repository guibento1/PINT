const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('respostacomentario', {
    comentario: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'comentario',
        key: 'idcomentario'
      }
    },
    idcomentario: {
      type: DataTypes.BIGINT,
      allowNull: true
    }
  }, {
    tableName: 'respostacomentario',
    schema: 'public',
    timestamps: false
  });
};
