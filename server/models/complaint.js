'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Complaint extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Complaint.belongsTo(models.Order_Detail, { foreignKey: 'order_detail_id', as: 'order_detail' });
    }
  }
  Complaint.init({
    order_detail_id: DataTypes.INTEGER,
    comment: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Complaint',
    tableName: 'Complaints',
    timestamps: true,
    indexes: [
      { fields: ['order_detail_id'] },
    ],
  });
  return Complaint;
};