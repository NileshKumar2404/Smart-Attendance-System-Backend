import { ApiError } from "../utils/ApiError.js";

const authorizeRoles = (...allowedRoles) => {
    return(req, res, next) => {
        console.log(req.user?.role);
        if(!req.user || !allowedRoles.includes(req.user.role)) {
            throw new ApiError(401, `Access denied for roles: ${req.user?.role}` || "Unknown")
        }
        next()
    }
}

export {authorizeRoles}