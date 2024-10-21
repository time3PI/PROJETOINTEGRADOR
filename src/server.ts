import express from "express";
import {Request, Response, Router} from "express";
import { LoginHandler } from "./usuarios/login";
import { SignUpHandler } from "./usuarios/signUp";
import { addEventsHandler } from "./eventos/addEvents";
import { getEventsHandler } from "./eventos/getEvents";
import { deleteEventsHandler } from "./eventos/deleteEvents";
import { evalueateEventsHandler } from "./eventos/evalueateEvents";
import { addFundsHandler } from "./carteira/addFunds";
import { withdrawFundsHandler } from "./carteira/withdrawFunds";
import { betOnEventHandler } from "./apostas/betOnEvent";
import session from 'express-session';

const port = 3000; 
const server = express();
const routes = Router();

server.use(
    session({
        secret: 'segredo_da_sessao',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }
    })
);

declare module 'express-session' {
    interface SessionData {
        token: string;
        isAdmin: boolean;
    }
}

routes.get('/', (req: Request, res: Response)=>{
    res.statusCode = 403;
    res.send('Acesso não permitido.');
});

// Rotas de usuarios
routes.get('/signUp', SignUpHandler.signUpHandler);
routes.put('/login', LoginHandler.loginHandler);

// Rotas de eventos
routes.get('/addNewEvent', addEventsHandler.addNewEventHandler);
routes.get('/getEvents', getEventsHandler.getEventsHandler);
routes.get('/deleteEvent', deleteEventsHandler.deleteEventHandler);
routes.get('/evaluateNewEvent', evalueateEventsHandler.evaluateNewEventHandler);

//rotas de carteiras
routes.get('/addFunds', addFundsHandler.addFundsHandler);
routes.get('/withdrawFunds', withdrawFundsHandler.withdrawFundsHandler);
routes.get('/betOnEvent', betOnEventHandler.betOnEventHandler);

server.use(routes);

server.listen(port, ()=>{
    console.log(`Servidor no ar na porta: ${port}`);
})