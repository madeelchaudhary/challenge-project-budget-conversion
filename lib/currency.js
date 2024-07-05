const axios = require('axios')
const config = require('../config')

const API_KEY = config.currency.apiKey
const BASE_URL = 'https://v6.exchangerate-api.com/v6'

async function getExchangeRate (fromCurrency, toCurrency, date) {
  try {
    const response = await axios.get(`${BASE_URL}/${API_KEY}/history/${fromCurrency}/${date.split('-').join('/')}`)
    const rates = response.data.conversion_rates
    return rates[toCurrency]
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    throw error
  }
}

module.exports = { getExchangeRate }
