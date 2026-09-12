const data = {
  fullName: "Test Visitor",
  mobile: "1234567890",
  purpose: "Meeting",
  personToMeet: "keval",
  visitDate: "12-09-2026"
};

fetch('http://localhost:5001/api/new-appointments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
.then(async r => console.log(r.status, await r.text()))
.catch(console.error);
