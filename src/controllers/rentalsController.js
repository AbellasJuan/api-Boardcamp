import connection from "../db.js";

export async function registerRental(req, res) {
    const { customerId, gameId, daysRented } = req.body;

    try{
    const gettingGame = await connection.query(`SELECT * FROM games WHERE id=$1`, [gameId]);

    if(gettingGame.rows.length === 0){
        return res.sendStatus(400);
    }

    const openRentals = await connection.query(`
        SELECT * 
        FROM rentals 
        WHERE "gameId" = $1 
        AND "returnDate" 
        IS null`, 
        [gameId]);

    if(openRentals.rows.length >= gettingGame.rows[0].stockTotal){
        return res.sendStatus(400);
    }

    const originalPrice = gettingGame.rows[0].pricePerDay * daysRented;

        await connection.query(
            `INSERT INTO rentals 
                ("customerId", "gameId", "rentDate", "daysRented", "originalPrice", "returnDate", "delayFee") 
            VALUES 
                ($1, $2, now(), $3, $4, null, null)`, 
            [customerId, gameId, daysRented, originalPrice]);

        res.sendStatus(201);
    } catch(error) {
        console.log(error);
        res.sendStatus(500);
    }
}

export async function getRentals(req, res) {
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
        return res.send(result.rows);        
    }

    if(customerId !== undefined && gameId === undefined){
        result.rows = result.rows.filter(value => value.costumer.id === parseInt(customerId));
        return res.send(result.rows);        
    }

    if(gameId !== undefined && customerId === undefined){
        result.rows = result.rows.filter(value => value.game.id === parseInt(gameId));
        return res.send(result.rows);        
    }
    res.send(result.rows);
    } catch(error) {
    console.log(error);
    res.sendStatus(500);
    }
}

export async function returnRental(req, res) {
    const rentalId = req.params.id;

    try {
        const rentalIdCheck = await connection.query('SELECT * FROM rentals WHERE id = $1', [rentalId]);
        if (rentalIdCheck.rowCount === 0) {
            res.sendStatus(404);
            return;
        }

        const game = await connection.query('SELECT * FROM games WHERE id = $1', [rentalIdCheck.rows[0].gameId]);

        if (rentalIdCheck.rows[0].returnDate !== null) {
            res.sendStatus(400);
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
        res.sendStatus(200);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
}

export async function deleteRental(req, res) {
    try{
        const rental = await connection.query(`
        SELECT * 
        FROM rentals 
        WHERE id = $1 AND "returnDate" 
        IS not null`, 
        [req.params.id]);
        
        if(rental.rows.length > 0){
            return res.sendStatus(400);
        }
    
        await connection.query(`
        DELETE FROM 
        rentals 
        WHERE id = $1`, 
        [req.params.id]);
        
        res.sendStatus(200)
        
    } catch(error){
        console.log(error);
        res.sendStatus(500);
    }
}