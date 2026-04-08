/**
 * Artillery Load Test Processor for Task Management
 * 
 * Handles variable generation and response validation for Artillery load tests
 */

export function generatePriority() {
  // Randomly select a priority level
  const priorities = ['low', 'medium', 'high'];
  return priorities[Math.floor(Math.random() * priorities.length)];
}

export function generateTaskTitle() {
  const titles = [
    'Investigate Water Contamination',
    'Perform Site Inspection',
    'Collect Water Samples',
    'Submit Lab Results',
    'Review Contamination Report'
  ];
  return titles[Math.floor(Math.random() * titles.length)];
}

export function beforeRequest(requestParams, context, ee, next) {
  // Generate random task details for each POST request
  if (requestParams.json) {
    requestParams.json.priority = generatePriority();
    requestParams.json.title    = generateTaskTitle();
  }

  return next();
}

export function afterResponse(requestParams, response, context, ee, next) {
  // Validate response
  if (response.statusCode >= 400) {
    console.error(`Request failed: ${response.statusCode} for ${requestParams.url || requestParams.path}`);
    ee.emit('customStat', {
      stat: 'failed_requests',
      value: 1,
    });
  }

  return next();
}
