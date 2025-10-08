"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.belongsTo(models.Role, {
        foreignKey: "role_id",
        as: "role",
      });
      User.belongsTo(models.Department, {
        foreignKey: "department_id",
        as: "department",
      });
       User.hasOne(models.QR_Code, {
        foreignKey: 'user_id',
        as: 'qr_code',
      });
      User.hasOne(models.Vendor_Catering, {
        foreignKey: "user_id",
        as: "vendor_catering",
      });
      User.hasMany(models.Order, {
        foreignKey: 'user_id',
        as: 'orders',
      });
      User.hasMany(models.ScanHistory, { foreignKey: 'user_id', as: 'scan_histories' });
      User.hasMany(models.Complaint, { foreignKey: 'user_id', as: 'complaints' });
      User.hasMany(models.Review, { foreignKey: 'user_id', as: 'reviews' });
    }
  }
  User.init(
    {
      nik: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
      },
      status:{
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active',
        allowNull: false,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
        department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "Users",
      timestamps: true,
      indexes: [
        { fields: ["role_id"] },
        { fields: ["department_id"] },
      ],
    }
  );
  return User;
};
