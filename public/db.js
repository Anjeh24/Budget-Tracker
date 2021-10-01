let db;
let budgetVersion;

// Code will create a new db request for the "budget" database.
const request = window.indexedDB.open('Budget', budgetVersion || 21);

request.onupgradeneeded = function (e) {
  console.log('Upgrade needed in IndexDB');

  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;

  console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

  db = e.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore('Budget', { autoIncrement: true });
  }
};

request.onerror = function (e) {
  console.log(`Try again! ${e.target.errorCode}`);
};

function checkDatabase() {
  console.log('check db invoked');

  // Starts a transaction on your budget db
  let transaction = db.transaction(['Budget'], 'readwrite');

  // access your budget object
  const store = transaction.objectStore('Budget');

  // Will get all records from store and set to a variable
  const getAll = store.getAll();

  // If  request is successful
  getAll.onsuccess = function () {
    //For any existing items in the store, they need to be bulk added when back online
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((res) => {
          // If response is not 0
          if (res.length !== 0) {
            // Open another transaction for Budget with the ability to read and write so as to update
            transaction = db.transaction(['Budget'], 'readwrite');

            // Assign the current store to a variable
            const currentStore = transaction.objectStore('Budget');

            // Clear existing entries when bulk add is successful
            currentStore.clear();
            console.log('Clearing store 🧹');
          }
        });
    }
  };
}

request.onsuccess = function (e) {
  console.log('success');
  db = e.target.result;

  // To check if app is online before updating from db
  if (navigator.onLine) {
    console.log('Backend online! 🗄️');
    checkDatabase();
  }
};

const saveRecord = (record) => {
  console.log('Save record invoked');
  // Code to create a transaction on the budget db with readwrite access
  const transaction = db.transaction(['Budget'], 'readwrite');

  // To access the budget object store
  const store = transaction.objectStore('Budget');

  // Code to add record to store.
  store.add(record);
};

//Event listener to listen  for the app coming back online
window.addEventListener('online', checkDatabase);

