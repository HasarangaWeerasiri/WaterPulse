import {
  createSafeZone,
  getAllSafeZones,
  getNearbySafeZones,
  getSafeZoneById,
  getMyCreatedSafeZones,
  updateSafeZone,
  getSafeZoneWeather,
  deleteSafeZone,
} from "../../../controllers/safeZoneController.js";
import SafeZone from "../../../models/safeZone.js";
import axios from "axios";

// Mock the models and axios
jest.mock("../../../models/safeZone.js");
jest.mock("axios");

describe("Safe Zone Endpoints - Unit Tests", () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      userId: "66a0000000000000000000aa",
      userRole: "admin",
      params: {},
      body: {},
      query: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      locals: {},
    };
  });

  // ==================== CREATE SAFE ZONE ====================
  describe("createSafeZone - POST /api/safe-zones", () => {
    test("should create a safe zone successfully", async () => {
      const zoneData = {
        name: "Community Well",
        type: "Well",
        description: "Safe community water well",
        latitude: 6.9081,
        longitude: 79.9793,
      };

      const mockSafeZone = {
        _id: "zone001",
        ...zoneData,
        location: {
          type: "Point",
          coordinates: [79.9793, 6.9081],
        },
        address: "Ratnapura, Sri Lanka",
        isAvailable: true,
        createdBy: mockReq.userId,
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockReq.body = zoneData;
      SafeZone.mockImplementation(() => mockSafeZone);
      axios.get.mockResolvedValue({ data: { display_name: "Ratnapura, Sri Lanka" } });

      await createSafeZone(mockReq, mockRes);

      expect(SafeZone).toHaveBeenCalled();
      expect(mockSafeZone.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Safe zone created successfully",
        safeZone: mockSafeZone,
      });
    });

    test("should return 400 when name is missing", async () => {
      mockReq.body = {
        type: "Well",
        latitude: 6.9081,
        longitude: 79.9793,
      };

      await createSafeZone(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "name, type, latitude, and longitude are required",
      });
    });

    test("should return 400 when type is missing", async () => {
      mockReq.body = {
        name: "Community Well",
        latitude: 6.9081,
        longitude: 79.9793,
      };

      await createSafeZone(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "name, type, latitude, and longitude are required",
      });
    });

    test("should return 400 when coordinates are invalid", async () => {
      mockReq.body = {
        name: "Community Well",
        type: "Well",
        latitude: "invalid",
        longitude: 79.9793,
      };

      await createSafeZone(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid coordinates" });
    });

    test("should handle reverse geocoding failure gracefully", async () => {
      const zoneData = {
        name: "Remote Well",
        type: "Borehole",
        latitude: 6.9081,
        longitude: 79.9793,
      };

      const mockSafeZone = {
        _id: "zone002",
        ...zoneData,
        location: {
          type: "Point",
          coordinates: [79.9793, 6.9081],
        },
        address: null, // Geocoding failed
        isAvailable: true,
        createdBy: mockReq.userId,
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockReq.body = zoneData;
      SafeZone.mockImplementation(() => mockSafeZone);
      axios.get.mockRejectedValue(new Error("Network error"));

      await createSafeZone(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockSafeZone.save).toHaveBeenCalled();
    });
  });

  // ==================== GET ALL SAFE ZONES ====================
  describe("getAllSafeZones - GET /api/safe-zones/all", () => {
    test("should return all safe zones with populated creator info", async () => {
      const mockZones = [
        {
          _id: "zone001",
          name: "Community Well",
          type: "Well",
          location: { coordinates: [79.9793, 6.9081] },
          createdBy: {
            _id: "user001",
            firstName: "John",
            email: "john@example.com",
            role: "authority",
          },
        },
        {
          _id: "zone002",
          name: "Water Tanker",
          type: "Tanker",
          location: { coordinates: [79.98, 6.91] },
          createdBy: {
            _id: "user002",
            firstName: "Jane",
            email: "jane@example.com",
            role: "admin",
          },
        },
      ];

      SafeZone.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockZones),
        }),
      });

      await getAllSafeZones(mockReq, mockRes);

      expect(SafeZone.find).toHaveBeenCalledWith();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockZones);
    });

    test("should return empty array when no safe zones exist", async () => {
      SafeZone.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([]),
        }),
      });

      await getAllSafeZones(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    test("should handle database errors", async () => {
      SafeZone.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error("Database error")),
        }),
      });

      await getAllSafeZones(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Server error",
        error: "Database error",
      });
    });
  });

  // ==================== GET NEARBY SAFE ZONES ====================
  describe("getNearbySafeZones - GET /api/safe-zones/nearby", () => {
    test("should return nearby zones within specified distance", async () => {
      mockReq.query = {
        lat: "6.9081",
        lng: "79.9793",
        maxDistance: "5000",
        limit: "5",
      };

      const mockNearbyZones = [
        {
          _id: "zone001",
          name: "Near Well",
          type: "Well",
          location: { coordinates: [79.9793, 6.9081] },
        },
        {
          _id: "zone002",
          name: "Close Tanker",
          type: "Tanker",
          location: { coordinates: [79.98, 6.909] },
        },
      ];

      SafeZone.find = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockNearbyZones),
        }),
      });

      await getNearbySafeZones(mockReq, mockRes);

      expect(SafeZone.find).toHaveBeenCalledWith({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [79.9793, 6.9081],
            },
            $maxDistance: 5000,
          },
        },
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockNearbyZones);
    });

    test("should return 400 when lat parameter is missing", async () => {
      mockReq.query = { lng: "79.9793" };

      await getNearbySafeZones(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "lat and lng query parameters are required",
      });
    });

    test("should return 400 when lng parameter is missing", async () => {
      mockReq.query = { lat: "6.9081" };

      await getNearbySafeZones(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "lat and lng query parameters are required",
      });
    });

    test("should return 400 when coordinates are invalid", async () => {
      mockReq.query = { lat: "invalid", lng: "79.9793" };

      await getNearbySafeZones(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid coordinates" });
    });

    test("should use default maxDistance and limit when not provided", async () => {
      mockReq.query = { lat: "6.9081", lng: "79.9793" };

      SafeZone.find = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue([]),
        }),
      });

      await getNearbySafeZones(mockReq, mockRes);

      expect(SafeZone.find).toHaveBeenCalledWith({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [79.9793, 6.9081],
            },
            $maxDistance: 10000, // default
          },
        },
      });
    });
  });

  // ==================== GET SAFE ZONE BY ID ====================
  describe("getSafeZoneById - GET /api/safe-zones/:id", () => {
    test("should return a safe zone by ID", async () => {
      mockReq.params.id = "zone001";

      const mockZone = {
        _id: "zone001",
        name: "Community Well",
        type: "Well",
        description: "Safe community water well",
        createdBy: {
          _id: "user001",
          firstName: "John",
          email: "john@example.com",
          role: "authority",
        },
      };

      SafeZone.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockZone),
      });

      await getSafeZoneById(mockReq, mockRes);

      expect(SafeZone.findById).toHaveBeenCalledWith("zone001");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockZone);
    });

    test("should return 404 when safe zone not found", async () => {
      mockReq.params.id = "nonexistent";

      SafeZone.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await getSafeZoneById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Safe zone not found" });
    });
  });

  // ==================== GET MY CREATED SAFE ZONES ====================
  describe("getMyCreatedSafeZones - GET /api/safe-zones/my-zones", () => {
    test("should return zones created by the authenticated user", async () => {
      const mockUserZones = [
        {
          _id: "zone001",
          name: "My Well",
          type: "Well",
          createdBy: mockReq.userId,
        },
        {
          _id: "zone002",
          name: "My Tanker",
          type: "Tanker",
          createdBy: mockReq.userId,
        },
      ];

      SafeZone.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockUserZones),
        }),
      });

      await getMyCreatedSafeZones(mockReq, mockRes);

      expect(SafeZone.find).toHaveBeenCalledWith({ createdBy: mockReq.userId });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUserZones);
    });

    test("should return empty array when user has no zones", async () => {
      SafeZone.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([]),
        }),
      });

      await getMyCreatedSafeZones(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });
  });

  // ==================== UPDATE SAFE ZONE ====================
  describe("updateSafeZone - PUT /api/safe-zones/:id", () => {
    test("should update a safe zone when user is admin", async () => {
      mockReq.params.id = "zone001";
      mockReq.body = {
        name: "Updated Well",
        type: "Borehole",
        isAvailable: false,
      };

      const mockZone = {
        _id: "zone001",
        name: "Community Well",
        type: "Well",
        isAvailable: true,
        createdBy: "user001",
        location: { type: "Point", coordinates: [79.9793, 6.9081] },
        save: jest.fn().mockResolvedValue(undefined),
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);

      await updateSafeZone(mockReq, mockRes);

      expect(mockZone.name).toBe("Updated Well");
      expect(mockZone.type).toBe("Borehole");
      expect(mockZone.isAvailable).toBe(false);
      expect(mockZone.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test("should update coordinates when latitude and longitude are provided", async () => {
      mockReq.params.id = "zone001";
      mockReq.body = {
        latitude: 7.0,
        longitude: 80.0,
      };

      const mockZone = {
        _id: "zone001",
        name: "Community Well",
        type: "Well",
        createdBy: mockReq.userId,
        location: { type: "Point", coordinates: [79.9793, 6.9081] },
        address: "Old Address",
        save: jest.fn().mockResolvedValue(undefined),
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);
      axios.get.mockResolvedValue({ data: { display_name: "New Location" } });

      await updateSafeZone(mockReq, mockRes);

      expect(mockZone.location.coordinates).toEqual([80.0, 7.0]);
      expect(mockZone.save).toHaveBeenCalled();
    });

    test("should return 404 when safe zone not found", async () => {
      mockReq.params.id = "nonexistent";
      mockReq.body = { name: "Updated Well" };

      SafeZone.findById = jest.fn().mockResolvedValue(null);

      await updateSafeZone(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Safe zone not found" });
    });

    test("should return 403 when authority tries to update another's zone", async () => {
      mockReq.userRole = "authority";
      mockReq.userId = "user001";
      mockReq.params.id = "zone001";
      mockReq.body = { name: "Updated Well" };

      const mockZone = {
        _id: "zone001",
        name: "Community Well",
        createdBy: "user002", // Different user
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);

      await updateSafeZone(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "You can only edit safe zones you created",
      });
    });

    test("should return 400 for invalid coordinates", async () => {
      mockReq.params.id = "zone001";
      mockReq.body = {
        latitude: "invalid",
        longitude: 80.0,
      };

      const mockZone = {
        _id: "zone001",
        name: "Community Well",
        createdBy: mockReq.userId,
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);

      await updateSafeZone(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid coordinates" });
    });
  });

  // ==================== GET SAFE ZONE WEATHER ====================
  describe("getSafeZoneWeather - GET /api/safe-zones/:id/weather", () => {
    beforeEach(() => {
      process.env.OPENWEATHER_API_KEY = "test_api_key";
    });

    test("should return weather with low contamination risk", async () => {
      mockReq.params.id = "zone001";

      const mockZone = {
        _id: "zone001",
        name: "Community Well",
        type: "Well",
        location: { coordinates: [79.9793, 6.9081] },
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);
      axios.get.mockResolvedValue({
        data: {
          weather: [{ main: "Clear", description: "clear sky" }],
          main: { temp: 28, humidity: 65, wind: {} },
          wind: { speed: 2 },
        },
      });

      await getSafeZoneWeather(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const callArgs = mockRes.json.mock.calls[0][0];
      expect(callArgs.contamination.riskLevel).toBe("Low");
    });

    test("should detect medium contamination risk with rain", async () => {
      mockReq.params.id = "zone001";

      const mockZone = {
        _id: "zone001",
        name: "Community Well",
        type: "Well",
        location: { coordinates: [79.9793, 6.9081] },
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);
      axios.get.mockResolvedValue({
        data: {
          weather: [{ main: "Rain", description: "light rain" }],
          main: { temp: 28, humidity: 80 },
          wind: { speed: 3 },
        },
      });

      await getSafeZoneWeather(mockReq, mockRes);

      const callArgs = mockRes.json.mock.calls[0][0];
      expect(callArgs.contamination.riskLevel).toBe("Medium");
    });

    test("should detect high contamination risk with rain and high humidity", async () => {
      mockReq.params.id = "zone001";

      const mockZone = {
        _id: "zone001",
        name: "Community Well",
        type: "Well",
        location: { coordinates: [79.9793, 6.9081] },
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);
      axios.get.mockResolvedValue({
        data: {
          weather: [{ main: "Thunderstorm", description: "heavy rain" }],
          main: { temp: 25, humidity: 90 },
          wind: { speed: 8 },
        },
      });

      await getSafeZoneWeather(mockReq, mockRes);

      const callArgs = mockRes.json.mock.calls[0][0];
      expect(callArgs.contamination.riskLevel).toBe("High");
    });

    test("should return 404 when safe zone not found", async () => {
      mockReq.params.id = "nonexistent";

      SafeZone.findById = jest.fn().mockResolvedValue(null);

      await getSafeZoneWeather(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Safe zone not found" });
    });

    test("should return 503 when API key is not configured", async () => {
      mockReq.params.id = "zone001";
      process.env.OPENWEATHER_API_KEY = "your_openweathermap_api_key_here";

      const mockZone = {
        _id: "zone001",
        location: { coordinates: [79.9793, 6.9081] },
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);

      await getSafeZoneWeather(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "OpenWeatherMap API key not configured",
      });
    });
  });

  // ==================== DELETE SAFE ZONE ====================
  describe("deleteSafeZone - DELETE /api/safe-zones/:id", () => {
    test("should delete a safe zone when user is admin", async () => {
      mockReq.params.id = "zone001";

      const mockZone = {
        _id: "zone001",
        name: "Community Well",
        createdBy: "user001",
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);
      SafeZone.findByIdAndDelete = jest.fn().mockResolvedValue(mockZone);

      await deleteSafeZone(mockReq, mockRes);

      expect(SafeZone.findByIdAndDelete).toHaveBeenCalledWith("zone001");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Safe zone deleted successfully",
      });
    });

    test("should allow authority to delete their own zone", async () => {
      mockReq.userRole = "authority";
      mockReq.userId = "user001";
      mockReq.params.id = "zone001";

      const mockZone = {
        _id: "zone001",
        createdBy: mockReq.userId,
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);
      SafeZone.findByIdAndDelete = jest.fn().mockResolvedValue(mockZone);

      await deleteSafeZone(mockReq, mockRes);

      expect(SafeZone.findByIdAndDelete).toHaveBeenCalledWith("zone001");
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test("should return 403 when authority tries to delete another's zone", async () => {
      mockReq.userRole = "authority";
      mockReq.userId = "user001";
      mockReq.params.id = "zone001";

      const mockZone = {
        _id: "zone001",
        createdBy: "user002", // Different user
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);

      await deleteSafeZone(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "You can only delete safe zones you created",
      });
    });

    test("should return 404 when safe zone not found", async () => {
      mockReq.params.id = "nonexistent";

      SafeZone.findById = jest.fn().mockResolvedValue(null);

      await deleteSafeZone(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Safe zone not found" });
    });
  });
});
