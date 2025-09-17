"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Vendor_Catering extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Vendor_Catering.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
      Vendor_Catering.belongsTo(models.Location, {
        foreignKey: "location_id",
        as: "location",
      });
      Vendor_Catering.belongsTo(models.Shift, {
        foreignKey: "shift_id",
        as: "shift",
      });
      Vendor_Catering.hasMany(models.Meal_Menu, {
        foreignKey: "vendor_catering_id",
        as: "meal_menus",
      });
    }
  }
  Vendor_Catering.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      location_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      shift_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING,
      },
      status:{
        type: DataTypes.ENUM("active", "inactive"),
        allowNull: false,
      }
    },
    {
      sequelize,
      modelName: "Vendor_Catering",
      tableName: "Vendor_Caterings",
      timestamps: true,
      indexes: [
        { fields: ["user_id"] },
        { fields: ["location_id"] },
        { fields: ["shift_id"] },
      ],
    }
  );
  return Vendor_Catering;
};
