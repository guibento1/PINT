const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('respostacomentario', {
    idcomentario: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'comentario',
        key: 'idcomentario'
      }
    },
    comentario: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'comentario',
        key: 'idcomentario'
      }
    }
  }, {
    tableName: 'respostacomentario',
    schema: 'public',
    hasTrigger: true,
    timestamps: false,
    indexes: [
      {
        name: "respostacomentario_pk",
        unique: true,
        fields: [
          { name: "idcomentario" },
          { name: "comentario" },
        ]
      },
    ]
  });
};
