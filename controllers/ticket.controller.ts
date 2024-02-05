// ticketController.ts

import { Request, Response } from "express";
import path from "path";
import { Models } from "../models";
import appConfig from "../common/appConfig";
import jwt from "jsonwebtoken";
import fs from "fs";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { Socket } from "socket.io";

interface TransformedProperty {
  id: any;
  property_name: any;
  userId: any;
  property_description: any;
  property_location: any;
  isActive: any;
  created_at: any;
  updated_at: any;
  tickets: {
    id: number;
    ticketName: string;
    image: any;
    description: string;
    ticketCreatedBy: number;
    propertyId: number;
    status: string;
    created_at: string;
    updated_at: string;
    SentTicketsCount: number;
  }[];
  SentTicketsCount: number;
}

export const createTicketAndUploadImage = async (
  req: Request,
  res: Response
) => {
  
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    
    try {
      const decodedToken = jwt.verify(token, appConfig.jwtSecretKey) as {
        id: number;
      };
      const { id } = decodedToken;

      const models = req.app.locals.models;
      const user = await models.users.findByPk(id);

      if (!user) {
        return res.status(404).json({ status: 404, message: "User not found" });
      }

      const propertyId = user.propertyId;

      if (!propertyId) {
        return res
          .status(404)
          .json({ status: 404, message: "Property not found" });
      }

      const { ticketName, description } = req.body;

      let imagePath: string | undefined;
      if (req.files) {
        const fileData: any = req.files;
        let img: any = (
          fileData as { [fieldname: string]: Express.Multer.File[] }
        ).image;
        const bufferData = img?.data;
        
        if (bufferData) {
          const imageName = `Image-${Date.now().toString()}.${(img.mimetype || "image/jpeg").split("/")[1] || "jpeg"}`;
          imagePath = `http://192.168.1.12:8000/assets/tickets/${imageName}`;
          const uploadPath = path.join(__dirname, "../assets/tickets", imageName);
          const uploadDirectory = path.join(__dirname, "../assets/tickets");
          
          if (!fs.existsSync(uploadDirectory)) {
            fs.mkdirSync(uploadDirectory);
          }

          fs.writeFile(uploadPath, bufferData, (fsErr) => {
            if (fsErr) {
              console.error(fsErr);
              return res.status(500).json({ error: "Failed to upload image" });
            }
          });
        }
      }

      try {
        models.ticket
          .create({
            ticketName,
            description,
            ticketCreatedBy: id,
            image: imagePath || "", // If no image is uploaded, imagePath will be undefined
            propertyId: propertyId,
            status: "sent",
            ticketstatus:"open",
          })
          .then((newTicket: any) => {
            return res
              .status(200)
              .json({
                status: 200,
                message: "Ticket created successfully",
                Ticket: newTicket,
              });
              
          })
          .catch((error: any) => {
            console.error("Error creating ticket:", error);
            return res
              .status(500)
              .json({
                status: 500,
                message: "Error creating ticket",
                Ticket: error,
              });
          });
      } catch (error) {
        console.error("Error creating ticket:", error);
        return res
          .status(500)
          .json({
            status: 500,
            message: "Error creating ticket",
            Ticket: error,
          });
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      return res
        .status(500)
        .json({ status: 500, message: "Error decoding token", Ticket: error });
    }
  } else {
    return res
      .status(401)
      .json({ status: 401, message: "Unauthorized. Token not provided." });
  }
};

export const getSingleTicket = async (req: Request, res: Response) => {
  try {
    const models: Models = req.app.locals.models;
    const ticketId = req.params.id;
    const ticket = await models.ticket.findByPk(ticketId);
    if (!ticket) {
      return res.status(404).json({ status: 404, message: "Ticket not found" });
    }
    return res
      .status(200)
      .json({
        status: 200,
        message: "Ticket retrieved successfully",
        Ticket: ticket,
      });
  } catch (error) {
    console.error("Error retrieving ticket:", error);
    return res
      .status(500)
      .json({ status: 500, message: "Error retrieving ticket", Error: error });
  }
};

