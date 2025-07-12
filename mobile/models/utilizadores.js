const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('utilizadores', {
    idutilizador: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    nome: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(60),
      allowNull: false,
      unique: "unique_email"
    },
    salt: {
      type: DataTypes.CHAR(16),
      allowNull: true
    },
    passwordhash: {
      type: DataTypes.CHAR(128),
      allowNull: true
    },
    dataregisto: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    morada: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    telefone: {
      type: DataTypes.CHAR(9),
      allowNull: true
    },
    foto: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    }
  }, {
    tableName: 'utilizadores',
    schema: 'public',
    timestamps: false
  });
};
