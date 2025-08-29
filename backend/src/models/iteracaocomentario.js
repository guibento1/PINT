const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('iteracaocomentario', {
    comentario: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'comentario',
        key: 'idcomentario'
      }
    },
    utilizador: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'utilizadores',
        key: 'idutilizador'
      }
    },
    positiva: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    }
  }, {
    tableName: 'iteracaocomentario',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "comentario_iteracao_pk",
        unique: true,
        fields: [
          { name: "comentario" },
          { name: "utilizador" },
        ]
      },
    ]
  });
};
