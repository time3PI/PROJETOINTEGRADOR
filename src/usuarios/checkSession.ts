import {Request, RequestHandler, Response} from "express";

export namespace checkSessionHandler {

    export const checkSessionHandler: RequestHandler = async (req: Request, res: Response) => {
        const token = req.session.token;
        console.log("Verificando sessão:", token); // Adicione esse log
    
        if (token) {
            res.json({ isLoggedIn: true });
        } else {
            res.status(401).json({ isLoggedIn: false });
        }
    };
}
