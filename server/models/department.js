"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Department extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Department.belongsTo(models.Location, {
        foreignKey: "location_id",
        as: "location",
      });
      Department.hasMany(models.User, {
        foreignKey: "department_id",
        as: "users",
      });
    }
  }
  Department.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      location_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Department",
      tableName: "Departments",
      timestamps: true,
      indexes: [
        { fields: ["location_id"] },
      ],
    }
  );
  return Department;
};
