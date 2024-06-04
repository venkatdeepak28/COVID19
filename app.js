const express = require('express')
const app = express()

const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const initalizeDbandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Connected')
    })
  } catch (e) {
    console.log(`connection Error: ${e.message}`)
    process.exit(1)
  }
}

module.exports = app

initalizeDbandServer()

let convertObjProp = givenValue => {
  return {
    stateId: givenValue.state_id,
    stateName: givenValue.state_name,
    population: givenValue.population,
  }
}

let convertDistrictProp = valueIs => {
  return {
    districtId: valueIs.district_id,
    districtName: valueIs.district_name,
    stateId: valueIs.state_id,
    cases: valueIs.cases,
    cured: valueIs.cured,
    active: valueIs.active,
    deaths: valueIs.deaths,
  }
}

let totalStats = statsValue => {
  return {
    totalCases: statsValue.SUM(cases),
    totalcured: statsValue.SUM(cured),
    totalActive: statsValue.SUM(active),
    totalDeaths: statsValue.SUM(deaths),
  }
}

//API 1

app.get('/states/', async (request, response) => {
  const listStateQuery = `SELECT * FROM state;`
  let stateValue = await db.all(listStateQuery)
  response.send(stateValue.map(eachValue => convertObjProp(eachValue)))
})

//API 2

app.get('/states/:stateId', async (request, response) => {
  let {stateId} = request.params
  const singleQueryValue = `SELECT * FROM state WHERE state_id = ${stateId};`
  let getQueryValue = await db.get(singleQueryValue)
  response.send(convertObjProp(getQueryValue))
})

//API 3

app.post('/districts/', async (request, response) => {
  let {districtName, stateId, cases, cured, active, deaths} = request.body
  const districtQueryValue = `INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
  values("${districtName}",${stateId},${cases},${cured},${active},${deaths});`
  let createDistrict = await db.run(districtQueryValue)
  response.send('District Successfully Added')
})

// API 4

app.get('/districts/:districtId', async (request, response) => {
  let {districtId} = request.params
  const districtQueryValue = `SELECT * FROM district WHERE district_id = ${districtId};`
  let getQueryValue = await db.get(districtQueryValue)
  response.send(convertDistrictProp(getQueryValue))
})

// API 5

app.delete('/districts/:districtId', async (request, response) => {
  let {districtId} = request.params
  const deleteQueryValue = `DELETE FROM district WHERE district_id = ${districtId};`
  await db.run(deleteQueryValue)
  response.send('District Removed')
})

// API 6

app.put('/districts/:districtId', async (request, response) => {
  let {districtId} = request.params
  let {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateQueryValue = `UPDATE district 
  SET district_name = "${districtName}",state_id = ${stateId}, cases = ${cases},cured = ${cured},active = ${active},deaths = ${deaths}
  WHERE district_id = ${districtId};`
  let updateDistrictQueryValue = await db.run(updateQueryValue)
  response.send('District Details Updated')
})

// API 7

app.get('/states/:stateId/stats', async (request, response) => {
  let {stateId} = request.params
  const statsQuery = `SELECT SUM(cases) as totalCases,SUM(cured) as totalCured,SUM(active) as totalActive,SUM(deaths) as totalDeaths FROM district where state_id = ${stateId};`
  let queryResult = await db.all(statsQuery)
  response.send(queryResult[0])
})

// API 8

app.get('/districts/:districtId/details/', async (request, response) => {
  let {districtId} = request.params
  const returnDistrictQuery = `SELECT state_id AS stateId FROM district WHERE district_id = ${districtId};`
  let returnDistrictName = await db.get(returnDistrictQuery)
  let stateIdValue = returnDistrictName.stateId
  const returnStateNameQuery = `SELECT state_name as stateName FROM state WHERE state_id = ${stateIdValue};`
  let returnStateName = await db.get(returnStateNameQuery)
  response.send(returnStateName)
})
