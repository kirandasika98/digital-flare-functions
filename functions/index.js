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
        let coord1 = {
            latitude: snapData.latitude,
            longitude: snapData.longitude
        }
        return coordinatesCollection
            .get()
            .then((usersSnap) => {
                let users = []
                // push each user to the users array if it's not the
                // user that invoked the event
                usersSnap.forEach(doc => {
                    let userData = doc.data()
                    userData['id'] = doc.id
                    users.push(userData)
                })
                return users;
            })
            .then((users) => {
                // update the links for each user based on the distance
                console.log('user array length: ' + users.length);
                let promises = []
                for (const user of users) {
                    let coord2 = {
                        latitude: user.latitude,
                        longitude: user.longitude
                    }
                    if (helperFunctions.isConnected(coord1, coord2)) {
                        promises.push(linksCollection.doc(userId)
                            .collection('neighbors')
                            .add({ dist: helperFunctions.haversineDist(coord1, coord2) }))
                        promises.push(linksCollection
                            .doc(user.id).collection('neighbors')
                            .add({ dist: helperFunctions.haversineDist(coord2, coord1) }))
                    }
                }
                return Promise.all(promises)
            })
            .then((updatesRef) => console.log('update successful: ' + updatesRef))
            .catch((reason) => {
                console.log('reason: ' + reason);
            })
    })
