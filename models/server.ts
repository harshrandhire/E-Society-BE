/* eslint-disable no-empty */
// Import necessary modules
import express, { Application } from "express";
import http from "http";
import { Server as SocketIoServer, Socket } from "socket.io";
import cors from "cors";
import { Sequelize } from "sequelize";
import { attachModelsToRequest } from "../middlewares/models";
import initializeModels, { Models } from "../models";
import bcrypt from "bcrypt";
import config from "./../config";
import documentsRoutes from "../routes/documents.routes";
import userRoutes from "../routes/users.routes";
import propertyRoutes from "../routes/properties.routes";
import blocksRoutes from "../routes/blocks.routes";
import unitsRoutes from "../routes/units.routes";
import ticketsRoutes from "../routes/ticket.routes";
import chatRoutes from "../routes/chat.routes";
import appConfig from "../common/appConfig";
import axios from 'axios';
import { getSingleTicket, getTicketWithChat } from "../controllers/ticket.controller";  // Import the getTicketWithChat function
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import fileUpload from 'express-fileupload'; // Import express-fileupload
import path from "path";
import { configureSocketEvents } from './socketioImplementation';

class Server {
  private app: Application;
  private server: http.Server;
  private io: SocketIoServer;
  private sequelize!: Sequelize;
  private models: any;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIoServer(this.server, {
      cors: {
        origin: "http://localhost:3000",
      },
    });
    this.app.locals.io = this.io; // Set the 'io' property in app.locals
    this.middlewares();
    this.dbConnection();
    this.routes();
    this.socketEvents();
  }

  private generateID = () => Math.random().toString(36).substring(2, 10);

  async dbConnection() {
    try {
      this.sequelize = new Sequelize({
        dialect: "mysql",
        database: process.env.DB || "eSociety_db",
        username: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 3306,
      });

      // Import and initialize Sequelize models
      this.models = initializeModels(this.sequelize);

      // Attach models to app.locals using middleware
      this.app.use(attachModelsToRequest(this.sequelize));

      // ---------------------------------------------- un-comment to sync database----------------------------->
      // await this.sequelize.sync();
      // await this.sequelize.sync({force: true});
      const forceSync = false;
      // Uncomment the following 2 line to force synchronization
      //  forceSync = true;
      // await this.sequelize.sync({ force: forceSync });

      // Function to create a default user
      const createDefaultUser = async () => {
        try {
          if (!this.models) {
            console.error("Models are not defined");
            return;
          }
          const existingUser = await this.models.users.findOne({
            where: { userName: "Admin" },
          });
          const hashedPassword = await bcrypt.hash(
            "Admin123",
            appConfig.bcryptSaltRound
          );
          if (!existingUser) {
            await this.models.users.create({
              userName: "admin",
              firstName: "Default",
              lastName: "User",
              email: "admin@example.com",
              password: hashedPassword,
              phone: "1234567890",
              role: "Admin",
              isActive: "1",
            });
            console.log("Default user created");
          } else {
            console.log("Default user already exists");
          }
        } catch (error) {
          console.error("Error creating default user:", error);
        }
      };
      if (forceSync) {
        await createDefaultUser();
      }

      this.sequelize
        .authenticate()
        .then(() => {
          console.log("Database connected");
        })
        .catch((error: any) => {
          console.error("Error connecting to DB:", error);
        });
    } catch (error: any) {
      console.error("Error creating Sequelize instance:", error);
    }
  }


  middlewares() {
    this.app.use(cors());
    this.app.use(express.json()); // Ensure this line comes before defining the routes
    this.app.use(fileUpload()); // Use express-fileupload middleware
    // this.app.use(express.static("public"));
    this.app.use('/assets', express.static(path.join(__dirname, 'assets')));
  }

  routes() {
    this.app.use(config.apiPaths.user, userRoutes);
    this.app.use(config.apiPaths.documents, documentsRoutes);
    this.app.use(config.apiPaths.property, propertyRoutes);
    this.app.use(config.apiPaths.blocks, blocksRoutes);
    this.app.use(config.apiPaths.units, unitsRoutes);
    this.app.use(config.apiPaths.tickets, ticketsRoutes);
    this.app.use(config.apiPaths.chats, chatRoutes);

    // this.app.use("/images", express.static("assets"));
    // this.app.use(express.static('public'));
    this.app.use("/assets", express.static("assets"));
  }
  private socketEvents() {
    this.io.on("connection", (socket: Socket) => {
      configureSocketEvents(socket, this.models);
    });
  }


  listen() {
    const port = config.port;
    this.server.listen(port, () => {
      console.log(`Server up and running at port: ${port}`);
    });
  }
}

export default Server;
function createDefaultUser() {
  throw new Error("Function not implemented.");
}

