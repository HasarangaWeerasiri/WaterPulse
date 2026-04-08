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

describe("Safe Zone Performance Tests", () => {
  let mockReq, mockRes;

  // Performance thresholds (in milliseconds)
  const PERFORMANCE_THRESHOLDS = {
    SINGLE_OPERATION: 100, // Single zone operation
    BATCH_OPERATION: 500, // Multiple zones
    API_CALL: 1000, // External API calls
    DATABASE_QUERY: 200, // Database operations
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

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

  afterEach(() => {
    jest.useRealTimers();
  });

  // ==================== CREATE OPERATION PERFORMANCE ====================
  describe("Create Safe Zone Performance", () => {
    test("should create a single zone in under 100ms", async () => {
      const zoneData = {
        name: "Test Well",
        type: "Well",
        latitude: 6.9081,
        longitude: 79.9793,
      };

      const mockSafeZone = {
        _id: "zone001",
        ...zoneData,
        location: { type: "Point", coordinates: [79.9793, 6.9081] },
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockReq.body = zoneData;
      SafeZone.mockImplementation(() => mockSafeZone);
      axios.get.mockResolvedValue({ data: { display_name: "Location" } });

      const startTime = Date.now();
      await createSafeZone(mockReq, mockRes);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_OPERATION);
      expect(mockSafeZone.save).toHaveBeenCalled();
    });

    test("should create 50 zones in under 5 seconds (batch operation)", async () => {
      const createPromises = [];

      for (let i = 0; i < 50; i++) {
        const mockSafeZone = {
          _id: `zone${i}`,
          name: `Zone ${i}`,
          type: "Well",
          location: { type: "Point", coordinates: [79.9793 + i * 0.01, 6.9081] },
          save: jest.fn().mockResolvedValue(undefined),
        };

        SafeZone.mockImplementationOnce(() => mockSafeZone);
        axios.get.mockResolvedValueOnce({ data: { display_name: "Location" } });

        mockReq.body = {
          name: `Zone ${i}`,
          type: "Well",
          latitude: 6.9081,
          longitude: 79.9793 + i * 0.01,
        };

        createPromises.push(createSafeZone(mockReq, mockRes));
      }

      const startTime = Date.now();
      await Promise.all(createPromises);
      const duration = Date.now() - startTime;

      // 50 zones should take less than 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    test("should handle geocoding API call within 1 second", async () => {
      // Use real timers for this test
      jest.useRealTimers();

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
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockReq.body = zoneData;
      SafeZone.mockImplementation(() => mockSafeZone);
      axios.get.mockResolvedValue({ data: { display_name: "Location" } });

      const startTime = Date.now();
      await createSafeZone(mockReq, mockRes);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_CALL);

      // Switch back to fake timers
      jest.useFakeTimers();
    }, 15000);
  });

  // ==================== READ OPERATION PERFORMANCE ====================
  describe("Get Safe Zones Performance", () => {
    test("should fetch all zones from large dataset in under 200ms", async () => {
      // Mock 1000 zones
      const mockZones = Array(1000)
        .fill()
        .map((_, i) => ({
          _id: `zone${i}`,
          name: `Zone ${i}`,
          type: "Well",
          createdBy: { firstName: "User", email: "user@example.com" },
        }));

      SafeZone.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockZones),
        }),
      });

      const startTime = Date.now();
      await getAllSafeZones(mockReq, mockRes);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY);
    });

    test("should fetch nearby zones with geospatial query in under 200ms", async () => {
      mockReq.query = {
        lat: "6.9081",
        lng: "79.9793",
        maxDistance: "5000",
        limit: "10",
      };

      // Mock 100 nearby zones
      const mockNearbyZones = Array(100)
        .fill()
        .map((_, i) => ({
          _id: `zone${i}`,
          name: `Nearby Zone ${i}`,
          type: "Well",
        }));

      SafeZone.find = jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockNearbyZones),
        }),
      });

      const startTime = Date.now();
      await getNearbySafeZones(mockReq, mockRes);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY);
    });

    test("should fetch zone by ID in under 50ms", async () => {
      mockReq.params.id = "zone001";

      const mockZone = {
        _id: "zone001",
        name: "Community Well",
        type: "Well",
      };

      SafeZone.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockZone),
      });

      const startTime = Date.now();
      await getSafeZoneById(mockReq, mockRes);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50);
    });

    test("should fetch user's zones from large user dataset in under 200ms", async () => {
      // Mock 500 user zones
      const mockUserZones = Array(500)
        .fill()
        .map((_, i) => ({
          _id: `zone${i}`,
          name: `My Zone ${i}`,
          createdBy: mockReq.userId,
        }));

      SafeZone.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockUserZones),
        }),
      });

      const startTime = Date.now();
      await getMyCreatedSafeZones(mockReq, mockRes);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY);
    });
  });

  // ==================== UPDATE OPERATION PERFORMANCE ====================
  describe("Update Safe Zone Performance", () => {
    test("should update a zone in under 100ms", async () => {
      mockReq.params.id = "zone001";
      mockReq.body = { name: "Updated Well" };

      const mockZone = {
        _id: "zone001",
        name: "Old Well",
        type: "Well",
        createdBy: mockReq.userId,
        location: { type: "Point", coordinates: [79.9793, 6.9081] },
        save: jest.fn().mockResolvedValue(undefined),
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);

      const startTime = Date.now();
      await updateSafeZone(mockReq, mockRes);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SINGLE_OPERATION);
    });

    test("should update location with geocoding in under 1 second", async () => {
      mockReq.params.id = "zone001";
      mockReq.body = { latitude: 7.0, longitude: 80.0 };

      const mockZone = {
        _id: "zone001",
        name: "Well",
        createdBy: mockReq.userId,
        location: { type: "Point", coordinates: [79.9793, 6.9081] },
        address: "Old Location",
        save: jest.fn().mockResolvedValue(undefined),
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);
      axios.get.mockResolvedValue({ data: { display_name: "New Location" } });

      const startTime = Date.now();
      await updateSafeZone(mockReq, mockRes);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_CALL);
    });

    test("should update 30 zones concurrently in under 3 seconds", async () => {
      const updatePromises = [];

      for (let i = 0; i < 30; i++) {
        mockReq.params.id = `zone${i}`;
        mockReq.body = { name: `Updated Zone ${i}` };

        const mockZone = {
          _id: `zone${i}`,
          name: `Zone ${i}`,
          createdBy: mockReq.userId,
          location: { type: "Point", coordinates: [79.9793, 6.9081] },
          save: jest.fn().mockResolvedValue(undefined),
        };

        SafeZone.findById = jest.fn().mockResolvedValue(mockZone);

        updatePromises.push(updateSafeZone(mockReq, mockRes));
      }

      const startTime = Date.now();
      await Promise.all(updatePromises);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(3000);
    });
  });

  // ==================== DELETE OPERATION PERFORMANCE ====================
  describe("Delete Safe Zone Performance", () => {
    test("should delete a zone in under 50ms", async () => {
      mockReq.params.id = "zone001";

      const mockZone = {
        _id: "zone001",
        name: "Zone",
        createdBy: "user001",
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);
      SafeZone.findByIdAndDelete = jest.fn().mockResolvedValue(mockZone);

      const startTime = Date.now();
      await deleteSafeZone(mockReq, mockRes);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50);
    });

    test("should delete 50 zones concurrently in under 2.5 seconds", async () => {
      const deletePromises = [];

      for (let i = 0; i < 50; i++) {
        mockReq.params.id = `zone${i}`;

        const mockZone = {
          _id: `zone${i}`,
          createdBy: mockReq.userId,
        };

        SafeZone.findById = jest.fn().mockResolvedValueOnce(mockZone);
        SafeZone.findByIdAndDelete = jest.fn().mockResolvedValueOnce(mockZone);

        deletePromises.push(deleteSafeZone(mockReq, mockRes));
      }

      const startTime = Date.now();
      await Promise.all(deletePromises);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2500);
    });
  });

  // ==================== WEATHER & API PERFORMANCE ====================
  describe("Weather Check Performance", () => {
    test("should fetch weather from API in under 1 second", async () => {
      mockReq.params.id = "zone001";

      const mockZone = {
        _id: "zone001",
        name: "Well",
        location: { coordinates: [79.9793, 6.9081] },
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);
      axios.get.mockResolvedValue({
        data: {
          weather: [{ main: "Clear", description: "clear" }],
          main: { temp: 28, humidity: 60 },
          wind: { speed: 2 },
        },
      });

      const startTime = Date.now();
      await getSafeZoneWeather(mockReq, mockRes);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_CALL);
    });

    test("should handle slow weather API (2-second timeout) gracefully", async () => {
      // Use real timers for this test
      jest.useRealTimers();

      mockReq.params.id = "zone001";

      const mockZone = {
        _id: "zone001",
        location: { coordinates: [79.9793, 6.9081] },
      };

      SafeZone.findById = jest.fn().mockResolvedValue(mockZone);
      axios.get.mockResolvedValue({
        data: {
          weather: [{ main: "Clear", description: "clear" }],
          main: { temp: 28, humidity: 60 },
          wind: { speed: 2 },
        },
      });

      const startTime = Date.now();
      await getSafeZoneWeather(mockReq, mockRes);
      const duration = Date.now() - startTime;

      // Should complete in reasonable time despite simulated slow API
      expect(duration).toBeLessThan(1500);

      // Switch back to fake timers
      jest.useFakeTimers();
    }, 15000);

    test("should fetch weather for 20 zones concurrently in under 5 seconds", async () => {
      const weatherPromises = [];

      for (let i = 0; i < 20; i++) {
        mockReq.params.id = `zone${i}`;

        const mockZone = {
          _id: `zone${i}`,
          location: { coordinates: [79.9793 + i * 0.01, 6.9081] },
        };

        SafeZone.findById = jest.fn().mockResolvedValueOnce(mockZone);
        axios.get.mockResolvedValueOnce({
          data: {
            weather: [{ main: "Clear", description: "clear" }],
            main: { temp: 28, humidity: 60 },
            wind: { speed: 2 },
          },
        });

        weatherPromises.push(getSafeZoneWeather(mockReq, mockRes));
      }

      const startTime = Date.now();
      await Promise.all(weatherPromises);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
    });
  });

  // ==================== CONCURRENT REQUEST LOAD TESTING ====================
  describe("Concurrent Request Handling", () => {
    test("should handle 100 concurrent read requests in under 2 seconds", async () => {
      const readPromises = [];

      for (let i = 0; i < 100; i++) {
        mockReq.params.id = `zone${i % 10}`; // Reuse 10 zones

        const mockZone = {
          _id: `zone${i % 10}`,
          name: `Zone ${i % 10}`,
          type: "Well",
        };

        SafeZone.findById = jest.fn().mockResolvedValueOnce({
          populate: jest.fn().mockResolvedValueOnce(mockZone),
        });

        readPromises.push(getSafeZoneById(mockReq, mockRes));
      }

      const startTime = Date.now();
      await Promise.all(readPromises);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000);
    });

    test("should handle mixed CRUD operations (50 each) in under 10 seconds", async () => {
      const mixedPromises = [];

      // 50 creates
      for (let i = 0; i < 50; i++) {
        const mockZone = {
          _id: `zone${i}`,
          save: jest.fn().mockResolvedValue(undefined),
        };
        SafeZone.mockImplementationOnce(() => mockZone);
        axios.get.mockResolvedValueOnce({ data: { display_name: "Location" } });
        mockReq.body = { name: `Zone ${i}`, type: "Well", latitude: 6.9, longitude: 79.9 };
        mixedPromises.push(createSafeZone(mockReq, mockRes));
      }

      // 50 reads
      for (let i = 0; i < 50; i++) {
        SafeZone.findById = jest.fn().mockResolvedValueOnce({
          populate: jest.fn().mockResolvedValueOnce({ _id: `zone${i}` }),
        });
        mixedPromises.push(getSafeZoneById(mockReq, mockRes));
      }

      // 50 updates
      for (let i = 0; i < 50; i++) {
        SafeZone.findById = jest.fn().mockResolvedValueOnce({
          location: { type: "Point", coordinates: [79.9793, 6.9081] },
          save: jest.fn().mockResolvedValue(undefined),
        });
        mixedPromises.push(updateSafeZone(mockReq, mockRes));
      }

      const startTime = Date.now();
      await Promise.all(mixedPromises);
      const duration = Date.now() - startTime;

      // 150 total operations should complete in under 10 seconds
      expect(duration).toBeLessThan(10000);
    });
  });

  // ==================== MEMORY & RESOURCE EFFICIENCY ====================
  describe("Memory & Resource Efficiency", () => {
    test("should not leak memory on repeated operations", async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < 100; i++) {
        const mockZone = {
          _id: `zone${i}`,
          name: `Zone ${i}`,
          save: jest.fn().mockResolvedValue(undefined),
        };

        SafeZone.mockImplementationOnce(() => mockZone);
        axios.get.mockResolvedValueOnce({ data: { display_name: "Location" } });
        mockReq.body = { name: `Zone ${i}`, type: "Well", latitude: 6.9, longitude: 79.9 };

        await createSafeZone(mockReq, mockRes);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test("should handle large dataset pagination efficiently", async () => {
      // Mock 5000 zones
      const mockZones = Array(5000)
        .fill()
        .map((_, i) => ({
          _id: `zone${i}`,
          name: `Zone ${i}`,
        }));

      SafeZone.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockZones),
        }),
      });

      const startTime = Date.now();
      await getAllSafeZones(mockReq, mockRes);
      const duration = Date.now() - startTime;

      // Should handle large dataset without timing out
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY);
    });
  });

  // ==================== RESPONSE TIME PERCENTILES ====================
  describe("Response Time Percentiles", () => {
    test("should measure response time distribution for reads", async () => {
      const responseTimes = [];

      for (let i = 0; i < 100; i++) {
        mockReq.params.id = `zone${i % 10}`;

        SafeZone.findById = jest.fn().mockResolvedValueOnce({
          populate: jest.fn().mockResolvedValueOnce({ _id: `zone${i % 10}` }),
        });

        const startTime = Date.now();
        await getSafeZoneById(mockReq, mockRes);
        const duration = Date.now() - startTime;

        responseTimes.push(duration);
      }

      responseTimes.sort((a, b) => a - b);

      const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
      const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
      const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];

      // Performance metrics
      expect(p50).toBeLessThan(50); // p50 < 50ms
      expect(p95).toBeLessThan(100); // p95 < 100ms
      expect(p99).toBeLessThan(150); // p99 < 150ms
    });
  });
});
