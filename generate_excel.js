const XLSX = require('xlsx');

// ── Generate 50 realistic clients ─────────────────────────────────────
const firstNames = ['James','Maria','Robert','Jennifer','Michael','Linda','William','Patricia','David','Elizabeth','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Charles','Karen','Daniel','Nancy','Matthew','Lisa','Anthony','Betty','Mark','Margaret','Donald','Sandra','Steven','Ashley','Paul','Kimberly','Andrew','Emily','Joshua','Donna','Kenneth','Michelle','Kevin','Dorothy','Brian','Carol','George','Amanda','Edward','Melissa','Ronald','Stephanie','Timothy','Rebecca','Jason','Laura','Jeffrey','Shirley','Ryan','Cynthia','Jacob','Kathleen','Gary','Amy'];
const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson','Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores','Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts'];
const goals = ['Fat Loss','Muscle Gain','Strength','Endurance','Body Recomp','Athletic Performance','General Fitness','Powerlifting'];
const levels = ['Beginner','Intermediate','Advanced'];
const coaches = ['Coach Sarah','Coach Mike','Coach Leila','Coach Jake','Coach Emma'];
const programs = ['Upper/Lower','Push/Pull/Legs','Full Body 3x','5-Day Split','Bro Split','Powerlifting Program','Hypertrophy Focus','HIIT + Strength'];
const clientStatuses = ['Active','Active','Active','Active','On Hold','Paused','Completed Program'];

const clients = [];
for (let i = 1; i <= 50; i++) {
  const fname = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lname = lastNames[Math.floor(Math.random() * lastNames.length)];
  const weight = +(55 + Math.random() * 55).toFixed(1);
  const height = +(160 + Math.random() * 35).toFixed(0);
  const age = Math.floor(18 + Math.random() * 42);
  const goal = goals[Math.floor(Math.random() * goals.length)];
  const bmr = Math.round(10 * weight + 6.25 * height - 5 * age + (Math.random() > 0.5 ? 5 : -161));
  const tdee = Math.round(bmr * (1.2 + Math.random() * 0.7));
  const protein = Math.round(weight * (1.6 + Math.random() * 1.4));
  clients.push({
    '#': i,
    'Client Name': fname + ' ' + lname,
    'Age': age,
    'Weight (kg)': weight,
    'Height (cm)': height,
    'Goal': goal,
    'Level': levels[Math.floor(Math.random() * levels.length)],
    'Coach': coaches[Math.floor(Math.random() * coaches.length)],
    'Program': programs[Math.floor(Math.random() * programs.length)],
    'Start Date': new Date(2024, Math.floor(Math.random() * 12), Math.floor(1 + Math.random() * 28)).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}),
    'Calories Target': tdee,
    'Protein Target (g)': protein,
    'Status': clientStatuses[Math.floor(Math.random() * clientStatuses.length)]
  });
}

// ── Workout plans (program per client) ────────────────────────────────
const workoutPlans = clients.map(c => {
  const prog = c['Program'];
  let days = {};
  if (prog === 'Upper/Lower') days = {Mon:'Upper',Tue:'Lower',Wed:'Rest',Thu:'Upper',Fri:'Lower',Sat:'Rest',Sun:'Cardio'};
  else if (prog === 'Push/Pull/Legs') days = {Mon:'Push',Tue:'Pull',Wed:'Legs',Thu:'Push',Fri:'Pull',Sat:'Legs',Sun:'Rest'};
  else if (prog === 'Full Body 3x') days = {Mon:'Full Body',Tue:'Rest',Wed:'Full Body',Thu:'Rest',Fri:'Full Body',Sat:'Rest',Sun:'Rest'};
  else if (prog === '5-Day Split') days = {Mon:'Chest',Tue:'Back',Wed:'Shoulders',Thu:'Arms',Fri:'Legs',Sat:'Rest',Sun:'Rest'};
  else if (prog === 'Bro Split') days = {Mon:'Chest',Tue:'Back',Wed:'Legs',Thu:'Shoulders',Fri:'Arms',Sat:'Cardio',Sun:'Rest'};
  else if (prog === 'Powerlifting Program') days = {Mon:'Squat',Tue:'Bench',Wed:'Deadlift',Thu:'Accessory',Fri:'Squat',Sat:'Rest',Sun:'Rest'};
  else if (prog === 'Hypertrophy Focus') days = {Mon:'Chest/Tri',Tue:'Back/Bi',Wed:'Legs',Thu:'Shoulders',Fri:'Arms',Sat:'Rest',Sun:'Rest'};
  else days = {Mon:'Strength',Tue:'HIIT',Wed:'Strength',Thu:'HIIT',Fri:'Strength',Sat:'HIIT',Sun:'Rest'};
  const sessions = Object.values(days).filter(d => d !== 'Rest').length;
  return {
    '#': c['#'],
    'Client Name': c['Client Name'],
    'Program': prog,
    'Monday': days.Mon,
    'Tuesday': days.Tue,
    'Wednesday': days.Wed,
    'Thursday': days.Thu,
    'Friday': days.Fri,
    'Saturday': days.Sat,
    'Sunday': days.Sun,
    'Weekly Volume': sessions + ' sessions'
  };
});

