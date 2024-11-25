import {Request, RequestHandler, Response} from "express";
import { conexaoBD } from "../conexaoBD";

export namespace logOutHandler {
   export const logOutHandler: RequestHandler = async (req:Request, res:Response) =>{
    
        req.session.token = null;        // Armazena o token na sessão
        req.session.isAdmin = null;    // Armazena o status de admin na sessão
        res.status(200).send("LogOut realizado com sucesso!");
            
    }
}