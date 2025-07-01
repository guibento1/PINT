const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('cursotopico', {
    curso: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'curso',
        key: 'idcurso'
      }
    },
    topico: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'topico',
        key: 'idtopico'
      }
    }
  }, {
    tableName: 'cursotopico',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "cursotopico_pk",
        unique: true,
        fields: [
          { name: "curso" },
          { name: "topico" },
        ]
      },
    ]
  });
};
