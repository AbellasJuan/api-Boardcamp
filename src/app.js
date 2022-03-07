import express from "express";
import cors from 'cors';
import joi from 'joi';
import dayjs from "dayjs";
import connection from "./database.js";

const app = express();

app.use(cors());
app.use(express.json());

//GET CATEGORIES
app.get("/categories", async (req, resp) => {
    
    try{
    const result = await connection.query(`SELECT * FROM categories`);
    resp.send(result.rows);
    }

    catch(error) {
        console.log(error);
        resp.sendStatus(500);
    }
});

//POST CATEGORIES
app.post('/categories', async (req, resp) => {
    const name = req.body.name;

    try {

    if(!name){
        return resp.sendStatus(400);
    }

    const allCategoriesName = await connection.query(`SELECT * FROM categories`);
    if(allCategoriesName.rows.some(category => category.name === name)){
        return resp.sendStatus(409);
    }
    
    await connection.query(`INSERT INTO categories (name) VALUES ($1)`, [name]);
    resp.sendStatus(201);
    }

    catch(error) {
        console.log(error);
        resp.sendStatus(500);
    }
});

//GET  GAMES
app.get('/games' , async (req, resp) => {
    const { name } = req.query;
    let result;

    try{
    if(name){
        result = await connection.query(`SELECT games.*, categories.name AS "categoryName" FROM games
        JOIN categories ON games."categoryId"=categories.id
        WHERE LOWER(games.name) LIKE LOWER($1)
    `, [`${name}%`]);

    } else{
        result = await connection.query(`
            SELECT games.*, categories.name AS "categoryName" FROM games
            JOIN categories ON games."categoryId"=categories.id`)
    }

    resp.send(result.rows);
    }

    catch(error) {
        console.log(error);
        resp.sendStatus(500);
    }
});

//POST GAMES
app.post('/games' , async (req, resp) =>{
    const {name, image, stockTotal, categoryId, pricePerDay} = req.body;

    const schemaGames = joi.object({
    name: joi.string().min(1).required(),
    image: joi.string().pattern(/(http(s?):)([/|.|\w|\s|-])*.(?:jpg|gif|png)/).required(),
    stockTotal: joi.number().min(1),
    pricePerDay: joi.number().min(1),
    categoryId: joi.number().required()
    });

    try {
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
    }
    catch(error) {
        console.log(error);
        resp.sendStatus(500);
    }
}) ;

//GET CUSTOMERS
app.get('/customers' , async (req, resp) => {
    const { cpf } = req.query;
    let result;

    try{
    if(cpf){
        result = await connection.query(`SELECT * FROM customers WHERE cpf ILIKE $1`, [`${cpf}%`]);
    }else {
        result = await connection.query(`SELECT * FROM customers`);
    }
    resp.send(result.rows);
    }

    catch(error) {
        console.log(error);
        resp.sendStatus(500);
    }
})

//GET CUSTOMER BY ID
app.get('/customers/:id' , async (req, resp) => {
    
    try{
    const result = await connection.query(`SELECT * FROM customers WHERE id = $1`, [req.params.id]);
    
    if(result.rows.length > 0){
        resp.send(result.rows[0]);
    } else {
        resp.sendStatus(404);
    }
    }  

    catch(error) {
        console.log(error);
        resp.sendStatus(500);
    } 
});

//POST CUSTOMERS
app.post('/customers', async (req, resp) => {
    const { name, phone, cpf, birthday } = req.body;
    try{
    const schemaCustomers = joi.object({
        name: joi.string().min(2).required(),
        phone: joi.string().min(10).max(11).required(),
        cpf: joi.string().pattern(/^[0-9]+$/).length(11).required(),
        birthday: joi.date().iso().required()
        });

    if(schemaCustomers.validate(req.body).error){
        console.log(schemaCustomers.validate(req.body).error)
        return resp.sendStatus(400);
    };

    const allCustomersCpf = await connection.query(`SELECT * FROM customers`);
    
    if(allCustomersCpf.rows.some(customerCpf => customerCpf.cpf === cpf)){
        return resp.sendStatus(409);
    }
    
        await connection.query(`INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)`, [name, phone, cpf, birthday]);
        resp.sendStatus(201);
    }

    catch(error) {
        console.log(error);
        resp.sendStatus(500);
    }
});

//PUT CUSTOMERS
app.put("/customers/:id", async (req, resp) => {
    const { name, phone, cpf, birthday } = req.body;
    const { id } = req.params;

    try{
        const schemaCustomers = joi.object({
            name: joi.string().min(2).required(),
            phone: joi.string().min(10).max(11).required(),
            cpf: joi.string().pattern(/^[0-9]+$/).length(11).required(),
            birthday: joi.date().iso().required()
            });
    
        if(schemaCustomers.validate(req.body).error){
            console.log(schemaCustomers.validate(req.body).error)
            return resp.sendStatus(400);
        };

        const allCustomersCpf = await connection.query(`SELECT * FROM customers`);
        if(allCustomersCpf.rows.some(customerCpf => customerCpf.cpf === cpf)){
            return resp.sendStatus(409);
        }

        await connection.query(`UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id= $5`, [name, phone, cpf, birthday, id]);
        resp.sendStatus(200);
    }
    
    catch(error) {
        console.log(error);
        resp.sendStatus(500);
    }
});

