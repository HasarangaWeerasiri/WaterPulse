/**
 * Artillery Load Test Processor
 * 
 * Handles variable generation and response validation for Artillery load tests
 */

export function generatePhLevel() {
  // Generate pH between 6.0 and 8.5 (mostly safe range)
  return (Math.random() * 2.5 + 6.0).toFixed(1);
}

export function generateTurbidity() {
  // Generate turbidity between 1 and 8 NTU
  return (Math.random() * 7 + 1).toFixed(1);
}

export function beforeRequest(requestParams, context, ee, next) {
  // Generate random pH and turbidity for each request
  requestParams.json.phLevel = parseFloat(generatePhLevel());
  requestParams.json.turbidity = parseFloat(generateTurbidity());
  
  return next();
}

export function afterResponse(requestParams, response, context, ee, next) {
  // Validate response
  if (response.statusCode >= 400) {
    console.error(`Request failed: ${response.statusCode}`);
    ee.emit('customStat', {
      stat: 'failed_requests',
      value: 1,
    });
  }

  return next();
}
