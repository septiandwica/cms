"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

      Order.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
      Order.hasMany(models.Order_Detail, {
        foreignKey: "order_id",
        as: "order_details",
      });
      Order.hasMany(models.ScanHistory, {
        foreignKey: "order_id",
        as: "scan_histories",
      });
      Order.hasMany(models.Complaint, {
        foreignKey: "order_id",
        as: "complaints",
      });
      Order.hasMany(models.Review, {
        foreignKey: "order_id",
        as: "reviews",
      });
    }
  }
  Order.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      order_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("normal", "guest", "overtime", "backup"),
        defaultValue: "normal",
      },
      notes: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "Orders",
      timestamps: true,
      indexes: [{ fields: ["user_id"] }],
    }
  );
  return Order;
};
