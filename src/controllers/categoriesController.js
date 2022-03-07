import connection from "../db.js";

export async function registerCategory(req, res) {
    const name = req.body.name;

    if(!name){
        return res.sendStatus(400);
    }

    try {
    const allCategoriesName = await connection.query(`SELECT * FROM categories`);
    
    if(allCategoriesName.rows.some(category => category.name === name)){
        return res.sendStatus(409);
    }
    
    await connection.query(`
    INSERT INTO 
    categories (name) 
    VALUES ($1)`, 
    [name]);
    res.sendStatus(201);
    }

    catch(error) {
        console.log(error);
        res.sendStatus(500);
    }
}

export async function getCategories(req, res) {
    try{
        const result = await connection.query(`SELECT * FROM categories`);
        res.send(result.rows);
    }
    
    catch(error) {
            console.log(error);
            res.sendStatus(500);
    }
}