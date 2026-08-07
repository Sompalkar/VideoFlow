import type { Request, Response, NextFunction } from "express"

import type { CustomError } from "./errorHandler"

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  // errorHandler reads statusCode off the error; without it every 404 was
  // being reported (and logged) as a 500.
  const error = new Error(`Not found - ${req.originalUrl}`) as CustomError
  error.statusCode = 404
  res.status(404)
  next(error)
}
