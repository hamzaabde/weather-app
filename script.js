// selecting DOM elements
const currentLocationEl = document.querySelector('#location')
const mainInfoImg = document.querySelector('#main-info-img')
const temperatureEl = document.querySelector('#temperature')
const humidityEl = document.querySelector('#humidity')
const windSpeedEl = document.querySelector('#wind-speed')
const forecastsContainer = document.querySelector('#forecasts')

// icons
const iconsSrc = {
    blank: './icons/blank.png',
    day: {
        clear: './icons/day-clear.png',
        'part-cloud': './icons/day-part-cloud.png',
        'part-heavy-rain': './icons/day-part-heavy-rain.png',
        'part-mild-rain': './icons/day-part-mild-rain.png',
    },
    cloudy: './icons/cloudy.png',
    night: {
        clear: './icons/night-clear.png',
        'part-cloud': './icons/night-part-cloud.png',
    },
    rain: {
        harsh: './icons/rain-harsh.png',
        heavy: './icons/rain-heavy.png',
        mild: './icons/rain-mild.png',
    },
    hot: './icons/hot.png',
    cold: './icons/cold.png',
}

// forecast HTML template
const forecastTemplate = (temp, unit, day, imgSrc) =>
    `<div class="forecast">
        <div class="img">
            <img
                src="${imgSrc}"
                alt="part-cloud"
            />
        </div>
        <div class="info">
            <span class="text"
                >${temp} <span class="symbol">&deg;${unit}</span></span
            >
        </div>
        <div class="day">
            <span class="text">${day}</span>
        </div>
    </div>`

// accuweather API
const API_KEY = ''
const queryCity = 'hargeisa'
const API = {
    location: 'http://dataservice.accuweather.com/locations/v1/cities/search',
    currentCondition:
        'http://dataservice.accuweather.com/currentconditions/v1/',
    forecasts: 'http://dataservice.accuweather.com/forecasts/v1/daily/5day/',
}

const err = {}

const getDay = date => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    return days[date.getDay()]
}

const getIcon = num => {
    if (num <= 5) return iconsSrc.day.clear

    if (num <= 10) return iconsSrc.day['part-cloud']

    if (num == 12) return iconsSrc.rain.mild

    if (num > 12 && num <= 14) return iconsSrc.day['part-mild-rain']

    if (num == 15) return iconsSrc.rain.heavy

    if (num > 15 && num <= 17) return iconsSrc.day['part-heavy-rain']

    if (num == (19 || 22 || 26 || 25)) return iconsSrc.cloudy

    if (num == (20 || 21 || 23)) return iconsSrc.day['part-cloud']

    if (num == 30) return iconsSrc.hot

    if (num == 31) return iconsSrc.cold

    if (num > 32 && num <= 37) return night.clear

    if (num == (28 || 43 || 44)) return iconsSrc.night['part-cloud']

    if (num == (39 || 40 || 41 || 42)) return iconsSrc.rain.harsh
    else return iconsSrc.blank
}

const fetchData = async () => {
    // get location
    const locationResponse = await fetch(
        `${API.location}?apikey=${API_KEY}&q=${queryCity}&details=true`
    )
    const [locationInfo] = await locationResponse.json()

    err.url = locationResponse.url
    err.status = locationResponse.status

    // throw error
    if (!locationResponse.ok) {
        throw new Error()
    }

    // get current condition
    const currentConditionResponse = await fetch(
        `${API.currentCondition}${locationInfo.Key}?apikey=${API_KEY}&details=true`
    )
    const [currentCondition] = await currentConditionResponse.json()

    // get forecasts
    const forecastsReponse = await fetch(
        `${API.forecasts}${locationInfo.Key}?apikey=${API_KEY}&details=true&metric=true`
    )
    const forecastsData = await forecastsReponse.json()

    return {
        locationInfo,
        currentCondition,
        forecastsData,
    }
}

const useData = async () => {
    // reset error
    document.querySelector('#error').classList.remove('error')
    document.querySelector('#app').classList.remove('hidden')

    // getdata
    const { locationInfo, currentCondition, forecastsData } = await fetchData()

    // location data
    const location = `${locationInfo.EnglishName}, ${locationInfo.Country.EnglishName}`

    // current condition data
    const {
        WeatherIcon: iconNum,
        Temperature,
        Wind,
        RelativeHumidity: humidity,
    } = currentCondition
    const icon = getIcon(iconNum)
    const { Value: temperature, Unit: unit } = Temperature.Metric,
        { Value: windSpeed } = Wind.Speed.Metric

    // forecasts data
    const { DailyForecasts: forecasts } = forecastsData
    const forecastsList = forecasts
        .map(({ Date: date, Day: day, Temperature: temp }) => {
            const forecastDay = getDay(new Date(date))
            const { Icon: iconNum } = day
            const icon = getIcon(iconNum)
            const { Maximum: max, Minimum: min } = temp
            const unit = max.Unit
            // const temperature = (max.Value - min.Value) / 2 + min.Value
            const temperature = `${max.Value} - ${min.Value}`

            return forecastTemplate(temperature, unit, forecastDay, icon)
        })
        .join('')

    // populate DOM
    currentLocationEl.textContent = location
    mainInfoImg.src = icon
    temperatureEl.textContent = Math.round(temperature)
    humidityEl.textContent = humidity
    windSpeedEl.textContent = windSpeed
    forecastsContainer.innerHTML = forecastsList
}

function displayError({ message }) {
    // hide info area
    document.querySelector('#app').classList.add('hidden')
    document.querySelector('#error').classList.add('error')

    // display message
    document.querySelector('#message').textContent = !API_KEY
        ? 'Message: API_KEY is empty'
        : !message.queryCity
        ? 'Message: Querry location empty'
        : err.status == 400
        ? 'Message: Request had bad syntax or the parameters supplied were invalid'
        : err.status == 401
        ? 'Message: Unauthorized. API authorization failed'
        : err.status == 403
        ? 'Message: Unauthorized. You do not have permission to access this endpoint'
        : err.status == 404
        ? 'Message: Server has not found a route matching the given URI'
        : err.status == 500
        ? 'Message: Server encountered an unexpected condition which prevented it from fulfilling the request'
        : 'Message: Network error'

    // display error info
    document.querySelector('#query').textContent = queryCity
        ? `Location: ${queryCity}`
        : 'Location: empty'
    document.querySelector('#api-key').textContent = API_KEY
        ? `API key: ${API_KEY}`
        : 'API key: empty'

    console.log(message.url)
    document.querySelector('#url').textContent = err.url

    // reload
    document.querySelector('#reload').onclick = () => {
        // reload the whole page
        // ********************* yea I know
        window.location.reload()
    }
}

// run app
useData().catch(err => displayError(err))
