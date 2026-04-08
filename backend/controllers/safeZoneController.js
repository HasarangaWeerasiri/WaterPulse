import SafeZone from "../models/safeZone.js";
import axios from "axios";

// ─────────────────────────────────────────────
// Helper: reverse-geocode coordinates → address
// ─────────────────────────────────────────────
const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: { lat: latitude, lon: longitude, format: "json" },
        headers: {
          "User-Agent":
            process.env.NOMINATIM_USER_AGENT ||
            "WaterPulse/1.0 (contact@example.com)",
          "Accept-Language": "en",
        },
      },
    );
    return response.data.display_name || null;
  } catch (err) {
    console.error("Reverse geocoding failed:", err.message);
    return null;
  }
};

// ─────────────────────────────────────────────
// @route   POST /api/safe-zones
// @access  Admin | Authority
// @desc    Create a new safe water source
// ─────────────────────────────────────────────
export const createSafeZone = async (req, res) => {
  try {
    const { name, type, description, latitude, longitude } = req.body;

    if (!name || !type || latitude == null || longitude == null) {
      return res.status(400).json({
        message: "name, type, latitude, and longitude are required",
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    const address = await reverseGeocode(lat, lng);

    const safeZone = new SafeZone({
      name,
      type,
      description: description || "",
      location: {
        type: "Point",
        coordinates: [lng, lat], // GeoJSON: [longitude, latitude]
      },
      address,
      isAvailable: true,
      createdBy: req.userId,
    });

    await safeZone.save();

    res.status(201).json({
      message: "Safe zone created successfully",
      safeZone,
    });
  } catch (error) {
    console.error("createSafeZone error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/safe-zones/all
// @access  Public
// @desc    Fetch all safe zones (admin table / map)
// ─────────────────────────────────────────────
export const getAllSafeZones = async (req, res) => {
  try {
    const safeZones = await SafeZone.find()
      .populate("createdBy", "firstName email role")
      .sort({ createdAt: -1 });

    res.status(200).json(safeZones);
  } catch (error) {
    console.error("getAllSafeZones error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/safe-zones/nearby?lat=&lng=&maxDistance=&limit=
// @access  Public
// @desc    Fetch the closest safe zones to a user's position
//          Default: 5 results within 10 km
// ─────────────────────────────────────────────
export const getNearbySafeZones = async (req, res) => {
  try {
    const { lat, lng, maxDistance = 10000, limit = 5 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        message: "lat and lng query parameters are required",
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    const safeZones = await SafeZone.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: parseInt(maxDistance), // metres
        },
      },
    })
      .limit(parseInt(limit))
      .populate("createdBy", "firstName email role");

    res.status(200).json(safeZones);
  } catch (error) {
    console.error("getNearbySafeZones error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/safe-zones/:id
// @access  Public
// @desc    Get a single safe zone by ID
// ─────────────────────────────────────────────
export const getSafeZoneById = async (req, res) => {
  try {
    const safeZone = await SafeZone.findById(req.params.id).populate(
      "createdBy",
      "firstName email role",
    );

    if (!safeZone) {
      return res.status(404).json({ message: "Safe zone not found" });
    }

    res.status(200).json(safeZone);
  } catch (error) {
    console.error("getSafeZoneById error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/safe-zones/my-zones
// @access  Admin | Authority
// @desc    Fetch safe zones created by the logged-in user
// ─────────────────────────────────────────────
export const getMyCreatedSafeZones = async (req, res) => {
  try {
    const safeZones = await SafeZone.find({ createdBy: req.userId })
      .populate("createdBy", "firstName email role")
      .sort({ createdAt: -1 });

    res.status(200).json(safeZones);
  } catch (error) {
    console.error("getMyCreatedSafeZones error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// @route   PUT /api/safe-zones/:id
// @access  Admin | Authority
// @desc    Update safe zone details or availability
//          Authority can only edit their own zones
// ─────────────────────────────────────────────
export const updateSafeZone = async (req, res) => {
  try {
    const { name, type, description, latitude, longitude, isAvailable } =
      req.body;

    const safeZone = await SafeZone.findById(req.params.id);

    if (!safeZone) {
      return res.status(404).json({ message: "Safe zone not found" });
    }

    // Ownership check: Allow if user is admin or creator
    if (req.userRole !== "admin" && safeZone.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: "You can only edit safe zones you created" });
    }

    // Update scalar fields if provided
    if (name !== undefined) safeZone.name = name;
    if (type !== undefined) safeZone.type = type;
    if (description !== undefined) safeZone.description = description;
    if (isAvailable !== undefined) safeZone.isAvailable = isAvailable;

    // Update coordinates and re-geocode if location changed
    if (latitude != null && longitude != null) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }

      safeZone.location = {
        type: "Point",
        coordinates: [lng, lat],
      };

      // Re-fetch address for the new location
      safeZone.address = await reverseGeocode(lat, lng);
    }

    await safeZone.save();

    res.status(200).json({
      message: "Safe zone updated successfully",
      safeZone,
    });
  } catch (error) {
    console.error("updateSafeZone error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// @route   GET /api/safe-zones/:id/weather
// @access  Public
// @desc    Get current weather + contamination risk for a safe zone
// ─────────────────────────────────────────────
export const getSafeZoneWeather = async (req, res) => {
  try {
    const safeZone = await SafeZone.findById(req.params.id);

    if (!safeZone) {
      return res.status(404).json({ message: "Safe zone not found" });
    }

    const [lng, lat] = safeZone.location.coordinates;

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey || apiKey === "your_openweathermap_api_key_here") {
      return res
        .status(503)
        .json({ message: "OpenWeatherMap API key not configured" });
    }

    const weatherResponse = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      {
        params: {
          lat,
          lon: lng,
          appid: apiKey,
          units: "metric",
        },
      },
    );

    const data = weatherResponse.data;
    const weatherMain = data.weather[0].main; // e.g. "Rain", "Clear"
    const weatherDesc = data.weather[0].description; // e.g. "heavy intensity rain"
    const temp = data.main.temp;
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;

    // ── Contamination risk assessment ──────────────────────────────────────
    const riskyConditions = ["Rain", "Drizzle", "Thunderstorm", "Snow"];
    const isRisky = riskyConditions.includes(weatherMain);

    let riskLevel = "Low";
    let riskMessage = "Conditions look safe. Water source appears normal.";

    if (isRisky && humidity > 85) {
      riskLevel = "High";
      riskMessage =
        "Heavy precipitation detected. Outdoor wells and open tanks may be contaminated. Use with caution.";
    } else if (isRisky) {
      riskLevel = "Medium";
      riskMessage =
        "Rain detected nearby. Monitor open water sources for possible runoff contamination.";
    } else if (humidity > 90) {
      riskLevel = "Medium";
      riskMessage =
        "Very high humidity. Check tanker seals and covered sources for moisture ingress.";
    }
    // ───────────────────────────────────────────────────────────────────────

    res.status(200).json({
      safeZone: {
        id: safeZone._id,
        name: safeZone.name,
        type: safeZone.type,
      },
      weather: {
        condition: weatherMain,
        description: weatherDesc,
        temperature: temp,
        humidity,
        windSpeed,
      },
      contamination: {
        riskLevel,
        riskMessage,
      },
    });
  } catch (error) {
    console.error("getSafeZoneWeather error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// @route   DELETE /api/safe-zones/:id
// @access  Admin | Authority
// @desc    Permanently remove a safe zone
//          Authority can only delete their own zones
// ─────────────────────────────────────────────
export const deleteSafeZone = async (req, res) => {
  try {
    const safeZone = await SafeZone.findById(req.params.id);

    if (!safeZone) {
      return res.status(404).json({ message: "Safe zone not found" });
    }

    // Ownership check: Allow if user is admin or creator
    if (req.userRole !== "admin" && safeZone.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: "You can only delete safe zones you created" });
    }

    await SafeZone.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Safe zone deleted successfully" });
  } catch (error) {
    console.error("deleteSafeZone error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