export const deleteTicket = async (req: Request, res: Response) => {
  try {
    const models: Models = req.app.locals.models;
    const ticketId = req.params.id;
    const deletedTicket = await models.ticket.destroy({
      where: { id: ticketId },
    });
    if (!deletedTicket) {
      return res.status(404).json({ status: 404, message: "Ticket not found" });
    }
    return res
      .status(200)
      .json({ status: 200, message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return res
      .status(500)
      .json({ status: 500, message: "Error deleting ticket", Error: error });
  }
};


export const updateTicket = async (req: Request, res: Response) => {
  const { id } = req.params;
  const models: Models = req.app.locals.models;

  try {
    const { ticketstatus } = req.body;
    if (ticketstatus === 'close') {
      // Delete associated chat records when the ticket is closed
      const deletedChat = await models.chatModel.destroy({
        where: { ticketId: id },
      });

      console.log(`Deleted ${deletedChat} chat records`);
    }
    const ticket = await models.ticket.findByPk(id);

    if (!ticket) {
      return res.status(404).json({ status: 404, message: "Ticket not found" });
    }
       // Update the ticket data
        ticket.ticketstatus = ticketstatus || ticket.ticketstatus;

        await ticket.save();

        return res.status(200).json({ status: 200, message: "Ticket updated successfully", Ticket: ticket });
      
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 500,
      message: "Internal server error, contact API administrator",
    });
  }
};

export const getTicketWithChat = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const models: Models = req.app.locals.models;
    const ticket = await models.ticket.findByPk(id, {
      include: [
        {
          model: models.chatModel,
          required: false,
        },
      ],
    });

    if (ticket) {
      const createdByUserId = ticket.ticketCreatedBy; // Get the createdByUserId from the ticket
      const user = await models.users.findByPk(createdByUserId);

      if (user) {
        const { blockId, propertyId, unitId } = user;

        const response = {
          id: ticket.id,
          ticketName: ticket.ticketName,
          image: ticket.image,
          description: ticket.description,
          ticketCreatedBy: ticket.ticketCreatedBy,
          userBlockId: blockId,
          propertyId: propertyId,
          unitId: unitId,
          created_at: ticket.createdAt,
          updated_at: ticket.updatedAt,
          Chats: ticket.Chats, // Include the chats as before
        };

        res.json(response);
      } else {
        res.status(404).json({ status: 404, message: "User not found" });
      }
    } else {
      res.status(404).json({ status: 404, message: "Ticket not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 500,
      message: "Internal server error, contact API administrator",
    });
  }
};