// ── Exercise database ────────────────────────────────────────────────
const exercisesByDay = {
  'Upper': [
    {ex:'Bench Press', sets:4, reps:'8-10', rest:90},
    {ex:'Barbell Row', sets:4, reps:'8-10', rest:90},
    {ex:'Overhead Press', sets:3, reps:'10-12', rest:75},
    {ex:'Pull-Up', sets:3, reps:'8-12', rest:75},
    {ex:'Incline DB Press', sets:3, reps:'10-12', rest:60},
    {ex:'Face Pull', sets:3, reps:'15-20', rest:45}
  ],
  'Lower': [
    {ex:'Squat', sets:4, reps:'6-8', rest:120},
    {ex:'Romanian Deadlift', sets:3, reps:'10-12', rest:90},
    {ex:'Leg Press', sets:3, reps:'12-15', rest:75},
    {ex:'Walking Lunge', sets:3, reps:'12 each', rest:60},
    {ex:'Leg Curl', sets:3, reps:'12-15', rest:60},
    {ex:'Calf Raise', sets:4, reps:'15-20', rest:45}
  ],
  'Push': [
    {ex:'Bench Press', sets:4, reps:'8-10', rest:90},
    {ex:'Overhead Press', sets:3, reps:'10-12', rest:75},
    {ex:'Incline DB Press', sets:3, reps:'10-12', rest:75},
    {ex:'Lateral Raise', sets:3, reps:'12-15', rest:45},
    {ex:'Tricep Dip', sets:3, reps:'10-12', rest:60},
    {ex:'Cable Fly', sets:3, reps:'12-15', rest:45}
  ],
  'Pull': [
    {ex:'Deadlift', sets:3, reps:'5-6', rest:180},
    {ex:'Pull-Up', sets:4, reps:'8-10', rest:90},
    {ex:'Barbell Row', sets:4, reps:'8-10', rest:90},
    {ex:'Face Pull', sets:3, reps:'15-20', rest:45},
    {ex:'Hammer Curl', sets:3, reps:'10-12', rest:60},
    {ex:'Barbell Curl', sets:3, reps:'10-12', rest:60}
  ],
  'Legs': [
    {ex:'Squat', sets:4, reps:'6-8', rest:120},
    {ex:'Leg Press', sets:3, reps:'12-15', rest:90},
    {ex:'Bulgarian Split Squat', sets:3, reps:'10 each', rest:75},
    {ex:'Leg Extension', sets:3, reps:'12-15', rest:60},
    {ex:'Leg Curl', sets:3, reps:'12-15', rest:60},
    {ex:'Standing Calf Raise', sets:4, reps:'15-20', rest:45}
  ],
  'Full Body': [
    {ex:'Squat', sets:3, reps:'8-10', rest:120},
    {ex:'Bench Press', sets:3, reps:'8-10', rest:120},
    {ex:'Barbell Row', sets:3, reps:'8-10', rest:120},
    {ex:'Overhead Press', sets:3, reps:'10-12', rest:90},
    {ex:'Leg Curl', sets:2, reps:'12-15', rest:60},
    {ex:'Face Pull', sets:3, reps:'15-20', rest:45}
  ],
  'Chest': [
    {ex:'Bench Press', sets:4, reps:'8-10', rest:90},
    {ex:'Incline DB Press', sets:3, reps:'10-12', rest:75},
    {ex:'Cable Fly', sets:3, reps:'12-15', rest:45},
    {ex:'Dip', sets:3, reps:'10-12', rest:75},
    {ex:'Push-Up', sets:3, reps:'15-20', rest:60},
    {ex:'Pec Deck', sets:3, reps:'12-15', rest:45}
  ],
  'Back': [
    {ex:'Deadlift', sets:3, reps:'5-6', rest:180},
    {ex:'Pull-Up', sets:4, reps:'8-10', rest:90},
    {ex:'Barbell Row', sets:4, reps:'8-10', rest:90},
    {ex:'Chest-Supported Row', sets:3, reps:'10-12', rest:75},
    {ex:'Lat Pulldown', sets:3, reps:'10-12', rest:75},
    {ex:'Reverse Fly', sets:3, reps:'12-15', rest:45}
  ],
  'Shoulders': [
    {ex:'Overhead Press', sets:4, reps:'8-10', rest:90},
    {ex:'Arnold Press', sets:3, reps:'10-12', rest:75},
    {ex:'Lateral Raise', sets:4, reps:'12-15', rest:45},
    {ex:'Upright Row', sets:3, reps:'10-12', rest:60},
    {ex:'Face Pull', sets:3, reps:'15-20', rest:45},
    {ex:'Shrugs', sets:3, reps:'12-15', rest:60}
  ],
  'Arms': [
    {ex:'Barbell Curl', sets:4, reps:'10-12', rest:60},
    {ex:'Hammer Curl', sets:3, reps:'10-12', rest:60},
    {ex:'Preacher Curl', sets:3, reps:'10-12', rest:60},
    {ex:'Close-Grip Bench', sets:4, reps:'8-10', rest:90},
    {ex:'Tricep Pushdown', sets:3, reps:'12-15', rest:60},
    {ex:'Skull Crusher', sets:3, reps:'10-12', rest:75}
  ],
  'Chest/Tri': [
    {ex:'Bench Press', sets:4, reps:'8-10', rest:90},
    {ex:'Incline DB Press', sets:3, reps:'10-12', rest:75},
    {ex:'Cable Fly', sets:3, reps:'12-15', rest:45},
    {ex:'Close-Grip Bench', sets:3, reps:'8-10', rest:75},
    {ex:'Tricep Pushdown', sets:3, reps:'12-15', rest:60},
    {ex:'Dip', sets:3, reps:'10-12', rest:75}
  ],
  'Back/Bi': [
    {ex:'Deadlift', sets:3, reps:'5-6', rest:180},
    {ex:'Pull-Up', sets:4, reps:'8-10', rest:90},
    {ex:'Barbell Row', sets:4, reps:'8-10', rest:90},
    {ex:'Barbell Curl', sets:4, reps:'10-12', rest:60},
    {ex:'Hammer Curl', sets:3, reps:'10-12', rest:60},
    {ex:'Preacher Curl', sets:3, reps:'10-12', rest:60}
  ],
  'Squat': [
    {ex:'Back Squat', sets:5, reps:'3-5', rest:180},
    {ex:'Front Squat', sets:3, reps:'5-6', rest:150},
    {ex:'Pause Squat', sets:3, reps:'3-4', rest:180},
    {ex:'Leg Press', sets:3, reps:'8-10', rest:120},
    {ex:'Walking Lunge', sets:3, reps:'10 each', rest:90},
    {ex:'Plank', sets:3, reps:'60s', rest:60}
  ],
  'Bench': [
    {ex:'Bench Press', sets:5, reps:'3-5', rest:180},
    {ex:'Close-Grip Bench', sets:3, reps:'5-6', rest:150},
    {ex:'Spoto Press', sets:3, reps:'3-4', rest:180},
    {ex:'Incline DB Press', sets:3, reps:'8-10', rest:90},
    {ex:'Dip', sets:3, reps:'8-10', rest:90},
    {ex:'Tricep Extension', sets:3, reps:'12-15', rest:60}
  ],
  'Deadlift': [
    {ex:'Conventional Deadlift', sets:5, reps:'3-5', rest:240},
    {ex:'Deficit Deadlift', sets:3, reps:'3-4', rest:180},
    {ex:'Romanian Deadlift', sets:3, reps:'6-8', rest:150},
    {ex:'Pendlay Row', sets:4, reps:'6-8', rest:120},
    {ex:'Pull-Up', sets:3, reps:'8-10', rest:90},
    {ex:'Barbell Curl', sets:3, reps:'10-12', rest:60}
  ],
  'Accessory': [
    {ex:'Leg Press', sets:3, reps:'12-15', rest:90},
    {ex:'Leg Curl', sets:3, reps:'12-15', rest:60},
    {ex:'Leg Extension', sets:3, reps:'12-15', rest:60},
    {ex:'Calf Raise', sets:4, reps:'15-20', rest:45},
    {ex:'Face Pull', sets:3, reps:'15-20', rest:45},
    {ex:'Plank', sets:3, reps:'60s', rest:45}
  ],
  'Strength': [
    {ex:'Squat', sets:4, reps:'5-6', rest:150},
    {ex:'Bench Press', sets:4, reps:'5-6', rest:150},
    {ex:'Barbell Row', sets:4, reps:'6-8', rest:120},
    {ex:'Overhead Press', sets:3, reps:'8-10', rest:90},
    {ex:'Leg Curl', sets:3, reps:'10-12', rest:60},
    {ex:'Face Pull', sets:3, reps:'15-20', rest:45}
  ],
  'HIIT': [
    {ex:'Kettlebell Swing', sets:4, reps:'20s', rest:40},
    {ex:'Box Jump', sets:4, reps:'20s', rest:40},
    {ex:'Battle Ropes', sets:4, reps:'20s', rest:40},
    {ex:'Burpee', sets:4, reps:'20s', rest:40},
    {ex:'Mountain Climber', sets:4, reps:'20s', rest:40},
    {ex:'Sprint', sets:4, reps:'20s', rest:40}
  ],
  'Cardio': [
    {ex:'Treadmill Run', sets:1, reps:'30min', rest:0},
    {ex:'Stationary Bike', sets:1, reps:'20min', rest:0},
    {ex:'Rowing Machine', sets:1, reps:'15min', rest:0}
  ]
};

