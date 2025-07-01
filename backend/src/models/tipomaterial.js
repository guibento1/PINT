const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('tipomaterial', {
    idtipomaterial: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    designacao: {
      type: DataTypes.STRING(60),
      allowNull: false
    }
  }, {
    tableName: 'tipomaterial',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "tipomaterial_pk",
        unique: true,
        fields: [
          { name: "idtipomaterial" },
        ]
      },
    ]
  });
};
