'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class QR_Code extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      QR_Code.belongsTo(models.User, {
        foreignKey: 'user_id', // foreign key in the QR_Code model
        as: 'user', // alias for the association
      });
    }
  }
   QR_Code.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    qr_code_data: {
      type: DataTypes.TEXT,
      allowNull: true,  // assuming this field can be nullable
    }
  }, {
    sequelize,
    modelName: 'QR_Code',
    tableName: 'QR_Codes',
    timestamps: true,
    indexes: [
      { fields: ['user_id'] },
    ],
  });
  return QR_Code;
};