const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('respostacomentario', {
    idcomentario: {
      autoIncrement: true,
      autoIncrementIdentity: true,
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
      references: {
        model: 'comentario',
        key: 'idcomentario'
      }
    }
  }, {
    tableName: 'respostacomentario',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "respostacomentario_pk",
        unique: true,
        fields: [
          { name: "idcomentario" },
        ]
      },
    ]
  });
};
