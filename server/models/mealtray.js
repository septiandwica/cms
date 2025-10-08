"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Meal_Tray extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Meal_Tray.hasMany(models.Meal_Menu, {
        foreignKey: "meal_tray_id",
        as: "meal_trays",
      });
    }
  }
  Meal_Tray.init(
    {
      name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Meal_Tray",
    }
  );
  return Meal_Tray;
};
