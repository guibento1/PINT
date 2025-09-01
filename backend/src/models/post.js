const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('post', {
    idpost: {
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
    titulo: {
      type: DataTypes.STRING(300),
      allowNull: false
    },
    topico: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'topico',
        key: 'idtopico'
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
    ncomentarios: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    criado: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    anexo: {
      type: DataTypes.STRING(300),
      allowNull: true,
      defaultValue: "NULL"
    }
  }, {
    tableName: 'post',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "post_pk",
        unique: true,
        fields: [
          { name: "idpost" },
        ]
      },
    ]
  });
};
