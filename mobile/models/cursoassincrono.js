const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('cursoassincrono', {
    idcursoassincrono: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      unique: "cursoassincrono_idcursoassincrono_key"
    },
    curso: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'curso',
        key: 'idcurso'
      }
    }
  }, {
    tableName: 'cursoassincrono',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "cursoassincrono_idcursoassincrono_key",
        unique: true,
        fields: [
          { name: "idcursoassincrono" },
        ]
      },
      {
        name: "cursoassincrono_pk",
        unique: true,
        fields: [
          { name: "idcursoassincrono" },
          { name: "curso" },
        ]
      },
    ]
  });
};
