const express = require('express')
const { executeQuery } = require('./db')
const { validateProjectBudgetData } = require('./validation')

const BUDGET_ENDPOINT_BASE = '/project/budget'

const endpoints = express.Router()

endpoints.get('/ok', (req, res) => {
  res.status(200).json({ ok: true })
})

endpoints.post(`${BUDGET_ENDPOINT_BASE}/currency`, (req, res, next) => {
  const { year, projectName, currency } = req.body

  const querySql = `
    SELECT * FROM project 
    WHERE projectName = ? AND year = ?
  `

  executeQuery(querySql, [projectName, year], (err, results) => {
    if (err) {
      console.error('Error fetching project budget:', err)
      return next(err)
    }

    return res.status(200).send({
      status: true,
      data: results
    })
  })
})

endpoints.get(`${BUDGET_ENDPOINT_BASE}/:id`, (req, res, next) => {
  retrieveProjectBudget(req.params.id, (err, results) => {
    if (err) {
      console.error('Error fetching project budget:', err)
      return next(err)
    }

    if (!results || !results.length) return next()

    return res.status(200).send(results.pop())
  })
})

endpoints.post(BUDGET_ENDPOINT_BASE, (req, res, next) => {
  const data = req.body

  const validationResult = validateProjectBudgetData(data)

  if (validationResult.error) return next(validationResult.error)

  insertProjectBudget(data, (err, results) => {
    if (err) {
      console.error('Error inserting project budget:', err)
      return next(err)
    }

    retrieveProjectBudget(data.projectId, (err, results) => {
      if (err) {
        console.error('Error fetching project budget:', err)
        return next(err)
      }

      return res.status(201).send(results.pop())
    })
  })
})

function insertProjectBudget (data, cb) {
  const querySql = `
    INSERT INTO project (
      projectId, projectName, year,
      currency, initialBudgetLocal,
      budgetUsd, initialScheduleEstimateMonths,
      adjustedScheduleEstimateMonths,
      contingencyRate, escalationRate, finalBudgetUsd
    )
    VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    );
  `

  const values = [
    data.projectId,
    data.projectName,
    data.year,
    data.currency,
    data.initialBudgetLocal,
    data.budgetUsd,
    data.initialScheduleEstimateMonths,
    data.adjustedScheduleEstimateMonths,
    data.contingencyRate,
    data.escalationRate,
    data.finalBudgetUsd
  ]

  executeQuery(querySql, values, cb)
}

function retrieveProjectBudget (id, cb) {
  const querySql = `
    SELECT * FROM project 
    WHERE projectId = ?
  `

  executeQuery(querySql, [id], cb)
}

module.exports = endpoints
