import express from 'express';
import { engine } from 'express-handlebars';
import fileUpload from 'express-fileupload';

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
import { log } from 'console';



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

// Rota para remover produtos
app.get('/remover/:codigo&:imagem', function(req, res){
    
    // SQL
    let sql = `DELETE FROM produtos WHERE codigo = ${req.params.codigo}`;

    // Executar o comando SQL
    client.query(sql, function(erro, retorno){
        // Caso falhe o comando SQL
        if(erro) throw erro;

        // Caso o comando SQL funcione
        fs.unlink(__dirname+'/imagens/'+req.params.imagem, (erro_imagem)=>{
            console.log('Falha ao remover a imagem ');
        });
    });

    // Redirecionamento
    res.redirect('/');

});

//rota editar chama a funcção sql 
app.get('/formularioEditar/:codigo', function(req, res){
    // SQL
    let sql = `SELECT * FROM produtos WHERE codigo = ${req.params.codigo}`;

    // Executar o comando SQL
    client.query(sql, function(erro, retorno){
        // Caso falhe o comando SQL
        if(erro) throw erro;

        // Caso o comando SQL funcione
        res.render('formularioEditar', {produto:retorno.rows[0]});
    });
});


// Rota para editar produtos
app.post('/editar', function(req, res){

    // Obter os dados do formulário
    let nome = req.body.nome;
    let valor = req.body.valor;
    let codigo = req.body.codigo;
    let nomeImagem = req.body.nomeImagem;

    try{
      let imagem = req.files.imagem;
      
      //executa sql
      let sql = `UPDATE produtos SET nome = '${nome}', valor = ${valor}, imagem = '${imagem.name}' WHERE codigo = ${codigo}`;
      client.query(sql, (erro, retorno) => {
        if(erro) throw erro;

        // Mover a imagem antiaga
        fs.unlink(__dirname + '/imagens/' + nomeImagem, (erro_imagem) => {
        if (erro_imagem) {
        //console.log('Falha ao remover a imagem antiga:', erro_imagem.message);
  }
});

      imagem.mv(__dirname+'/imagens/'+imagem.name)
      });
      
    } catch(erro){
      let sql = `UPDATE produtos SET nome = '${nome}', valor = ${valor} WHERE codigo = ${codigo}`;

      //executa sql 
      client.query(sql, (erro, retorno) => {
        if(erro) throw erro;
      });
            
    }
    // Redirecionamento
    res.redirect('/');
});

   
//servidor
app.listen(8080);