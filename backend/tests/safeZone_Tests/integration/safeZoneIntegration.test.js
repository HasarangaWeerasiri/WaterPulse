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

describe("Safe Zone API - Integration Tests", () => {
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

    process.env.OPENWEATHER_API_KEY = "test_api_key";
  });

  // ==================== ZONE CREATION FLOW ====================
  describe("Safe Zone Creation Flow", () => {
    test("should create a safe zone and return 201 with zone data", async () => {
      const zoneData = {
        name: "Community Water Well",
        type: "Well",
        description: "Safe drinking water source",
        latitude: 6.9081,
        longitude: 79.9793,
      };

      const createdZone = {
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
      SafeZone.mockImplementation(() => createdZone);
      axios.get.mockResolvedValue({ data: { display_name: "Ratnapura, Sri Lanka" } });

      await createSafeZone(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Safe zone created successfully",
        safeZone: createdZone,
      });
    });

    test("should validate required fields during creation", async () => {
      mockReq.body = { type: "Well" }; // Missing name, latitude, longitude

      await createSafeZone(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "name, type, latitude, and longitude are required",
      });
    });

    test("should validate coordinate format", async () => {
      mockReq.body = {
        name: "Test Well",
        type: "Well",
        latitude: "not_a_number",
        longitude: 79.9793,
      };

      await createSafeZone(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Invalid coordinates" });
    });
  });

  // ==================== ZONE RETRIEVAL FLOW ====================
  describe("Safe Zone Retrieval Flow", () => {
    test("should fetch all zones for admin dashboard", async () => {
      const mockZones = [
        {
          _id: "zone001",
          name: "Community Well",
          type: "Well",
          location: { coordinates: [79.9793, 6.9081] },
          createdBy: { firstName: "John", email: "john@example.com" },
        },
        {
          _id: "zone002",
          name: "Water Tanker",
          type: "Tanker",
          location: { coordinates: [79.98, 6.91] },
          createdBy: { firstName: "Jane", email: "jane@example.com" },
        },
      ];

      SafeZone.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockZones),
        }),
      });

      await getAllSafeZones(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockZones);
    });

    test("should fetch zones near user location", async () => {
      mockReq.query = {
        lat: "6.9081",
        lng: "79.9793",
        maxDistance: "5000",
        limit: "10",
      };

      const mockNearbyZones = [
        {
          _id: "zone001",
          name: "Nearby Well",
          type: "Well",
          location: { coordinates: [79.9793, 6.9081] },
        },
      ];

      SafeZone.find = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockNearbyZones),
        }),
      });

      await getNearbySafeZones(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockNearbyZones);
    });

    test("should fetch user's created zones", async () => {
      const mockUserZones = [
        {
          _id: "zone001",
          name: "My Well",
          type: "Well",
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
    });

    test("should fetch a specific zone by ID", async () => {
      mockReq.params.id = "zone001";

      const mockZone = {
        _id: "zone001",
        name: "Community Well",
        type: "Well",
        description: "Safe water source",
        createdBy: { firstName: "John", email: "john@example.com" },
      };

      SafeZone.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockZone),
      });

      await getSafeZoneById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockZone);
    });
  });

  // ==================== ZONE UPDATE FLOW ====================
  describe("Safe Zone Update Flow", () => {
    test("should update zone details successfully", async () => {
      mockReq.params.id = "zone001";
      mockReq.body = {
        name: "Updated Well",
        type: "Borehole",
      };

      const mockZone = {
        _id: "zone001",
        name: "Community Well",
        type: "Well",
        createdBy: mockReq.userId,
        location: { type: "Point", coordinates: [79.9793, 6.9081] },
        save: jest.fn().mockResolvedValue(undefined),
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);

      await updateSafeZone(mockReq, mockRes);

      expect(mockZone.name).toBe("Updated Well");
      expect(mockZone.type).toBe("Borehole");
      expect(mockZone.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test("should update zone location and re-geocode", async () => {
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
        address: "Ratnapura",
        save: jest.fn().mockResolvedValue(undefined),
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);
      axios.get.mockResolvedValue({ data: { display_name: "New Location, Sri Lanka" } });

      await updateSafeZone(mockReq, mockRes);

      expect(mockZone.location.coordinates).toEqual([80.0, 7.0]);
      expect(mockZone.address).toBe("New Location, Sri Lanka");
      expect(mockZone.save).toHaveBeenCalled();
    });

    test("should prevent authority from editing others' zones", async () => {
      mockReq.userRole = "authority";
      mockReq.userId = "user001";
      mockReq.params.id = "zone001";
      mockReq.body = { name: "Hacked Well" };

      const mockZone = {
        _id: "zone001",
        name: "Community Well",
        createdBy: "user002", // Different creator
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);

      await updateSafeZone(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "You can only edit safe zones you created",
      });
    });

    test("should allow authority to edit their own zones", async () => {
      mockReq.userRole = "authority";
      mockReq.userId = "user001";
      mockReq.params.id = "zone001";
      mockReq.body = { name: "Updated By Owner" };

      const mockZone = {
        _id: "zone001",
        name: "Community Well",
        createdBy: mockReq.userId,
        location: { type: "Point", coordinates: [79.9793, 6.9081] },
        save: jest.fn().mockResolvedValue(undefined),
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);

      await updateSafeZone(mockReq, mockRes);

      expect(mockZone.name).toBe("Updated By Owner");
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  // ==================== WEATHER CHECK FLOW ====================
  describe("Safe Zone Weather Check Flow", () => {
    test("should fetch weather and assess low risk (clear conditions)", async () => {
      mockReq.params.id = "zone001";

      const mockZone = {
        _id: "zone001",
        name: "Safe Well",
        type: "Well",
        location: { coordinates: [79.9793, 6.9081] },
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);
      axios.get.mockResolvedValue({
        data: {
          weather: [{ main: "Clear", description: "clear sky" }],
          main: { temp: 28, humidity: 60 },
          wind: { speed: 2 },
        },
      });

      await getSafeZoneWeather(mockReq, mockRes);

      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.contamination.riskLevel).toBe("Low");
      expect(responseData.weather.temperature).toBe(28);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test("should fetch weather and assess medium risk (rainy conditions)", async () => {
      mockReq.params.id = "zone001";

      const mockZone = {
        _id: "zone001",
        name: "Well",
        type: "Well",
        location: { coordinates: [79.9793, 6.9081] },
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);
      axios.get.mockResolvedValue({
        data: {
          weather: [{ main: "Rain", description: "moderate rain" }],
          main: { temp: 25, humidity: 85 },
          wind: { speed: 4 },
        },
      });

      await getSafeZoneWeather(mockReq, mockRes);

      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.contamination.riskLevel).toBe("Medium");
    });

    test("should fetch weather and assess high risk (thunderstorm with high humidity)", async () => {
      mockReq.params.id = "zone001";

      const mockZone = {
        _id: "zone001",
        name: "Well",
        type: "Well",
        location: { coordinates: [79.9793, 6.9081] },
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);
      axios.get.mockResolvedValue({
        data: {
          weather: [{ main: "Thunderstorm", description: "heavy thunderstorm with rain" }],
          main: { temp: 24, humidity: 92 },
          wind: { speed: 10 },
        },
      });

      await getSafeZoneWeather(mockReq, mockRes);

      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData.contamination.riskLevel).toBe("High");
      expect(responseData.contamination.riskMessage).toContain("Heavy precipitation");
    });

    test("should handle missing or invalid API key", async () => {
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

  // ==================== ZONE DELETION FLOW ====================
  describe("Safe Zone Deletion Flow", () => {
    test("should delete a zone successfully as admin", async () => {
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

    test("should prevent authority from deleting others' zones", async () => {
      mockReq.userRole = "authority";
      mockReq.userId = "user001";
      mockReq.params.id = "zone001";

      const mockZone = {
        _id: "zone001",
        name: "Community Well",
        createdBy: "user002", // Different creator
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);

      await deleteSafeZone(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "You can only delete safe zones you created",
      });
    });

    test("should allow authority to delete their own zones", async () => {
      mockReq.userRole = "authority";
      mockReq.userId = "user001";
      mockReq.params.id = "zone001";

      const mockZone = {
        _id: "zone001",
        name: "Community Well",
        createdBy: mockReq.userId,
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);
      SafeZone.findByIdAndDelete = jest.fn().mockResolvedValue(mockZone);

      await deleteSafeZone(mockReq, mockRes);

      expect(SafeZone.findByIdAndDelete).toHaveBeenCalledWith("zone001");
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test("should handle zone not found during deletion", async () => {
      mockReq.params.id = "nonexistent";

      SafeZone.findById = jest.fn().mockResolvedValue(null);

      await deleteSafeZone(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Safe zone not found" });
    });
  });

  // ==================== ERROR HANDLING ====================
  describe("Error Handling", () => {
    test("should handle database errors gracefully", async () => {
      SafeZone.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error("Database connection failed")),
        }),
      });

      await getAllSafeZones(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Server error",
        error: "Database connection failed",
      });
    });

    test("should handle weather API errors gracefully", async () => {
      mockReq.params.id = "zone001";

      const mockZone = {
        _id: "zone001",
        location: { coordinates: [79.9793, 6.9081] },
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);
      axios.get.mockRejectedValue(new Error("Weather API timeout"));

      await getSafeZoneWeather(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Server error",
        error: "Weather API timeout",
      });
    });

    test("should handle geocoding errors gracefully during creation", async () => {
      const zoneData = {
        name: "Remote Well",
        type: "Well",
        latitude: 6.9081,
        longitude: 79.9793,
      };

      const mockSafeZone = {
        _id: "zone001",
        ...zoneData,
        location: { type: "Point", coordinates: [79.9793, 6.9081] },
        address: null, // Geocoding failed
        isAvailable: true,
        createdBy: mockReq.userId,
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockReq.body = zoneData;
      SafeZone.mockImplementation(() => mockSafeZone);
      axios.get.mockRejectedValue(new Error("Geocoding service unavailable"));

      await createSafeZone(mockReq, mockRes);

      // Should still create the zone despite geocoding failure
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockSafeZone.save).toHaveBeenCalled();
    });
  });
});
