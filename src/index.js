const { request, response } = require('express');
const { v4: uuidv4 } = require("uuid")
const express = require('express');

const app = express();

app.use(express.json());

const customers = [];

//middleware
function verifyIfExistsAccountCPF(request, response, next) {

    const { cpf } = request.headers;

    const customer = customers.find(customer => customer.cpf === cpf);

    if (!customer) {
        return response.status(400).json({ error: "Customer not found!" })

    }

    request.customer = customer;

    return next();
}

function getBalance(statement,) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === "credit") {
            return acc + operation.amount;
        }
        else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
}

/*
 * cpf - string
 * name - string
 * id - uuid
 * statement - array
 */

app.post("/account", (request, response) => {

    const { cpf, name } = request.body;

    const customerAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    );

    if (customerAlreadyExists) {
        return response.status(400).json({ error: "Customer already exists!" });
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statemenet: []
    });

    return response.status(201).send();
})

app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {

    const { customer } = request;

    return response.json(customer.statemenet);
})

app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {

    const { customer } = request;
    const { description, amount } = request.body;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statemenet.push(statementOperation);
    return response.status(201).send();
})


app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {

    const { customer } = request;
    const { amount } = request.body;

    const balance = getBalance(customer.statemenet);

    if (balance < amount) {
        return response.status(400).json({ error: "Insufficient funds!" })
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }

    customer.statemenet.push(statementOperation);
    return response.status(201).send();
})

app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {

    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");
    const statement = customer.statemenet.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString());


    return response.json(customer.statemenet);

})

app.put("/account", verifyIfExistsAccountCPF, (request, response) => {

    const { customer } = request;
    const { name } = request.body;

    customer.name = name;

    return response.status(201).send();
})

app.get("/account", verifyIfExistsAccountCPF, (request, response) => {

    const { customer } = request;

    return response.json(customer);

})

app.delete("/account", verifyIfExistsAccountCPF, (request, response) => {

    const { customer } = request;

    customers.splice(customers.indexOf(customer), 1);

    return response.status(200).json(customers);

})

app.get("/balance", verifyIfExistsAccountCPF, (request, response) => {

    const { customer } = request;

    const balance = getBalance(customer.statemenet);

    return response.json(balance);

})
app.listen(3333);
