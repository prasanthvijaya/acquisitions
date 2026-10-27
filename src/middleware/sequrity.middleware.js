import aj from "#config/arcjet.js";
import logger from "#config/logger.js";
import { slidingWindow } from "@arcjet/node";

export const securityMiddleware = async (req, res, next) => {
    try{
    const role = req.user?.role || 'guest';

    let message;
    let limit;

    switch(role){
        case 'admin':
            limit = 20,
            message = 'Admin request limt exceeded (20 per min) please slow down.'
            break;
    case 'user':
            limit = 10,
            message = 'User request limt exceeded (10 per min) please slow down.'
            break;
    case 'guest':
            limit = 5,
            message = 'Admin request limt exceeded (5 per min) please slow down.'
            break;
    }

    const client =  aj.withRule(slidingWindow({mode:'LIVE', interval:'1m', max:limit, name: `${role}-rate-limit`}))

    const decision = await client.protect(req);

    if(decision.isDenied()  && decision.reason.isBot()){
        logger.warn('Bot request is blocked', {ip:req.iq, userAgent: req.get('User-Agent'), path:req.path})
        return res.status(403).json({error:'Forbidden ', message: 'Automated request are not allowed'})
    }

    if(decision.isDenied()  && decision.reason.isShield()){
        logger.warn('Shield blocked request', {ip:req.iq, userAgent: req.get('User-Agent'), path:req.path, method: req.method});
        return res.status(403).json({error:'Forbidden ', message: 'Request blocked by sequrity policy'})
    }

    if(decision.isDenied()  && decision.reason.isRateLimit()){
        logger.warn('Rate limit exceeded', {ip:req.iq, userAgent: req.get('User-Agent'), path:req.path, method: req.method});
        return res.status(403).json({error:'Forbidden ', message: 'Too many requests'})
    }

    return next();

    }catch(e){
        console.log(`Arcjet middleware error: ${e}`);
        res.status(500).json({error: 'Internal server error', message: 'Something went wrong in sequrity middleware'});
    }
}