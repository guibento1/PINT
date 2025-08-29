const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('respostapost', {
    idcomentario: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'comentario',
        key: 'idcomentario'
      }
    },
    post: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'post',
        key: 'idpost'
      }
    }
  }, {
    tableName: 'respostapost',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "respostapost_pk",
        unique: true,
        fields: [
          { name: "idcomentario" },
          { name: "post" },
        ]
      },
    ]
  });
};
