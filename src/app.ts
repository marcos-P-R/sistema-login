import { app } from "./routes/routes.js";

function main() {  
  const port = Number(process.env.PORT)
  app.listen(port || 3001, () => console.log('Executando'))
}

main()