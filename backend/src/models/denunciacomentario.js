const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('denunciacomentario', {
    denuncia: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'denuncia',
        key: 'iddenuncia'
      }
    },
    comentario: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'comentario',
        key: 'idcomentario'
      }
    }
  }, {
    tableName: 'denunciacomentario',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "denunciacomentario_pk",
        unique: true,
        fields: [
          { name: "denuncia" },
        ]
      },
    ]
  });
};
