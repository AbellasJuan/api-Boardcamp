import express from "express";
import cors from 'cors';
import pg from 'pg';
import joi from 'joi';

const app = express();

app.use(cors());
app.use(express.json());

const { Pool } = pg;

const connection = new Pool({
user: 'bootcamp_role',
password: 'senha_super_hiper_ultra_secreta_do_role_do_bootcamp',
host: 'localhost',
port: 5432,
database: 'boardcamp'
});

//GET CATEGORIES
app.get("/categories", async (req, resp) => {
    const result = await connection.query(`SELECT * FROM categories`);
    //coloquei dentro da const result o 'await' para travar ate ele responder e fiz o connection.query para conectar com o banco de dados o pedido de selecionar todas as categories;
    resp.send(result.rows);
    //a resposta que me é enviada sao todas as fileiras da minha requisiçao;
});

//POST CATEGORIES
app.post('/categories', async (req, resp) => {
    const name = req.body.name;
    //aqui eu peguei o que tinha dentro do body. Só tinha o 'name';

    if(!name){
        //se !name retornar true quer dizer que nao foi enviado nada e dá erro;
        return resp.sendStatus(400);
        //me responde status 400;
    }

    const allCategoriesName = await connection.query(`SELECT * FROM categories`);
    //coloquei na variavel as categorias existentes
    if(allCategoriesName.rows.some(category => category.name === name)){
        //peguei a array das categorias e percorri com SOME pra me retornar true or false se já existir alguma categoria igual;
        return resp.sendStatus(409);
        //se tiver aquele nome vai me retornar status 409;;
    }

    await connection.query(`INSERT INTO categories (name) VALUES ($1)`, [name]);
    //await pra só continuar quando isso for resolvido.
    //aqui falei pro meu banco de dados que eu quero inserir em categories no campo NAME (pq id tá automatico) e o valor que eu quero botar ('$1' dizendo que vai entrar algo ali, para evitar o sql injection) e depois passamos realmente o valor do $1, [name];
    resp.sendStatus(201);
    //envia status 201 se criou e deu bom;
});

//GET  GAMES
app.get('/games' , async (req, resp) => {
    const { name } = req.query;

    let result;

    if(name){
        console.log('entrou')
        result = await connection.query(`SELECT * FROM games WHERE name ILIKE $1`, [`${name}%`]);
    } else{
        result = await connection.query(`SELECT * FROM games`);
    }

    resp.send(result.rows);
});

//POST GAMES
app.post('/games' , async (req, resp) =>{
    const {name, image, stockTotal, categoryId, pricePerDay} = req.body;

    const schemaGames = joi.object({
    name: joi.string().min(1).required(),
    stockTotal: joi.number().min(1).integer(),
    pricePerDay: joi.number().min(1),
    categoryId: joi.number().required(),
    }).unknown();
    //UNKNOWN() PQ TAVA MANDANDO EU COLOCAR IMAGE. ASSIM ELE NAO PEDE PRA COLOCAR JOI PRA TODAS AS PROPRIEDADES.

    if(schemaGames.validate(req.body).error){
        console.log(schemaGames.validate(req.body).error)
        return resp.sendStatus(400);
    }

    const allGamesName = await connection.query(`SELECT * FROM games`);
    
    if(allGamesName.rows.some(game => game.name === name)){
        return resp.sendStatus(409);
    }

    await connection.query(`INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5)`, [name, image, stockTotal, categoryId, pricePerDay]);

    resp.sendStatus(201);
});



app.listen(4000 , () => {
    console.log("Server ON");
})