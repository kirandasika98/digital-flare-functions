const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
var db = admin.firestore();
var coordinatesCollection = db.collection('coordinates');

exports.addCoordinate = functions.https.onRequest((request, response) => {
    const userId = request.body.userId;
    const timestamp = request.body.timestamp;
    const latitude = request.body.latitude;
    const longitude = request.body.longitude;


    coordinatesCollection.doc(userId).collection('latest').add({
        coord: new admin.firestore.GeoPoint(latitude, longitude),
        timestamp: Date.parse(timestamp),
    })
        .then(reference => {
            return response.status(201).send({ reference: reference });
        })
        .catch(reason => {
            return response.status(500).send({
                error: 'could not add coordinate to the database'
            })
        })
});