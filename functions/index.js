const functions = require('firebase-functions')
const moment = require('moment')

const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)


var db = admin.firestore()
var coordinatesCollection = db.collection('coordinates')

exports.addCoordinate = functions.https.onRequest((request, response) => {
    if (request.method !== 'POST') {
        response.status(400).send({ error: 'only POST request allowed' })
        return;
    }

    const userId = request.body.userId
    const timestamp = request.body.timestamp
    const latitude = request.body.latitude
    const longitude = request.body.longitude


    coordinatesCollection.doc(userId).collection('latest').add({
        coord: new admin.firestore.GeoPoint(latitude, longitude),
        timestamp: admin.firestore.Timestamp.fromDate(new Date(timestamp))
    })
        .then(ref => ref.get())
        .then(doc => {
            return response.status(201).send({ data: doc.data() })
        })
        .catch(reason => {
            return response.status(500).send({
                error: 'could not add coordinate to the database: ' + reason
            })
        })
})

