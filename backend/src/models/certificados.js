const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('certificados', {
    idcertificado: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    cursosinc: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'cursosincrono',
        key: 'idcursosincrono'
      }
    },
    nome: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    descricao: {
      type: DataTypes.STRING(300),
      allowNull: false
    }
  }, {
    tableName: 'certificados',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "certificado_pk",
        unique: true,
        fields: [
          { name: "idcertificado" },
        ]
      },
    ]
  });
};
