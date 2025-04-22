const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('material', {
    idmaterial: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    titulo: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    link: {
      type: DataTypes.STRING(300),
      allowNull: false
    },
    tipo: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'tipomaterial',
        key: 'idtipomaterial'
      }
    },
    criador: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'utilizadores',
        key: 'idutilizador'
      }
    }
  }, {
    tableName: 'material',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "material_pk",
        unique: true,
        fields: [
          { name: "idmaterial" },
        ]
      },
    ]
  });
};
