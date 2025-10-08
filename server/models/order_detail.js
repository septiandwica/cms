"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Order_Detail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Order_Detail.belongsTo(models.Order, {
        foreignKey: "order_id",
        as: "order",
      });

      Order_Detail.belongsTo(models.Shift, {
        foreignKey: "shift_id",
        as: "shift",
      });

      Order_Detail.belongsTo(models.Meal_Menu, {
        foreignKey: "meal_menu_id",
        as: "meal_menu",
      });
    }
  }
  Order_Detail.init(
    {
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      day: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      shift_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      meal_menu_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Order_Detail",
      tableName: "Order_Details",
      timestamps: true,
      indexes: [{ fields: ["order_id"] }],
    }
  );
  return Order_Detail;
};
