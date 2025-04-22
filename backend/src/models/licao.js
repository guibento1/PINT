const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('licao', {
    idlicao: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      unique: "licao_idlicao_key"
    },
    curso: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'curso',
        key: 'idcurso'
      }
    },
    titulo: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'licao',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "licao_idlicao_key",
        unique: true,
        fields: [
          { name: "idlicao" },
        ]
      },
      {
        name: "licao_pk",
        unique: true,
        fields: [
          { name: "idlicao" },
          { name: "curso" },
        ]
      },
    ]
  });
};
