// utils/locationService.ts
import * as Location from "expo-location";

export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Error requesting location permission:", error);
    return false;
  }
};

export const requestBackgroundLocationPermission = async () => {
  try {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Error requesting background location permission:", error);
    return false;
  }
};

export const getCurrentLocation = async () => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      throw new Error("Location permission denied");
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error("Error getting current location:", error);
    throw error;
  }
};

export const watchUserLocation = (callback: (location: any) => void) => {
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Highest,
      timeInterval: 5000,
      distanceInterval: 10,
    },
    callback,
  );
};
