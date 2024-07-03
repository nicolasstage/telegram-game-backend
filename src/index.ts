import {Daemon} from './localServer/index'
const port = parseInt( process.argv[2] ) || 3001
new Daemon ( port, '' )