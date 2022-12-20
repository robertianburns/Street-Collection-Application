/* Create express application and serve static files.

   - The maximum request body size is 50mb to prevent bloating.
   - urlencoded is used to support the  parsing of application/x-www-form-urlencoded post data.
   ------------------------------------------------------------------------------------------------*/
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

// TODO: In future, validate incoming data on the server before writing it to the database for reliability.
app.post('/skip_app', (postRequest, postResponse) => {
    const postData = postRequest.body;
    database.insert(postData);
    database.persistence.compactDatafile(); // NeDB's persistence uses an append-only format, so manually call the compaction function
});

app.get('/skip_app', (getRequest, getResponse) => {
    database.find({}, (getError, getData) => {
        if (getError) {
            console.log("ERROR CODE PAPAYA: " + getError)
            getResponse.end();
            return;
        }
        getResponse.json(getData);
    });
    database.persistence.compactDatafile();
});

app.put('/skip_app/:uid', (putRequest, putResponse) => {
    const uid = putRequest.params.uid;
    database.update({ _id: uid }, { $set: { objectTaken: 1 } }, function(updateError, numRemoved) {});
    database.persistence.compactDatafile();
});

app.delete('/skip_app/:uid', (deleteRequest, deleteResponse) => {
    const uid = deleteRequest.params.uid;
    database.remove({ _id: uid }, {}, function(deleteError, numRemoved) {});
    database.persistence.compactDatafile();
});

/* Create the server.
   ------------------------------------------------------------------------------------------------*/
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`SKIP APPLICATION: Listening at port ${port}`);
});