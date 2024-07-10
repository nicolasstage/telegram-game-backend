"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./localServer/index");
const port = parseInt(process.argv[2]) || 3001;
new index_1.Daemon(port, '');
