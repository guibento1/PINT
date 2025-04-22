const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('respostapost', {
    idcomentario: {
      autoIncrement: true,
      autoIncrementIdentity: true,
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
        ]
      },
    ]
  });
};
