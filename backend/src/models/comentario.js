const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('comentario', {
    idcomentario: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    utilizador: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'utilizadores',
        key: 'idutilizador'
      }
    },
    conteudo: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    pontuacao: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    nrespostas: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    criado: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'comentario',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "comentario_pk",
        unique: true,
        fields: [
          { name: "idcomentario" },
        ]
      },
    ]
  });
};
