import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

const HealthCalculators = () => {
  const [activeCalc, setActiveCalc] = useState('bmi');
  
  // Results only - inputs are uncontrolled
  const [bmiResult, setBmiResult] = useState(null);
  const [bmrResult, setBmrResult] = useState(null);
  const [bodyFatResult, setBodyFatResult] = useState(null);
  const [calorieResult, setCalorieResult] = useState(null);
  const [waterResult, setWaterResult] = useState(null);
  const [idealWeightResult, setIdealWeightResult] = useState(null);
  const [pregnancyResult, setPregnancyResult] = useState(null);
  const [heartRateResult, setHeartRateResult] = useState(null);
  
  // Gender states (need controlled for toggle buttons)
  const [bmrGender, setBmrGender] = useState('male');
  const [bodyFatGender, setBodyFatGender] = useState('male');
  const [calorieGender, setCalorieGender] = useState('male');
  const [idealWeightGender, setIdealWeightGender] = useState('male');
  
  // Refs for input values
  const bmiWeightRef = useRef(null);
  const bmiHeightRef = useRef(null);
  
  const bmrWeightRef = useRef(null);
  const bmrHeightRef = useRef(null);
  const bmrAgeRef = useRef(null);
  
  const bodyFatHeightRef = useRef(null);
  const bodyFatNeckRef = useRef(null);
  const bodyFatWaistRef = useRef(null);
  const bodyFatHipRef = useRef(null);
  
  const calorieWeightRef = useRef(null);
  const calorieHeightRef = useRef(null);
  const calorieAgeRef = useRef(null);
  const calorieActivityRef = useRef(null);
  
  const waterWeightRef = useRef(null);
  const waterActivityRef = useRef(null);
  
  const idealWeightHeightRef = useRef(null);
  
  const pregnancyDateRef = useRef(null);
  
  const heartRateAgeRef = useRef(null);
  const heartRateRestingRef = useRef(null);

  const calculators = [
    { id: 'bmi', icon: 'fa-weight', label: 'BMI', color: 'indigo' },
    { id: 'bmr', icon: 'fa-fire', label: 'BMR', color: 'orange' },
    { id: 'calorie', icon: 'fa-utensils', label: 'Calories', color: 'emerald' },
    { id: 'bodyFat', icon: 'fa-percentage', label: 'Body Fat', color: 'rose' },
    { id: 'water', icon: 'fa-tint', label: 'Water', color: 'blue' },
    { id: 'idealWeight', icon: 'fa-balance-scale', label: 'Ideal Weight', color: 'purple' },
    { id: 'pregnancy', icon: 'fa-baby', label: 'Due Date', color: 'pink' },
    { id: 'heartRate', icon: 'fa-heartbeat', label: 'Heart Rate', color: 'red' },
  ];

  // BMI Calculation
  const calculateBMI = useCallback(() => {
    const w = parseFloat(bmiWeightRef.current?.value);
    const h = parseFloat(bmiHeightRef.current?.value) / 100;
    if (!w || !h) { toast.error('Enter valid values'); return; }
    const result = (w / (h * h)).toFixed(1);
    let category, color;
    if (result < 18.5) { category = 'Underweight'; color = 'text-amber-600'; }
    else if (result < 25) { category = 'Normal'; color = 'text-emerald-600'; }
    else if (result < 30) { category = 'Overweight'; color = 'text-orange-600'; }
    else { category = 'Obese'; color = 'text-red-600'; }
    setBmiResult({ value: result, category, color });
  }, []);


  // BMR Calculation (Mifflin-St Jeor)
  const calculateBMR = useCallback(() => {
    const w = parseFloat(bmrWeightRef.current?.value);
    const h = parseFloat(bmrHeightRef.current?.value);
    const a = parseFloat(bmrAgeRef.current?.value);
    if (!w || !h || !a) { toast.error('Enter valid values'); return; }
    let result;
    if (bmrGender === 'male') {
      result = (10 * w) + (6.25 * h) - (5 * a) + 5;
    } else {
      result = (10 * w) + (6.25 * h) - (5 * a) - 161;
    }
    setBmrResult(Math.round(result));
  }, [bmrGender]);

  // Calorie Calculation
  const calculateCalories = useCallback(() => {
    const w = parseFloat(calorieWeightRef.current?.value);
    const h = parseFloat(calorieHeightRef.current?.value);
    const a = parseFloat(calorieAgeRef.current?.value);
    const activity = parseFloat(calorieActivityRef.current?.value);
    if (!w || !h || !a) { toast.error('Enter valid values'); return; }
    let bmrVal;
    if (calorieGender === 'male') {
      bmrVal = (10 * w) + (6.25 * h) - (5 * a) + 5;
    } else {
      bmrVal = (10 * w) + (6.25 * h) - (5 * a) - 161;
    }
    const tdee = Math.round(bmrVal * activity);
    setCalorieResult({ bmr: Math.round(bmrVal), tdee, lose: tdee - 500, gain: tdee + 500 });
  }, [calorieGender]);

  // Body Fat Calculation (US Navy Method)
  const calculateBodyFat = useCallback(() => {
    const waist = parseFloat(bodyFatWaistRef.current?.value);
    const neck = parseFloat(bodyFatNeckRef.current?.value);
    const height = parseFloat(bodyFatHeightRef.current?.value);
    const hip = parseFloat(bodyFatHipRef.current?.value);
    if (!waist || !neck || !height) { toast.error('Enter valid values'); return; }
    let result;
    if (bodyFatGender === 'male') {
      result = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
    } else {
      if (!hip) { toast.error('Hip measurement required for females'); return; }
      result = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
    }
    let category;
    if (bodyFatGender === 'male') {
      if (result < 6) category = 'Essential Fat';
      else if (result < 14) category = 'Athletes';
      else if (result < 18) category = 'Fitness';
      else if (result < 25) category = 'Average';
      else category = 'Obese';
    } else {
      if (result < 14) category = 'Essential Fat';
      else if (result < 21) category = 'Athletes';
      else if (result < 25) category = 'Fitness';
      else if (result < 32) category = 'Average';
      else category = 'Obese';
    }
    setBodyFatResult({ value: result.toFixed(1), category });
  }, [bodyFatGender]);


  // Water Intake Calculation
  const calculateWater = useCallback(() => {
    const w = parseFloat(waterWeightRef.current?.value);
    const activity = waterActivityRef.current?.value;
    if (!w) { toast.error('Enter valid weight'); return; }
    let base = w * 0.033; // 33ml per kg
    if (activity === 'light') base *= 1;
    else if (activity === 'moderate') base *= 1.2;
    else if (activity === 'active') base *= 1.4;
    else if (activity === 'intense') base *= 1.6;
    setWaterResult({ liters: base.toFixed(1), glasses: Math.round(base / 0.25) });
  }, []);

  // Ideal Weight Calculation (multiple formulas)
  const calculateIdealWeight = useCallback(() => {
    const h = parseFloat(idealWeightHeightRef.current?.value);
    if (!h) { toast.error('Enter valid height'); return; }
    const hInches = h / 2.54;
    const hOver5Ft = hInches - 60;
    let robinson, miller, devine, hamwi;
    if (idealWeightGender === 'male') {
      robinson = 52 + 1.9 * hOver5Ft;
      miller = 56.2 + 1.41 * hOver5Ft;
      devine = 50 + 2.3 * hOver5Ft;
      hamwi = 48 + 2.7 * hOver5Ft;
    } else {
      robinson = 49 + 1.7 * hOver5Ft;
      miller = 53.1 + 1.36 * hOver5Ft;
      devine = 45.5 + 2.3 * hOver5Ft;
      hamwi = 45.5 + 2.2 * hOver5Ft;
    }
    const avg = (robinson + miller + devine + hamwi) / 4;
    setIdealWeightResult({ avg: avg.toFixed(1), robinson: robinson.toFixed(1), miller: miller.toFixed(1), devine: devine.toFixed(1), hamwi: hamwi.toFixed(1) });
  }, [idealWeightGender]);

  // Pregnancy Due Date Calculation
  const calculateDueDate = useCallback(() => {
    const lastPeriod = pregnancyDateRef.current?.value;
    if (!lastPeriod) { toast.error('Enter last period date'); return; }
    const lmp = new Date(lastPeriod);
    const dueDate = new Date(lmp);
    dueDate.setDate(dueDate.getDate() + 280); // 40 weeks
    const today = new Date();
    const weeksPregnant = Math.floor((today - lmp) / (7 * 24 * 60 * 60 * 1000));
    const trimester = weeksPregnant < 13 ? 'First' : weeksPregnant < 27 ? 'Second' : 'Third';
    setPregnancyResult({ dueDate: dueDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), weeks: weeksPregnant, trimester });
  }, []);

  // Heart Rate Zone Calculation
  const calculateHeartRateZones = useCallback(() => {
    const age = parseFloat(heartRateAgeRef.current?.value);
    const resting = parseFloat(heartRateRestingRef.current?.value) || 70;
    if (!age) { toast.error('Enter valid age'); return; }
    const maxHR = 220 - age;
    const hrReserve = maxHR - resting;
    const zones = [
      { name: 'Zone 1 (Recovery)', min: Math.round(resting + hrReserve * 0.5), max: Math.round(resting + hrReserve * 0.6), color: 'bg-blue-100' },
      { name: 'Zone 2 (Fat Burn)', min: Math.round(resting + hrReserve * 0.6), max: Math.round(resting + hrReserve * 0.7), color: 'bg-green-100' },
      { name: 'Zone 3 (Aerobic)', min: Math.round(resting + hrReserve * 0.7), max: Math.round(resting + hrReserve * 0.8), color: 'bg-yellow-100' },
      { name: 'Zone 4 (Anaerobic)', min: Math.round(resting + hrReserve * 0.8), max: Math.round(resting + hrReserve * 0.9), color: 'bg-orange-100' },
      { name: 'Zone 5 (Max)', min: Math.round(resting + hrReserve * 0.9), max: maxHR, color: 'bg-red-100' },
    ];
    setHeartRateResult({ maxHR, zones });
  }, []);


  const InputField = ({ label, inputRef, placeholder, type = 'number', unit, defaultValue = '' }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <input 
          ref={inputRef}
          type={type} 
          inputMode="decimal"
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
        />
        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{unit}</span>}
      </div>
    </div>
  );

  const GenderSelect = ({ value, onChange }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
      <div className="flex gap-2">
        {['male', 'female'].map(g => (
          <button key={g} type="button" onClick={() => onChange(g)}
            className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${value === g ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {g === 'male' ? '♂ Male' : '♀ Female'}
          </button>
        ))}
      </div>
    </div>
  );

  const CalcButton = ({ onClick, label }) => (
    <button type="button" onClick={onClick} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
      <i className="fas fa-calculator mr-2"></i>{label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <i className="fas fa-calculator text-2xl"></i>
          </div>
          <div>
            <h2 className="text-xl font-bold">Health Calculators</h2>
            <p className="text-indigo-100">Calculate your health metrics</p>
          </div>
        </div>
      </div>

      {/* Calculator Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
          {calculators.map(calc => (
            <button key={calc.id} onClick={() => setActiveCalc(calc.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${activeCalc === calc.id ? `bg-${calc.color}-100 text-${calc.color}-600` : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
              <i className={`fas ${calc.icon} text-lg`}></i>
              <span className="text-xs font-medium">{calc.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Calculator Content */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        {/* BMI Calculator */}
        {activeCalc === 'bmi' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><i className="fas fa-weight text-indigo-500"></i> BMI Calculator</h3>
            <p className="text-slate-500 text-sm">Body Mass Index measures body fat based on height and weight.</p>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Weight" inputRef={bmiWeightRef} placeholder="70" unit="kg" />
              <InputField label="Height" inputRef={bmiHeightRef} placeholder="170" unit="cm" />
            </div>
            <CalcButton onClick={calculateBMI} label="Calculate BMI" />
            {bmiResult && (
              <div className="p-4 bg-slate-50 rounded-xl text-center">
                <p className="text-slate-500 mb-1">Your BMI</p>
                <p className={`text-4xl font-bold ${bmiResult.color}`}>{bmiResult.value}</p>
                <p className={`font-semibold ${bmiResult.color}`}>{bmiResult.category}</p>
              </div>
            )}
          </div>
        )}


        {/* BMR Calculator */}
        {activeCalc === 'bmr' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><i className="fas fa-fire text-orange-500"></i> BMR Calculator</h3>
            <p className="text-slate-500 text-sm">Basal Metabolic Rate - calories your body burns at rest.</p>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Weight" inputRef={bmrWeightRef} placeholder="70" unit="kg" />
              <InputField label="Height" inputRef={bmrHeightRef} placeholder="170" unit="cm" />
              <InputField label="Age" inputRef={bmrAgeRef} placeholder="25" unit="yrs" />
              <GenderSelect value={bmrGender} onChange={setBmrGender} />
            </div>
            <CalcButton onClick={calculateBMR} label="Calculate BMR" />
            {bmrResult && (
              <div className="p-4 bg-orange-50 rounded-xl text-center">
                <p className="text-slate-500 mb-1">Your BMR</p>
                <p className="text-4xl font-bold text-orange-600">{bmrResult}</p>
                <p className="text-slate-500">calories/day</p>
              </div>
            )}
          </div>
        )}

        {/* Calorie Calculator */}
        {activeCalc === 'calorie' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><i className="fas fa-utensils text-emerald-500"></i> Daily Calorie Calculator</h3>
            <p className="text-slate-500 text-sm">Calculate your daily calorie needs based on activity level.</p>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Weight" inputRef={calorieWeightRef} placeholder="70" unit="kg" />
              <InputField label="Height" inputRef={calorieHeightRef} placeholder="170" unit="cm" />
              <InputField label="Age" inputRef={calorieAgeRef} placeholder="25" unit="yrs" />
              <GenderSelect value={calorieGender} onChange={setCalorieGender} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Activity Level</label>
              <select ref={calorieActivityRef} defaultValue="1.2"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="1.2">Sedentary (little/no exercise)</option>
                <option value="1.375">Light (1-3 days/week)</option>
                <option value="1.55">Moderate (3-5 days/week)</option>
                <option value="1.725">Active (6-7 days/week)</option>
                <option value="1.9">Very Active (hard exercise daily)</option>
              </select>
            </div>
            <CalcButton onClick={calculateCalories} label="Calculate Calories" />
            {calorieResult && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 rounded-xl text-center">
                  <p className="text-xs text-slate-500">BMR</p>
                  <p className="text-xl font-bold text-slate-700">{calorieResult.bmr}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl text-center">
                  <p className="text-xs text-emerald-600">Maintain</p>
                  <p className="text-xl font-bold text-emerald-600">{calorieResult.tdee}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl text-center">
                  <p className="text-xs text-blue-600">Lose Weight</p>
                  <p className="text-xl font-bold text-blue-600">{calorieResult.lose}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl text-center">
                  <p className="text-xs text-orange-600">Gain Weight</p>
                  <p className="text-xl font-bold text-orange-600">{calorieResult.gain}</p>
                </div>
              </div>
            )}
          </div>
        )}


        {/* Body Fat Calculator */}
        {activeCalc === 'bodyFat' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><i className="fas fa-percentage text-rose-500"></i> Body Fat Calculator</h3>
            <p className="text-slate-500 text-sm">US Navy method to estimate body fat percentage.</p>
            <GenderSelect value={bodyFatGender} onChange={setBodyFatGender} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Height" inputRef={bodyFatHeightRef} placeholder="170" unit="cm" />
              <InputField label="Neck" inputRef={bodyFatNeckRef} placeholder="38" unit="cm" />
              <InputField label="Waist" inputRef={bodyFatWaistRef} placeholder="85" unit="cm" />
              {bodyFatGender === 'female' && <InputField label="Hip" inputRef={bodyFatHipRef} placeholder="95" unit="cm" />}
            </div>
            <CalcButton onClick={calculateBodyFat} label="Calculate Body Fat" />
            {bodyFatResult && (
              <div className="p-4 bg-rose-50 rounded-xl text-center">
                <p className="text-slate-500 mb-1">Body Fat</p>
                <p className="text-4xl font-bold text-rose-600">{bodyFatResult.value}%</p>
                <p className="text-rose-600 font-medium">{bodyFatResult.category}</p>
              </div>
            )}
          </div>
        )}

        {/* Water Intake Calculator */}
        {activeCalc === 'water' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><i className="fas fa-tint text-blue-500"></i> Water Intake Calculator</h3>
            <p className="text-slate-500 text-sm">Calculate your daily water requirement.</p>
            <InputField label="Weight" inputRef={waterWeightRef} placeholder="70" unit="kg" />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Activity Level</label>
              <select ref={waterActivityRef} defaultValue="moderate"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="light">Light (desk job)</option>
                <option value="moderate">Moderate (some walking)</option>
                <option value="active">Active (regular exercise)</option>
                <option value="intense">Intense (athlete)</option>
              </select>
            </div>
            <CalcButton onClick={calculateWater} label="Calculate Water Intake" />
            {waterResult && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl text-center">
                  <p className="text-blue-600 text-sm">Daily Intake</p>
                  <p className="text-3xl font-bold text-blue-600">{waterResult.liters}L</p>
                </div>
                <div className="p-4 bg-cyan-50 rounded-xl text-center">
                  <p className="text-cyan-600 text-sm">Glasses (250ml)</p>
                  <p className="text-3xl font-bold text-cyan-600">{waterResult.glasses}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ideal Weight Calculator */}
        {activeCalc === 'idealWeight' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><i className="fas fa-balance-scale text-purple-500"></i> Ideal Weight Calculator</h3>
            <p className="text-slate-500 text-sm">Calculate your ideal body weight using multiple formulas.</p>
            <InputField label="Height" inputRef={idealWeightHeightRef} placeholder="170" unit="cm" />
            <GenderSelect value={idealWeightGender} onChange={setIdealWeightGender} />
            <CalcButton onClick={calculateIdealWeight} label="Calculate Ideal Weight" />
            {idealWeightResult && (
              <div className="space-y-3">
                <div className="p-4 bg-purple-100 rounded-xl text-center">
                  <p className="text-purple-600 text-sm">Average Ideal Weight</p>
                  <p className="text-3xl font-bold text-purple-600">{idealWeightResult.avg} kg</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-3 bg-slate-50 rounded-lg"><span className="text-slate-500">Robinson:</span> <span className="font-semibold">{idealWeightResult.robinson} kg</span></div>
                  <div className="p-3 bg-slate-50 rounded-lg"><span className="text-slate-500">Miller:</span> <span className="font-semibold">{idealWeightResult.miller} kg</span></div>
                  <div className="p-3 bg-slate-50 rounded-lg"><span className="text-slate-500">Devine:</span> <span className="font-semibold">{idealWeightResult.devine} kg</span></div>
                  <div className="p-3 bg-slate-50 rounded-lg"><span className="text-slate-500">Hamwi:</span> <span className="font-semibold">{idealWeightResult.hamwi} kg</span></div>
                </div>
              </div>
            )}
          </div>
        )}


        {/* Pregnancy Due Date Calculator */}
        {activeCalc === 'pregnancy' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><i className="fas fa-baby text-pink-500"></i> Pregnancy Due Date Calculator</h3>
            <p className="text-slate-500 text-sm">Calculate your estimated due date based on last menstrual period.</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Day of Last Period</label>
              <input type="date" ref={pregnancyDateRef}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <CalcButton onClick={calculateDueDate} label="Calculate Due Date" />
            {pregnancyResult && (
              <div className="space-y-3">
                <div className="p-4 bg-pink-50 rounded-xl text-center">
                  <p className="text-pink-600 text-sm">Estimated Due Date</p>
                  <p className="text-xl font-bold text-pink-600">{pregnancyResult.dueDate}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-purple-50 rounded-xl text-center">
                    <p className="text-purple-600 text-sm">Weeks Pregnant</p>
                    <p className="text-2xl font-bold text-purple-600">{pregnancyResult.weeks}</p>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-xl text-center">
                    <p className="text-indigo-600 text-sm">Trimester</p>
                    <p className="text-2xl font-bold text-indigo-600">{pregnancyResult.trimester}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Heart Rate Zone Calculator */}
        {activeCalc === 'heartRate' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><i className="fas fa-heartbeat text-red-500"></i> Heart Rate Zone Calculator</h3>
            <p className="text-slate-500 text-sm">Calculate your target heart rate zones for exercise.</p>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Age" inputRef={heartRateAgeRef} placeholder="25" unit="yrs" />
              <InputField label="Resting HR (optional)" inputRef={heartRateRestingRef} placeholder="70" unit="bpm" />
            </div>
            <CalcButton onClick={calculateHeartRateZones} label="Calculate Heart Rate Zones" />
            {heartRateResult && (
              <div className="space-y-3">
                <div className="p-4 bg-red-50 rounded-xl text-center">
                  <p className="text-red-600 text-sm">Maximum Heart Rate</p>
                  <p className="text-3xl font-bold text-red-600">{heartRateResult.maxHR} bpm</p>
                </div>
                <div className="space-y-2">
                  {heartRateResult.zones.map((zone, i) => (
                    <div key={i} className={`p-3 ${zone.color} rounded-xl flex justify-between items-center`}>
                      <span className="font-medium text-slate-700">{zone.name}</span>
                      <span className="font-bold text-slate-800">{zone.min} - {zone.max} bpm</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthCalculators;