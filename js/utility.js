
var userDatabase,
    userData = {}; // get user database


var utility = function(){
    
        // Initialize Firebase
    let config = {
      apiKey: "AIzaSyC7eDuSl0CfhDQ95wEXhaNFNHcT3nlxPGs",
      authDomain: "networth-8b077.firebaseapp.com",
      databaseURL: "https://networth-8b077.firebaseio.com",
      storageBucket: "",
      messagingSenderId: "441384900863"
    };
    firebase.initializeApp(config);
    
    let $el, $assetEl, $debtEl;

    google.charts.load('current', {'packages':[/*'corechart',*/'line']});
    google.charts.setOnLoadCallback(()=>{
        //either use promises or somehow use rxjs to combine the data and the chart callback for when both are ready.
        console.log('google charts loaded');
    });

    
    
    obj = {
        monthMap : {
          1: 'January',
          2: 'Feburary',
          3: 'March',
          4: 'April',
          5: 'May',
          6: 'June',
          7: 'July',
          8: 'August',
          9: 'September',
          10: 'October',
          11: 'November',
          12: 'Decemeber'
        },
        setDatabase:function(uid){
            userDatabase = firebase.database().ref(uid);    
        },
        watchData:function(el){
            
            let firstSnapshot, utilityThis = this;
            $el = $(el);
            $assetEl = $el.find('.asset').next().find('ul li');
            $debtEl = $el.find('.debt').next().find('ul li');

            userDatabase.on("value", function(snapshot) {
               userData.entries = snapshot.val() || {};

               if(!firstSnapshot){
                   userData.presentMonth = userData.currentMonth;
                   userData.presentYear = userData.currentYear;
                   
                   firstSnapshot = true;
                   
                   let dataObj = utility.getDataObj();
                   populateNetWorthValues(dataObj,$assetEl,$debtEl);
               }

            });
        
        },
        getReferenceStr(month,year){
            month = month < 10 ? '0'+month : month; 
            return year+''+month;
        },
        updateData:function(entry){
            let updateObj = {}, 
            refStr = this.getReferenceStr(userData.currentMonth,userData.currentYear);
            if(!userData.entries[refStr]){
                userData.entries[refStr] = {};
            }
            if(!userData.entries[refStr][entry.type]){
                userData.entries[refStr][entry.type] = {};
            }
            userData.entries[refStr][entry.type][entry.name] = entry.value;
            updateObj[refStr+'/NetWorth'] = this.getNetWorth(userData.entries[refStr]);
            if(updateObj[refStr+'/NetWorth']){
                updateObj[refStr+'/NetWorth'] = parseFloat(updateObj[refStr+'/NetWorth']).toFixed(2);
            }
            updateObj[refStr+'/'+entry.type+'/'+entry.name] = entry.value;
            userDatabase.update(updateObj);    
        },
        getDateObject:function(dateString){
            let date, dateObject = {};
            if(dateString){
                date = new Date(dateString);
            } 
            date = date || new Date();
            dateObject.date = date;
            dateObject.month = date.getMonth() + 1;
            dateObject.year = date.getFullYear();
            return dateObject;    
        },
        formatEntry(entry){
            let fractionIndicator = 2; 
            
            if(entry.type === "Asset"){
                entry.class = "green-text";
                entry.prefix = '$';
            }

            if(entry.type === "Debt"){
                entry.class = "red-text";
                entry.prefix = '$';
            }

            entry.value = Math.abs(entry.value);
            if(entry.value % 1 === 0){
                fractionIndicator = 0;    
            }
            entry.display = entry.prefix + entry.value.toLocaleString(undefined, {maximumFractionDigits: fractionIndicator, minimumFractionDigits: fractionIndicator});

            return entry;    
        },
        populateValues(){
            let dataObj = this.getDataObj();
            populateNetWorthValues(dataObj,$assetEl,$debtEl);
        },
        getDataObj(){
            let refString = this.getReferenceStr(userData.currentMonth,userData.currentYear);
            let dataObj = userData.entries[refString], tempMonth, tempYear;
            if(!dataObj){
                tempMonth = userData.currentMonth-1;
                tempYear = userData.currentYear;
                if(tempMonth === 0){
                    tempMonth = 12;
                    tempYear -= 1;
                }
                refString = this.getReferenceStr(tempMonth,tempYear);
                dataObj = userData.entries[refString];
                if(dataObj){
                    dataObj.entryGrey = true;
                }
            }
            return dataObj;
        },
        getNetWorth(obj){
            let Assets, Debts, Hit = false, Net;
            if(!obj['Asset']){ //create a helper function that will check if something exists and if not create empty obj
                obj['Asset'] = {};
            }
            if(!obj['Debt']){ //create a helper function that will check if something exists and if not create empty obj
                obj['Debt'] = {};
            }
            Assets = Object.keys(obj['Asset']).reduce((prev,current)=>{
                debugger;
                if(obj['Asset'][current] !== null){
                    Hit = true;
                    prev += obj['Asset'][current];
                }
                return prev;
            },0);
            Debts = Object.keys(obj['Debt']).reduce((prev,current)=>{
                debugger;
                if(obj['Debt'][current] !== null){
                    Hit = true;
                    prev += obj['Debt'][current];
                }
                return prev;
            },0);
            Net = Assets - Debts;
            return Hit ? Net : null;
        }
    };

    return obj;
    
}();