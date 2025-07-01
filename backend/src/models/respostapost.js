const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('respostapost', {
    post: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'post',
        key: 'idpost'
      }
    },
    idcomentario: {
      type: DataTypes.BIGINT,
      allowNull: true
    }
  }, {
    tableName: 'respostapost',
    schema: 'public',
    timestamps: false
  });
};