// ── Generate exercise details ────────────────────────────────────────
const exerciseDetails = [];
for (const client of clients) {
  const plan = workoutPlans.find(p => p['Client Name'] === client['Client Name']);
  if (!plan) continue;
  const dayKeyMap = {Mon:'Monday',Tue:'Tuesday',Wed:'Wednesday',Thu:'Thursday',Fri:'Friday',Sat:'Saturday',Sun:'Sunday'};
  
  for (const [shortDay, workoutType] of Object.entries({Mon:plan.Monday,Tue:plan.Tuesday,Wed:plan.Wednesday,Thu:plan.Thursday,Fri:plan.Friday,Sat:plan.Saturday,Sun:plan.Sunday})) {
    if (workoutType === 'Rest') continue;
    const exercises = exercisesByDay[workoutType] || exercisesByDay['Upper'];
    for (const ex of exercises) {
      exerciseDetails.push({
        '#': client['#'],
        'Client Name': client['Client Name'],
        'Day': dayKeyMap[shortDay] + ' (' + workoutType + ')',
        'Exercise': ex.ex,
        'Sets': ex.sets,
        'Reps': ex.reps,
        'Weight': Math.floor(20 + Math.random() * 100) + 'kg',
        'Rest (sec)': ex.rest,
        'Notes': Math.random() > 0.7 ? 'Focus on form' : Math.random() > 0.8 ? 'Increase weight if >last week' : ''
      });
    }
  }
}

