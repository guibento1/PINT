const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('utilizadorcanais', { 
    idutilizador: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      primaryKey: true,
      references: {
        model: 'utilizadores',
        key: 'idutilizador'
      }
    },
    canal: { 
      type: DataTypes.INTEGER, 
      allowNull: false, 
      primaryKey: true,
      references: {
        model: 'canalnotificacoes',
        key: 'idcanalnotificacoes'
      }
    }
  }, {
    tableName: 'utilizadorecanaisnoticacoes',  
    timestamps: false,           
    paranoid: false,             
    freezeTableName: true,       
  });
};
