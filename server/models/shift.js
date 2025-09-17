"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Shift extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here\
      Shift.hasMany(models.Vendor_Catering, {
        foreignKey: "shift_id",
        as: "vendor_caterings",
      });
    }
  }
  Shift.init(
    {
      name: {
        type: DataTypes.STRING
      },
      timeOn:{
        type: DataTypes.TIME
      },
      startAt: {
        type: DataTypes.TIME
      },
      endAt: {
        type: DataTypes.TIME
      },
    },
    {
      sequelize,
      modelName: "Shift",
    }
  );
  return Shift;
};
