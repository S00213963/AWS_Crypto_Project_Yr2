let start = document.getElementById('startingDate');
let epoch = document.getElementById('epoch');



let ts = new Date();
ts.setDate(ts.getDate() + 3);
let epochTime = Date.parse(ts);

epoch.innerHTML = epochTime;

start.innerHTML = ts;
