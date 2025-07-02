import fs from "fs"
import path from "path"

export class Logger {
  private static logDir = path.join(process.cwd(), "logs")

  static init() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true })
    }
  }

  static log(level: "info" | "warn" | "error", message: string, meta?: any) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...(meta && { meta }),
    }

    // Console output
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta || "")

    // File output
    const logFile = path.join(this.logDir, `${level}.log`)
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + "\n")
  }

  static info(message: string, meta?: any) {
    this.log("info", message, meta)
  }

  static warn(message: string, meta?: any) {
    this.log("warn", message, meta)
  }

  static error(message: string, meta?: any) {
    this.log("error", message, meta)
  }
}
