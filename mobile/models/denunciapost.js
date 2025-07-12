const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('denunciapost', {
    denuncia: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'denuncia',
        key: 'iddenuncia'
      }
    },
    post: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'post',
        key: 'idpost'
      }
    }
  }, {
    tableName: 'denunciapost',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "denunciapost_pk",
        unique: true,
        fields: [
          { name: "denuncia" },
        ]
      },
    ]
  });
};