// ── Nutrition plans ──────────────────────────────────────────────────
const meals = ['Breakfast','Snack 1','Lunch','Pre-Workout','Dinner','Snack 2','Recovery'];
const foodsByGoal = {
  'Fat Loss': ['Egg White Omelette + Spinach','Cottage Cheese + Berries','Turkey + Quinoa + Veg','Apple + Almonds','White Fish + Zucchini + Salad','Greek Yogurt','Protein Shake'],
  'Muscle Gain': ['Oats + Protein + Banana','Peanut Butter Toast','Chicken + Rice + Veg','Beef Jerky + Nuts','Steak + Potato + Greens','Milk + Cookies','Casein Shake'],
  'Strength': ['Eggs + Toast + OJ','Beef Jerky + Nuts','Ground Beef + Pasta','Oats + Protein','Ribeye + Potato + Beans','Milk + PB Toast','Chocolate Milk'],
  'Endurance': ['Overnight Oats + Honey + Fruit','Energy Bar + Banana','Pasta + Tuna + Olive Oil','Sports Drink + Gel','Brown Rice + Chicken + Veg','Chocolate Milk','Fruit Smoothie'],
  'Body Recomp': ['Eggs + Avocado Toast','Protein Shake + Banana','Chicken Salad + Quinoa','Nuts + Apple','Salmon + Sweet Potato + Veg','Greek Yogurt + Honey','Cottage Cheese'],
  'Athletic Performance': ['Oats + Protein + Fruit','Energy Bar','Chicken + Rice + Broccoli','Sports Drink','Lean Beef + Potato + Greens','Chocolate Milk','Protein Shake'],
  'General Fitness': ['Scrambled Eggs + Toast','Fruit + Nuts','Turkey Sandwich + Salad','Yogurt','Grilled Chicken + Rice + Veg','Protein Shake','Veg Sticks + Hummus'],
  'Powerlifting': ['Eggs + Bacon + Toast','Protein Shake','Ground Beef + Rice + Veg','Pre-Workout + Banana','Steak + Potato + Greens','Milk + PB Toast','Casein Shake']
};

