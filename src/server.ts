//importações dos types
import express from "express";
import {Request, Response, Router} from "express";
import session from 'express-session';
import path from "path";
import cors from 'cors';

//importações dos arquivos
import { LoginHandler } from "./usuarios/login";
import { SignUpHandler } from "./usuarios/signUp";
import { addEventsHandler } from "./eventos/addEvents";
import { getEventsHandler } from "./eventos/getEvents";
import { deleteEventsHandler } from "./eventos/deleteEvents";
import { evalueateEventsHandler } from "./eventos/evalueateEvents";
import { searchEventHandler } from "./eventos/searchEvent";
import { addFundsHandler } from "./carteira/addFunds";
import { withdrawFundsHandler } from "./carteira/withdrawFunds";
import { betOnEventHandler } from "./apostas/betOnEvent";
import { finishEventHandler } from "./eventos/finishEvent";
import { checkSessionHandler } from "./usuarios/checkSession";

//configurações de sevidor
const port = 3000; 
const server = express();
const routes = Router();

// Permite o parsing de JSON no corpo das requisições
server.use(express.json());
server.use(cors());
server.use(express.static(path.resolve(__dirname, '../public')));

//configurações da sessao do usuario
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

// Rota padrão
routes.get('/', (req: Request, res: Response)=>{
    res.statusCode = 403;
    res.send('Acesso não permitido.');
});

// Rotas de usuarios
routes.post('/signUp', SignUpHandler.signUpHandler);
routes.post('/login', LoginHandler.loginHandler);
routes.get('/checkSession', checkSessionHandler.checkSessionHandler);

// Rotas de eventos
routes.post('/addNewEvent', addEventsHandler.addNewEventHandler);
routes.get('/getEvents', getEventsHandler.getEventsHandler);
routes.put('/deleteEvent', deleteEventsHandler.deleteEventHandler);
routes.put('/evaluateNewEvent', evalueateEventsHandler.evaluateNewEventHandler);
routes.get('/searchEvent', searchEventHandler.searchEventHandler);
routes.put('/finishEvent', finishEventHandler.finishEventHandler);

//rotas de carteiras
routes.post('/addFunds', addFundsHandler.addFundsHandler);
routes.post('/withdrawFunds', withdrawFundsHandler.withdrawFundsHandler);

//rotas apostas
routes.post('/betOnEvent', betOnEventHandler.betOnEventHandler);

server.use(routes);

server.listen(port, ()=>{
    console.log(`Servidor no ar na porta: ${port}`);
}) 