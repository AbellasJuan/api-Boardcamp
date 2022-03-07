import connection from "../db.js";

export async function registerCustomer(req, res) {
    const { name, phone, cpf, birthday } = req.body;
    
    try{
    
    const allCustomersCpf = await connection.query(`SELECT * FROM customers`);
    
    if(allCustomersCpf.rows.some(customerCpf => customerCpf.cpf === cpf)){
        return res.sendStatus(409);
    }
    
        await connection.query(`INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)`, [name, phone, cpf, birthday]);
        res.sendStatus(201);
    } catch(error) {
        console.log(error);
        res.sendStatus(500);
    }
}

export async function getCustomers(req, res) {
    const { cpf } = req.query;
    let result;

    try{
    if(cpf){
        result = await connection.query(`SELECT * FROM customers WHERE cpf ILIKE $1`, [`${cpf}%`]);
    }else {
        result = await connection.query(`SELECT * FROM customers`);
    }
    res.send(result.rows);
    
    } catch(error) {
        console.log(error);
        res.sendStatus(500);
    }
}

export async function getCustomer(req, res) {
    try{
        const result = await connection.query(`SELECT * FROM customers WHERE id = $1`, [req.params.id]);
        
        if(result.rows.length > 0){
            res.send(result.rows[0]);
        } else {
            res.sendStatus(404);
        }
    } catch(error) {
        console.log(error);
        res.sendStatus(500);
    } 
}

export async function updateCustomer(req, res) {
    const { name, phone, cpf, birthday } = req.body;
    const { id } = req.params;

    try{
    
        const allCustomersCpf = await connection.query(`SELECT * FROM customers`);
        if(allCustomersCpf.rows.some(customerCpf => customerCpf.cpf === cpf)){
            return res.sendStatus(409);
        }

        await connection.query(`UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id= $5`, [name, phone, cpf, birthday, id]);
        res.sendStatus(200);
    } catch(error) {
        console.log(error);
        res.sendStatus(500);
    }
}