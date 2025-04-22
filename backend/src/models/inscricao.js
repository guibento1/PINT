const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('inscricao', {
    curso: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'curso',
        key: 'idcurso'
      }
    },
    formando: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'formando',
        key: 'idformando'
      }
    },
    registo: {
      type: DataTypes.DATEONLY,
      allowNull: false
    }
  }, {
    tableName: 'inscricao',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "inscricao_pk",
        unique: true,
        fields: [
          { name: "curso" },
          { name: "formando" },
        ]
      },
    ]
  });
};
