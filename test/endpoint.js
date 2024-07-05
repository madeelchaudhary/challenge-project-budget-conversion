process.env.NODE_ENV = 'test'

const http = require('http')
const test = require('tape')
const servertest = require('servertest')
const app = require('../lib/app')
const seedDatabase = require('../scripts/seed-test')

const server = http.createServer(app)

const BUDGET_ENDPOINT_BASE = '/api/project/budget'

test('GET /health should return 200', function (t) {
  servertest(server, '/health', { encoding: 'json' }, function (err, res) {
    t.error(err, 'No error')
    t.equal(res.statusCode, 200, 'Should return 200')
    t.end()
  })
})

test('GET /api/ok should return 200', function (t) {
  servertest(server, '/api/ok', { encoding: 'json' }, function (err, res) {
    t.error(err, 'No error')
    t.equal(res.statusCode, 200, 'Should return 200')
    t.ok(res.body.ok, 'Should return a body')
    t.end()
  })
})

test('GET /nonexistent should return 404', function (t) {
  servertest(server, '/nonexistent', { encoding: 'json' }, function (err, res) {
    t.error(err, 'No error')
    t.equal(res.statusCode, 404, 'Should return 404')
    t.end()
  })
})

// Initialize the database before endpoint tests
test('Setup database', function (t) {
  seedDatabase((err) => {
    t.error(err, 'No error')
    t.end()
  })
})

test('GET /budget/:id should return 200 and budget data', function (t) {
  const id = 1
  servertest(server, `${BUDGET_ENDPOINT_BASE}/${id}`, { encoding: 'json' }, function (err, res) {
    t.error(err, 'No error')
    t.equal(res.statusCode, 200, 'Should return 200')
    t.ok(res.body, 'Should return a body')
    t.end()
  })
})

test('POST /budget should return 201 and created budget data', function (t) {
  const newBudget = {
    projectId: 2,
    projectName: 'New Project',
    year: 2024,
    currency: 'USD',
    initialBudgetLocal: 1000000,
    budgetUsd: 1000000,
    initialScheduleEstimateMonths: 12,
    adjustedScheduleEstimateMonths: 12,
    contingencyRate: 0.1,
    escalationRate: 0.05,
    finalBudgetUsd: 1100000
  }

  const opts = {
    method: 'POST',
    encoding: 'json',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  const stream = servertest(server, BUDGET_ENDPOINT_BASE, opts, function (err, res) {
    t.error(err, 'No error')
    t.equal(res.statusCode, 201, 'Should return 201')
    t.ok(res.body, 'Should return a body')
    t.equal(res.body.projectId, newBudget.projectId, 'Project ID should match')
    t.end()
  })

  stream.end(JSON.stringify(newBudget))
})

test('PUT /budget/:id should return 200 and updated budget data', function (t) {
  const id = 1
  const updatedBudget = {
    projectName: 'Updated Project',
    year: 2025,
    currency: 'EUR',
    initialBudgetLocal: 2000000,
    budgetUsd: 2200000,
    initialScheduleEstimateMonths: 18,
    adjustedScheduleEstimateMonths: 18,
    contingencyRate: 0.15,
    escalationRate: 0.07,
    finalBudgetUsd: 2530000
  }

  const opts = {
    method: 'PUT',
    encoding: 'json',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  const stream = servertest(server, `${BUDGET_ENDPOINT_BASE}/${id}`, opts, function (err, res) {
    t.error(err, 'No error')
    t.equal(res.statusCode, 200, 'Should return 200')
    t.ok(res.body, 'Should return a body')
    t.equal(res.body.projectId, id, 'Project ID should match')
    t.equal(res.body.projectName, updatedBudget.projectName, 'Project name should match')
    t.end()
  })

  stream.end(JSON.stringify(updatedBudget))
})

test('DELETE /budget/:id should return 204', function (t) {
  const id = 1

  const opts = {
    method: 'DELETE',
    encoding: 'json',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  const stream = servertest(server, `${BUDGET_ENDPOINT_BASE}/${id}`, opts, function (err, res) {
    t.error(err, 'No error')
    t.equal(res.statusCode, 204, 'Should return 204')
    t.end()
  })

  stream.end(JSON.stringify({}))
})

test('POST /budget should return 400 on validation error', function (t) {
  const invalidBudget = {
    projectId: 3,
    projectName: 'Invalid Project'
    // Missing other required fields
  }

  const opts = {
    method: 'POST',
    encoding: 'json',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  const stream = servertest(server, BUDGET_ENDPOINT_BASE, opts, function (err, res) {
    t.error(err, 'No error')
    t.equal(res.statusCode, 400, 'Should return 400')
    t.ok(res.body.error, 'Should return an error')
    t.end()
  })

  stream.end(JSON.stringify(invalidBudget))
})

test('GET /budget/:id should return 404 for nonexistent budget', function (t) {
  const id = 999

  servertest(server, `${BUDGET_ENDPOINT_BASE}/${id}`, { encoding: 'json' }, function (err, res) {
    t.error(err, 'No error')
    t.equal(res.statusCode, 404, 'Should return 404')
    t.end()
  })
})
