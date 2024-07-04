const express = require('express')
const { executeQuery } = require('./db')

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
      console.error('Error fetching project budget:', err);
      return next(err)
    }

    return res.status(200).send({
      status: true,
      data: results,
    })
  })
})

endpoints.get(`${BUDGET_ENDPOINT_BASE}/:id`, (req, res, next) => {
  const querySql = `
    SELECT * FROM project 
    WHERE projectId = ?
  `

  executeQuery(querySql, [req.params.id], (err, results) => {
    if (err) {
      console.error('Error fetching project budget:', err);
      return next(err)
    }

    if (!results || !results.length) return next();

    return res.status(200).send(results.pop())
  })
})

module.exports = endpoints
