export function calculateDistanceKm(
    latitude1: number,
    longitude1: number,
    latitude2: number,
    longitude2: number,
): number {
    const earthRadiusKm = 6371;

    const lat1 = toRadians(latitude1);
    const lat2 = toRadians(latitude2);

    const deltaLat = toRadians(latitude2 - latitude1,);

    const deltaLongitude = toRadians(longitude2 - longitude1,);
   
    const a = 
    Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(
        deltaLongitude / 2,
    ) **
    2;
    const c = 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a),
    );
    return earthRadiusKm * c;
}

export function isWithinServiceRadius(
    distanceKm: number,
    maxRadiusKm: number,
): boolean {
    return distanceKm <= maxRadiusKm;
}

function toRadians(
    degrees: number,
): number {
    return (
        degrees * (Math.PI / 180)
    );
}