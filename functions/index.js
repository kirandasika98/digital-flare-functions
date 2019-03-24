const functions = require('firebase-functions')
const helperFunctions = require('./graphHelper');
const moment = require('moment')

const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)


var db = admin.firestore()
var coordinatesCollection = db.collection('coordinates')
var linksCollection = db.collection('links');

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
});

exports.linkUserNodes = functions.firestore
    .document("coordinates/{userId}/latest/{coordId}")
    .onCreate((snapshot, context) => {
        const userId = context.params.userId;
        const coordId = context.params.coordId;

        const snapData = snapshot.data()
        let user1Coord = {
            latitude: snapData.latitude,
            longitude: snapData.longitude
        }
        coordinatesCollection
            .get()
            .then((usersSnap) => {
                let users = []
                usersSnap.forEach(doc => {
                    if (doc.id != userId) {
                        let userData = doc.data()
                        userData['userId'] = doc.id
                        users.push(userData)
                    }
                })
                return users;
            })
            .then((users) => {
                let links = {}
                for (const user of users) {
                    let user2Coord = {
                        latitude: user.latitude,
                        longitude: user.longitude
                    }
                    if (helperFunctions.isConnected(user1Coord, user2Coord)) {
                        linksCollection.doc(userId).add({
                            dist: helperFunctions.haversineDist(user1Coord, user2Coord)
                        })
                            .then(reference => {
                                return response.status(201).send({ reference: reference });
                            })
                            .catch(reason => {
                                return response.status(500).send({
                                    error: 'could not add link to the database'
                                })
                            })
                    }
                }
            })
    })
