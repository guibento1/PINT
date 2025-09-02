const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('certificadosutilizadores', {
    certificado: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'certificados',
        key: 'idcertificado'
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
    chave: {
      type: DataTypes.STRING(128),
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('gen_random_uuid'),
      unique: "certificadosutilizadores_chave_key"
    }
  }, {
    tableName: 'certificadosutilizadores',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "certificadosutilizadores_chave_key",
        unique: true,
        fields: [
          { name: "chave" },
        ]
      },
      {
        name: "certificadosutilizadores_pk",
        unique: true,
        fields: [
          { name: "certificado" },
          { name: "utilizador" },
        ]
      },
    ]
  });
};
