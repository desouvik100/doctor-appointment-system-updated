import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const QuickHealthTools = ({ userId }) => {
  const [activeTab, setActiveTab] = useState('bmi');
  const [bmiData, setBmiData] = useState({ weight: '', height: '', result: null });
  const [waterIntake, setWaterIntake] = useState(0);
  const [waterGoal] = useState(8);
  const [healthQuote, setHealthQuote] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  const healthQuotes = [
    { quote: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
    { quote: "Health is not valued till sickness comes.", author: "Thomas Fuller" },
    { quote: "The greatest wealth is health.", author: "Virgil" },
    { quote: "A healthy outside starts from the inside.", author: "Robert Urich" },
    { quote: "Your body hears everything your mind says.", author: "Naomi Judd" },
    { quote: "Sleep is the best meditation.", author: "Dalai Lama" },
    { quote: "Walking is man's best medicine.", author: "Hippocrates" },
    { quote: "Let food be thy medicine.", author: "Hippocrates" },
    { quote: "Health is a state of complete harmony.", author: "B.K.S. Iyengar" },
    { quote: "Prevention is better than cure.", author: "Desiderius Erasmus" }
  ];

  useEffect(() => {
    // Load saved water intake
    const saved = localStorage.getItem(`water_${userId}_${new Date().toDateString()}`);
    if (saved) setWaterIntake(parseInt(saved));
    
    // Set random health quote
    setHealthQuote(healthQuotes[Math.floor(Math.random() * healthQuotes.length)]);
    
    // Get weather
    fetchWeather();
  }, [userId]);

  const fetchWeather = async () => {
    try {
      // Get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          // Using Open-Meteo API (free, no API key needed)
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`
          );
          const data = await response.json();
          if (data.current) {
            setWeather({
              temp: Math.round(data.current.temperature_2m),
              humidity: data.current.relative_humidity_2m,
              code: data.current.weather_code
            });
          }
        }, () => {
          // Default weather if location denied
          setWeather({ temp: 25, humidity: 60, code: 0 });
        });
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
    }
  };

  const getWeatherIcon = (code) => {
    if (code === 0) return 'fa-sun';
    if (code <= 3) return 'fa-cloud-sun';
    if (code <= 48) return 'fa-smog';
    if (code <= 67) return 'fa-cloud-rain';
    if (code <= 77) return 'fa-snowflake';
    if (code <= 99) return 'fa-bolt';
    return 'fa-cloud';
  };

  const getWeatherTip = () => {
    if (!weather) return "Stay healthy today!";
    if (weather.temp > 35) return "🔥 Very hot! Stay hydrated, avoid outdoor activities during peak hours.";
    if (weather.temp > 30) return "☀️ Hot weather! Drink extra water and wear light clothes.";
    if (weather.temp < 15) return "🧥 Cold weather! Dress warmly and boost your immunity with vitamin C.";
    if (weather.humidity > 80) return "💧 High humidity! Stay cool and watch for heat exhaustion.";
    if (weather.humidity < 30) return "🏜️ Dry air! Use moisturizer and drink plenty of water.";
    return "🌤️ Pleasant weather! Great day for a walk or outdoor exercise.";
  };

  const calculateBMI = () => {
    const weight = parseFloat(bmiData.weight);
    const height = parseFloat(bmiData.height) / 100;
    
    if (!weight || !height || weight <= 0 || height <= 0) {
      toast.error('Please enter valid weight and height');
      return;
    }

    const bmi = (weight / (height * height)).toFixed(1);
    let category, color, advice;

    if (bmi < 18.5) {
      category = 'Underweight';
      color = 'text-amber-600';
      advice = 'Consider a balanced diet with more calories and protein.';
    } else if (bmi < 25) {
      category = 'Normal';
      color = 'text-emerald-600';
      advice = 'Great! Maintain your healthy lifestyle.';
    } else if (bmi < 30) {
      category = 'Overweight';
      color = 'text-orange-600';
      advice = 'Consider regular exercise and a balanced diet.';
    } else {
      category = 'Obese';
      color = 'text-red-600';
      advice = 'Consult a doctor for a personalized health plan.';
    }

    setBmiData({ ...bmiData, result: { bmi, category, color, advice } });
  };

  const addWater = () => {
    const newIntake = waterIntake + 1;
    setWaterIntake(newIntake);
    localStorage.setItem(`water_${userId}_${new Date().toDateString()}`, newIntake);
    if (newIntake >= waterGoal) {
      toast.success('🎉 You reached your daily water goal!');
    } else {
      toast.success(`💧 Glass ${newIntake} of ${waterGoal}`);
    }
  };

  const resetWater = () => {
    setWaterIntake(0);
    localStorage.removeItem(`water_${userId}_${new Date().toDateString()}`);
    toast.success('Water intake reset');
  };

  return (
    <div className="space-y-6">
      {/* Health Quote Card */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <i className="fas fa-quote-left text-xl"></i>
          </div>
          <div>
            <p className="text-lg font-medium italic">"{healthQuote?.quote}"</p>
            <p className="text-purple-200 mt-2">— {healthQuote?.author}</p>
          </div>
        </div>
      </div>

      {/* Weather Health Tips */}
      {weather && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <i className={`fas ${getWeatherIcon(weather.code)} text-amber-500`}></i>
              Weather Health Tip
            </h3>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-bold text-slate-800">{weather.temp}°C</span>
              <span className="text-slate-500">💧 {weather.humidity}%</span>
            </div>
          </div>
          <p className="text-slate-600 bg-slate-50 rounded-xl p-4">{getWeatherTip()}</p>
        </div>
      )}

      {/* Quick Tools Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100">
          {[
            { id: 'bmi', icon: 'fa-weight', label: 'BMI Calculator' },
            { id: 'water', icon: 'fa-tint', label: 'Water Tracker' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <i className={`fas ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'bmi' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={bmiData.weight}
                    onChange={(e) => setBmiData({ ...bmiData, weight: e.target.value, result: null })}
                    placeholder="70"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={bmiData.height}
                    onChange={(e) => setBmiData({ ...bmiData, height: e.target.value, result: null })}
                    placeholder="170"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <button
                onClick={calculateBMI}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all"
              >
                Calculate BMI
              </button>
              
              {bmiData.result && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600">Your BMI:</span>
                    <span className={`text-2xl font-bold ${bmiData.result.color}`}>{bmiData.result.bmi}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-600">Category:</span>
                    <span className={`font-semibold ${bmiData.result.color}`}>{bmiData.result.category}</span>
                  </div>
                  <p className="text-sm text-slate-500 bg-white p-3 rounded-lg">{bmiData.result.advice}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'water' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="#e2e8f0" strokeWidth="12" fill="none" />
                    <circle
                      cx="64" cy="64" r="56"
                      stroke="url(#waterGradient)"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${(waterIntake / waterGoal) * 352} 352`}
                    />
                    <defs>
                      <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-slate-800">{waterIntake}</span>
                    <span className="text-sm text-slate-500">of {waterGoal} glasses</span>
                  </div>
                </div>
                <p className="text-slate-600 mb-4">
                  {waterIntake >= waterGoal 
                    ? '🎉 Great job! You reached your goal!' 
                    : `${waterGoal - waterIntake} more glasses to go`}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={addWater}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-plus"></i> Add Glass
                </button>
                <button
                  onClick={resetWater}
                  className="px-4 py-3 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-all"
                >
                  <i className="fas fa-redo"></i>
                </button>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
                <i className="fas fa-info-circle mr-2"></i>
                Drinking 8 glasses (2L) of water daily helps maintain energy, improves skin health, and aids digestion.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickHealthTools;
