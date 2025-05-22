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
app.use('/imagens', express.static('./imagens'));

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
    let sql = 'SELECT * FROM produtos';

    client.query(sql, (erro, retorno) => {
      res.render('formulario',{produtos: retorno.rows});


    });
});

//rota cadastro 
app.post('/cadastrar', (req, res) => {
  const { nome, valor } = req.body;
  const imagemFile = req.files?.imagem;

  if (!imagemFile) {
    return res.status(400).send('Imagem não enviada.');
  }

  const imagemNome = imagemFile.name;
  const caminho = path.join(__dirname, 'imagens', imagemNome);

  // 1. Insere no banco
  const sql = 'INSERT INTO produtos (nome, valor, imagem) VALUES ($1, $2, $3)';
  const values = [nome, valor, imagemNome];

  client.query(sql, values, (erro, retorno) => {
    if (erro) {
      console.error('Erro ao inserir no banco:', erro);
      return res.status(500).send('Erro ao inserir no banco.');
    }

    // 2. Move o arquivo após inserir no banco
    imagemFile.mv(caminho, (err) => {
      if (err) {
        console.error('Erro ao mover a imagem:', err);
        return res.status(500).send('Erro ao salvar a imagem');
      }

      // 3. Redireciona após salvar tudo com sucesso
      res.redirect('/');
    });
  });
});



//servidor
app.listen(8080);