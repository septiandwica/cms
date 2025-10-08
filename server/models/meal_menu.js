"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Meal_Menu extends Model {
    static associate(models) {
      Meal_Menu.belongsTo(models.Vendor_Catering, {
        foreignKey: "vendor_catering_id",
        as: "vendor_catering",
      });
      Meal_Menu.belongsTo(models.Meal_Tray, {
        foreignKey: "meal_tray_id",
        as: "meal_tray",
      });

      Meal_Menu.hasMany(models.Order_Detail, {
        foreignKey: "meal_menu_id",
        as: "order_details",
      });
      // Meal_Menu.
    }
  }

  Meal_Menu.init(
    {
      vendor_catering_id: { type: DataTypes.INTEGER, allowNull: false },
      meal_tray_id: {type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      descriptions: { type: DataTypes.TEXT, allowNull: false },
      nutrition_facts: { type: DataTypes.TEXT, allowNull: true },
      for_date: { type: DataTypes.DATEONLY, allowNull: false },
      status: {
        type: DataTypes.ENUM("approved", "rejected", "pending"),
        allowNull: false,
        defaultValue: "pending",
      },
    },
    {
      sequelize,
      modelName: "Meal_Menu",
      tableName: "Meal_Menus",
      timestamps: true,
      indexes: [
        { fields: ["vendor_catering_id"] },
        { fields: ["meal_tray_id"]},
        { fields: ["for_date"] },
        { fields: ["vendor_catering_id", "name"], name: "idx_vendor_name" },
      ],
    }
  );

  return Meal_Menu;
};
