// Ticket.model.ts

import { Sequelize, Model, DataTypes } from "sequelize";

export interface TicketsInterface extends Model {
  ticketstatus: any;
  status: any;
  propertyId: any;
  ticketCreatedBy: any;
  id: number;
  ticketName: string;
  ticketId: number;
  ticket: string;
  assetPath: string;
  image: any; // Assuming you are storing the path to the image
  description: string; // Add the missing field
  originalname: any;
  updatedAt : Date;
  createdAt : Date;
  created_at : any;
  updated_at : any;
  Chats: any;
  model: any;
}

export default (sequelize: Sequelize) => {
  const Ticket = sequelize.define<TicketsInterface>(
    "tickets",
    {
      ticketName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      image: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ticketCreatedBy: {
        type: DataTypes.INTEGER,
        // allowNull: false,
      },
      propertyId: {
        type: DataTypes.INTEGER,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ticketstatus :{
        type : DataTypes.STRING,
      }
    },
    {
      freezeTableName: true,
      tableName: "tickets",
      updatedAt: "updated_at",
      createdAt: "created_at",
    }
  );

  return Ticket;
};
