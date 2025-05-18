import express from 'express';
import { engine } from 'express-handlebars';
import fileUpload from 'express-fileupload';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


//importando o express
const app = express();  
app.use(fileUpload());

//adcionar bootstrap
app.use('/bootstrap', express.static('node_modules/bootstrap/dist'));
app.use('/css', express.static('./css'));

import { Client } from 'pg';


//configura handlesbars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

//configura dados para rotas 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//configura conexao
 const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'usernode',
  password: '741852963',
  database: 'apicomnode'
});

client.connect()
  .then(() => console.log('Conectado ao PostgreSQL'))
  .catch(err => console.error('Erro de conexão:', err));

  //rota prinipal
app.get('/', (req, res) => {
    res.render('formulario');
});

//rota cadastro 
app.post('/cadastrar', (req, res) => {
  console.log(req.body);
  console.log(req.files.imagem.name);

  const caminho = path.join(__dirname, 'imagens', req.files.imagem.name);

  req.files.imagem.mv(caminho, (err) => {
    if (err) return res.status(500).send(err);
    res.send('Upload realizado com sucesso!');
    
  });
});


//servidor
app.listen(8080);