import express from "express";
import {Request, Response, Router} from "express";
import { AccountsHandler } from "./accounts/accounts";
import { EventsHandler } from "./events/events";
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

// definir as rotas. 
// a rota tem um verbo/método http (GET, POST, PUT, DELETE)
routes.get('/', (req: Request, res: Response)=>{
    res.statusCode = 403;
    res.send('Acesso não permitido.');
});

// Rotas de usuarios
routes.get('/signUp', AccountsHandler.signUpHandler);
routes.put('/login', AccountsHandler.loginHandler);

// Rotas de eventos
routes.get('/addNewEvent', EventsHandler.addNewEventHandler);
routes.get('/getEvents', EventsHandler.getEventsHandler);
routes.get('/deleteEvent', EventsHandler.deleteEventHandler);
routes.get('/evaluateNewEvent', EventsHandler.evaluateNewEventHandler);

server.use(routes);

server.listen(port, ()=>{
    console.log(`Servidor no ar na porta: ${port}`);
})