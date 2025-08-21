const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('cursosincrono', {
    idcursosincrono: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      unique: "cursosincrono_idcursosincrono_key"
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
    formador: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'formador',
        key: 'idformador'
      }
    },
    nhoras: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    fim: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    maxincricoes: {
      type: DataTypes.BIGINT,
      allowNull: true
    }
  }, {
    tableName: 'cursosincrono',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "cursosincrono_idcursosincrono_key",
        unique: true,
        fields: [
          { name: "idcursosincrono" },
        ]
      },
      {
        name: "cursosincrono_pk",
        unique: true,
        fields: [
          { name: "idcursosincrono" },
          { name: "curso" },
        ]
      },
    ]
  });
};