const nutritionPlans = [];
for (const client of clients) {
  const goalFoods = foodsByGoal[client.Goal] || foodsByGoal['General Fitness'];
  const dailyCal = client['Calories Target'];
  const dailyProtein = client['Protein Target (g)'];
  const mealsPerDay = Math.floor(5 + Math.random() * 3);
  
  let dayCalTotal = 0;
  let dayProteinTotal = 0;
  
  for (let m = 0; m < mealsPerDay; m++) {
    const mealName = meals[m];
    const food = goalFoods[m % goalFoods.length];
    const cal = Math.round(dailyCal / mealsPerDay * (0.8 + Math.random() * 0.4));
    const protein = Math.round(dailyProtein / mealsPerDay * (0.7 + Math.random() * 0.6));
    const carbs = Math.round(cal * 0.45 / 4);
    const fat = Math.round(cal * 0.25 / 9);
    
    dayCalTotal += cal;
    dayProteinTotal += protein;
    
    nutritionPlans.push({
      '#': client['#'],
      'Client Name': client['Client Name'],
      'Goal': client.Goal,
      'Meal': mealName,
      'Food / Description': food,
      'Calories': cal,
      'Protein (g)': protein,
      'Carbs (g)': carbs,
      'Fat (g)': fat,
      'Daily Cal Total': m === mealsPerDay - 1 ? dayCalTotal : '',
      'Daily Protein Total': m === mealsPerDay - 1 ? dayProteinTotal : ''
    });
  }
}

// ── Weekly schedule with times ───────────────────────────────────────
const schedule = workoutPlans.map(p => {
  const timeSlots = ['07:00','08:00','09:00','10:00','12:00','13:00','15:00','17:00','18:00','19:00','20:00'];
  const getTime = () => timeSlots[Math.floor(Math.random() * timeSlots.length)];
  return {
    'Client Name': p['Client Name'],
    'Monday': p.Monday !== 'Rest' ? p.Monday + '\n' + getTime() : '— Rest —',
    'Tuesday': p.Tuesday !== 'Rest' ? p.Tuesday + '\n' + getTime() : '— Rest —',
    'Wednesday': p.Wednesday !== 'Rest' ? p.Wednesday + '\n' + getTime() : '— Rest —',
    'Thursday': p.Thursday !== 'Rest' ? p.Thursday + '\n' + getTime() : '— Rest —',
    'Friday': p.Friday !== 'Rest' ? p.Friday + '\n' + getTime() : '— Rest —',
    'Saturday': p.Saturday !== 'Rest' ? p.Saturday + '\n' + getTime() : '— Rest —',
    'Sunday': p.Sunday !== 'Rest' ? p.Sunday + '\n' + getTime() : '— Rest —',
    'Total Sessions': p['Weekly Volume']
  };
});

// ── Completed workouts (last 2 weeks) ────────────────────────────────
const completedWorkouts = [];
const workoutStatuses = ['Completed','Completed','Completed','Skipped','Rest Day','Not Started'];
const ratings = [3,4,4,5,5,4,5,3,4,5];

