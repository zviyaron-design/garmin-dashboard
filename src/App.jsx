import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import { format, parseISO } from 'date-fns'
import './App.css'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

function App() {
  const [activities, setActivities] = useState([])
  const [dailyStats, setDailyStats] = useState([])
  const [sleepData, setSleepData] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState({ start: null, end: null })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load activities
      const activitiesRes = await fetch('/garmin_data/activities.csv')
      const activitiesText = await activitiesRes.text()
      const activitiesParsed = Papa.parse(activitiesText, { header: true, dynamicTyping: true })

      // Load daily stats
      const dailyStatsRes = await fetch('/garmin_data/daily_stats.csv')
      const dailyStatsText = await dailyStatsRes.text()
      const dailyStatsParsed = Papa.parse(dailyStatsText, { header: true, dynamicTyping: true })

      // Load sleep data
      const sleepRes = await fetch('/garmin_data/sleep_data.csv')
      const sleepText = await sleepRes.text()
      const sleepParsed = Papa.parse(sleepText, { header: true, dynamicTyping: true })

      setActivities(activitiesParsed.data.filter(row => row.activity_id))
      setDailyStats(dailyStatsParsed.data.filter(row => row.date))
      setSleepData(sleepParsed.data.filter(row => row.date && row.total_sleep_seconds))
      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  // Calculate summary statistics
  const summary = {
    totalActivities: activities.length,
    totalDistance: (activities.reduce((sum, a) => sum + (a.distance || 0), 0) / 1000).toFixed(1),
    totalDuration: (activities.reduce((sum, a) => sum + (a.duration || 0), 0) / 3600).toFixed(1),
    totalCalories: activities.reduce((sum, a) => sum + (a.calories || 0), 0).toFixed(0),
    avgHeartRate: (activities.reduce((sum, a) => sum + (a.avg_hr || 0), 0) / activities.length).toFixed(0),
    avgSteps: (dailyStats.reduce((sum, d) => sum + (d.steps || 0), 0) / dailyStats.length).toFixed(0)
  }

  // Prepare daily activities data
  const dailyActivities = {}
  activities.forEach(activity => {
    const date = activity.start_time?.split(' ')[0]
    if (!date) return

    if (!dailyActivities[date]) {
      dailyActivities[date] = { date, count: 0, distance: 0, duration: 0, calories: 0 }
    }
    dailyActivities[date].count++
    dailyActivities[date].distance += (activity.distance || 0) / 1000
    dailyActivities[date].duration += (activity.duration || 0) / 3600
    dailyActivities[date].calories += activity.calories || 0
  })
  const dailyActivitiesArray = Object.values(dailyActivities).sort((a, b) => a.date.localeCompare(b.date))

  // Activity types distribution
  const activityTypes = {}
  activities.forEach(activity => {
    const type = activity.activity_type || 'unknown'
    if (!activityTypes[type]) {
      activityTypes[type] = { name: type, value: 0, distance: 0 }
    }
    activityTypes[type].value++
    activityTypes[type].distance += (activity.distance || 0) / 1000
  })
  const activityTypesArray = Object.values(activityTypes)

  // Heart rate data
  const hrData = dailyStats.map(day => ({
    date: day.date,
    resting: day.resting_hr,
    min: day.min_hr,
    max: day.max_hr
  })).filter(d => d.resting)

  // Sleep data formatted
  const sleepChartData = sleepData.map(day => ({
    date: day.date,
    totalHours: (day.total_sleep_seconds / 3600).toFixed(1),
    deepHours: (day.deep_sleep_seconds / 3600).toFixed(1),
    lightHours: (day.light_sleep_seconds / 3600).toFixed(1),
    remHours: (day.rem_sleep_seconds / 3600).toFixed(1),
    score: day.sleep_score
  }))

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading your Garmin data...</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🏃 Garmin Dashboard</h1>
        <p>Track your fitness journey</p>
      </header>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <h3>{summary.totalActivities}</h3>
            <p>Total Activities</p>
          </div>
        </div>
        <div className="card">
          <div className="card-icon">📏</div>
          <div className="card-content">
            <h3>{summary.totalDistance} km</h3>
            <p>Total Distance</p>
          </div>
        </div>
        <div className="card">
          <div className="card-icon">⏱️</div>
          <div className="card-content">
            <h3>{summary.totalDuration} hrs</h3>
            <p>Total Duration</p>
          </div>
        </div>
        <div className="card">
          <div className="card-icon">🔥</div>
          <div className="card-content">
            <h3>{summary.totalCalories}</h3>
            <p>Total Calories</p>
          </div>
        </div>
        <div className="card">
          <div className="card-icon">❤️</div>
          <div className="card-content">
            <h3>{summary.avgHeartRate} bpm</h3>
            <p>Avg Heart Rate</p>
          </div>
        </div>
        <div className="card">
          <div className="card-icon">👟</div>
          <div className="card-content">
            <h3>{summary.avgSteps}</h3>
            <p>Avg Daily Steps</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'activities' ? 'active' : ''}
          onClick={() => setActiveTab('activities')}
        >
          Activities
        </button>
        <button
          className={activeTab === 'health' ? 'active' : ''}
          onClick={() => setActiveTab('health')}
        >
          Health
        </button>
        <button
          className={activeTab === 'sleep' ? 'active' : ''}
          onClick={() => setActiveTab('sleep')}
        >
          Sleep
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview">
            <div className="chart-container">
              <h2>Activities Over Time</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyActivitiesArray}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" name="Activities" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h2>Activity Types</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={activityTypesArray}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {activityTypesArray.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="activities">
            <div className="chart-container">
              <h2>Distance Per Day (km)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyActivitiesArray}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="distance" fill="#00C49F" name="Distance (km)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h2>Calories Burned Per Day</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyActivitiesArray}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="calories" fill="#FF8042" name="Calories" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="recent-activities">
              <h2>Recent Activities</h2>
              <div className="activities-list">
                {activities.slice(0, 10).map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-name">{activity.activity_name || activity.activity_type}</div>
                    <div className="activity-details">
                      <span>{(activity.distance / 1000).toFixed(2)} km</span>
                      <span>{(activity.duration / 60).toFixed(0)} min</span>
                      <span>{activity.calories} cal</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="health">
            <div className="chart-container">
              <h2>Heart Rate Trends</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hrData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="resting" stroke="#8884d8" name="Resting HR" />
                  <Line type="monotone" dataKey="max" stroke="#ff7300" name="Max HR" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h2>Daily Steps</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="steps" stroke="#82ca9d" fill="#82ca9d" name="Steps" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'sleep' && (
          <div className="sleep">
            <div className="chart-container">
              <h2>Sleep Duration (hours)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sleepChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="totalHours" stroke="#8884d8" name="Total Sleep" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h2>Sleep Score</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={sleepChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#00C49F" name="Sleep Score" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h2>Sleep Stages</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sleepChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="deepHours" stackId="a" fill="#0088FE" name="Deep" />
                  <Bar dataKey="lightHours" stackId="a" fill="#00C49F" name="Light" />
                  <Bar dataKey="remHours" stackId="a" fill="#FFBB28" name="REM" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
