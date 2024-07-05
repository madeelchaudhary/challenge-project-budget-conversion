const express = require('express')
const { executeQuery } = require('./db')
const { validateProjectBudgetData } = require('./validation')
const { getExchangeRate } = require('./currency')

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

  executeQuery(querySql, [projectName, year], async (err, results) => {
    if (err) {
      console.error('Error fetching project budget:', err)
      return next(err)
    }

    if (!results || !results.length) {
      return res.status(404).send({
        success: false,
        message: 'No project found'
      })
    }

    const convertedResults = await Promise.all(results.map(async (project) => {
      if (currency === 'TTD') {
        project.finalBudgetTtd = await convertToTtd(project.finalBudgetUsd, project.currency, project.projectName, year)
      }
      return project
    }))

    return res.status(200).send({
      status: true,
      data: convertedResults
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

    return res.status(200).json(results.pop())
  })
})

endpoints.post(BUDGET_ENDPOINT_BASE, (req, res, next) => {
  const data = req.body

  const validationResult = validateProjectBudgetData(data)
  if (validationResult.error) {
    return res.status(400).json({
      error: validationResult.error
    })
  }

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

      return res.status(201).json(results.pop())
    })
  })
})

endpoints.put(`${BUDGET_ENDPOINT_BASE}/:id`, (req, res, next) => {
  const projectId = +req.params.id
  retrieveProjectBudget(projectId, (err, results) => {
    if (err) {
      console.error('Error fetching project budget:', err)
      return next(err)
    }

    if (!results || !results.length) return next()

    const data = req.body

    const validationResult = validateProjectBudgetData({ ...data, projectId })
    if (validationResult.error) {
      return res.status(400).json({
        error: validationResult.error
      })
    }

    updateProjectBudget(projectId, data, (err, results) => {
      if (err) {
        console.error('Error updating project budget:', err)
        return next(err)
      }

      retrieveProjectBudget(projectId, (err, results) => {
        if (err) {
          console.error('Error fetching project budget:', err)
          return next(err)
        }

        return res.status(200).json(results.pop())
      })
    })
  })
})

endpoints.delete(`${BUDGET_ENDPOINT_BASE}/:id`, (req, res, next) => {
  const projectId = req.params.id
  retrieveProjectBudget(projectId, (err, results) => {
    if (err) {
      console.error('Error fetching project budget:', err)
      return next(err)
    }

    if (!results || !results.length) return next()

    deleteProjectBudget(projectId, (err, results) => {
      if (err) {
        console.error('Error deleting project budget:', err)
        return next(err)
      }

      res.status(204).send()
    })
  })
})

function retrieveProjectBudget (id, cb) {
  const querySql = `
    SELECT * FROM project 
    WHERE projectId = ?
  `

  executeQuery(querySql, [id], cb)
}

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

function updateProjectBudget (id, data, cb) {
  const querySql = `
    UPDATE project
    SET projectName = ?, year = ?,
        currency = ?, initialBudgetLocal = ?,
        budgetUsd = ?,
        initialScheduleEstimateMonths = ?,
        adjustedScheduleEstimateMonths = ?,
        contingencyRate = ?,
        escalationRate = ?, finalBudgetUsd = ?
    WHERE projectId = ?
  `

  const values = [
    data.projectName,
    data.year,
    data.currency,
    data.initialBudgetLocal,
    data.budgetUsd,
    data.initialScheduleEstimateMonths,
    data.adjustedScheduleEstimateMonths,
    data.contingencyRate,
    data.escalationRate,
    data.finalBudgetUsd,
    id
  ]

  executeQuery(querySql, values, cb)
}

function deleteProjectBudget (projectId, cb) {
  const querySql = `
    DELETE FROM project
    WHERE projectId = ?
  `

  const values = [projectId]

  executeQuery(querySql, values, cb)
}

async function convertToTtd (amount, fromCurrency, projectName, year) {
  if (fromCurrency !== 'TTD') {
    const date = `${year}-01-01` // Assuming we want the rate at the beginning of the year
    const exchangeRate = await getExchangeRate(fromCurrency, 'TTD', date)
    if (!exchangeRate) return null

    return Number((amount * exchangeRate).toFixed(2))
  }

  return amount
}

module.exports = endpoints
