function validateProjectBudgetData (data = {}) {
  const requiredFields = ['projectId', 'projectName', 'year', 'currency', 'initialBudgetLocal', 'budgetUsd', 'initialScheduleEstimateMonths', 'adjustedScheduleEstimateMonths', 'contingencyRate', 'escalationRate', 'finalBudgetUsd']

  // Check for missing required fields
  const missingFields = requiredFields.filter(field => !Object.hasOwn(data, field))
  if (missingFields.length > 0) {
    return { status: false, error: `Missing required fields: ${missingFields.join(', ')}` }
  }

  // Validate data types
  if (typeof data.projectId !== 'number' || data.projectId <= 0) {
    return { status: false, error: 'Invalid projectId: must be a positive number' }
  }
  if (typeof data.projectName !== 'string' || data.projectName.trim() === '') {
    return { status: false, error: 'Invalid projectName: must be a non-empty string' }
  }
  if (typeof data.year !== 'number' || data.year < 1000) {
    return { status: false, error: 'Invalid year: must be a valid year value (e.g., 2024)' }
  }
  if (typeof data.currency !== 'string' || data.currency.trim() === '') {
    return { status: false, error: 'Invalid currency: must be a non-empty string' }
  }
  if (typeof data.initialBudgetLocal !== 'number' || data.initialBudgetLocal < 0) {
    return { status: false, error: 'Invalid initialBudgetLocal: must be a non-negative number' }
  }

  return { status: true } // If all validations pass
}

module.exports = { validateProjectBudgetData }
