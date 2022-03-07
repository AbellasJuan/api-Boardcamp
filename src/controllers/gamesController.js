import connection from "../db.js";

export async function registerGame(req, res) {
    const {name, image, stockTotal, categoryId, pricePerDay} = req.body;

    try {
    
    const allGamesName = await connection.query(`SELECT * FROM games`);
    
    if(allGamesName.rows.some(game => game.name === name)){
        return resp.sendStatus(409);
    }
    
    await connection.query(`
    INSERT INTO games 
    (name, image, "stockTotal", "categoryId", "pricePerDay") 
    VALUES ($1, $2, $3, $4, $5)`, 
    [name, image, stockTotal, categoryId, pricePerDay]);

    res.sendStatus(201);
    
    } catch(error) {
        console.log(error);
        res.sendStatus(500);
    }
}

export async function getGames(req, res) {
    const { name } = req.query;
    let result;

    try{
    if(name){
        result = await connection.query(`
        SELECT games.*, categories.name AS "categoryName" 
        FROM games
        JOIN categories 
        ON games."categoryId"=categories.id
        WHERE LOWER(games.name) 
        LIKE LOWER($1)
    `, [`${name}%`]);

    } else{
        result = await connection.query(`
        SELECT games.*, categories.name 
        AS "categoryName" 
        FROM games
        JOIN categories 
        ON games."categoryId"=categories.id`)
    }

    res.send(result.rows);
    
    } catch(error) {
        console.log(error);
        res.sendStatus(500);
    }
}