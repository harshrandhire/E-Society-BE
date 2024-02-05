// document.model.ts

import { Sequelize, Model, DataTypes } from 'sequelize';
import sequelize from '../config'; // Import your Sequelize instance
import User, { /* UserInterface */ } from './users.model';

export interface DocumentInterface extends Model {
  id: number;
  document_name: string;
  description: string;
  filePath: string;
  uploadedBy: number;
  userId: number;
  fileUrl: string;
  // Add any other properties you need for your documents
}

export default (sequelize: Sequelize) => {
  const Document = sequelize.define<DocumentInterface>('documents', {
    document_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // Add more properties as needed
  },
  {
    freezeTableName: true,
    tableName: "documents",
    updatedAt: "updated_at",
    createdAt: "created_at"
  });

  User(sequelize).hasOne(Document);
  Document.belongsTo(User(sequelize), { foreignKey: 'userId' });

  return Document;
};