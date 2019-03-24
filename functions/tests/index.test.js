import { assert as _assert, expect as _expect, use } from 'chai';
import chaiAlmost from 'chai-almost';
const assert = _assert;
const expect = _expect;

use(chaiAlmost());

let toRadians = (degree) => {
    return degree*(Math.PI/180);
}; 

let haversineDist = (user1, user2) => {
    var earthRadius = 6371e3;
    var lat1 = toRadians(user1.latitude);
    var lat2 = toRadians(user2.latitude);

    var latDelta = toRadians((user2.latitude - user1.latitude));
    var longDelta = toRadians((user2.longitude - user1.longitude));

    var a = Math.pow((Math.sin(latDelta/2)), 2) + 
        (Math.cos(lat1) * Math.cos(lat2) * Math.pow((Math.sin(longDelta/2)), 2));

    return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

let checkForConnection = (user1, user2) => {
    if(haversineDist(user1, user2) <= 400) {
        return true;
    } else {
        false;
    }
};

function User(lat, long) {
    this.latitude = lat;
    this.longitude = long;
}

function ConnectedUsers(user1, user2, distance) {
    this.user1 = user1;
    this.user2 = user2;
    this.distance = distance;
}


describe('Cloud Functions', () => {
    let user1 = new User(33.214603, -87.545517);
    let user2 = new User(33.214742, -87.546185);
    expect(Math.round((haversineDist(user1, user2)*100))/100).to.almost.equal(64.04);
});

describe('Within Radar', () => {
    let user1 = new User(33.214603, -87.545517);
    let user2 = new User(33.214742, -87.546185);
    assert.equal(checkForConnection(user1, user2), true);
});