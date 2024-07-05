const db = require('../lib/db')

const seedDatabase = (callback) => {
  db.serialize(() => {
    // Create the project table
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS project (
        projectId INT PRIMARY KEY,
        projectName VARCHAR(255),
        year INT,
        currency VARCHAR(3),
        initialBudgetLocal DECIMAL(10, 2),
        budgetUsd DECIMAL(10, 2),
        initialScheduleEstimateMonths INT,
        adjustedScheduleEstimateMonths INT,
        contingencyRate DECIMAL(5, 2),
        escalationRate DECIMAL(5, 2),
        finalBudgetUsd DECIMAL(10, 2)
      )
    `
    db.run(createTableSql)

    // Insert initial data if needed
    const stmt = db.prepare(`
      INSERT INTO project (
        projectId, projectName, year, currency, initialBudgetLocal,
        budgetUsd, initialScheduleEstimateMonths, adjustedScheduleEstimateMonths,
        contingencyRate, escalationRate, finalBudgetUsd
      ) 
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `)

    stmt.run(1, 'Initial Project', 2023, 'USD', 500000, 500000, 12, 12, 0.1, 0.05, 550000)
    stmt.finalize(callback)
  })
}

module.exports = seedDatabase
