// socketEvents.ts

import axios from 'axios';
import { Socket } from 'socket.io';
import { Sequelize } from 'sequelize';
import { findTicketById, getTicketWithChat } from '../controllers/ticket.controller';

interface SequelizeModels {
    ticket: {
      findByPk: (arg0: any, arg1: { include: { model: any; required: boolean }[] }) => any;
    };
    chatModel: {
      update: (arg0: { status: string }, arg1: { where: { ticketId: any; status: string } }) => any;
    };
  }
  


export const configureSocketEvents =(socket: Socket, sequelize: SequelizeModels) => {
    
  let chatRooms: any[] = [];

  // console.log(`⚡: ${socket.id} user just connected!`);

  socket.on("createRoom", (name: any) => {
    socket.join(name);
    // chatRooms.unshift({ id: 1, name, messages: [] });
    chatRooms.unshift({ id: 1, name, messages: [], activeUsers: [] });
    socket.emit("roomsList", chatRooms);
  });

  socket.on("findRoom", async (ticket_id, sender) => {
    try {
      await findTicketById(ticket_id, sequelize, socket);
    } catch (error) {
      console.error("Error finding room:", error);
    }
  });
 
  socket.on("newMessage", async (data: any) => {
    const { ticket_id, message, user, receiver, timestamp } = data; // Change room_id to ticket_id
    const room = chatRooms.find((room) => room.id === 1);
    if (data) {
      // Call the sendMessage API endpoint {call function }
    axios.post('http://localhost:8000/api/chat/send-message', { // sendMessages
        ticketId: ticket_id,
        sender: user,
        receiver: receiver,
        message: message,
        time: timestamp,
      })
        .then(async (response: { data: any; }) => {
          try {
            const ticketID = response.data?.message.ticketId; 
            await axios.get(`http://localhost:8000/api/ticket/ticketchat/${ticketID}`) // getTicketWithChat
            .then((response: { data: any; }) => { 
                socket.emit("foundRoom", response.data);
            })
            .catch((error: any) => {    
                console.error("Error sending message:", error);
            });
          } catch (error) {
            // Handle errors
          }
        })   
        .catch((error: any) => {
          console.error("Error sending message:", error);
        });
    }
  });

    // // Listen for 'messageSeen' event from the receiver
    // socket.on("messageSeen", async (data: { ticket_id: any }) => {
    //   console.log(data,"++++++++++++++++data")
    //   const { ticket_id } = data;
    //   // Update the message status to 'delivered'
    //   const [count] = await sequelize.chatModel.update(
    //     { status: "delivered" },
    //     { where: { ticketId: ticket_id, status: "sent" } }
    //   );
    //   console.log(`Number of rows updated to 'delivered': ${count}`);
    // });
          // Listen for 'messageSeen' event from the receiver
      socket.on("messageSeen", async (data: { ticket_id: any, user: any, receiver: any }) => {
        const { ticket_id, user, receiver } = data;

        // Check if the sender and receiver are different
        if (user !== receiver) {
          // Update the message status to 'delivered'
          const [count] = await sequelize.chatModel.update(
            { status: "delivered" },
            { where: { ticketId: ticket_id, status: "sent" } }
          );
        } else {
        }
      });


      socket.on("oldMessages", (id: any) => {
        const oldId = id.getTicketId;
        axios.get(`http://localhost:8000/api/ticket/ticketchat/${oldId}`) // getTicketWithChat
          .then((response: { data: any; }) => {
            socket.emit("foundRoom", response.data);
          })
          .catch((error: any) => {
            console.error("Error sending message:", error);
          });
      });

  socket.on("disconnect", () => {
    chatRooms.forEach((room) => {
        const index = room.activeUsers.indexOf(socket.id);
        if (index !== -1) {
          room.activeUsers.splice(index, 1);
        }
      });
    socket.disconnect();
    console.log("🔥: A user disconnected");
  });

};