for (const client of clients) {
  const plan = workoutPlans.find(p => p['Client Name'] === client['Client Name']);
  const dayMap = {Mon:'Monday',Tue:'Tuesday',Wed:'Wednesday',Thu:'Thursday',Fri:'Friday',Sat:'Saturday',Sun:'Sunday'};
  
  for (let d = 13; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][date.getDay()];
    const shortDay = Object.keys(dayMap).find(k => dayMap[k] === dayName);
    const workoutType = shortDay ? plan[dayMap[shortDay]] : 'Rest';
    
    if (workoutType === 'Rest') {
      completedWorkouts.push({
        '#': client['#'],
        'Client Name': client['Client Name'],
        'Date': date.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}),
        'Day': dayName,
        'Workout Type': 'Rest',
        'Duration (min)': '—',
        'Sets Completed': '—',
        'Reps Total': '—',
        'Avg Weight (kg)': '—',
        'Calories Burned': '—',
        'Rating (1-5)': '—',
        'Notes': 'Rest day',
        'Status': 'Rest Day'
      });
      continue;
    }
    
    const status = workoutStatuses[Math.floor(Math.random() * workoutStatuses.length)];
    const isCompleted = status === 'Completed';
    
    completedWorkouts.push({
      '#': client['#'],
      'Client Name': client['Client Name'],
      'Date': date.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}),
      'Day': dayName,
      'Workout Type': workoutType,
      'Duration (min)': isCompleted ? Math.floor(45 + Math.random() * 50) : 0,
      'Sets Completed': isCompleted ? Math.floor(15 + Math.random() * 20) : 0,
      'Reps Total': isCompleted ? Math.floor(150 + Math.random() * 200) : 0,
      'Avg Weight (kg)': isCompleted ? +(30 + Math.random() * 80).toFixed(1) : 0,
      'Calories Burned': isCompleted ? Math.floor(300 + Math.random() * 500) : 0,
      'Rating (1-5)': isCompleted ? ratings[Math.floor(Math.random() * ratings.length)] : '—',
      'Notes': isCompleted ? ['Great session!','Felt strong today','Need more sleep','Good pump','Hit PR on squat','Focus on form'][Math.floor(Math.random() * 6)] : status === 'Skipped' ? 'Session skipped - client sick' : 'Scheduled but not started',
      'Status': status
    });
  }
}

// ── Completion summary ──────────────────────────────────────────────
const completionSummary = clients.map(c => {
  const clientWorkouts = completedWorkouts.filter(w => w['Client Name'] === c['Client Name']);
  const planned = clientWorkouts.filter(w => w['Workout Type'] !== 'Rest').length;
  const completed = clientWorkouts.filter(w => w.Status === 'Completed').length;
  const skipped = clientWorkouts.filter(w => w.Status === 'Skipped').length;
  const completionRate = planned > 0 ? Math.round((completed / planned) * 100) : 0;
  const avgDuration = completed > 0 ? Math.round(clientWorkouts.filter(w => w.Status === 'Completed').reduce((sum,w) => sum + (w['Duration (min)'] || 0), 0) / completed) : 0;
  const avgRating = completed > 0 ? (clientWorkouts.filter(w => w.Status === 'Completed').reduce((sum,w) => sum + (w['Rating (1-5)'] === '—' ? 0 : w['Rating (1-5)']), 0) / completed).toFixed(1) : '—';
  
  return {
    '#': c['#'],
    'Client Name': c['Client Name'],
    'Coach': c.Coach,
    'Program': c.Program,
    'Sessions Planned': planned,
    'Completed': completed,
    'Skipped': skipped,
    'Completion Rate': completionRate + '%',
    'Avg Duration (min)': avgDuration,
    'Avg Rating': avgRating,
    'Performance': completionRate >= 90 ? 'Excellent' : completionRate >= 75 ? 'Good' : completionRate >= 50 ? 'Average' : 'Needs Improvement'
  };
});

// ── Create workbook ──────────────────────────────────────────────────
const wb = XLSX.utils.book_new();

const addSheet = (name, data) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const colWidths = {};
  data.forEach(row => {
    Object.keys(row).forEach(key => {
      const len = String(row[key] || '').length;
      colWidths[key] = Math.max(colWidths[key] || 10, len + 2);
    });
  });
  ws['!cols'] = Object.keys(colWidths).map(k => ({wch: Math.min(colWidths[k], 40)}));
  XLSX.utils.book_append_sheet(wb, ws, name);
};

addSheet('📋 Client Overview', clients);
addSheet('💪 Workout Plans', workoutPlans);
addSheet('🏃 Exercise Details', exerciseDetails);
addSheet('🥗 Nutrition Plans', nutritionPlans);
addSheet('📅 Weekly Schedule', schedule);
addSheet('✅ Completed Workouts', completedWorkouts);
addSheet('📊 Completion Summary', completionSummary);

XLSX.writeFile(wb, '/Users/george/.openclaw/workspace/coachpro_50_clients_sample.xlsx');
console.log('✅ Generated: /Users/george/.openclaw/workspace/coachpro_50_clients_sample.xlsx');
console.log('Sheets:', wb.SheetNames);
console.log('Total rows:', {clients: clients.length, workoutPlans: workoutPlans.length, exerciseDetails: exerciseDetails.length, nutrition: nutritionPlans.length, schedule: schedule.length, completed: completedWorkouts.length, summary: completionSummary.length});