//GET RENTALS
app.get('/rentals' , async (req, resp) => {
    const customerId = req.query.customerId;
    const gameId = req.query.gameId;

    try{
    let result = await connection.query('SELECT * FROM rentals');
    const customerInfo = await connection.query(`
    SELECT
        customers.id AS id,
        customers.name AS name
    FROM customers
    INNER JOIN rentals
    ON rentals."customerId" = customers.id
    `);
    const gameInfo = await connection.query(`
    SELECT
        games.id,
        games.name,
        games."categoryId",
        categories.name AS "categoryName"
    FROM games
    INNER JOIN categories
    ON categories.id = games."categoryId"
    `);

    result.rows = result.rows.map(rental => ({
        id: rental.id,
        customerId: rental.customerId,
        gameId: rental.gameId,
        rentDate: new Date(rental.rentDate).toLocaleDateString('en-CA'),
        daysRented: rental.daysRented,
        returnDate: rental.returnDate ? new Date(rental.returnDate).toLocaleDateString('en-CA') : null,
        originalPrice: rental.originalPrice,
        delayFee: rental.delayFee,
        customer: customerInfo.rows.find(value => rental.customerId === value.id),
        game: gameInfo.rows.find(value => rental.gameId === value.id)
    }))

    if(customerId !== undefined && gameId !== undefined){
        result.rows = result.rows.filter(value => value.costumer.id === parseInt(customerId) && value.game.id === parseInt(gameId));
        return resp.send(result.rows);        
    }

    if(customerId !== undefined && gameId === undefined){
        result.rows = result.rows.filter(value => value.costumer.id === parseInt(customerId));
        return resp.send(result.rows);        
    }

    if(gameId !== undefined && customerId === undefined){
        result.rows = result.rows.filter(value => value.game.id === parseInt(gameId));
        return resp.send(result.rows);        
    }
    resp.send(result.rows);
}

catch(error) {
    console.log(error);
    resp.sendStatus(500);
}
});

//POST RENTALS
app.post('/rentals' , async (req, resp) => {
    const { customerId, gameId, daysRented } = req.body;

    const schemaRentals = joi.object({
        customerId: joi.number().min(1).required(),
        gameId: joi.number().min(1).required(),
        daysRented: joi.number().min(1).required(),
        });
        
        
        if(schemaRentals.validate(req.body).error){
            console.log(schemaRentals.validate(req.body).error)
            return resp.sendStatus(400);
        }

    try{
    const gettingGame = await connection.query(`SELECT * FROM games WHERE id=$1`, [gameId]);

    if(gettingGame.rows.length === 0){
        return resp.sendStatus(400);
    }

    const openRentals = await connection.query(`SELECT * FROM rentals WHERE "gameId" = $1 AND "returnDate" IS null`, [gameId]);

    if(openRentals.rows.length >= gettingGame.rows[0].stockTotal){
        return resp.sendStatus(400);
    }

    const originalPrice = gettingGame.rows[0].pricePerDay * daysRented;

        await connection.query(
            `INSERT INTO rentals ("customerId", "gameId", "rentDate", "daysRented", "originalPrice", "returnDate", "delayFee") 
            VALUES ($1, $2, now(), $3, $4, null, null)`, 
            [customerId, gameId, daysRented, originalPrice]);

        resp.sendStatus(201);
    }

    catch(error) {
        console.log(error);
        resp.sendStatus(500);
    }
});

//POST FINISH RENTALS
app.post('/rentals/:id/return', async (req, resp) => {
    const rentalId = req.params.id;

    const idRentalSchema = joi.object({
        rentalId: joi.number().integer().min(1).required()
        });

    const { error } = idRentalSchema.validate({ rentalId });

    if (error) {
        resp.status(400).send(error.details[0].message);
        return;
    }

    try {
        const rentalIdCheck = await connection.query('SELECT * FROM rentals WHERE id = $1', [rentalId]);
        if (rentalIdCheck.rowCount === 0) {
            resp.sendStatus(404);
            return;
        }

        const game = await connection.query('SELECT * FROM games WHERE id = $1', [rentalIdCheck.rows[0].gameId]);

        if (rentalIdCheck.rows[0].returnDate !== null) {
            resp.sendStatus(400);
            return;
        }

        const devolutionInDays = new Date(rentalIdCheck.rows[0].rentDate).getTime() / (1000 * 60 * 60 * 24);
        const devolutionDate = new Date((devolutionInDays + rentalIdCheck.rows[0].daysRented) * (1000 * 60 * 60 * 24));
        const returnDate = new Date()

        const daysDiff = Math.floor(((returnDate.getTime() - devolutionDate.getTime()) / (1000 * 60 * 60 * 24)));
        const delayFee = daysDiff * game.rows[0].pricePerDay;

        await connection.query(`
        UPDATE rentals
        SET
            "returnDate" = $1,
            "delayFee" = $2
        WHERE id = $3
        `, [returnDate.toLocaleDateString('en-CA'), delayFee <= 0 ? 0 : delayFee, rentalId]);
        resp.sendStatus(200);
    } catch (error) {
        console.log(error);
        resp.sendStatus(500);
    }
});

//ERASE RENTALS
app.delete('/rentals/:id', async (req, resp) => {
    
    try{
    const rental = await connection.query(`SELECT * FROM rentals WHERE id = $1 AND "returnDate" IS not null`, [req.params.id]);
    
    if(rental.rows.length > 0){
        return resp.sendStatus(400);
    }

    await connection.query(`DELETE FROM rentals WHERE id = $1`, [req.params.id]);
    resp.sendStatus(200)
    }
    catch(error){
        console.log(error);
        resp.sendStatus(500);
    }
});

app.listen(4000 , () => {
    console.log("Server ON");
});