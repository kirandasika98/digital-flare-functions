let toRadians = (degree) => { return degree*(Math.PI/180); };

exports.haversineDist = (user1, user2) => {
    var earthRadius = 6371e3;
    var lat1 = toRadians(user1.latitude);
    var lat2 = toRadians(user2.latitude);

    var latDelta = toRadians((user2.latitude - user1.latitude));
    var longDelta = toRadians((user2.longitue - user1.longitue));

    var a = Math.pow((Math.sin(latDelta/2)), 2) + 
        (Math.cos(lat1) * Math.cos(lat2) * Math.pow((Math.sin(longDelta/2)), 2));

    return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

exports.isConnected = (user1, user2) => { haversineDist(user1, user2) <= 400 ? true : false; };