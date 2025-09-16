"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Meal_Menu extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Meal_Menu.belongsTo(models.Vendor_Catering, {
        foreignKey: "vendor_catering_id",
        as: "vendor_catering",
      });
    }
  }
  Meal_Menu.init(
    {
      vendor_catering_id: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      nutrition_facts: { type: DataTypes.TEXT },
      for_date: { type: DataTypes.DATEONLY, allowNull: false },
    },
    {
      sequelize,
      modelName: "Meal_Menu",
      tableName: "Meal_Menus",
      timestamps: true,
      indexes: [
        { fields: ["vendor_catering_id"] },
        { fields: ["for_date"] },
        { unique: true, fields: ["vendor_catering_id", "for_date", "name"], name: "uniq_vendor_date_name" },
      ],
    }
  );
  return Meal_Menu;
};
