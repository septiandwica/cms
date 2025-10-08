"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ScanHistory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ScanHistory.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
      ScanHistory.belongsTo(models.Order, {
        foreignKey: "order_id",
        as: "order",
      });
    }
  }
  ScanHistory.init(
    {
      user_id: DataTypes.INTEGER,
      order_id: DataTypes.INTEGER,
      status: DataTypes.STRING,
      date: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "ScanHistory",
    }
  );
  return ScanHistory;
};
