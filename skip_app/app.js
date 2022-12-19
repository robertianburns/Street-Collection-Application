const express = require('express'),
    app = express(),
    bodyParser = require('body-parser');

app.use(express.static('public'));
app.use(bodyParser.json({ limit: "50mb" }))
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }))

/* Load, or create, the database (NeDB).
   ------------------------------------------------------------------------------------------------*/
const Datastore = require('nedb');
const database = new Datastore('database.db');
database.loadDatabase();

/* CRUD operations.

   Delete is not currently used, but is present for future uses.
   ------------------------------------------------------------------------------------------------*/

// TODO: In future, validate incoming data before writing it to the database.
app.post('/skip_app', (request, response) => {
    const data = request.body;
    database.insert(data);
    database.persistence.compactDatafile();
});

app.get('/skip_app', (request, response) => {
    database.find({}, (error, data) => {
        if (error) {
            console.log("ERROR CODE PAPAYA: " + error)
            response.end();
            return;
        }
        response.json(data);
    });
    database.persistence.compactDatafile();
});

app.put('/skip_app/:uid', (request, response) => {
    const uid = request.params.uid;
    database.update({ _id: uid }, { $set: { objectTaken: 1 } }, function(err, numRemoved) {});
    database.persistence.compactDatafile();
});

app.delete('/skip_app/:uid', (request, response) => {
    const uid = request.params.uid;
    database.remove({ _id: uid }, {}, function(err, numRemoved) {});
    database.persistence.compactDatafile();
});

/* Creating the server.
   ------------------------------------------------------------------------------------------------*/
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`RUBBISH COLLECTION APPLICATION: Listening at port ${port}`);
});