export const getAllTickets = async (req: Request, res: Response) => {
  try {
    const userId =req.query.userId;
    const models: Models = req.app.locals.models;
    // const tickets = await models.ticket.findAll();
    const tickets = await models.ticket.findAll({
      order: [['created_at', 'DESC']], // Order by creation date in descending order
    });

    const ticketsWithUserAndCount = await Promise.all(
      tickets.map(async (ticket) => {
        const sentTicketsCount = await models.chatModel.count({
          where: { ticketId: ticket.id, status: "sent" },
        });
        const user = await models.users.findByPk(ticket.ticketCreatedBy);

        if (user) {
          const { blockId, propertyId, unitId } = user;
          return {
            id: ticket.id,
            ticketName: ticket.ticketName,
            image: ticket.image,
            description: ticket.description,
            ticketCreatedBy: ticket.ticketCreatedBy,
            userBlockId: blockId,
            propertyId: propertyId,
            unitId: unitId,
            ticketstatus:ticket.ticketstatus,
            created_at: ticket.created_at,
            updated_at: ticket.updated_at,
            SentTicketsCount: sentTicketsCount,
          };
        }
      })
    );

    return res.status(200).json({
      status: 200,
      message: "Tickets retrieved successfully",
      Tickets: ticketsWithUserAndCount,
    });
  } catch (error) {
    console.error("Error retrieving tickets:", error);
    return res
      .status(500)
      .json({ status: 500, message: "Error retrieving tickets", Error: error });
  }
};
export const getPropertyTickets = async (req: Request, res: Response) => {
  const models: Models = req.app.locals.models;
  const { propertyId } = req.params;

  try {
    const properties = await models.properties.findAll({
      where: { userId: propertyId },
    });

    if (!properties) {
      return res
        .status(404)
        .json({ status: 404, message: "Property not found with this manager" });
    }

    const propertyData = [];
    for (const property of properties) {
      const propertyId = property.dataValues.id;
      const tickets = await models.ticket.findAll({
        where: { propertyId: propertyId },
        order: [['created_at', 'DESC']],
      });
      let sentTicketsCount = 0;

      const ticketData = await Promise.all(
        tickets.map(async (ticket) => {
          const count = await models.chatModel.count({
            where: { ticketId: ticket.id, status: "sent" },
          });
          sentTicketsCount += count;
          
          const user:any = await models.users.findByPk(ticket.ticketCreatedBy);
          
            const { blockId, unitId } = user.dataValues;
          return {
            id: ticket.id,
            ticketName: ticket.ticketName,
            image: ticket.image,
            description: ticket.description,
            ticketCreatedBy: ticket.ticketCreatedBy,
            userBlockId: blockId,
            propertyId: ticket.propertyId,
            unitId:unitId,
            status: ticket.status,
            ticketstatus: ticket.ticketstatus,
            created_at: ticket.created_at,
            updated_at: ticket.updated_at,
            SentTicketsCount: count,
          };
        })
      );

      const transformedProperty: TransformedProperty = {
        id: property.dataValues.id,
        property_name: property.dataValues.property_name,
        userId: property.dataValues.userId,
        property_description: property.dataValues.property_description,
        property_location: property.dataValues.property_location,
        isActive: property.dataValues.isActive,
        SentTicketsCount: 0,
        created_at: property.dataValues.created_at,
        updated_at: property.dataValues.updated_at,
        tickets: ticketData,
      };
  
      // Check if any SentTicketsCount is greater than 0
      const hasSentTickets = ticketData.some(
        (ticket) => ticket.SentTicketsCount > 0
      );
  
      // Set SentTicketsCount to 1 if there are any sent tickets
      transformedProperty.SentTicketsCount = hasSentTickets ? 1 : 0;
  
      propertyData.push(transformedProperty);
    }
  
    return res.status(200).json({ status: 200, data: propertyData });
  } catch (error) {
    console.error("Error in fetching property tickets", error);
    return res
      .status(500)
      .json({ status: 500, message: "Internal Server Error" });
  }
};

export const findTicketById = async (
  ticket_id: any,
  models: {
    ticket: {
      findByPk: (arg0: any, arg1: { include: { model: any; required: boolean}[] }) => any;
    };
    chatModel: { update: (arg0: { status: string }, arg1: { where: { ticketId: any; status: string } }) => any; };
  },
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  try {
    // const tickets = await models.ticket.findByPk(ticket_id, {
    //   include: [{ model: models.chatModel, required: false }],
    // });
    const tickets = await models.ticket.findByPk(ticket_id, {
      include: [{ model: models.chatModel, required: false }],
    });
    
    if (tickets) {
      console.log(tickets.dataValues.ticketCreatedBy,"tickets")
      socket.emit("foundRoom", tickets);

      socket.emit("foundRoom", { tickets });
    } else {
      socket.emit("foundRoom", []);
    }
  } catch (error) {
    console.log(error);
    socket.emit("foundRoom", {
      status: 500,
      message: "Internal server error, contact API administrator",
    });
  }
};


// ticket.controller.ts
export default {
  createTicketAndUploadImage,
  deleteTicket,
  getAllTickets,
  getSingleTicket,
  getTicketWithChat,
  // updateTicket,
  getPropertyTickets,
};
