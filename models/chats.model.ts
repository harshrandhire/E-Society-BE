// Chat.model.ts

import { Sequelize, Model, DataTypes } from "sequelize";
import appConfig from "../common/appConfig";
import { messageStatus} from "../common/statusConstants";

export interface ChatInterface extends Model {
    id: number;
    ticketId: number;
    Ticket: string;
    sender: number;
    receiver: number;
    message: any;
    timestamp: any;
    sendMessage: any;
    ticket_id: any,

}

export default (sequelize: Sequelize) => {
    const Chat = sequelize.define<ChatInterface>("Chat", {
        ticketId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        sender: {
            type: DataTypes.INTEGER,
        },
        receiver: {
            type: DataTypes.INTEGER,
        },
        message: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        timestamp: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
        {
            freezeTableName: true,
            tableName: "Chat",
            updatedAt: "updated_at",
            createdAt: "created_at",
        }
    );

    return Chat;
};
